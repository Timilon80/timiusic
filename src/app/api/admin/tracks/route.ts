import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createTrack } from "@/lib/db";
import { persistUpload } from "@/lib/storage";
import { InputError, normalizeOptionalAssetUrl } from "@/lib/validation";

const fallbackVisual =
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80";

function validFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const formData = await request.formData();

    const title = String(formData.get("title") || "").trim();
    const artist = String(formData.get("artist") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const genre = String(formData.get("genre") || "").trim();
    const mood = String(formData.get("mood") || "").trim();
    const mediaType = String(formData.get("mediaType") || "audio") === "video" ? "video" : "audio";
    const mediaUrlValue = String(formData.get("mediaUrl") || "").trim();
    const coverUrlValue = String(formData.get("coverUrl") || "").trim();
    const visualUrlValue = String(formData.get("visualUrl") || "").trim();
    const featured = String(formData.get("featured") || "false") === "true";

    const mediaFile = formData.get("mediaFile");
    const coverFile = formData.get("coverFile");
    const visualFile = formData.get("visualFile");

    if (!title || !artist) {
      return NextResponse.json({ error: "Titulo y artista son obligatorios." }, { status: 400 });
    }

    let mediaUrl = mediaUrlValue;
    let coverUrl = coverUrlValue;
    let visualUrl = visualUrlValue;

    if (validFile(mediaFile)) {
      mediaUrl = await persistUpload(mediaFile, "media");
    }

    if (validFile(coverFile)) {
      coverUrl = await persistUpload(coverFile, "covers");
    }

    if (validFile(visualFile)) {
      visualUrl = await persistUpload(visualFile, "visuals");
    }

    mediaUrl = normalizeOptionalAssetUrl(mediaUrl, {
      label: "La fuente multimedia",
      allowLocal: true,
      allowRemote: true,
      allowEmpty: false,
    });

    coverUrl = normalizeOptionalAssetUrl(coverUrl, {
      label: "La portada",
      allowLocal: true,
      allowRemote: true,
      allowEmpty: true,
    });

    visualUrl = normalizeOptionalAssetUrl(visualUrl, {
      label: "El visual",
      allowLocal: true,
      allowRemote: true,
      allowEmpty: true,
    });

    if (!mediaUrl) {
      return NextResponse.json({ error: "Debes subir un archivo multimedia o enviar una URL." }, { status: 400 });
    }

    if (!coverUrl) {
      coverUrl = visualUrl || fallbackVisual;
    }

    if (!visualUrl) {
      visualUrl = coverUrl || fallbackVisual;
    }

    createTrack({
      title,
      artist,
      description,
      genre,
      mood,
      mediaType,
      mediaUrl,
      coverUrl,
      visualUrl,
      featured,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Debes iniciar sesion." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Solo el admin puede publicar pistas." }, { status: 403 });
    }

    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "No se pudo cargar la pista." }, { status: 500 });
  }
}
