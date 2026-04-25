"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  Home,
  Disc3,
  Download,
  Heart,
  LogOut,
  Pause,
  Play,
  Radio,
  Search,
  Shield,
  Sparkles,
  UserRound,
  Waves,
  Zap,
} from "lucide-react";
import { cn, formatDownloads } from "@/lib/utils";
import type {
  BackgroundStyle,
  EqualizerPreset,
  LiveStationSettings,
  PublicTrack,
  SessionUser,
  ThemeMode,
} from "@/lib/types";

type ProfileData = {
  id: number;
  username: string;
  role: "admin" | "client";
  displayName: string;
  bio: string;
  avatarUrl: string;
  favoriteTheme: ThemeMode;
  equalizerPreset: EqualizerPreset;
  backgroundStyle: BackgroundStyle;
  createdAt: string;
};

type RadioAppProps = {
  user: SessionUser | null;
  profile: ProfileData | null;
  tracks: PublicTrack[];
  publicRegistrationEnabled: boolean;
  stats: {
    users: number;
    tracks: number;
    favorites: number;
    downloads: number;
  };
  liveSettings: LiveStationSettings;
};

type PlayerMode = "track" | "live";

const themes: Array<{
  id: ThemeMode;
  label: string;
  accent: string;
  surface: string;
  player: string;
}> = [
  {
    id: "neon",
    label: "Neon Pulse",
    accent: "from-cyan-400 via-sky-500 to-fuchsia-500",
    surface: "border-cyan-400/30 bg-cyan-400/10",
    player: "shadow-[0_0_50px_rgba(34,211,238,0.28)]",
  },
  {
    id: "vinyl",
    label: "Retro Vinyl",
    accent: "from-amber-300 via-orange-400 to-lime-400",
    surface: "border-amber-300/30 bg-amber-300/10",
    player: "shadow-[0_0_50px_rgba(251,191,36,0.22)]",
  },
  {
    id: "aurora",
    label: "Aurora Flow",
    accent: "from-violet-400 via-fuchsia-500 to-emerald-400",
    surface: "border-fuchsia-400/30 bg-fuchsia-400/10",
    player: "shadow-[0_0_50px_rgba(217,70,239,0.24)]",
  },
];

const equalizerPresets: Array<{
  id: EqualizerPreset;
  label: string;
  gains: [number, number, number, number, number, number];
}> = [
  { id: "balanced", label: "Balanceado", gains: [0, 0, 0, 0, 0, 0] },
  { id: "bass-boost", label: "Bass Boost", gains: [6, 5, 3, 0, -1, -2] },
  { id: "treble-boost", label: "Treble Boost", gains: [-2, -1, 0, 2, 4, 6] },
  { id: "vocal-boost", label: "Vocal Boost", gains: [-2, 0, 3, 5, 3, 0] },
  { id: "club", label: "Club", gains: [5, 3, 1, 0, 2, 4] },
  { id: "deep", label: "Deep", gains: [7, 5, 2, -1, -1, 0] },
  { id: "acoustic", label: "Acustico", gains: [2, 3, 2, 1, 2, 3] },
  { id: "electronic", label: "Electronic", gains: [4, 2, 0, 2, 4, 5] },
  { id: "cinema", label: "Cinema", gains: [3, 4, 1, 0, 2, 3] },
  { id: "lo-fi", label: "Lo-Fi", gains: [3, 1, -1, -1, 1, 2] },
];

const backgroundStyles: Array<{
  id: BackgroundStyle;
  label: string;
  value: string;
}> = [
  {
    id: "neon-grid",
    label: "Neon Grid",
    value:
      "radial-gradient(circle at top left, rgba(0, 240, 255, 0.17), transparent 35%), radial-gradient(circle at top right, rgba(255, 0, 212, 0.18), transparent 28%), radial-gradient(circle at bottom, rgba(80, 35, 255, 0.18), transparent 25%), linear-gradient(145deg, #030512 0%, #081127 46%, #02040f 100%)",
  },
  {
    id: "sunset-haze",
    label: "Sunset Haze",
    value:
      "radial-gradient(circle at top, rgba(255, 166, 0, 0.2), transparent 32%), radial-gradient(circle at right, rgba(255, 0, 119, 0.18), transparent 30%), linear-gradient(160deg, #16030d 0%, #39172d 45%, #120612 100%)",
  },
  {
    id: "midnight-vinyl",
    label: "Midnight Vinyl",
    value:
      "radial-gradient(circle at center, rgba(255, 255, 255, 0.06), transparent 26%), radial-gradient(circle at top left, rgba(255, 196, 0, 0.12), transparent 30%), linear-gradient(145deg, #050505 0%, #121212 52%, #1f1305 100%)",
  },
  {
    id: "ocean-dream",
    label: "Ocean Dream",
    value:
      "radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), transparent 30%), radial-gradient(circle at bottom left, rgba(45, 212, 191, 0.18), transparent 34%), linear-gradient(150deg, #02131c 0%, #072f44 48%, #031018 100%)",
  },
  {
    id: "aurora-sky",
    label: "Aurora Sky",
    value:
      "radial-gradient(circle at top left, rgba(168, 85, 247, 0.18), transparent 30%), radial-gradient(circle at top right, rgba(16, 185, 129, 0.18), transparent 34%), radial-gradient(circle at bottom, rgba(59, 130, 246, 0.16), transparent 30%), linear-gradient(145deg, #050816 0%, #101235 50%, #08111d 100%)",
  },
];

const equalizerFrequencies = [60, 170, 350, 1000, 3500, 10000] as const;

function panelBackground(url: string | undefined): CSSProperties | undefined {
  if (!url) {
    return undefined;
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(4,7,18,0.18), rgba(4,7,18,0.9)), url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function coverStyle(url: string | undefined): CSSProperties | undefined {
  if (!url) {
    return undefined;
  }

  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className={cn(
            "w-full rounded-full border px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.3em] transition sm:w-auto",
            value === theme.id
              ? `bg-gradient-to-r text-slate-950 ${theme.accent}`
              : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10"
          )}
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
}

function AudioVisualization({ active }: { active: boolean }) {
  return (
    <div className="mt-8 flex items-end justify-center gap-2">
      {Array.from({ length: 18 }).map((_, index) => {
        const baseHeight = 12 + (index % 6) * 8;
        const height = baseHeight + (active ? ((index * 7) % 18) : 0);

        return (
          <span
            key={index}
            className="w-1 rounded-full bg-gradient-to-t from-fuchsia-500 via-violet-400 to-cyan-300"
            style={{ height: `${height}px`, opacity: active ? 0.82 : 0.28 }}
          />
        );
      })}
    </div>
  );
}

function MobileNav({
  canPlayLive,
  onLiveTap,
}: {
  canPlayLive: boolean;
  onLiveTap: () => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-3 py-2 backdrop-blur xl:hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-2">
        <a
          href="#home"
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-white/78 transition hover:bg-white/8 hover:text-white"
        >
          <Home className="h-4 w-4" />
          Inicio
        </a>
        <button
          type="button"
          onClick={onLiveTap}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-white/78 transition hover:bg-white/8 hover:text-white"
        >
          <Radio className="h-4 w-4" />
          {canPlayLive ? "Live" : "Radio"}
        </button>
        <a
          href="#catalogo"
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-white/78 transition hover:bg-white/8 hover:text-white"
        >
          <Search className="h-4 w-4" />
          Buscar
        </a>
        <a
          href="#perfil"
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-white/78 transition hover:bg-white/8 hover:text-white"
        >
          <UserRound className="h-4 w-4" />
          Perfil
        </a>
      </div>
    </nav>
  );
}

function MobileStickyPlayer({
  title,
  subtitle,
  coverUrl,
  isPlaying,
  onTogglePlayback,
  onOpen,
}: {
  title: string;
  subtitle: string;
  coverUrl?: string;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-[4.9rem] z-40 px-3 xl:hidden">
      <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-[26px] border border-white/12 bg-slate-950/92 px-3 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur">
        <button
          type="button"
          onClick={onOpen}
          className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 bg-cover bg-center"
          style={coverStyle(coverUrl)}
          aria-label={`Abrir ${title}`}
        />
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-black text-white">{title}</p>
          <p className="truncate text-xs text-white/62">{subtitle}</p>
        </button>
        <button
          type="button"
          onClick={onTogglePlayback}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 text-slate-950"
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function GlassReveal({
  children,
  className,
  id,
  delay: _delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}) {
  return <section id={id} className={className}>{children}</section>;
}

function GuestAuthPanel({ publicRegistrationEnabled }: { publicRegistrationEnabled: boolean }) {
  const router = useRouter();
  const [loginPayload, setLoginPayload] = useState({ username: "", password: "" });
  const [registerPayload, setRegisterPayload] = useState({
    displayName: "",
    username: "",
    password: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [pending, setPending] = useState(false);

  async function submit(path: string, payload: Record<string, string>, successText: string) {
    setPending(true);
    setMessage(null);

    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string; ok?: boolean }
      | null;

    if (!response.ok) {
      setMessage(data?.error || "No se pudo completar la accion.");
      setPending(false);
      return;
    }

    setMessage(successText);
    startTransition(() => {
      router.refresh();
    });
    setPending(false);
  }

  async function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("/api/auth/login", loginPayload, "Sesion iniciada. Entrando a la cabina...");
  }

  async function onRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit("/api/auth/register", registerPayload, "Cuenta creada. Ya puedes entrar.");
  }

  return (
    <GlassReveal delay={0.2} className="glass rounded-[28px] p-5 sm:rounded-[32px] sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">Acceso</p>
          <h2 className="mt-3 text-2xl font-black text-white">Entra a tu cuenta o crea un nuevo perfil</h2>
        </div>
        <div className="self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
          Acceso gestionado por el administrador
        </div>
      </div>

      {publicRegistrationEnabled ? (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(["login", "register"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                "w-full rounded-full border px-4 py-2 text-sm font-semibold transition",
                mode === item
                  ? "border-cyan-300/50 bg-cyan-300/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10"
              )}
            >
              {item === "login" ? "Iniciar sesion" : "Crear cuenta"}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          El registro publico esta desactivado. Si necesitas acceso, pidelo al administrador.
        </div>
      )}

      {message ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          {message}
        </div>
      ) : null}

      {mode === "login" || !publicRegistrationEnabled ? (
        <form onSubmit={onLoginSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-white/75">
            Usuario
            <input
              required
              value={loginPayload.username}
              onChange={(event) =>
                setLoginPayload((current) => ({ ...current, username: event.target.value }))
              }
              className="rounded-2xl border border-white/12 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
              placeholder="cliente001"
            />
          </label>
          <label className="grid gap-2 text-sm text-white/75">
            Clave
            <input
              required
              type="password"
              value={loginPayload.password}
              onChange={(event) =>
                setLoginPayload((current) => ({ ...current, password: event.target.value }))
              }
              className="rounded-2xl border border-white/12 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
              placeholder="Tu clave"
            />
          </label>
          <button
            disabled={pending}
            className="rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
          >
            {pending ? "Entrando..." : "Entrar a la emisora"}
          </button>
        </form>
      ) : (
        <form onSubmit={onRegisterSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm text-white/75">
            Nombre visible
            <input
              required
              value={registerPayload.displayName}
              onChange={(event) =>
                setRegisterPayload((current) => ({ ...current, displayName: event.target.value }))
              }
              className="rounded-2xl border border-white/12 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-fuchsia-300/45"
              placeholder="DJ Nova"
            />
          </label>
          <label className="grid gap-2 text-sm text-white/75">
            Usuario
            <input
              required
              value={registerPayload.username}
              onChange={(event) =>
                setRegisterPayload((current) => ({ ...current, username: event.target.value }))
              }
              className="rounded-2xl border border-white/12 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-fuchsia-300/45"
              placeholder="dj_nova"
            />
          </label>
          <label className="grid gap-2 text-sm text-white/75">
            Clave
            <input
              required
              type="password"
              value={registerPayload.password}
              onChange={(event) =>
                setRegisterPayload((current) => ({ ...current, password: event.target.value }))
              }
              className="rounded-2xl border border-white/12 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-fuchsia-300/45"
              placeholder="Minimo 6 caracteres"
            />
          </label>
          <button
            disabled={pending}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-400 via-violet-500 to-emerald-400 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
          >
            {pending ? "Creando..." : "Crear cuenta ahora"}
          </button>
        </form>
      )}
    </GlassReveal>
  );
}

export function RadioApp({
  user,
  profile,
  tracks,
  publicRegistrationEnabled,
  stats,
  liveSettings,
}: RadioAppProps) {
  const router = useRouter();
  const canPlayLive = liveSettings.liveEnabled && Boolean(liveSettings.streamUrl.trim());
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<number>(tracks[0]?.id ?? 0);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(canPlayLive ? "live" : "track");
  const [profileForm, setProfileForm] = useState({
    displayName: profile?.displayName || "Explorador IA",
    bio: profile?.bio || "Tu cabina personal para musica, visuales y atmosfera futurista.",
    avatarUrl:
      profile?.avatarUrl ||
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=600&q=80",
    favoriteTheme: profile?.favoriteTheme || "neon",
    equalizerPreset: profile?.equalizerPreset || "balanced",
    backgroundStyle: profile?.backgroundStyle || "neon-grid",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);

  const deferredQuery = useDeferredValue(query);
  const userTheme = themes.find((item) => item.id === profileForm.favoriteTheme) || themes[0];
  const liveTheme = themes.find((item) => item.id === liveSettings.accentTheme) || themes[2];
  const activeTheme = playerMode === "live" ? liveTheme : userTheme;
  const activeEqualizerPreset =
    equalizerPresets.find((item) => item.id === profileForm.equalizerPreset) || equalizerPresets[0];
  const activeBackgroundStyle =
    backgroundStyles.find((item) => item.id === profileForm.backgroundStyle) || backgroundStyles[0];

  const filteredTracks = tracks.filter((track) => {
    const searchable = `${track.title} ${track.artist} ${track.genre} ${track.mood}`.toLowerCase();
    const matchesQuery = searchable.includes(deferredQuery.trim().toLowerCase());
    const matchesFavorite = favoritesOnly ? track.isFavorite : true;
    return matchesQuery && matchesFavorite;
  });

  const selectedTrack =
    filteredTracks.find((track) => track.id === selectedTrackId) ||
    tracks.find((track) => track.id === selectedTrackId) ||
    filteredTracks[0] ||
    tracks[0] ||
    null;

  useEffect(() => {
    if (!canPlayLive && playerMode === "live") {
      setPlayerMode("track");
    }
  }, [canPlayLive, playerMode]);

  useEffect(() => {
    setIsPlaying(false);
  }, [selectedTrack?.id, playerMode, liveSettings.streamUrl]);

  useEffect(() => {
    const node = mediaRef.current;

    if (typeof window === "undefined") {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!node || !AudioContextClass) {
      return;
    }

    let context = audioContextRef.current;

    if (!context) {
      context = new AudioContextClass();
      audioContextRef.current = context;
    }

    if (!sourceNodeRef.current || sourceNodeRef.current.mediaElement !== node) {
      sourceNodeRef.current?.disconnect();
      filterNodesRef.current.forEach((filter) => filter.disconnect());

      const source = context.createMediaElementSource(node);
      const filters = equalizerFrequencies.map((frequency, index) => {
        const filter = context.createBiquadFilter();
        filter.type = index === 0 ? "lowshelf" : index === equalizerFrequencies.length - 1 ? "highshelf" : "peaking";
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        return filter;
      });

      source.connect(filters[0]);
      filters.forEach((filter, index) => {
        const next = filters[index + 1];
        if (next) {
          filter.connect(next);
          return;
        }

        filter.connect(context.destination);
      });

      sourceNodeRef.current = source;
      filterNodesRef.current = filters;
    }

    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }
  }, [playerMode, selectedTrack?.id, liveSettings.streamUrl]);

  useEffect(() => {
    const filters = filterNodesRef.current;

    if (!filters.length) {
      return;
    }

    activeEqualizerPreset.gains.forEach((gain, index) => {
      const filter = filters[index];
      if (!filter) {
        return;
      }

      filter.gain.value = gain;
    });
  }, [activeEqualizerPreset]);

  async function logout() {
    setLoadingAction(true);
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => router.refresh());
    setLoadingAction(false);
  }

  async function toggleFavorite(trackId: number) {
    if (!user) {
      setMessage("Inicia sesion para guardar canciones favoritas.");
      return;
    }

    setLoadingAction(true);

    const response = await fetch("/api/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trackId }),
    });

    const data = (await response.json().catch(() => null)) as
      | { error?: string; favorite?: boolean }
      | null;

    if (!response.ok) {
      setMessage(data?.error || "No se pudo actualizar favoritos.");
      setLoadingAction(false);
      return;
    }

    setMessage(data?.favorite ? "Cancion guardada en favoritos." : "Cancion retirada de favoritos.");
    startTransition(() => router.refresh());
    setLoadingAction(false);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setMessage("Debes iniciar sesion para guardar tu perfil.");
      return;
    }

    setLoadingAction(true);

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileForm),
    });

    const data = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;

    if (!response.ok) {
      setMessage(data?.error || "No se pudo guardar tu perfil.");
      setLoadingAction(false);
      return;
    }

    setMessage("Perfil actualizado correctamente.");
    startTransition(() => router.refresh());
    setLoadingAction(false);
  }

  function togglePlayback() {
    const node = mediaRef.current;
    if (!node) {
      return;
    }

    if (node.paused) {
      if (audioContextRef.current?.state === "suspended") {
        void audioContextRef.current.resume().catch(() => undefined);
      }

      void node.play();
      return;
    }

    node.pause();
  }

  function activateTrack(trackId: number) {
    setSelectedTrackId(trackId);
    setPlayerMode("track");
  }

  function activateLiveMode() {
    if (!canPlayLive) {
      setMessage("La radio en vivo aun no esta activa.");
      return;
    }

    setPlayerMode("live");
  }

  const favoriteCount = tracks.filter((track) => track.isFavorite).length;
  const heroVisual = playerMode === "live" ? liveSettings.visualUrl : selectedTrack?.visualUrl;
  const heroTitle =
    playerMode === "live" && canPlayLive
      ? liveSettings.streamTitle
      : selectedTrack?.title || "Selecciona una pista para encender la cabina";
  const heroLead =
    playerMode === "live" && canPlayLive
      ? "Radio en vivo 24/7"
      : selectedTrack?.artist || "Tu radio, tus reglas";
  const heroDescription =
    playerMode === "live" && canPlayLive
      ? liveSettings.streamTagline
      : selectedTrack?.description ||
        "Previsualiza musica, visuales, favoritos y perfiles personalizados en una sola experiencia.";
  const mobilePlayerTitle = playerMode === "live" && canPlayLive ? liveSettings.streamTitle : heroTitle;
  const mobilePlayerSubtitle = playerMode === "live" && canPlayLive ? "Radio en vivo" : heroLead;
  const mobilePlayerCover = playerMode === "live" && canPlayLive ? liveSettings.visualUrl : selectedTrack?.coverUrl || selectedTrack?.visualUrl;
  const hasMobilePlayer = Boolean((playerMode === "live" && canPlayLive) || selectedTrack);

  return (
    <main
      className="relative min-h-screen overflow-hidden px-3 py-4 pb-40 sm:px-6 sm:py-8 sm:pb-8 lg:px-8 xl:pb-8"
      style={{ background: activeBackgroundStyle.value }}
    >
      <div className="grid-glow absolute inset-0 opacity-60" />
      <div className="absolute left-[-10rem] top-[-6rem] h-64 w-64 rounded-full bg-cyan-500/20 blur-[120px] sm:left-[-12rem] sm:top-[-8rem] sm:h-80 sm:w-80" />
      <div className="absolute bottom-[-8rem] right-[-6rem] h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[120px] sm:bottom-[-10rem] sm:right-[-8rem] sm:h-80 sm:w-80" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-5 sm:gap-6">
        <GlassReveal id="home" className="glass rounded-[28px] p-4 sm:rounded-[32px] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-cyan-200/80 sm:text-xs sm:tracking-[0.35em]">
                <Radio className="h-4 w-4" />
                TIMIUSIC RADIO IA
              </div>
              <h1 className="mt-4 max-w-3xl break-words text-3xl font-black leading-none text-white sm:text-6xl">
                Emisora WEB IA
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                Ahora puedes lanzar la radio live 24/7, mantener la biblioteca descargable y dejar que
                cada cliente sienta una cabina mucho mas premium.
              </p>
            </div>

            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              {canPlayLive ? (
                <button
                  type="button"
                  onClick={activateLiveMode}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-white transition sm:w-auto",
                    playerMode === "live"
                      ? "border-emerald-300/40 bg-emerald-300/20"
                      : "border-emerald-300/25 bg-emerald-300/12 hover:bg-emerald-300/20"
                  )}
                >
                  <Radio className="h-4 w-4" />
                  En vivo 24/7
                </button>
              ) : null}
              <div className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/80 sm:w-auto sm:text-left">
                {user ? `Hola, ${user.displayName}` : "Modo demo abierto"}
              </div>
              {user?.role === "admin" ? (
                <Link
                  href="/admin"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-300/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-300/25 sm:w-auto"
                >
                  <Shield className="h-4 w-4" />
                  Panel admin
                </Link>
              ) : null}
              {user ? (
                <button
                  type="button"
                  onClick={logout}
                  disabled={loadingAction}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 disabled:opacity-60 sm:w-auto"
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </button>
              ) : (
                <a
                  href="#auth"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02] sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Entrar ahora
                </a>
              )}
            </div>
          </div>
        </GlassReveal>

        <section className="grid gap-5 sm:gap-6 xl:grid-cols-[1.25fr,0.75fr]">
          <GlassReveal delay={0.05}>
            <div
              className={cn(
                "glass noise-overlay relative overflow-hidden rounded-[28px] border p-5 sm:rounded-[36px] sm:p-8",
                activeTheme.surface
              )}
              style={panelBackground(heroVisual)}
            >
              <div className="aurora-ring" />
              <div key={`${playerMode}-${selectedTrack?.id ?? "none"}`} className="relative z-10 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.32em] text-white/80">
                    <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                      {playerMode === "live" ? "On Air" : selectedTrack?.genre || "Streaming"}
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                      {playerMode === "live" ? "24/7" : selectedTrack?.mood || "Visual"}
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                      {playerMode === "live"
                        ? liveSettings.streamUrl
                          ? "Live Stream"
                          : "Standby"
                        : selectedTrack?.mediaType === "video"
                          ? "Video Stage"
                          : "Audio Stage"}
                    </span>
                  </div>
                  <h2 className="mt-8 max-w-3xl break-words text-2xl font-black text-white sm:text-5xl">
                    {heroTitle}
                  </h2>
                  <p className="mt-3 text-base font-semibold text-cyan-100/90 sm:text-lg">{heroLead}</p>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                    {heroDescription}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {canPlayLive ? (
                        <button
                          type="button"
                          onClick={activateLiveMode}
                          className={cn(
                            "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-white transition sm:w-auto",
                            playerMode === "live"
                              ? "border-emerald-300/40 bg-emerald-300/20"
                              : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                        )}
                      >
                        <Radio className="h-4 w-4" />
                        Escuchar live
                      </button>
                    ) : null}
                    {selectedTrack ? (
                        <button
                          type="button"
                          onClick={() => activateTrack(selectedTrack.id)}
                          className={cn(
                            "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-white transition sm:w-auto",
                            playerMode === "track"
                              ? "border-cyan-300/40 bg-cyan-300/18"
                              : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                        )}
                      >
                        <Disc3 className="h-4 w-4" />
                        Volver al catalogo
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-4">
                    <div className="glass rounded-3xl p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/55">Usuarios</p>
                      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{stats.users}</p>
                    </div>
                    <div className="glass rounded-3xl p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/55">Pistas</p>
                      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{stats.tracks}</p>
                    </div>
                    <div className="glass rounded-3xl p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/55">Favoritos</p>
                      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{stats.favorites}</p>
                    </div>
                    <div className="glass rounded-3xl p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/55">Descargas</p>
                      <p className="mt-2 text-2xl font-black text-white sm:text-3xl">{formatDownloads(stats.downloads)}</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/55">Look del reproductor</p>
                    <ThemePicker
                      value={profileForm.favoriteTheme}
                      onChange={(nextTheme) =>
                        setProfileForm((current) => ({ ...current, favoriteTheme: nextTheme }))
                      }
                    />
                  </div>
              </div>
            </div>
          </GlassReveal>

          <GlassReveal id="cabina" delay={0.1} className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex items-center gap-3 text-cyan-200">
              <Waves className="h-5 w-5" />
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Cabina AI Music</p>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/12 bg-slate-950/55 p-4 sm:rounded-[32px] sm:p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div
                  className="h-16 w-16 overflow-hidden rounded-3xl border border-white/10 bg-white/5 bg-cover bg-center"
                  style={coverStyle(profileForm.avatarUrl)}
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                    {user ? profile?.role || "client" : "visitor"}
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    {user ? profileForm.displayName : "Modo invitado"}
                  </h3>
                  <p className="mt-1 text-sm text-white/65">
                    {user ? `Usuario: ${profile?.username}` : "Explora el demo o entra con tus credenciales."}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/72">{profileForm.bio}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Skin</p>
                  <p className="mt-2 text-lg font-bold text-white">{userTheme.label}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Favoritas</p>
                  <p className="mt-2 text-lg font-bold text-white">{favoriteCount}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Live</p>
                  <p className="mt-2 text-lg font-bold text-white">{canPlayLive ? "Activa" : "Standby"}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-emerald-300/15 bg-emerald-300/8 sm:rounded-[32px]">
              <div className="flex flex-col items-start gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-300 opacity-80" />
                  <p className="text-sm font-semibold text-white">{liveSettings.streamTitle}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-white/65">
                  {canPlayLive ? "On Air" : "Offline"}
                </span>
              </div>
              <div className="px-5 py-4 text-sm leading-7 text-white/68">
                {liveSettings.streamTagline}
              </div>
            </div>
          </GlassReveal>
        </section>

        {message ? <div className="glass rounded-3xl px-5 py-4 text-sm text-white/82">{message}</div> : null}

        <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <GlassReveal id="player" delay={0.12} className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">Player Stage</p>
                <h3 className="mt-3 break-words text-2xl font-black text-white sm:text-3xl">
                  {playerMode === "live" ? "Radio en vivo con atmosfera inmersiva" : "Reproductor visual personalizable"}
                </h3>
              </div>
              <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={togglePlayback}
                  className={cn(
                    "inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r text-slate-950 transition sm:w-14 sm:rounded-full",
                    activeTheme.accent,
                    activeTheme.player
                  )}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </button>
                {canPlayLive ? (
                  <button
                    type="button"
                    onClick={activateLiveMode}
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-white transition sm:w-auto",
                      playerMode === "live"
                        ? "border-emerald-300/40 bg-emerald-300/20"
                        : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                    )}
                  >
                    <Radio className="h-4 w-4" />
                    En vivo
                  </button>
                ) : null}
                {playerMode === "track" && selectedTrack ? (
                  <a
                    href={`/download/${selectedTrack.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Descargar
                  </a>
                ) : null}
              </div>
            </div>

            {playerMode === "live" && canPlayLive ? (
              <div key="live-stage" className="mt-8 grid gap-4 sm:gap-6 lg:grid-cols-[0.95fr,1.05fr]">
                  <div
                    className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/75 p-4 sm:min-h-[420px] sm:rounded-[36px] sm:p-6"
                    style={panelBackground(liveSettings.visualUrl)}
                  >
                    <div className={cn("absolute inset-0 opacity-70", `bg-gradient-to-br ${liveTheme.accent}`)} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_35%),linear-gradient(180deg,rgba(3,5,14,0.14),rgba(3,5,14,0.82))]" />

                    <div className="relative z-10 flex w-full flex-col items-center justify-center text-center">
                      <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
                        <div
                          className={cn("absolute inset-0 rounded-full bg-gradient-to-br blur-3xl", liveTheme.accent)}
                          style={{ opacity: 0.33 }}
                        />
                        <div className="absolute inset-[8%] rounded-full border border-white/15" />
                        <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/15 bg-slate-950/75 shadow-2xl sm:h-56 sm:w-56">
                          <div className="absolute inset-[12%] rounded-full border border-white/10" />
                          <div className="absolute inset-[24%] rounded-full border border-white/10" />
                          <Radio className="h-16 w-16 text-white" />
                        </div>
                      </div>

                      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-emerald-100">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 opacity-80" />
                        Transmitiendo ahora
                      </div>

                      <AudioVisualization active={isPlaying} />

                      <audio
                        key={`live-${liveSettings.streamUrl}`}
                        ref={(node) => {
                          mediaRef.current = node;
                        }}
                        src={liveSettings.streamUrl}
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        className="relative z-10 mt-8 w-full max-w-lg accent-emerald-300"
                      />
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/55">
                      <span className="rounded-full border border-white/10 px-3 py-2">Live Stream</span>
                      <span className="rounded-full border border-white/10 px-3 py-2">24/7</span>
                      <span className="rounded-full border border-white/10 px-3 py-2">Always On</span>
                    </div>

                    <h4 className="mt-6 break-words text-2xl font-black text-white sm:text-3xl">{liveSettings.streamTitle}</h4>
                    <p className="mt-2 text-lg font-semibold text-emerald-100/90">Cabina principal en vivo</p>
                    <p className="mt-5 text-sm leading-7 text-white/72">{liveSettings.streamTagline}</p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-white/55">Estado</p>
                        <p className="mt-2 text-xl font-black text-white">On Air</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-white/55">Tema live</p>
                        <p className="mt-2 text-xl font-black text-white">{liveTheme.label}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-white/55">Modo</p>
                        <p className="mt-2 text-xl font-black text-white">Streaming</p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {selectedTrack ? (
                        <button
                          type="button"
                          onClick={() => activateTrack(selectedTrack.id)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
                        >
                          <Disc3 className="h-4 w-4" />
                          Ir a la pista seleccionada
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : selectedTrack ? (
                <div key={`track-stage-${selectedTrack.id}`} className="mt-8 grid gap-4 sm:gap-6 lg:grid-cols-[0.9fr,1.1fr]">
                  <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70 p-4 sm:min-h-[420px] sm:rounded-[36px] sm:p-6">
                    <div className={cn("absolute inset-0 opacity-70", `bg-gradient-to-br ${userTheme.accent}`)} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_35%),linear-gradient(180deg,rgba(3,5,14,0.16),rgba(3,5,14,0.78))]" />

                    {selectedTrack.mediaType === "video" ? (
                      <video
                        key={selectedTrack.id}
                        ref={(node) => {
                          mediaRef.current = node;
                        }}
                        poster={selectedTrack.coverUrl}
                        src={selectedTrack.mediaUrl}
                        controls
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        className="relative z-10 h-full min-h-[220px] w-full rounded-[24px] border border-white/12 object-cover shadow-2xl sm:min-h-[340px] sm:rounded-[30px]"
                      />
                    ) : (
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="floating relative flex h-60 w-60 items-center justify-center rounded-full border border-white/12 bg-slate-950/70 p-4 shadow-2xl sm:h-80 sm:w-80">
                          <div className="absolute inset-0 rounded-full border-[22px] border-white/10" />
                          <div className={cn("absolute inset-[8%] rounded-full blur-xl", `bg-gradient-to-br ${userTheme.accent}`)} />
                          <div
                            className="relative h-36 w-36 overflow-hidden rounded-full border border-white/12 bg-cover bg-center sm:h-48 sm:w-48"
                            style={coverStyle(selectedTrack.coverUrl || selectedTrack.visualUrl)}
                          />
                          <div className="absolute h-6 w-6 rounded-full bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.15)]" />
                        </div>

                        <AudioVisualization active={isPlaying} />

                        <audio
                          key={selectedTrack.id}
                          ref={(node) => {
                            mediaRef.current = node;
                          }}
                          src={selectedTrack.mediaUrl}
                          controls
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => setIsPlaying(false)}
                          className="relative z-10 mt-8 w-full max-w-lg accent-cyan-300"
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:rounded-[32px] sm:p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/55">
                      <span className="rounded-full border border-white/10 px-3 py-2">{selectedTrack.genre}</span>
                      <span className="rounded-full border border-white/10 px-3 py-2">{selectedTrack.mood}</span>
                      <span className="rounded-full border border-white/10 px-3 py-2">
                        {selectedTrack.mediaType === "video" ? "Video HD" : "Audio HQ"}
                      </span>
                    </div>

                    <h4 className="mt-6 break-words text-2xl font-black text-white sm:text-3xl">{selectedTrack.title}</h4>
                    <p className="mt-2 text-lg font-semibold text-cyan-100/90">{selectedTrack.artist}</p>
                    <p className="mt-5 text-sm leading-7 text-white/72">{selectedTrack.description}</p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-white/55">Descargas</p>
                        <p className="mt-2 text-xl font-black text-white">{formatDownloads(selectedTrack.downloads)}</p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-white/55">Favorita</p>
                        <p className="mt-2 text-xl font-black text-white">
                          {selectedTrack.isFavorite ? "Si" : "No"}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                        <p className="text-xs uppercase tracking-[0.28em] text-white/55">Portada</p>
                        <p className="mt-2 text-xl font-black text-white">
                          {selectedTrack.coverUrl ? "Activa" : "Pendiente"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(selectedTrack.id)}
                        className={cn(
                          "inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition sm:w-auto",
                          selectedTrack.isFavorite
                            ? "border-fuchsia-300/40 bg-fuchsia-300/20 text-white"
                            : "border-white/10 bg-white/5 text-white hover:border-white/25 hover:bg-white/10"
                        )}
                      >
                        <Heart className={cn("h-4 w-4", selectedTrack.isFavorite ? "fill-current" : "")} />
                        {selectedTrack.isFavorite ? "Guardada" : "Guardar favorita"}
                      </button>

                      <a
                        href={`/download/${selectedTrack.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
                      >
                        <Download className="h-4 w-4" />
                        Descargar pista
                      </a>

                      {canPlayLive ? (
                        <button
                          type="button"
                          onClick={activateLiveMode}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 sm:w-auto"
                        >
                          <Radio className="h-4 w-4" />
                          Cambiar a live
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key="empty-stage"
                  className="mt-8 rounded-[28px] border border-dashed border-white/12 bg-white/5 p-6 text-center text-white/65 sm:rounded-[32px] sm:p-10"
                >
                  No hay pistas disponibles todavia.
                </div>
              )}
          </GlassReveal>

          <GlassReveal id="catalogo" delay={0.18} className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">Biblioteca</p>
                <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">Catalogo multimedia</h3>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                {canPlayLive ? (
                  <button
                    type="button"
                    onClick={activateLiveMode}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition sm:w-auto",
                      playerMode === "live"
                        ? "border-emerald-300/40 bg-emerald-300/20 text-white"
                        : "border-white/10 bg-white/5 text-white/75 hover:border-white/25 hover:bg-white/10"
                    )}
                  >
                    Ir al live
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setFavoritesOnly((current) => !current)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition sm:w-auto",
                    favoritesOnly
                      ? "border-fuchsia-300/40 bg-fuchsia-300/18 text-white"
                      : "border-white/10 bg-white/5 text-white/75 hover:border-white/25 hover:bg-white/10"
                  )}
                >
                  {favoritesOnly ? "Viendo favoritas" : "Mostrar favoritas"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-white/65">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por titulo, artista, genero o mood"
                className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/35 sm:text-sm"
              />
            </div>

            <div className="mt-6 space-y-3 xl:max-h-[670px] xl:overflow-auto xl:pr-1">
              {filteredTracks.length ? (
                filteredTracks.map((track) => (
                  <article
                    key={track.id}
                    className={cn(
                      "group rounded-[24px] border p-3 transition sm:rounded-[28px] sm:p-4",
                      selectedTrack?.id === track.id && playerMode === "track"
                        ? "border-cyan-300/35 bg-cyan-300/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                      <button
                        type="button"
                        onClick={() => activateTrack(track.id)}
                        className="h-32 w-full shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-cover bg-center text-left sm:h-24 sm:w-24 sm:rounded-[24px]"
                        style={coverStyle(track.coverUrl || track.visualUrl)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <button type="button" onClick={() => activateTrack(track.id)} className="min-w-0 text-left">
                            <h4 className="text-lg font-black text-white sm:truncate">{track.title}</h4>
                            <p className="mt-1 text-sm text-cyan-100/80 sm:truncate">{track.artist}</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleFavorite(track.id)}
                            className={cn(
                              "inline-flex h-11 w-11 self-start items-center justify-center rounded-2xl border transition sm:self-auto",
                              track.isFavorite
                                ? "border-fuchsia-300/40 bg-fuchsia-300/20 text-white"
                                : "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/10"
                            )}
                          >
                            <Heart className={cn("h-4 w-4", track.isFavorite ? "fill-current" : "")} />
                          </button>
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/68">{track.description}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
                            {track.genre}
                          </span>
                          <span className="rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
                            {track.mood}
                          </span>
                          <span className="rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.25em] text-white/55">
                            {track.mediaType}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                          <button
                            type="button"
                            onClick={() => activateTrack(track.id)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/12 sm:w-auto sm:py-3"
                          >
                            <Play className="h-4 w-4" />
                            Abrir player
                          </button>
                          <a
                            href={`/download/${track.id}`}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:bg-white/10 sm:w-auto sm:py-3"
                          >
                            <Download className="h-4 w-4" />
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-white/5 p-8 text-center text-white/62">
                  No hay coincidencias para tu busqueda.
                </div>
              )}
            </div>
          </GlassReveal>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <GlassReveal id="perfil" delay={0.22} className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
            <div className="flex items-center gap-3 text-white/80">
              <UserRound className="h-5 w-5" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/55">Perfil</p>
                <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">Ajusta tu identidad sonora</h3>
              </div>
            </div>

            {user ? (
              <form onSubmit={saveProfile} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm text-white/75">
                  Nombre visible
                  <input
                    value={profileForm.displayName}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                    }
                    className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  />
                </label>

                <label className="grid gap-2 text-sm text-white/75">
                  Bio
                  <textarea
                    value={profileForm.bio}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, bio: event.target.value }))
                    }
                    rows={4}
                    className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  />
                </label>

                <label className="grid gap-2 text-sm text-white/75">
                  URL de avatar
                  <input
                    value={profileForm.avatarUrl}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))
                    }
                    className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                    placeholder="https://..."
                  />
                </label>

                <div>
                  <p className="mb-3 text-sm text-white/75">Tema visual guardado</p>
                  <ThemePicker
                    value={profileForm.favoriteTheme}
                    onChange={(nextTheme) =>
                      setProfileForm((current) => ({ ...current, favoriteTheme: nextTheme }))
                    }
                  />
                </div>

                <label className="grid gap-2 text-sm text-white/75">
                  Ecualizador
                  <select
                    value={profileForm.equalizerPreset}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        equalizerPreset: event.target.value as EqualizerPreset,
                      }))
                    }
                    className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  >
                    {equalizerPresets.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm text-white/75">
                  Fondo de la app
                  <select
                    value={profileForm.backgroundStyle}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        backgroundStyle: event.target.value as BackgroundStyle,
                      }))
                    }
                    className="rounded-2xl border border-white/12 bg-slate-950/55 px-4 py-3 text-white outline-none transition focus:border-cyan-300/45"
                  >
                    {backgroundStyles.map((background) => (
                      <option key={background.id} value={background.id}>
                        {background.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  disabled={loadingAction}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-5 py-3 font-bold text-slate-950 transition hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
                >
                  Guardar perfil
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-white/12 bg-white/5 p-8 text-sm leading-7 text-white/68">
                Cuando inicies sesion podras guardar tu perfil, tu tema favorito, tus canciones favoritas
                y tu forma preferida de explorar la cabina.
              </div>
            )}
          </GlassReveal>

          {user ? (
            <GlassReveal delay={0.26} className="glass rounded-[28px] p-5 sm:rounded-[36px] sm:p-8">
              <div className="flex items-center gap-3 text-white/80">
                <Disc3 className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Tu resumen</p>
                  <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">Cabina personal del oyente</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Usuario</p>
                  <p className="mt-3 text-2xl font-black text-white">{profile?.username}</p>
                  <p className="mt-2 text-sm text-white/65">Cliente autenticado en la emisora.</p>
                </div>
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Favoritas</p>
                  <p className="mt-3 text-2xl font-black text-white">{favoriteCount}</p>
                  <p className="mt-2 text-sm text-white/65">Tus canciones guardadas se recuerdan en la base local.</p>
                </div>
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Tema guardado</p>
                  <p className="mt-3 text-2xl font-black text-white">{userTheme.label}</p>
                  <p className="mt-2 text-sm text-white/65">Cambia el look cuando quieras y vuelve a guardar.</p>
                </div>
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Ecualizador</p>
                  <p className="mt-3 text-2xl font-black text-white">{activeEqualizerPreset.label}</p>
                  <p className="mt-2 text-sm text-white/65">Tu sonido personalizado se aplica al reproductor actual.</p>
                </div>
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Fondo app</p>
                  <p className="mt-3 text-2xl font-black text-white">{activeBackgroundStyle.label}</p>
                  <p className="mt-2 text-sm text-white/65">El fondo cambia al instante y queda guardado en tu perfil.</p>
                </div>
                <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/55">Live 24/7</p>
                  <p className="mt-3 text-2xl font-black text-white">{canPlayLive ? "Disponible" : "Pendiente"}</p>
                  <p className="mt-2 text-sm text-white/65">Tu emisora ahora soporta canal continuo y catalogo bajo demanda.</p>
                </div>
              </div>

              <div className="mt-6 rounded-[30px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3 text-white">
                  <Zap className="h-5 w-5 text-amber-300" />
                  <p className="text-sm font-semibold">Modo activo: {playerMode === "live" ? "Radio en vivo" : "Biblioteca interactiva"}</p>
                </div>
              </div>
            </GlassReveal>
          ) : (
            <GuestAuthPanel publicRegistrationEnabled={publicRegistrationEnabled} />
          )}
        </section>
      </div>

      {hasMobilePlayer ? (
        <MobileStickyPlayer
          title={mobilePlayerTitle}
          subtitle={mobilePlayerSubtitle}
          coverUrl={mobilePlayerCover}
          isPlaying={isPlaying}
          onTogglePlayback={togglePlayback}
          onOpen={() => {
            window.location.hash = "player";
          }}
        />
      ) : null}

      <MobileNav canPlayLive={canPlayLive} onLiveTap={activateLiveMode} />
    </main>
  );
}
