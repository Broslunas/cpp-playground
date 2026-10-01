import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { uploadCodeToR2, getCodeFromR2, isR2Configured } from "@/lib/r2";
import { Project } from "@/types";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Base de datos MongoDB no configurada" },
      { status: 503 }
    );
  }

  try {
    const db = await getDb();
    const collection = db.collection("projects");

    const docs = await collection
      .find({ userId: user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    const projects: Project[] = await Promise.all(
      docs.map(async (doc) => {
        let code = doc.code || "";

        // If R2 is configured and key exists, fetch latest code from R2
        if (doc.r2Key && isR2Configured()) {
          try {
            code = await getCodeFromR2(doc.r2Key);
          } catch (r2Error) {
            console.error(`Error al recuperar código de R2 para ${doc.projectId}:`, r2Error);
            // Fallback to mongo stored code if available
            code = doc.code || "";
          }
        }

        return {
          id: doc.projectId,
          name: doc.name,
          language: doc.language,
          code,
          stdin: doc.stdin || "",
          compiler: doc.compiler || "",
          options: doc.options || "",
          settings: doc.settings,
          createdAt: doc.createdAt || Date.now(),
          updatedAt: doc.updatedAt || Date.now(),
          syncedAt: doc.syncedAt || Date.now(),
          isCloud: true,
          visibility: doc.visibility || "private",
          publicCode: doc.publicCode ?? false,
          featured: doc.featured ?? false,
          collectionIds: doc.collectionIds || [],
          folder: doc.folder || undefined,
        };
      })
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    return NextResponse.json(
      { error: "Error al recuperar proyectos de la nube" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Base de datos MongoDB no configurada" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      id,
      name,
      language = "cpp",
      code = "",
      stdin = "",
      compiler = "",
      options = "",
      settings,
      createdAt = Date.now(),
      updatedAt = Date.now(),
      visibility = "private",
      publicCode = false,
      featured = false,
      collectionIds = [],
      folder,
    } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "ID y nombre de proyecto requeridos" },
        { status: 400 }
      );
    }

    const r2Key = `projects/${user.id}/${id}.txt`;

    // 1. Upload code to Cloudflare R2
    if (isR2Configured()) {
      try {
        await uploadCodeToR2(r2Key, code);
      } catch (r2Error) {
        console.error("Error al guardar código en R2:", r2Error);
      }
    }

    // 2. Save metadata and backup in MongoDB
    const db = await getDb();
    const collection = db.collection("projects");
    const now = Date.now();

    await collection.updateOne(
      { userId: user.id, projectId: id },
      {
        $set: {
          userId: user.id,
          projectId: id,
          name,
          language,
          code, // Keep backup in Mongo in case R2 is unreachable or offline
          stdin,
          compiler,
          options,
          settings,
          r2Key,
          updatedAt,
          syncedAt: now,
          visibility: ["public", "unlisted", "private"].includes(visibility) ? visibility : "private",
          publicCode: Boolean(publicCode),
          featured: Boolean(featured),
          collectionIds: Array.isArray(collectionIds) ? collectionIds : [],
          folder: typeof folder === "string" ? folder.trim() : "",
        },
        $setOnInsert: {
          createdAt,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      project: {
        id,
        name,
        language,
        code,
        stdin,
        compiler,
        options,
        settings,
        createdAt,
        updatedAt,
        syncedAt: now,
        isCloud: true,
        visibility,
        publicCode: Boolean(publicCode),
        featured: Boolean(featured),
        collectionIds,
        folder: typeof folder === "string" ? folder.trim() || undefined : undefined,
      },
    });
  } catch (error) {
    console.error("Error al guardar proyecto en la nube:", error);
    return NextResponse.json(
      { error: "Error al guardar proyecto en la nube" },
      { status: 500 }
    );
  }
}
