import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyPending2FAToken,
  createSessionToken,
  COOKIE_NAME,
  PENDING_2FA_COOKIE_NAME,
  AuthUser,
  sanitizeReturnTo,
} from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { decryptSecret, verifyTotpToken, verifyAndConsumeRecoveryCode } from "@/lib/security";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(PENDING_2FA_COOKIE_NAME)?.value;

  if (!pendingToken) {
    return NextResponse.json(
      { error: "Sesión de verificación expirada o inexistente. Vuelve a iniciar sesión." },
      { status: 401 }
    );
  }

  const pending = await verifyPending2FAToken(pendingToken);
  if (!pending) {
    return NextResponse.json(
      { error: "Token de desafío inválido o expirado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { code, returnTo } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    let query: Record<string, unknown> = { username: pending.username };
    try {
      if (ObjectId.isValid(pending.userId)) {
        query = { _id: new ObjectId(pending.userId) };
      }
    } catch {}

    const userDoc = await users.findOne(query);
    if (!userDoc) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    let isValid = false;
    let usedRecoveryCode = false;
    let nextHashedCodes = userDoc.recoveryCodesHashed || [];

    // 1. Intentar validar como TOTP
    const secret = decryptSecret(userDoc.totpSecretEncrypted || "");
    if (secret && verifyTotpToken(code, secret)) {
      isValid = true;
    }

    // 2. Si no es TOTP, intentar como código de recuperación
    if (!isValid && Array.isArray(userDoc.recoveryCodesHashed)) {
      const recResult = verifyAndConsumeRecoveryCode(code, userDoc.recoveryCodesHashed);
      if (recResult.valid) {
        isValid = true;
        usedRecoveryCode = true;
        nextHashedCodes = recResult.remainingHashedCodes;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        {
          error:
            "Código incorrecto. Si has perdido el acceso a tu app y a tus códigos, contacta a info@broslunas.com.",
        },
        { status: 400 }
      );
    }

    // Si se usó código de recuperación, descontarlo en Mongo
    if (usedRecoveryCode) {
      await users.updateOne(query, {
        $set: {
          recoveryCodesHashed: nextHashedCodes,
          updatedAt: new Date(),
        },
      });
    }

    const authUser: AuthUser = {
      id: userDoc._id.toString(),
      githubId: userDoc.githubId,
      username: userDoc.username,
      name: userDoc.name || userDoc.username,
      avatarUrl: userDoc.avatarUrl || "",
      email: userDoc.email || undefined,
    };

    const sessionToken = await createSessionToken(authUser);
    const finalReturn = sanitizeReturnTo(returnTo);

    const response = NextResponse.json({
      success: true,
      redirect: finalReturn,
      usedRecoveryCode,
      remainingRecoveryCodes: nextHashedCodes.length,
    });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    response.cookies.delete(PENDING_2FA_COOKIE_NAME);

    return response;
  } catch (err) {
    console.error("Error al verificar 2FA:", err);
    return NextResponse.json({ error: "Error en el servidor al verificar 2FA" }, { status: 500 });
  }
}
