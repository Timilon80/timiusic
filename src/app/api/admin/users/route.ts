import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createUser } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as {
      username?: string;
      password?: string;
      displayName?: string;
      role?: string;
    };

    if (!body.username || !body.password || !body.displayName) {
      return NextResponse.json({ error: "Completa todos los campos del cliente." }, { status: 400 });
    }

    if (body.password.length < 6) {
      return NextResponse.json({ error: "La clave debe tener al menos 6 caracteres." }, { status: 400 });
    }

    createUser({
      username: body.username,
      password: body.password,
      displayName: body.displayName,
      role: body.role === "admin" ? "admin" : "client",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Debes iniciar sesion." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Solo el admin puede crear clientes." }, { status: 403 });
    }

    return NextResponse.json({ error: "No se pudo crear el usuario. Puede que ya exista." }, { status: 400 });
  }
}
