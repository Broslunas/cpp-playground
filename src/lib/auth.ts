import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AuthUser } from "@/types";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type { AuthUser };

const COOKIE_NAME = "playground_session";
const PENDING_2FA_COOKIE_NAME = "playground_pending_2fa";
const DEFAULT_SECRET = "default-playground-secret-key-32-chars-minimum-needed";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export function isGithubOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  );
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    githubId: user.githubId,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function createPending2FAToken(userId: string, username: string): Promise<string> {
  return new SignJWT({
    pendingUserId: userId,
    pendingUsername: username,
    purpose: "2fa_challenge",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getSecretKey());
}

export async function verifyPending2FAToken(token: string): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.purpose !== "2fa_challenge") return null;
    return {
      userId: payload.pendingUserId as string,
      username: payload.pendingUsername as string,
    };
  } catch {
    return null;
  }
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const baseUser: AuthUser = {
      id: payload.id as string,
      githubId: payload.githubId as string | undefined,
      username: payload.username as string,
      name: payload.name as string,
      avatarUrl: payload.avatarUrl as string,
      email: payload.email as string | undefined,
    };

    // Si MongoDB está disponible, completar datos de perfil actualizados
    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        const users = db.collection("users");
        let query: Record<string, unknown> = { username: baseUser.username };
        try {
          if (ObjectId.isValid(baseUser.id)) {
            query = { _id: new ObjectId(baseUser.id) };
          }
        } catch {}

        const doc = await users.findOne(query);
        if (doc) {
          return {
            ...baseUser,
            name: doc.name || baseUser.name,
            bio: doc.bio || "",
            website: doc.website || "",
            availableForCollaboration: doc.availableForCollaboration ?? true,
            profileVisibility: doc.profileVisibility || "public",
            showActivity: doc.showActivity ?? true,
            featuredProjectIds: doc.featuredProjectIds || [],
            collections: doc.collections || [],
            preferences: doc.preferences || {
              theme: "dark",
              editorTheme: "one-dark",
              fontSize: 14,
              tabSize: 2,
              showLineNumbers: true,
              autoSave: true,
              emailNotifications: false,
              productUpdates: true,
            },
            security: {
              totpEnabled: Boolean(doc.totpEnabled),
              recoveryCodesRemaining: Array.isArray(doc.recoveryCodesHashed)
                ? doc.recoveryCodesHashed.length
                : 0,
              passkeysCount: Array.isArray(doc.passkeys) ? doc.passkeys.length : 0,
              activeSessionsCount: 1,
            },
          };
        }
      } catch (err) {
        console.error("Error al cargar perfil extendido:", err);
      }
    }

    return baseUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export function sanitizeReturnTo(rawUrl?: string | null): string {
  if (!rawUrl) return "/playground";
  if (!rawUrl.startsWith("/") || rawUrl.startsWith("//")) return "/playground";
  return rawUrl;
}

export { COOKIE_NAME, PENDING_2FA_COOKIE_NAME };
