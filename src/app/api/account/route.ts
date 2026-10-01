import { NextResponse } from "next/server";
import { getCurrentUser, COOKIE_NAME } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { isR2Configured, deleteCodeFromR2 } from "@/lib/r2";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const {
      name,
      bio,
      website,
      availableForCollaboration,
      profileVisibility,
      showActivity,
      featuredProjectIds,
      collections,
      preferences,
    } = body;

    const updateDoc: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateDoc.name = String(name).slice(0, 50);
    if (bio !== undefined) updateDoc.bio = String(bio).slice(0, 240);
    if (website !== undefined) {
      const cleanUrl = String(website).trim().slice(0, 150);
      if (cleanUrl === "" || /^https?:\/\//i.test(cleanUrl)) {
        updateDoc.website = cleanUrl;
      } else {
        return NextResponse.json({ error: "La URL debe comenzar con http:// o https://" }, { status: 400 });
      }
    }
    if (availableForCollaboration !== undefined) {
      updateDoc.availableForCollaboration = Boolean(availableForCollaboration);
    }
    if (profileVisibility !== undefined && ["public", "unlisted", "private"].includes(profileVisibility)) {
      updateDoc.profileVisibility = profileVisibility;
    }
    if (showActivity !== undefined) {
      updateDoc.showActivity = Boolean(showActivity);
    }
    if (Array.isArray(featuredProjectIds)) {
      updateDoc.featuredProjectIds = featuredProjectIds.slice(0, 6);
    }
    if (Array.isArray(collections)) {
      updateDoc.collections = collections.slice(0, 10).map((c: { id?: string; name: string }) => ({
        id: c.id || crypto.randomUUID(),
        name: String(c.name).slice(0, 30),
      }));
    }
    if (preferences && typeof preferences === "object") {
      updateDoc.preferences = {
        theme: preferences.theme === "black" ? "black" : "dark",
        editorTheme: ["one-dark", "dracula", "nord"].includes(preferences.editorTheme)
          ? preferences.editorTheme
          : "one-dark",
        fontSize: Math.max(12, Math.min(20, Number(preferences.fontSize) || 14)),
        tabSize: preferences.tabSize === 4 ? 4 : 2,
        showLineNumbers: preferences.showLineNumbers !== false,
        autoSave: preferences.autoSave !== false,
        emailNotifications: Boolean(preferences.emailNotifications),
        productUpdates: preferences.productUpdates !== false,
      };
    }

    const db = await getDb();
    const users = db.collection("users");
    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}

    await users.updateOne(query, { $set: updateDoc });

    return NextResponse.json({ success: true, updated: updateDoc });
  } catch (err) {
    console.error("Error actualizando perfil:", err);
    return NextResponse.json({ error: "Error al actualizar la configuración" }, { status: 500 });
  }
}

// Exportación completa de datos en JSON según RGPD/Privacidad
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "export") {
    if (!isMongoConfigured()) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 });
    }

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ username: user.username });
    const userProjects = await db
      .collection("projects")
      .find({ userId: user.id })
      .toArray();

    const sanitizedExport = {
      user: {
        username: userDoc?.username,
        name: userDoc?.name,
        email: userDoc?.email,
        bio: userDoc?.bio,
        website: userDoc?.website,
        profileVisibility: userDoc?.profileVisibility,
        preferences: userDoc?.preferences,
        createdAt: userDoc?.createdAt,
      },
      projects: userProjects.map((p) => ({
        id: p.projectId,
        name: p.name,
        language: p.language,
        code: p.code,
        stdin: p.stdin,
        visibility: p.visibility || "private",
        publicCode: Boolean(p.publicCode),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      exportedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(sanitizedExport, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="broslunas-playground-${user.username}-export.json"`,
      },
    });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}

// Eliminación permanente de cuenta
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ error: "Base de datos no configurada" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { confirmationUsername } = body;

    if (confirmationUsername !== user.username) {
      return NextResponse.json(
        { error: "El nombre de usuario de confirmación no coincide" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const projectsCol = db.collection("projects");
    const usersCol = db.collection("users");

    // 1. Eliminar archivos de R2 asociados
    if (isR2Configured()) {
      const userProjects = await projectsCol.find({ userId: user.id }).toArray();
      for (const p of userProjects) {
        if (p.r2Key) {
          try {
            await deleteCodeFromR2(p.r2Key);
          } catch {}
        }
      }
    }

    // 2. Eliminar proyectos de MongoDB
    await projectsCol.deleteMany({ userId: user.id });

    // 3. Eliminar usuario de MongoDB
    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}
    await usersCol.deleteOne(query);

    // 4. Limpiar cookie de sesión
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return NextResponse.json({ success: true, redirect: "/" });
  } catch (err) {
    console.error("Error al eliminar cuenta:", err);
    return NextResponse.json({ error: "Error al procesar la eliminación de la cuenta" }, { status: 500 });
  }
}
