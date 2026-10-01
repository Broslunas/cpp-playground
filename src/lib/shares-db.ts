import crypto from "crypto";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { SupportedLanguage, CompilerSettings } from "@/types";

export interface SharedSnippetRecord {
  code: string;
  title: string;
  language: SupportedLanguage;
  code_content: string;
  stdin: string;
  compiler: string;
  standard: string;
  settings?: CompilerSettings;
  hasPassword: boolean;
  passwordHash?: string | null;
  passwordSalt?: string | null;
  createdAt: number;
  expiresAt?: number | null;
  views: number;
  userId?: string | null;
  username?: string | null;
}

// In-memory fallback cache in case MongoDB is temporarily unavailable
const inMemoryShares = new Map<string, SharedSnippetRecord>();

let hasEnsuredIndexes = false;
async function ensureSharesCollection() {
  if (!isMongoConfigured() || hasEnsuredIndexes) return;
  try {
    const db = await getDb();
    const collection = db.collection("shares");
    await collection.createIndex({ code: 1 }, { unique: true });
    await collection.createIndex({ expiresAt: 1 }, { sparse: true });
    hasEnsuredIndexes = true;
  } catch (err) {
    console.warn("Could not ensure indexes on 'shares' collection:", err);
  }
}

// Generate URL-friendly short code (unambiguous alphanumeric)
export function generateShortCode(length = 6): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export const RESERVED_SLUGS = new Set([
  "api",
  "s",
  "login",
  "register",
  "u",
  "perfil",
  "configuracion",
  "auth",
  "admin",
  "playground",
  "c",
  "cpp",
  "python",
  "javascript",
  "typescript",
  "html",
  "sql",
  "bash",
  "terminal",
  "static",
  "favicon",
  "robots",
  "sitemap",
  "terms",
  "privacy",
  "settings",
]);

export function validateCustomSlug(slug: string): { valid: boolean; error?: string } {
  const clean = slug.trim().toLowerCase();
  if (clean.length < 3) {
    return { valid: false, error: "La URL personalizada debe tener al menos 3 caracteres." };
  }
  if (clean.length > 50) {
    return { valid: false, error: "La URL personalizada no puede superar 50 caracteres." };
  }
  if (!/^[a-z0-9_-]+$/.test(clean)) {
    return {
      valid: false,
      error: "Solo se permiten letras minúsculas, números, guiones (-) y guiones bajos (_).",
    };
  }
  if (RESERVED_SLUGS.has(clean)) {
    return { valid: false, error: "Esta URL personalizada está reservada por el sistema." };
  }
  return { valid: true };
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
  } catch {
    return false;
  }
}

export async function isSlugTaken(slug: string): Promise<boolean> {
  const normalized = slug.trim().toLowerCase();
  if (inMemoryShares.has(normalized)) return true;

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      const existing = await db.collection("shares").findOne({
        code: { $regex: new RegExp(`^${normalized}$`, "i") },
      });
      return Boolean(existing);
    } catch (err) {
      console.error("Error checking slug existence in Mongo:", err);
    }
  }
  return false;
}

export async function saveSharedSnippet(snippet: SharedSnippetRecord): Promise<void> {
  // Always keep in memory fallback
  inMemoryShares.set(snippet.code.toLowerCase(), snippet);

  if (isMongoConfigured()) {
    await ensureSharesCollection();
    try {
      const db = await getDb();
      await db.collection("shares").updateOne(
        { code: snippet.code },
        { $set: snippet },
        { upsert: true }
      );
    } catch (err) {
      console.error("Error saving shared snippet to Mongo:", err);
      // Fallback is already saved in memory
    }
  }
}

export async function getSharedSnippet(code: string): Promise<SharedSnippetRecord | null> {
  const normalized = code.trim().toLowerCase();

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      const doc = await db.collection("shares").findOne({
        code: { $regex: new RegExp(`^${normalized}$`, "i") },
      });
      if (doc) {
        return {
          code: doc.code,
          title: doc.title,
          language: doc.language,
          code_content: doc.code_content,
          stdin: doc.stdin || "",
          compiler: doc.compiler || "",
          standard: doc.standard || "",
          settings: doc.settings,
          hasPassword: Boolean(doc.hasPassword),
          passwordHash: doc.passwordHash,
          passwordSalt: doc.passwordSalt,
          createdAt: doc.createdAt || Date.now(),
          expiresAt: doc.expiresAt ?? null,
          views: doc.views || 0,
          userId: doc.userId,
          username: doc.username,
        };
      }
    } catch (err) {
      console.error("Error fetching shared snippet from Mongo:", err);
    }
  }

  // Fallback to memory
  return inMemoryShares.get(normalized) || null;
}

export async function incrementSnippetViews(code: string): Promise<void> {
  const normalized = code.trim().toLowerCase();
  const mem = inMemoryShares.get(normalized);
  if (mem) {
    mem.views = (mem.views || 0) + 1;
  }

  if (isMongoConfigured()) {
    try {
      const db = await getDb();
      await db.collection("shares").updateOne(
        { code: { $regex: new RegExp(`^${normalized}$`, "i") } },
        { $inc: { views: 1 } }
      );
    } catch (err) {
      console.error("Error incrementing snippet views in Mongo:", err);
    }
  }
}
