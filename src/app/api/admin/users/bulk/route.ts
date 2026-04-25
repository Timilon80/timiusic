import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createUsersBulk } from "@/lib/db";
import type { UserRole } from "@/lib/types";

function parseRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index) => {
      if (index !== 0) {
        return true;
      }

      const normalized = line.toLowerCase();
      return !(
        normalized.includes("usuario") ||
        normalized.includes("username") ||
        normalized.includes("displayname") ||
        normalized.includes("nombre")
      );
    })
    .map((line) => {
      const separator = line.includes("|") ? "|" : line.includes(";") ? ";" : ",";
      const parts = line.split(separator);
      const [displayName = "", username = "", password = "", role = "client"] = parts.map((item) => item.trim());
      const normalizedRole: UserRole = role === "admin" ? "admin" : "client";

      return {
        displayName,
        username,
        password,
        role: normalizedRole,
      };
    });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = (await request.json()) as { rows?: string };
    const rows = body.rows?.trim() || "";

    if (!rows) {
      return NextResponse.json({ error: "Debes enviar filas para importar." }, { status: 400 });
    }

    const entries = parseRows(rows);

    if (!entries.length) {
      return NextResponse.json({ error: "No se encontraron usuarios validos." }, { status: 400 });
    }

    const result = createUsersBulk(entries);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Debes iniciar sesion." }, { status: 401 });
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Solo el admin puede importar clientes." }, { status: 403 });
    }

    return NextResponse.json({ error: "No se pudo completar la importacion masiva." }, { status: 500 });
  }
}
