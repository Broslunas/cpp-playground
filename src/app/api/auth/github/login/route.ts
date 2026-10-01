import { NextResponse } from "next/server";
import { isGithubOAuthConfigured } from "@/lib/auth";

export async function GET(request: Request) {
  if (!isGithubOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "GitHub OAuth no está configurado",
        message: "Configura GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET en tu archivo .env.local",
      },
      { status: 500 }
    );
  }

  const clientId = process.env.GITHUB_CLIENT_ID!;
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get("returnTo") || "/playground";

  const state = crypto.randomUUID();
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("scope", "read:user user:email");
  githubAuthUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(githubAuthUrl.toString());

  // Store state and returnTo in secure short-lived cookies for CSRF verification
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  response.cookies.set("oauth_return_to", returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
