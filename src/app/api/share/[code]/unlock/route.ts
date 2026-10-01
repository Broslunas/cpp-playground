import { NextResponse } from "next/server";
import {
  getSharedSnippet,
  verifyPassword,
  incrementSnippetViews,
} from "@/lib/shares-db";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const { password } = body;

    if (!code) {
      return NextResponse.json({ error: "Código no especificado." }, { status: 400 });
    }

    const snippet = await getSharedSnippet(code);
    if (!snippet) {
      return NextResponse.json(
        { error: "Enlace no encontrado o eliminado." },
        { status: 404 }
      );
    }

    // Check expiration
    if (snippet.expiresAt && Date.now() > snippet.expiresAt) {
      return NextResponse.json(
        { error: "Este enlace de código ha expirado.", expired: true },
        { status: 410 }
      );
    }

    if (!snippet.hasPassword) {
      // Doesn't require password, return directly
      return NextResponse.json({
        success: true,
        code: snippet.code,
        title: snippet.title,
        language: snippet.language,
        code_content: snippet.code_content,
        stdin: snippet.stdin,
        compiler: snippet.compiler,
        standard: snippet.standard,
        settings: snippet.settings,
        createdAt: snippet.createdAt,
      });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Debes introducir la contraseña." },
        { status: 400 }
      );
    }

    const isValid = verifyPassword(
      password.trim(),
      snippet.passwordHash || "",
      snippet.passwordSalt || ""
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Contraseña incorrecta. Inténtalo de nuevo." },
        { status: 401 }
      );
    }

    // Valid password -> increment views and return full snippet
    incrementSnippetViews(snippet.code).catch(() => {});

    return NextResponse.json({
      success: true,
      code: snippet.code,
      title: snippet.title,
      language: snippet.language,
      code_content: snippet.code_content,
      stdin: snippet.stdin,
      compiler: snippet.compiler,
      standard: snippet.standard,
      settings: snippet.settings,
      createdAt: snippet.createdAt,
    });
  } catch (error) {
    console.error("Error unlocking shared snippet:", error);
    return NextResponse.json(
      { error: "Error al desbloquear el proyecto." },
      { status: 500 }
    );
  }
}
