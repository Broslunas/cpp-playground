import { CompilerSettings, SupportedLanguage } from "@/types";

export interface ShareableState {
  title?: string;
  language?: SupportedLanguage;
  code: string;
  stdin?: string;
  compiler?: string;
  standard?: string;
  settings?: CompilerSettings;
}

export interface CreateShareOptions {
  state: ShareableState;
  customSlug?: string;
  password?: string;
  expiresIn?: "never" | "1h" | "24h" | "7d" | "30d";
}

export interface CreateShareResult {
  success: boolean;
  code?: string;
  url?: string;
  fullUrl?: string;
  error?: string;
  hasPassword?: boolean;
}

export interface SharedSnippetResponse {
  requiresPassword: boolean;
  hasPassword?: boolean;
  code: string;
  title: string;
  language: SupportedLanguage;
  code_content?: string;
  stdin?: string;
  compiler?: string;
  standard?: string;
  settings?: CompilerSettings;
  createdAt?: number;
  error?: string;
  expired?: boolean;
}

// Client helper to create a shortened share link
export async function createShortShare(options: CreateShareOptions): Promise<CreateShareResult> {
  try {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: options.state.code,
        language: options.state.language,
        title: options.state.title,
        stdin: options.state.stdin,
        compiler: options.state.compiler,
        standard: options.state.standard,
        settings: options.state.settings,
        customSlug: options.customSlug?.trim() || undefined,
        password: options.password?.trim() || undefined,
        expiresIn: options.expiresIn || "never",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Error al crear enlace compartido" };
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shortUrl = `/s/${data.code}`;
    const fullUrl = `${origin}${shortUrl}`;

    return {
      success: true,
      code: data.code,
      url: shortUrl,
      fullUrl,
      hasPassword: data.hasPassword,
    };
  } catch (err) {
    console.error("Failed to create short share link:", err);
    return { success: false, error: "Error de red al conectar con el servidor." };
  }
}

// Client helper to fetch shared snippet
export async function fetchSharedSnippet(code: string): Promise<SharedSnippetResponse> {
  const res = await fetch(`/api/share/${encodeURIComponent(code)}`);
  const data = await res.json();
  if (!res.ok) {
    return {
      requiresPassword: false,
      code,
      title: "",
      language: "cpp",
      error: data.error || "Error al cargar proyecto",
      expired: Boolean(data.expired),
    };
  }
  return data;
}

// Client helper to unlock password protected snippet
export async function unlockSharedSnippet(
  code: string,
  password: string
): Promise<{ success: boolean; data?: SharedSnippetResponse; error?: string }> {
  try {
    const res = await fetch(`/api/share/${encodeURIComponent(code)}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Contraseña incorrecta." };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Failed to unlock snippet:", err);
    return { success: false, error: "Error de conexión al verificar contraseña." };
  }
}

// Encode UTF-8 string to URL-safe base64 (offline fallback)
export function encodeShareableState(state: ShareableState): string {
  try {
    const json = JSON.stringify(state);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (err) {
    console.error("Failed to encode state:", err);
    return "";
  }
}

// Decode URL-safe base64 to state
export function decodeShareableState(hash: string): ShareableState | null {
  try {
    const cleaned = hash.replace(/^#/, "").trim();
    if (!cleaned) return null;

    let base64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    if (parsed && typeof parsed.code === "string") {
      return parsed as ShareableState;
    }
    return null;
  } catch (err) {
    console.error("Failed to decode shared hash:", err);
    return null;
  }
}

export function generateShareUrl(state: ShareableState): string {
  const hash = encodeShareableState(state);
  if (!hash) return window.location.href;
  const url = new URL(window.location.href);
  url.hash = hash;
  return url.toString();
}
