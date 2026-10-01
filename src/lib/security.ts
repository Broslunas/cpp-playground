import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "crypto";

const DEFAULT_SECRET = "default-playground-secret-key-32-chars-minimum-needed";

function getSecretBuffer(): Buffer {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return createHmac("sha256", "playground-security-key").update(secret).digest();
}

/**
 * Cifrado simétrico AES-256-GCM para secretos sensibles como TOTP en base de datos.
 * NUNCA se guardan contraseñas de usuario ni secretos en claro.
 */
export function encryptSecret(plainText: string): string {
  const iv = randomBytes(12);
  const key = getSecretBuffer();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(cipherPayload: string): string {
  try {
    const parts = cipherPayload.split(":");
    if (parts.length !== 3) return "";
    const [ivHex, tagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(dataHex, "hex");
    const key = getSecretBuffer();
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    return "";
  }
}

/**
 * Generador de códigos de recuperación de un solo uso (formato XXXX-XXXX).
 * Se devuelven en claro al usuario una única vez; en Mongo se guarda solo el hash HMAC.
 */
export function generateRecoveryCodes(count = 8): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sin caracteres ambiguos (0/O, 1/I)

  for (let i = 0; i < count; i++) {
    let code = "";
    const bytes = randomBytes(8);
    for (let b = 0; b < 8; b++) {
      if (b === 4) code += "-";
      code += alphabet[bytes[b] % alphabet.length];
    }
    plainCodes.push(code);
    hashedCodes.push(hashRecoveryCode(code));
  }

  return { plainCodes, hashedCodes };
}

export function hashRecoveryCode(code: string): string {
  const clean = code.trim().toUpperCase().replace(/\s+/g, "");
  return createHmac("sha256", getSecretBuffer()).update(clean).digest("hex");
}

export function verifyAndConsumeRecoveryCode(inputCode: string, savedHashedCodes: string[]): { valid: boolean; remainingHashedCodes: string[] } {
  const testHash = hashRecoveryCode(inputCode);
  const matchIndex = savedHashedCodes.indexOf(testHash);
  if (matchIndex === -1) {
    return { valid: false, remainingHashedCodes: savedHashedCodes };
  }
  const next = [...savedHashedCodes];
  next.splice(matchIndex, 1);
  return { valid: true, remainingHashedCodes: next };
}

/**
 * TOTP RFC 6238 en puro Node stdlib (sin dependencias externas pesadas).
 */
export function generateBase32Secret(length = 20): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = randomBytes(length);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += alphabet[bytes[i] % 32];
  }
  return secret;
}

function base32ToBuffer(base32: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const char of clean) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpCode(secretBase32: string, counter?: number): string {
  const key = base32ToBuffer(secretBase32);
  const timeStep = 30;
  const currentCounter = counter !== undefined ? counter : Math.floor(Date.now() / 1000 / timeStep);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(currentCounter));

  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const codeInt =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (codeInt % 1000000).toString().padStart(6, "0");
  return otp;
}

export function verifyTotpToken(token: string, secretBase32: string, windowSteps = 1): boolean {
  const clean = token.trim().replace(/\s+/g, "");
  if (clean.length !== 6 || !/^\d{6}$/.test(clean)) return false;

  const timeStep = 30;
  const currentStep = Math.floor(Date.now() / 1000 / timeStep);

  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const candidate = generateTotpCode(secretBase32, currentStep + offset);
    if (candidate === clean) {
      return true;
    }
  }
  return false;
}

export function buildOtpAuthUri(username: string, secretBase32: string, issuer = "Broslunas Playground"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
