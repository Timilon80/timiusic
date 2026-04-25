"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState, type FormEvent } from "react";
import {
  Download,
  FileText,
  Plus,
  Radio,
  Shield,
  Upload,
  Users,
  Waves,
} from "lucide-react";
import { formatDownloads } from "@/lib/utils";
import type { LiveStationSettings, SessionUser, TrackRecord, UserRecord } from "@/lib/types";

type AdminPanelProps = {
  user: SessionUser;
  stats: {
    users: number;
    tracks: number;
    favorites: number;
    downloads: number;
  };
  liveSettings: LiveStationSettings;
  users: UserRecord[];
  tracks: TrackRecord[];
};

export function AdminPanel({ user, stats, liveSettings, users, tracks }: AdminPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const [savingLive, setSavingLive] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    displayName: "",
    role: "client",
  });
  const [bulkRows, setBulkRows] = useState(
    "Nombre Cliente 1,cliente001,clave001,client\nNombre Cliente 2,cliente002,clave002,client"
  );
  const [trackForm, setTrackForm] = useState({
    title: "",
    artist: "",
    description: "",
    genre: "",
    mood: "",
    mediaType: "audio",
    mediaUrl: "",
    coverUrl: "",
    visualUrl: "",
    featured: false,
  });
  const [liveForm, setLiveForm] = useState({
    streamUrl: liveSettings.streamUrl,
    streamTitle: liveSettings.streamTitle,
    streamTagline: liveSettings.streamTagline,
    visualUrl: liveSettings.visualUrl,
    accentTheme: liveSettings.accentTheme,
    liveEnabled: liveSettings.liveEnabled,
  });

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingUser(true);
    setMessage(null);

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userForm),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;

    if (!response.ok) {
      setMessage(data?.error || "No se pudo crear el usuario.");
      setCreatingUser(false);
      return;
    }

    setMessage("Usuario creado correctamente.");
    setUserForm({ username: "", password: "", displayName: "", role: "client" });
    startTransition(() => router.refresh());
    setCreatingUser(false);
  }

  async function importUsersBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBulkLoading(true);
    setMessage(null);

    const response = await fetch("/api/admin/users/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows: bulkRows }),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string; result?: { created: number; skipped: number; errors: string[] } }
      | null;

    if (!response.ok) {
      setMessage(data?.error || "No se pudo importar el lote.");
      setBulkLoading(false);
      return;
    }

    const result = data?.result;
    setMessage(
      result
        ? `Importacion lista. Creados: ${result.created}. Saltados: ${result.skipped}.`
        : "Importacion completada."
    );
    startTransition(() => router.refresh());
    setBulkLoading(false);
  }

  async function saveLive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingLive(true);
    setMessage(null);

    const response = await fetch("/api/admin/live", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(liveForm),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;

    if (!response.ok) {
      setMessage(data?.error || "No se pudo guardar la radio en vivo.");
      setSavingLive(false);
      return;
    }

    setMessage("Configuracion live actualizada.");
    startTransition(() => router.refresh());
    setSavingLive(false);
  }

  async function uploadTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadingTrack(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("title", trackForm.title);
    formData.set("artist", trackForm.artist);
    formData.set("description", trackForm.description);
    formData.set("genre", trackForm.genre);
    formData.set("mood", trackForm.mood);
    formData.set("mediaType", trackForm.mediaType);
    formData.set("mediaUrl", trackForm.mediaUrl);
    formData.set("coverUrl", trackForm.coverUrl);
    formData.set("visualUrl", trackForm.visualUrl);
    formData.set("featured", trackForm.featured ? "true" : "false");

    const response = await fetch("/api/admin/tracks", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;

    if (!response.ok) {
      setMessage(data?.error || "No se pudo subir la pista.");
      setUploadingTrack(false);
      return;
    }

    setMessage("Pista cargada correctamente.");
    setTrackForm({
      title: "",
      artist: "",
      description: "",
      genre: "",
      mood: "",
      mediaType: "audio",
      mediaUrl: "",
      coverUrl: "",
      visualUrl: "",
      featured: false,
    });
    form.reset();
    startTransition(() => router.refresh());
    setUploadingTrack(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid-glow absolute inset-0 opacity-60" />
      <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-emerald-500/18 blur-[120px] sm:left-[-10rem] sm:top-[-8rem] sm:h-80 sm:w-80" />
      <div className="absolute bottom-[-8rem] right-[-6rem] h-72 w-72 rounded-full bg-cyan-500/16 blur-[120px] sm:bottom-[-10rem] sm:right-[-8rem] sm:h-96 sm:w-96" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-5 sm:gap-6">
        <header className="glass rounded-[28px] p-5 sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/15 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-emerald-100 sm:text-xs sm:tracking-[0.35em]">
                <Shield className="h-4 w-4" />
                TIMIUSIC ADMIN
              </div>
              <h1 className="mt-4 break-words text-3xl font-black text-white sm:text-5xl">
                Panel para radio en vivo, media premium y gestion masiva de clientes.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
                Desde aqui puedes lanzar el stream 24/7, subir catalogo, crear usuarios manuales o
                importar cientos de clientes en lote.
              </p>
            </div>

            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <div className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/80 sm:w-auto sm:text-left">
                Admin activo: <span className="font-semibold text-white">{user.displayName}</span>
              </div>
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
              >
                Volver a la radio
              </Link>
            </div>
          </div>
        </header>

        {message ? <div className="glass rounded-3xl px-5 py-4 text-sm text-white/82">{message}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass rounded-[30px] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Usuarios</p>
            <p className="mt-3 text-3xl font-black text-white sm:text-4xl">{stats.users}</p>
            <p className="mt-2 text-sm text-white/65">Capacidad comoda para aprox. 1000 clientes.</p>
          </div>
          <div className="glass rounded-[30px] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Pistas</p>
            <p className="mt-3 text-3xl font-black text-white sm:text-4xl">{stats.tracks}</p>
            <p className="mt-2 text-sm text-white/65">Audio y video en una sola biblioteca.</p>
          </div>
          <div className="glass rounded-[30px] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Live</p>
            <p className="mt-3 text-3xl font-black text-white sm:text-4xl">{liveSettings.liveEnabled ? "ON" : "OFF"}</p>
            <p className="mt-2 text-sm text-white/65">Canal continuo listo para activarse.</p>
          </div>
          <div className="glass rounded-[30px] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">Descargas</p>
            <p className="mt-3 text-3xl font-black text-white sm:text-4xl">{formatDownloads(stats.downloads)}</p>
            <p className="mt-2 text-sm text-white/65">Control simple de consumo por pista.</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex items-center gap-3 text-white/80">
              <Radio className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">Radio 24/7</p>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Configurar stream en vivo</h2>
              </div>
            </div>

            <form onSubmit={saveLive} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-white/75">
                URL del stream
                <input
                  value={liveForm.streamUrl}
                  onChange={(event) =>
                    setLiveForm((current) => ({ ...current, streamUrl: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                  placeholder="https://tu-stream.com/live.mp3"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Nombre del canal
                <input
                  value={liveForm.streamTitle}
                  onChange={(event) =>
                    setLiveForm((current) => ({ ...current, streamTitle: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Descripcion live
                <textarea
                  rows={4}
                  value={liveForm.streamTagline}
                  onChange={(event) =>
                    setLiveForm((current) => ({ ...current, streamTagline: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Visual de fondo
                <input
                  value={liveForm.visualUrl}
                  onChange={(event) =>
                    setLiveForm((current) => ({ ...current, visualUrl: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Tema live
                <select
                  value={liveForm.accentTheme}
                  onChange={(event) =>
                    setLiveForm((current) => ({ ...current, accentTheme: event.target.value as LiveStationSettings["accentTheme"] }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                >
                  <option value="neon">Neon Pulse</option>
                  <option value="vinyl">Retro Vinyl</option>
                  <option value="aurora">Aurora Flow</option>
                </select>
              </label>

              <label className="inline-flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 sm:items-center">
                <input
                  type="checkbox"
                  checked={liveForm.liveEnabled}
                  onChange={(event) =>
                    setLiveForm((current) => ({ ...current, liveEnabled: event.target.checked }))
                  }
                />
                Activar radio en vivo para los usuarios
              </label>

              <button
                disabled={savingLive}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 via-cyan-400 to-sky-500 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
              >
                <Radio className="h-4 w-4" />
                {savingLive ? "Guardando..." : "Guardar radio live"}
              </button>
            </form>
          </div>

          <div className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex items-center gap-3 text-white/80">
              <Waves className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">Catalogo</p>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Subir mp3, video, portada y visual</h2>
              </div>
            </div>

            <form onSubmit={uploadTrack} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-white/75">
                Titulo
                <input
                  required
                  value={trackForm.title}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Artista
                <input
                  required
                  value={trackForm.artist}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, artist: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75 md:col-span-2">
                Descripcion
                <textarea
                  rows={4}
                  value={trackForm.description}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Genero
                <input
                  value={trackForm.genre}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, genre: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  placeholder="Electronic"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Mood
                <input
                  value={trackForm.mood}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, mood: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  placeholder="Energetic"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Tipo de medio
                <select
                  value={trackForm.mediaType}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, mediaType: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                >
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                URL media opcional
                <input
                  value={trackForm.mediaUrl}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, mediaUrl: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Archivo de audio o video
                <input
                  name="mediaFile"
                  type="file"
                  accept="audio/*,video/*"
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-300/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                URL portada opcional
                <input
                  value={trackForm.coverUrl}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, coverUrl: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Archivo portada opcional
                <input
                  name="coverFile"
                  type="file"
                  accept="image/*"
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-fuchsia-300/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                URL visual opcional
                <input
                  value={trackForm.visualUrl}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, visualUrl: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  placeholder="https://..."
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Archivo visual opcional (imagen)
                <input
                  name="visualFile"
                  type="file"
                  accept="image/*"
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-emerald-300/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 md:col-span-2">
                <input
                  type="checkbox"
                  checked={trackForm.featured}
                  onChange={(event) =>
                    setTrackForm((current) => ({ ...current, featured: event.target.checked }))
                  }
                />
                Marcar como destacada en la portada
              </label>

              <button
                disabled={uploadingTrack}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60 md:col-span-2"
              >
                <Upload className="h-4 w-4" />
                {uploadingTrack ? "Subiendo..." : "Publicar pista en la radio"}
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.78fr,1.22fr]">
          <div className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex items-center gap-3 text-white/80">
              <Users className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">Clientes</p>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Crear usuario y clave</h2>
              </div>
            </div>

            <form onSubmit={createUser} className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm text-white/75">
                Nombre visible
                <input
                  required
                  value={userForm.displayName}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                  placeholder="Cliente Premium"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Usuario
                <input
                  required
                  value={userForm.username}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, username: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                  placeholder="cliente_001"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Clave
                <input
                  required
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                  placeholder="Minimo 6 caracteres"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/75">
                Rol
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, role: event.target.value }))
                  }
                  className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                >
                  <option value="client">Cliente</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <button
                disabled={creatingUser}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 via-cyan-400 to-sky-500 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                {creatingUser ? "Creando..." : "Crear cliente"}
              </button>
            </form>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5 sm:rounded-[30px]">
              <div className="flex items-center gap-3 text-white/80">
                <FileText className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Carga masiva</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Importar clientes por lote</h3>
                </div>
              </div>

              <form onSubmit={importUsersBulk} className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm text-white/75">
                  Pega filas CSV o texto
                  <textarea
                    rows={8}
                    value={bulkRows}
                    onChange={(event) => setBulkRows(event.target.value)}
                    className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-emerald-300/45"
                    placeholder="Nombre,usuario,clave,rol"
                  />
                </label>

                <p className="text-sm leading-7 text-white/62">
                  Formato soportado: `Nombre,usuario,clave,rol` o `Nombre|usuario|clave|rol` o `Nombre;usuario;clave;rol`.
                </p>

              <button
                disabled={bulkLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-400 via-violet-500 to-emerald-400 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
              >
                  <FileText className="h-4 w-4" />
                  {bulkLoading ? "Importando..." : "Importar lote de clientes"}
                </button>
              </form>
            </div>
          </div>

          <div className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">Programacion</p>
                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Pistas publicadas</h2>
              </div>
              <span className="self-start rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/55">
                {tracks.length} pistas
              </span>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-2">
              {tracks.map((track) => (
                <article key={track.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4 sm:rounded-[28px]">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div
                      className="h-36 w-full shrink-0 rounded-[22px] border border-white/10 bg-cover bg-center sm:h-24 sm:w-24"
                      style={{ backgroundImage: `url(${track.coverUrl || track.visualUrl})` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h3 className="text-lg font-black text-white sm:truncate">{track.title}</h3>
                          <p className="mt-1 text-sm text-cyan-100/80 sm:truncate">{track.artist}</p>
                        </div>
                        <span className="self-start rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
                          {track.mediaType}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
                        <span className="rounded-full border border-white/10 px-3 py-2">{track.genre || "general"}</span>
                        <span className="rounded-full border border-white/10 px-3 py-2">{track.mood || "mood"}</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 text-sm text-white/62 sm:flex-row sm:items-center sm:justify-between">
                        <span>Descargas: {formatDownloads(track.downloads)}</span>
                        <a
                          href={`/download/${track.id}`}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-white transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
                        >
                          <Download className="h-4 w-4" />
                          Descargar
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5 sm:rounded-[30px]">
              <div className="flex items-center gap-3 text-white/80">
                <Radio className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Usuarios creados</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Base actual de clientes</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3 xl:max-h-[360px] xl:overflow-auto xl:pr-1">
                {users.map((item) => (
                  <article key={item.id} className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-lg font-black text-white">{item.displayName}</p>
                        <p className="mt-1 text-sm text-white/68">@{item.username}</p>
                      </div>
                      <span className="self-start rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
                        {item.role}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
