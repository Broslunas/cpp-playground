import { NextResponse } from "next/server";
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { getWebAuthnRpConfig } from "@/lib/webauthn";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

const WEBAUTHN_REG_CHALLENGE = "webauthn_reg_challenge";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    const db = await getDb();
    const users = db.collection("users");
    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}

    const doc = await users.findOne(query);
    const existingPasskeys = Array.isArray(doc?.passkeys) ? doc.passkeys : [];

    const { rpName, rpID } = getWebAuthnRpConfig(request.url);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: user.username,
      userDisplayName: user.name || user.username,
      userID: new TextEncoder().encode(user.id),
      attestationType: "none",
      excludeCredentials: existingPasskeys.map((p: { id: string; transports?: AuthenticatorTransport[] }) => ({
        id: p.id,
        transports: p.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    const cookieStore = await cookies();
    cookieStore.set(WEBAUTHN_REG_CHALLENGE, options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5, // 5 min
      path: "/",
    });

    return NextResponse.json(options);
  } catch (err) {
    console.error("Error generando opciones de passkey:", err);
    return NextResponse.json({ error: "No se pudieron generar opciones de passkey" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_REG_CHALLENGE)?.value;
  if (!expectedChallenge) {
    return NextResponse.json({ error: "Desafío WebAuthn expirado o inválido" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { registrationResponse, name = "Passkey de usuario" } = body;
    const { rpID, origin } = getWebAuthnRpConfig(request.url);

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Verificación de passkey fallida" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    const db = await getDb();
    const users = db.collection("users");

    const newPasskey = {
      id: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: registrationResponse.response.transports || [],
      createdAt: Date.now(),
      name: (name && String(name).slice(0, 40)) || "Dispositivo",
    };

    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}

    await users.updateOne(query, {
      $push: { passkeys: newPasskey as never },
      $set: { updatedAt: new Date() },
    });

    cookieStore.delete(WEBAUTHN_REG_CHALLENGE);

    return NextResponse.json({ success: true, passkey: newPasskey });
  } catch (err) {
    console.error("Error al registrar passkey:", err);
    return NextResponse.json({ error: "Error procesando registro de passkey" }, { status: 500 });
  }
}
