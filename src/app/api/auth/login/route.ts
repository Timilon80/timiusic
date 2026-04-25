import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";
import { verifyUser } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };

    if (!body.username || !body.password) {
      return NextResponse.json({ error: "Debes enviar usuario y clave." }, { status: 400 });
    }

    const user = verifyUser(body.username, body.password);

    if (!user) {
      return NextResponse.json({ error: "Credenciales invalidas." }, { status: 401 });
    }

    await createSessionCookie(user.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar sesion." }, { status: 500 });
  }
}
