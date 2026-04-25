import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { updateProfile } from "@/lib/db";
import type { BackgroundStyle, EqualizerPreset, ThemeMode } from "@/lib/types";

function normalizeTheme(value: string): ThemeMode {
  if (value === "vinyl" || value === "aurora") {
    return value;
  }

  return "neon";
}

function normalizeEqualizerPreset(value: string): EqualizerPreset {
  switch (value) {
    case "bass-boost":
    case "treble-boost":
    case "vocal-boost":
    case "club":
    case "deep":
    case "acoustic":
    case "electronic":
    case "cinema":
    case "lo-fi":
      return value;
    default:
      return "balanced";
  }
}

function normalizeBackgroundStyle(value: string): BackgroundStyle {
  switch (value) {
    case "sunset-haze":
    case "midnight-vinyl":
    case "ocean-dream":
    case "aurora-sky":
      return value;
    default:
      return "neon-grid";
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSession();
    const body = (await request.json()) as {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      favoriteTheme?: string;
      equalizerPreset?: string;
      backgroundStyle?: string;
    };

    if (!body.displayName) {
      return NextResponse.json({ error: "El nombre visible es obligatorio." }, { status: 400 });
    }

    updateProfile(user.id, {
      displayName: body.displayName,
      bio: body.bio || "",
      avatarUrl: body.avatarUrl || "",
      favoriteTheme: normalizeTheme(body.favoriteTheme || "neon"),
      equalizerPreset: normalizeEqualizerPreset(body.equalizerPreset || "balanced"),
      backgroundStyle: normalizeBackgroundStyle(body.backgroundStyle || "neon-grid"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Debes iniciar sesion." }, { status: 401 });
    }

    return NextResponse.json({ error: "No se pudo guardar el perfil." }, { status: 500 });
  }
}
