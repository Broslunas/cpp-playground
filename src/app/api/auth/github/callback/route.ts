import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { AuthUser } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  const returnTo = cookieStore.get("oauth_return_to")?.value || "/playground";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (error || !code || !state || state !== savedState) {
    return NextResponse.redirect(
      `${appUrl}/playground?auth_error=${encodeURIComponent(
        error || "Parámetros de autenticación inválidos o expirados"
      )}`
    );
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Error al obtener token de GitHub");
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch GitHub user profile
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Broslunas-Playground",
      },
    });

    if (!userRes.ok) {
      throw new Error("No se pudo obtener el perfil de usuario de GitHub");
    }

    const ghUser = await userRes.json();

    // 3. Fetch primary email if not public in profile
    let email = ghUser.email;
    if (!email) {
      try {
        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "User-Agent": "Broslunas-Playground",
          },
        });
        if (emailRes.ok) {
          const emails = await emailRes.json();
          const primary = emails.find((e: { primary: boolean; verified: boolean; email: string }) => e.primary && e.verified) || emails[0];
          if (primary) email = primary.email;
        }
      } catch {
        // Non-critical if email fails
      }
    }

    const githubId = String(ghUser.id);
    let userId = githubId;

    // 4. Save / Upsert in MongoDB
    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        const users = db.collection("users");
        const now = new Date();
        const result = await users.findOneAndUpdate(
          { githubId },
          {
            $set: {
              username: ghUser.login,
              name: ghUser.name || ghUser.login,
              avatarUrl: ghUser.avatar_url,
              email: email || null,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        if (result && result._id) {
          userId = result._id.toString();
        }
      } catch (dbError) {
        console.error("Error al persistir usuario en MongoDB:", dbError);
      }
    }

    const authUser: AuthUser = {
      id: userId,
      githubId,
      username: ghUser.login,
      name: ghUser.name || ghUser.login,
      avatarUrl: ghUser.avatar_url,
      email: email || undefined,
    };

    // 5. Create signed JWT session
    const sessionToken = await createSessionToken(authUser);

    // 6. Set response cookie and redirect
    const response = NextResponse.redirect(`${appUrl}${returnTo}`);

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Clear state cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_return_to");

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado durante la autenticación";
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/playground?auth_error=${encodeURIComponent(message)}`
    );
  }
}
