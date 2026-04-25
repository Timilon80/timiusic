import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";
import { createUser } from "@/lib/db";
import { isPublicRegistrationEnabled } from "@/lib/env";

export async function POST(request: Request) {
  try {
    if (!isPublicRegistrationEnabled()) {
      return NextResponse.json(
        { error: "El registro publico esta desactivado. Solicita tu acceso al administrador." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      username?: string;
      password?: string;
      displayName?: string;
    };

    if (!body.username || !body.password || !body.displayName) {
      return NextResponse.json({ error: "Debes completar todos los campos." }, { status: 400 });
    }

    if (body.password.length < 6) {
      return NextResponse.json({ error: "La clave debe tener al menos 6 caracteres." }, { status: 400 });
    }

    const userId = createUser({
      username: body.username,
      password: body.password,
      displayName: body.displayName,
      role: "client",
    });

    await createSessionCookie(userId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la cuenta. Revisa si el usuario ya existe." }, { status: 400 });
  }
}
