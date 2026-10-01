import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  generateShortCode,
  validateCustomSlug,
  isSlugTaken,
  hashPassword,
  saveSharedSnippet,
  SharedSnippetRecord,
} from "@/lib/shares-db";
import { SupportedLanguage } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      code: codeContent,
      language,
      title,
      stdin = "",
      compiler = "",
      standard = "",
      settings,
      customSlug,
      password,
      expiresIn = "never",
    } = body;

    if (typeof codeContent !== "string") {
      return NextResponse.json(
        { error: "El código fuente es obligatorio." },
        { status: 400 }
      );
    }

    if (!language) {
      return NextResponse.json(
        { error: "El lenguaje de programación es obligatorio." },
        { status: 400 }
      );
    }

    let finalSlug: string;

    if (customSlug && typeof customSlug === "string" && customSlug.trim()) {
      const slugVal = validateCustomSlug(customSlug);
      if (!slugVal.valid) {
        return NextResponse.json({ error: slugVal.error }, { status: 400 });
      }
      const taken = await isSlugTaken(customSlug.trim());
      if (taken) {
        return NextResponse.json(
          { error: "Esta URL personalizada ya está en uso. Elige otra." },
          { status: 409 }
        );
      }
      finalSlug = customSlug.trim().toLowerCase();
    } else {
      // Generate unique short code
      let generated = generateShortCode(6);
      let attempts = 0;
      while ((await isSlugTaken(generated)) && attempts < 5) {
        generated = generateShortCode(6);
        attempts++;
      }
      finalSlug = generated;
    }

    // Password handling
    let hasPassword = false;
    let passwordHash: string | null = null;
    let passwordSalt: string | null = null;

    if (password && typeof password === "string" && password.trim().length > 0) {
      if (password.trim().length < 3) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 3 caracteres." },
          { status: 400 }
        );
      }
      const hashed = hashPassword(password.trim());
      hasPassword = true;
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }

    // Expiration handling
    let expiresAt: number | null = null;
    const now = Date.now();
    if (expiresIn === "1h") {
      expiresAt = now + 60 * 60 * 1000;
    } else if (expiresIn === "24h") {
      expiresAt = now + 24 * 60 * 60 * 1000;
    } else if (expiresIn === "7d") {
      expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    } else if (expiresIn === "30d") {
      expiresAt = now + 30 * 24 * 60 * 60 * 1000;
    }

    // Optional user attachment
    const currentUser = await getCurrentUser().catch(() => null);

    const record: SharedSnippetRecord = {
      code: finalSlug,
      title: (title || "Código Compartido").slice(0, 100),
      language: language as SupportedLanguage,
      code_content: codeContent,
      stdin: stdin || "",
      compiler: compiler || "",
      standard: standard || "",
      settings: settings || undefined,
      hasPassword,
      passwordHash,
      passwordSalt,
      createdAt: now,
      expiresAt,
      views: 0,
      userId: currentUser?.id || null,
      username: currentUser?.username || null,
    };

    await saveSharedSnippet(record);

    return NextResponse.json({
      success: true,
      code: finalSlug,
      url: `/s/${finalSlug}`,
      hasPassword,
      expiresAt,
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Error al generar enlace de compartir." },
      { status: 500 }
    );
  }
}
