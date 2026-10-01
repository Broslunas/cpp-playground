import { NextResponse } from "next/server";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { getCodeFromR2, isR2Configured } from "@/lib/r2";
import { PublicUserProfile, PublicProjectCard } from "@/types";

interface RouteParams {
  params: Promise<{ username: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { username } = await params;
  const cleanUsername = username?.trim().toLowerCase();

  if (!cleanUsername) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 400 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 });
  }

  try {
    const db = await getDb();
    const usersCol = db.collection("users");
    const projectsCol = db.collection("projects");

    // Búsqueda insensible a mayúsculas
    const userDoc = await usersCol.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
    });

    if (!userDoc) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const visibility = userDoc.profileVisibility || "public";

    // Si el perfil es explícitamente privado, no se expone información
    if (visibility === "private") {
      return NextResponse.json({ error: "Este perfil es privado" }, { status: 404 });
    }

    const userId = userDoc._id.toString();

    // Solo se exponen proyectos con visibilidad 'public'
    const publicDocs = await projectsCol
      .find({
        userId,
        visibility: "public",
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const featuredProjectIds: string[] = userDoc.featuredProjectIds || [];

    const featuredProjects: PublicProjectCard[] = await Promise.all(
      publicDocs
        .filter((doc) => featuredProjectIds.length === 0 || featuredProjectIds.includes(doc.projectId))
        .slice(0, 6)
        .map(async (doc) => {
          let code: string | undefined = undefined;

          // Solo se lee y envía el código si el usuario activó explícitamente publicCode
          if (doc.publicCode) {
            code = doc.code || "";
            if (doc.r2Key && isR2Configured()) {
              try {
                code = await getCodeFromR2(doc.r2Key);
              } catch {}
            }
          }

          return {
            id: doc.projectId,
            name: doc.name,
            language: doc.language || "cpp",
            compiler: doc.compiler || "",
            options: doc.options || "",
            updatedAt: doc.updatedAt || Date.now(),
            publicCode: Boolean(doc.publicCode),
            code,
            stdin: doc.publicCode ? doc.stdin : undefined,
          };
        })
    );

    const userCollections = Array.isArray(userDoc.collections) ? userDoc.collections : [];
    const collectionsWithCount = userCollections.map((col: { id: string; name: string }) => {
      const count = publicDocs.filter(
        (p) => Array.isArray(p.collectionIds) && p.collectionIds.includes(col.id)
      ).length;
      return {
        id: col.id,
        name: col.name,
        projectCount: count,
      };
    });

    const publicProfile: PublicUserProfile = {
      username: userDoc.username,
      name: userDoc.name || userDoc.username,
      avatarUrl: userDoc.avatarUrl || "",
      bio: userDoc.bio || "",
      website: userDoc.website || "",
      availableForCollaboration: userDoc.availableForCollaboration ?? true,
      profileVisibility: visibility,
      showActivity: userDoc.showActivity ?? true,
      featuredProjects,
      collections: collectionsWithCount,
      stats: {
        publicProjectsCount: publicDocs.length,
        joinedAt: userDoc.createdAt ? new Date(userDoc.createdAt).getTime() : Date.now(),
      },
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (err) {
    console.error("Error al obtener perfil público:", err);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
