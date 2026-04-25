import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDownloads(value: number) {
  return new Intl.NumberFormat("es-ES").format(value);
}

export function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function absoluteMediaPath(value: string) {
  if (!value.startsWith("/")) {
    return `/${value}`;
  }

  return value;
}
