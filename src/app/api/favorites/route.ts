import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { toggleFavorite } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = (await request.json()) as { trackId?: number };

    if (!body.trackId) {
      return NextResponse.json({ error: "Falta el trackId." }, { status: 400 });
    }

    const favorite = toggleFavorite(user.id, Number(body.trackId));
    return NextResponse.json({ ok: true, favorite });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Debes iniciar sesion." }, { status: 401 });
    }

    return NextResponse.json({ error: "No se pudo actualizar favoritos." }, { status: 500 });
  }
}
