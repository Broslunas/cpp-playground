import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { uploadCodeToR2, isR2Configured } from "@/lib/r2";
import { Project } from "@/types";

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
    const localProjects: Project[] = Array.isArray(body.projects) ? body.projects : [];

    const db = await getDb();
    const collection = db.collection("projects");
    const now = Date.now();

    const syncedProjects: Project[] = [];

    for (const project of localProjects) {
      if (!project.id || !project.name) continue;

      const r2Key = `projects/${user.id}/${project.id}.txt`;

      if (isR2Configured() && project.code) {
        try {
          await uploadCodeToR2(r2Key, project.code);
        } catch (r2Err) {
          console.error(`Error al subir ${project.id} a R2:`, r2Err);
        }
      }

      await collection.updateOne(
        { userId: user.id, projectId: project.id },
        {
          $set: {
            userId: user.id,
            projectId: project.id,
            name: project.name,
            language: project.language || "cpp",
            code: project.code || "",
            stdin: project.stdin || "",
            compiler: project.compiler || "",
            options: project.options || "",
            settings: project.settings,
            r2Key,
            updatedAt: project.updatedAt || now,
            syncedAt: now,
            folder: project.folder || "",
          },
          $setOnInsert: {
            createdAt: project.createdAt || now,
          },
        },
        { upsert: true }
      );

      syncedProjects.push({
        ...project,
        syncedAt: now,
        isCloud: true,
      });
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedProjects.length,
      projects: syncedProjects,
    });
  } catch (error) {
    console.error("Error en sincronización masiva:", error);
    return NextResponse.json(
      { error: "Error al sincronizar proyectos" },
      { status: 500 }
    );
  }
}
