import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "TIMIUSIC Radio IA",
  description:
    "Emisora web multimedia con panel administrador, perfiles, favoritos, descargas y visuales potentes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
