import { CompilerSettings, SupportedLanguage } from "@/types";

export interface ShareableState {
  language?: SupportedLanguage;
  code: string;
  stdin?: string;
  compiler?: string;
  standard?: string;
  settings?: CompilerSettings;
}

// Encode UTF-8 string to URL-safe base64
export function encodeShareableState(state: ShareableState): string {
  try {
    const json = JSON.stringify(state);
    // Base64 encoding compatible with UTF-8
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    // URL-safe replacement
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

    // Restore base64 standard chars
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
