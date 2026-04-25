import fs from "node:fs";
import path from "node:path";
import { toSlug } from "@/lib/utils";
import { assertUploadIsAllowed } from "@/lib/validation";

const publicDir = path.join(/* turbopackIgnore: true */ process.cwd(), "public");
const uploadRoot = path.join(publicDir, "uploads");
const coversDir = path.join(uploadRoot, "covers");
const mediaDir = path.join(uploadRoot, "media");
const visualsDir = path.join(uploadRoot, "visuals");
const dataDir = path.join(/* turbopackIgnore: true */ process.cwd(), "data");

export function ensureStorage() {
  [publicDir, uploadRoot, coversDir, mediaDir, visualsDir, dataDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function safeFileName(name: string) {
  const extension = path.extname(name).toLowerCase();
  const baseName = path.basename(name, extension);
  return `${Date.now()}-${toSlug(baseName || "media")}${extension}`;
}

export async function persistUpload(file: File, bucket: "covers" | "media" | "visuals") {
  ensureStorage();
  assertUploadIsAllowed(file, bucket);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = safeFileName(file.name);
  const destinationDir =
    bucket === "covers" ? coversDir : bucket === "media" ? mediaDir : visualsDir;
  const destinationPath = path.join(destinationDir, fileName);

  fs.writeFileSync(destinationPath, buffer);

  return `/uploads/${bucket}/${fileName}`;
}

export function getDataFilePath() {
  ensureStorage();
  return path.join(dataDir, "radio.db");
}
