import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import {
  generateBase32Secret,
  encryptSecret,
  decryptSecret,
  buildOtpAuthUri,
  verifyTotpToken,
  generateRecoveryCodes,
} from "@/lib/security";
import { ObjectId } from "mongodb";

export async function GET() {
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

    // Si ya está habilitado, no devolvemos el secreto por seguridad
    if (doc?.totpEnabled) {
      return NextResponse.json({
        enabled: true,
        recoveryCodesRemaining: Array.isArray(doc?.recoveryCodesHashed)
          ? doc.recoveryCodesHashed.length
          : 0,
      });
    }

    // Generar nuevo secreto provisional para configuración
    const secret = generateBase32Secret(20);
    const otpauthUrl = buildOtpAuthUri(user.username, secret);

    return NextResponse.json({
      enabled: false,
      secret,
      otpauthUrl,
    });
  } catch (err) {
    console.error("Error al obtener estado 2FA:", err);
    return NextResponse.json({ error: "Error al consultar 2FA" }, { status: 500 });
  }
}

// Activar 2FA tras verificar el primer código
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { token, secret } = body;

    if (!token || !secret) {
      return NextResponse.json({ error: "Token y secreto requeridos" }, { status: 400 });
    }

    const isValid = verifyTotpToken(token, secret);
    if (!isValid) {
      return NextResponse.json({ error: "Código TOTP inválido o fuera de hora" }, { status: 400 });
    }

    // Cifrar el secreto antes de guardarlo en MongoDB
    const encryptedSecret = encryptSecret(secret);
    const { plainCodes, hashedCodes } = generateRecoveryCodes(8);

    const db = await getDb();
    const users = db.collection("users");
    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}

    await users.updateOne(query, {
      $set: {
        totpEnabled: true,
        totpSecretEncrypted: encryptedSecret,
        recoveryCodesHashed: hashedCodes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      recoveryCodes: plainCodes, // Se muestran una sola vez para que el usuario los guarde
    });
  } catch (err) {
    console.error("Error activando 2FA:", err);
    return NextResponse.json({ error: "Error al activar 2FA" }, { status: 500 });
  }
}

// Desactivar 2FA (requiere código TOTP o de recuperación válido)
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { confirmationCode } = body;

    const db = await getDb();
    const users = db.collection("users");
    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}

    const doc = await users.findOne(query);
    if (!doc?.totpEnabled) {
      return NextResponse.json({ success: true });
    }

    const secret = decryptSecret(doc.totpSecretEncrypted || "");
    const isTotp = secret && confirmationCode && verifyTotpToken(confirmationCode, secret);

    const { verifyAndConsumeRecoveryCode } = await import("@/lib/security");
    const recoveryResult = verifyAndConsumeRecoveryCode(
      confirmationCode || "",
      doc.recoveryCodesHashed || []
    );

    if (!isTotp && !recoveryResult.valid) {
      return NextResponse.json(
        { error: "Código de confirmación incorrecto. Introduce un código TOTP o de recuperación." },
        { status: 400 }
      );
    }

    await users.updateOne(query, {
      $set: {
        totpEnabled: false,
        totpSecretEncrypted: null,
        recoveryCodesHashed: [],
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error al desactivar 2FA:", err);
    return NextResponse.json({ error: "Error al desactivar 2FA" }, { status: 500 });
  }
}
