import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { getCodeFromR2, uploadCodeToR2, deleteCodeFromR2, isR2Configured } from "@/lib/r2";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB no configurado" }, { status: 503 });
  }

  try {
    const db = await getDb();
    const doc = await db.collection("projects").findOne({
      userId: user.id,
      projectId: id,
    });

    if (!doc) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    let code = doc.code || "";
    if (doc.r2Key && isR2Configured()) {
      try {
        code = await getCodeFromR2(doc.r2Key);
      } catch (err) {
        console.error("Error al leer código de R2:", err);
      }
    }

    return NextResponse.json({
      project: {
        id: doc.projectId,
        name: doc.name,
        language: doc.language,
        code,
        stdin: doc.stdin || "",
        compiler: doc.compiler || "",
        options: doc.options || "",
        settings: doc.settings,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        syncedAt: doc.syncedAt,
        isCloud: true,
        visibility: doc.visibility || "private",
        publicCode: doc.publicCode ?? false,
        featured: doc.featured ?? false,
        collectionIds: doc.collectionIds || [],
        exerciseNumber: doc.exerciseNumber,
      },
    });
  } catch (error) {
    console.error("Error al obtener proyecto:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB no configurado" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      name,
      language,
      code,
      stdin,
      compiler,
      options,
      settings,
      visibility,
      publicCode,
      featured,
      collectionIds,
    } = body;

    const r2Key = `projects/${user.id}/${id}.txt`;

    if (code !== undefined && isR2Configured()) {
      try {
        await uploadCodeToR2(r2Key, code);
      } catch (r2Err) {
        console.error("Error al actualizar código en R2:", r2Err);
      }
    }

    const db = await getDb();
    const now = Date.now();

    const updateDoc: Record<string, unknown> = {
      updatedAt: now,
      syncedAt: now,
    };

    if (name !== undefined) updateDoc.name = name;
    if (language !== undefined) updateDoc.language = language;
    if (code !== undefined) updateDoc.code = code;
    if (stdin !== undefined) updateDoc.stdin = stdin;
    if (compiler !== undefined) updateDoc.compiler = compiler;
    if (options !== undefined) updateDoc.options = options;
    if (settings !== undefined) updateDoc.settings = settings;
    if (visibility !== undefined && ["public", "unlisted", "private"].includes(visibility)) {
      updateDoc.visibility = visibility;
    }
    if (publicCode !== undefined) updateDoc.publicCode = Boolean(publicCode);
    if (featured !== undefined) updateDoc.featured = Boolean(featured);
    if (Array.isArray(collectionIds)) updateDoc.collectionIds = collectionIds;

    await db.collection("projects").updateOne(
      { userId: user.id, projectId: id },
      { $set: updateDoc }
    );

    return NextResponse.json({ success: true, syncedAt: now });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = await params;
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "MongoDB no configurado" }, { status: 503 });
  }

  try {
    const db = await getDb();
    const r2Key = `projects/${user.id}/${id}.txt`;

    if (isR2Configured()) {
      try {
        await deleteCodeFromR2(r2Key);
      } catch (r2Err) {
        console.error("Error al eliminar código de R2:", r2Err);
      }
    }

    await db.collection("projects").deleteOne({
      userId: user.id,
      projectId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
