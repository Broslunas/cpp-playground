import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!isMongoConfigured()) {
    return NextResponse.json({ passkeys: [] });
  }

  try {
    const db = await getDb();
    const users = db.collection("users");
    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}

    const doc = await users.findOne(query);
    const passkeys = (doc?.passkeys || []).map((p: { id: string; name?: string; createdAt?: number }) => ({
      id: p.id,
      name: p.name || "Passkey",
      createdAt: p.createdAt || Date.now(),
    }));

    return NextResponse.json({ passkeys });
  } catch (err) {
    console.error("Error al obtener passkeys:", err);
    return NextResponse.json({ error: "Error al recuperar passkeys" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID de passkey requerido" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");
    let query: Record<string, unknown> = { username: user.username };
    try {
      if (ObjectId.isValid(user.id)) query = { _id: new ObjectId(user.id) };
    } catch {}

    await users.updateOne(query, {
      $pull: { passkeys: { id } as never },
      $set: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error al eliminar passkey:", err);
    return NextResponse.json({ error: "Error al eliminar passkey" }, { status: 500 });
  }
}
