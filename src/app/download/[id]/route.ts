import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getTrackById, incrementDownload } from "@/lib/db";
import { getContentTypeForFileName, resolveMediaDownloadTarget } from "@/lib/validation";

export const runtime = "nodejs";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9-_\.]/g, "-");
}

function getExtensionFromUrl(url: string) {
  const pathname = new URL(url, "http://localhost").pathname;
  return path.extname(pathname) || ".bin";
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const trackId = Number(id);

  if (!Number.isFinite(trackId)) {
    return NextResponse.json({ error: "Track invalido." }, { status: 400 });
  }

  const track = getTrackById(trackId);

  if (!track) {
    return NextResponse.json({ error: "Track no encontrado." }, { status: 404 });
  }

  const extension = getExtensionFromUrl(track.mediaUrl);
  const fileName = sanitizeFileName(`${track.artist}-${track.title}${extension}`.toLowerCase());
  const target = resolveMediaDownloadTarget(track.mediaUrl);

  if (target.type === "local") {
    const filePath = path.join(process.cwd(), "public", target.path.replace(/^\//, ""));

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Archivo local no encontrado." }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    incrementDownload(trackId);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": getContentTypeForFileName(fileName, track.mediaType),
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  }

  const upstream = await fetch(target.url, {
    headers: {
      Accept: track.mediaType === "video" ? "video/*,application/octet-stream;q=0.8" : "audio/*,application/octet-stream;q=0.8",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "No se pudo descargar el archivo remoto." }, { status: 502 });
  }

  incrementDownload(trackId);

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || getContentTypeForFileName(fileName, track.mediaType),
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
