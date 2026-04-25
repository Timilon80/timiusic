import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { updateLiveStationSettings } from "@/lib/db";
import { InputError, normalizeOptionalRemoteUrl } from "@/lib/validation";
import type { ThemeMode } from "@/lib/types";

function normalizeTheme(value: string): ThemeMode {
  if (value === "vinyl" || value === "aurora") {
    return value;
  }

  return "neon";
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as {
      streamUrl?: string;
      streamTitle?: string;
      streamTagline?: string;
      visualUrl?: string;
      accentTheme?: string;
      liveEnabled?: boolean;
    };

    updateLiveStationSettings({
      streamUrl: normalizeOptionalRemoteUrl(body.streamUrl || "", "La URL del stream"),
      streamTitle: body.streamTitle || "TIMIUSIC Live AI",
      streamTagline: body.streamTagline || "",
      visualUrl: normalizeOptionalRemoteUrl(body.visualUrl || "", "La URL del visual"),
      accentTheme: normalizeTheme(body.accentTheme || "neon"),
      liveEnabled: Boolean(body.liveEnabled),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Debes iniciar sesion." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Solo el admin puede editar la radio en vivo." }, { status: 403 });
    }

    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudo guardar la configuracion live." }, { status: 500 });
  }
}
