import { NextResponse } from "next/server";
import { getSharedSnippet, incrementSnippetViews } from "@/lib/shares-db";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    if (!code) {
      return NextResponse.json({ error: "Código no especificado." }, { status: 400 });
    }

    const snippet = await getSharedSnippet(code);
    if (!snippet) {
      return NextResponse.json(
        { error: "Enlace de código compartido no encontrado o eliminado." },
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

    // If password-protected, only return basic metadata without the code
    if (snippet.hasPassword) {
      return NextResponse.json({
        requiresPassword: true,
        hasPassword: true,
        code: snippet.code,
        title: snippet.title,
        language: snippet.language,
        createdAt: snippet.createdAt,
      });
    }

    // Increment views asynchronously
    incrementSnippetViews(snippet.code).catch(() => {});

    return NextResponse.json({
      requiresPassword: false,
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
    console.error("Error retrieving shared snippet:", error);
    return NextResponse.json(
      { error: "Error al recuperar código compartido." },
      { status: 500 }
    );
  }
}
