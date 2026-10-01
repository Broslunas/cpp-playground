import { NextResponse } from "next/server";
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { getWebAuthnRpConfig } from "@/lib/webauthn";
import { createSessionToken, createPending2FAToken, COOKIE_NAME, PENDING_2FA_COOKIE_NAME, AuthUser } from "@/lib/auth";
import { cookies } from "next/headers";

const WEBAUTHN_AUTH_CHALLENGE = "webauthn_auth_challenge";

export async function GET(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  const { rpID } = getWebAuthnRpConfig(request.url);

  try {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
    });

    const cookieStore = await cookies();
    cookieStore.set(WEBAUTHN_AUTH_CHALLENGE, options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5,
      path: "/",
    });

    return NextResponse.json(options);
  } catch (err) {
    console.error("Error al generar opciones de login con passkey:", err);
    return NextResponse.json({ error: "Error al preparar autenticación" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_AUTH_CHALLENGE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Desafío de autenticación expirado" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { authenticationResponse } = body;
    const credentialId = authenticationResponse?.id;

    if (!credentialId) {
      return NextResponse.json({ error: "ID de credencial requerido" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    // Buscar el usuario que tenga registrada esta passkey
    const userDoc = await users.findOne({ "passkeys.id": credentialId });
    if (!userDoc) {
      return NextResponse.json({ error: "Passkey no reconocida en ninguna cuenta" }, { status: 404 });
    }

    const passkey = userDoc.passkeys.find((p: { id: string }) => p.id === credentialId);
    if (!passkey) {
      return NextResponse.json({ error: "Passkey no encontrada" }, { status: 404 });
    }

    const { rpID, origin } = getWebAuthnRpConfig(request.url);

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.id,
        publicKey: Buffer.from(passkey.publicKey, "base64url"),
        counter: passkey.counter || 0,
        transports: passkey.transports,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Fallo en la validación de la passkey" }, { status: 401 });
    }

    // Actualizar counter de la passkey
    await users.updateOne(
      { _id: userDoc._id, "passkeys.id": credentialId },
      {
        $set: {
          "passkeys.$.counter": verification.authenticationInfo.newCounter,
          updatedAt: new Date(),
        },
      }
    );

    cookieStore.delete(WEBAUTHN_AUTH_CHALLENGE);

    const userId = userDoc._id.toString();

    // Comprobar si tiene 2FA / TOTP activo
    if (userDoc.totpEnabled) {
      const pendingToken = await createPending2FAToken(userId, userDoc.username);
      const res = NextResponse.json({
        requires2FA: true,
        redirect: "/login/verificar",
      });
      res.cookies.set(PENDING_2FA_COOKIE_NAME, pendingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
      });
      return res;
    }

    const authUser: AuthUser = {
      id: userId,
      githubId: userDoc.githubId,
      username: userDoc.username,
      name: userDoc.name || userDoc.username,
      avatarUrl: userDoc.avatarUrl || "",
      email: userDoc.email || undefined,
    };

    const sessionToken = await createSessionToken(authUser);
    const res = NextResponse.json({ success: true, redirect: "/playground" });
    res.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Error autenticando passkey:", err);
    return NextResponse.json({ error: "Error de servidor al validar passkey" }, { status: 500 });
  }
}
