import net from "node:net";
import path from "node:path";

export class InputError extends Error {}

type UploadBucket = "covers" | "media" | "visuals";

const MB = 1024 * 1024;
const localUploadPrefix = "/uploads/";

const uploadRules: Record<
  UploadBucket,
  {
    label: string;
    maxBytes: number;
    extensions: Set<string>;
    mimePrefixes: string[];
  }
> = {
  covers: {
    label: "La portada",
    maxBytes: 5 * MB,
    extensions: new Set([".jpg", ".jpeg", ".png", ".webp"]),
    mimePrefixes: ["image/"],
  },
  media: {
    label: "El archivo multimedia",
    maxBytes: 150 * MB,
    extensions: new Set([".mp3", ".m4a", ".wav", ".ogg", ".aac", ".mp4", ".webm"]),
    mimePrefixes: ["audio/", "video/"],
  },
  visuals: {
    label: "El visual",
    maxBytes: 8 * MB,
    extensions: new Set([".jpg", ".jpeg", ".png", ".webp"]),
    mimePrefixes: ["image/"],
  },
};

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
}

function isPrivateHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);

  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  const ipVersion = net.isIP(normalized);

  if (ipVersion === 4) {
    const [first, second] = normalized.split(".").map(Number);

    return (
      first === 10 ||
      first === 127 ||
      first === 169 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  if (ipVersion === 6) {
    return normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80");
  }

  return false;
}

function ensureSafeRemoteUrl(url: URL, label: string) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InputError(`${label} debe usar http o https.`);
  }

  if (isPrivateHostname(url.hostname)) {
    throw new InputError(`${label} no puede apuntar a localhost o a una red privada.`);
  }
}

function parseRemoteUrl(value: string, label: string) {
  try {
    const url = new URL(value);
    ensureSafeRemoteUrl(url, label);
    return url.toString();
  } catch (error) {
    if (error instanceof InputError) {
      throw error;
    }

    throw new InputError(`${label} debe ser una URL valida.`);
  }
}

function isSafeLocalAssetPath(value: string) {
  return value.startsWith(localUploadPrefix) && !value.includes("..");
}

export function normalizeOptionalAssetUrl(
  value: string,
  options: {
    label: string;
    allowLocal?: boolean;
    allowRemote?: boolean;
    allowEmpty?: boolean;
  }
) {
  const trimmed = value.trim();

  if (!trimmed) {
    if (options.allowEmpty === false) {
      throw new InputError(`${options.label} es obligatoria.`);
    }

    return "";
  }

  if (trimmed.startsWith("/")) {
    if (!options.allowLocal || !isSafeLocalAssetPath(trimmed)) {
      throw new InputError(`${options.label} debe apuntar a un archivo dentro de /uploads/.`);
    }

    return trimmed;
  }

  if (!options.allowRemote) {
    throw new InputError(`${options.label} debe usar una ruta local valida.`);
  }

  return parseRemoteUrl(trimmed, options.label);
}

export function normalizeOptionalRemoteUrl(value: string, label: string) {
  const trimmed = value.trim();
  return trimmed ? parseRemoteUrl(trimmed, label) : "";
}

export function assertUploadIsAllowed(file: File, bucket: UploadBucket) {
  const rule = uploadRules[bucket];
  const extension = path.extname(file.name).toLowerCase();

  if (!rule.extensions.has(extension)) {
    throw new InputError(`${rule.label} debe usar un formato permitido.`);
  }

  const mimeType = file.type.trim().toLowerCase();

  if (mimeType && !rule.mimePrefixes.some((prefix) => mimeType.startsWith(prefix))) {
    throw new InputError(`${rule.label} no tiene un tipo de archivo valido.`);
  }

  if (file.size > rule.maxBytes) {
    throw new InputError(`${rule.label} supera el limite permitido.`);
  }
}

export function resolveMediaDownloadTarget(value: string) {
  const trimmed = value.trim();

  if (isSafeLocalAssetPath(trimmed)) {
    return { type: "local" as const, path: trimmed };
  }

  return {
    type: "remote" as const,
    url: new URL(parseRemoteUrl(trimmed, "La URL multimedia")),
  };
}

export function getContentTypeForFileName(fileName: string, mediaType: "audio" | "video") {
  const extension = path.extname(fileName).toLowerCase();

  switch (extension) {
    case ".aac":
      return "audio/aac";
    case ".m4a":
      return "audio/mp4";
    case ".mp3":
      return "audio/mpeg";
    case ".ogg":
      return "audio/ogg";
    case ".wav":
      return "audio/wav";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    default:
      return mediaType === "video" ? "video/mp4" : "audio/mpeg";
  }
}
