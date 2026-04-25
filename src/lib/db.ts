import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { getAdminSeedPassword } from "@/lib/env";
import { getDataFilePath } from "@/lib/storage";
import type {
  BackgroundStyle,
  BulkImportResult,
  EqualizerPreset,
  FavoriteRecord,
  LiveStationSettings,
  PublicTrack,
  SessionUser,
  ThemeMode,
  TrackRecord,
  UserRecord,
  UserRole,
} from "@/lib/types";

const db = new Database(getDataFilePath());

db.pragma("journal_mode = WAL");

function now() {
  return new Date().toISOString();
}

function normalizeTheme(value?: string | null): ThemeMode {
  return value === "vinyl" || value === "aurora" ? value : "neon";
}

function normalizeRole(value?: string | null): UserRole {
  return value === "admin" ? "admin" : "client";
}

function normalizeEqualizerPreset(value?: string | null): EqualizerPreset {
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

function normalizeBackgroundStyle(value?: string | null): BackgroundStyle {
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

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      display_name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      favorite_theme TEXT NOT NULL DEFAULT 'neon',
      equalizer_preset TEXT NOT NULL DEFAULT 'balanced',
      background_style TEXT NOT NULL DEFAULT 'neon-grid',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seed_key TEXT UNIQUE,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      media_type TEXT NOT NULL,
      media_url TEXT NOT NULL,
      cover_url TEXT NOT NULL DEFAULT '',
      visual_url TEXT NOT NULL DEFAULT '',
      genre TEXT NOT NULL DEFAULT '',
      mood TEXT NOT NULL DEFAULT '',
      downloads INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      track_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, track_id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(track_id) REFERENCES tracks(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const trackColumns = db.prepare("PRAGMA table_info(tracks)").all() as Array<{ name: string }>;
  const hasSeedKey = trackColumns.some((column) => column.name === "seed_key");
  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  const hasEqualizerPreset = userColumns.some((column) => column.name === "equalizer_preset");
  const hasBackgroundStyle = userColumns.some((column) => column.name === "background_style");

  if (!hasSeedKey) {
    db.prepare("ALTER TABLE tracks ADD COLUMN seed_key TEXT").run();
  }

  if (!hasEqualizerPreset) {
    db.prepare("ALTER TABLE users ADD COLUMN equalizer_preset TEXT NOT NULL DEFAULT 'balanced'").run();
  }

  if (!hasBackgroundStyle) {
    db.prepare("ALTER TABLE users ADD COLUMN background_style TEXT NOT NULL DEFAULT 'neon-grid'").run();
  }

  db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_tracks_seed_key ON tracks(seed_key)").run();

  const legacySeeds = [
    ["seed-neon-pulse", "Neon Pulse", "AI Frequency"],
    ["seed-aurora-loop", "Aurora Loop", "Circuit Dreams"],
    ["seed-cinematic-bloom", "Cinematic Bloom", "Hologram FM"],
  ] as const;

  const attachSeedKey = db.prepare(
    `UPDATE tracks
     SET seed_key = ?
     WHERE id = (
       SELECT id FROM tracks
       WHERE title = ? AND artist = ? AND (seed_key IS NULL OR seed_key = '')
       ORDER BY id ASC
       LIMIT 1
     )`
  );

  for (const [seedKey, title, artist] of legacySeeds) {
    attachSeedKey.run(seedKey, title, artist);
  }
}

function setSetting(key: string, value: string) {
  db.prepare(
    `INSERT INTO app_settings (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

function getSetting(key: string, fallback = "") {
  const row = db
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .get(key) as { value: string } | undefined;

  return row?.value ?? fallback;
}

function seedAdmin() {
  const existingAdmin = db
    .prepare("SELECT id FROM users WHERE username = 'admin' LIMIT 1")
    .get() as { id: number } | undefined;

  if (existingAdmin) {
    return;
  }

  const password = getAdminSeedPassword();
  const hash = bcrypt.hashSync(password, 10);

  db.prepare(
      `INSERT OR IGNORE INTO users (username, password_hash, role, display_name, bio, avatar_url, favorite_theme, equalizer_preset, background_style, created_at)
     VALUES (?, ?, 'admin', ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "admin",
      hash,
      "Directorio TIMIUSIC",
      "Administra la emisora, sube contenido y crea clientes.",
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=400&q=80",
      "neon",
      "balanced",
      "neon-grid",
      now()
    );
}

function seedTracks() {
  const tracks = [
    {
      seedKey: "seed-neon-pulse",
      title: "Neon Pulse",
      artist: "AI Frequency",
      description: "Un set synthwave para abrir la emisora con energía futurista.",
      mediaType: "audio",
      mediaUrl:
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      coverUrl:
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
      visualUrl:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
      genre: "Synthwave",
      mood: "Nocturno",
      featured: 1,
    },
    {
      seedKey: "seed-aurora-loop",
      title: "Aurora Loop",
      artist: "Circuit Dreams",
      description: "Ambiente electrónico suave para sesiones largas y foco creativo.",
      mediaType: "audio",
      mediaUrl:
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      coverUrl:
        "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
      visualUrl:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
      genre: "Electronic",
      mood: "Atmosférico",
      featured: 0,
    },
    {
      seedKey: "seed-cinematic-bloom",
      title: "Cinematic Bloom",
      artist: "Hologram FM",
      description: "Video musical ideal para destacar portada, visual y movimiento.",
      mediaType: "video",
      mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
      coverUrl:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
      visualUrl:
        "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
      genre: "Visual Pop",
      mood: "Epic",
      featured: 1,
    },
  ];

  const insert = db.prepare(
    `INSERT OR IGNORE INTO tracks (seed_key, title, artist, description, media_type, media_url, cover_url, visual_url, genre, mood, downloads, featured, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  );

  for (const track of tracks) {
    insert.run(
      track.seedKey,
      track.title,
      track.artist,
      track.description,
      track.mediaType,
      track.mediaUrl,
      track.coverUrl,
      track.visualUrl,
      track.genre,
      track.mood,
      track.featured,
      now()
    );
  }
}

function seedStationSettings() {
  const settings: LiveStationSettings = {
    streamUrl: "https://stream.radioparadise.com/mp3-192",
    streamTitle: "TIMIUSIC Live AI",
    streamTagline: "Canal en vivo para sesiones continuas, premieres y mezclas automáticas.",
    visualUrl:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80",
    accentTheme: "aurora",
    liveEnabled: true,
  };

  setSetting("streamUrl", getSetting("streamUrl", settings.streamUrl));
  setSetting("streamTitle", getSetting("streamTitle", settings.streamTitle));
  setSetting("streamTagline", getSetting("streamTagline", settings.streamTagline));
  setSetting("visualUrl", getSetting("visualUrl", settings.visualUrl));
  setSetting("accentTheme", getSetting("accentTheme", settings.accentTheme));
  setSetting("liveEnabled", getSetting("liveEnabled", settings.liveEnabled ? "1" : "0"));
}

createTables();
seedAdmin();
seedTracks();
seedStationSettings();

export function createUser({
  username,
  password,
  displayName,
  role = "client",
}: {
  username: string;
  password: string;
  displayName: string;
  role?: UserRole;
}) {
  const hash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare(
      `INSERT INTO users (username, password_hash, role, display_name, bio, avatar_url, favorite_theme, equalizer_preset, background_style, created_at)
       VALUES (?, ?, ?, ?, '', '', 'neon', 'balanced', 'neon-grid', ?)`
    )
    .run(username.trim().toLowerCase(), hash, role, displayName.trim(), now());

  return Number(result.lastInsertRowid);
}

export function createUsersBulk(
  entries: Array<{ username: string; password: string; displayName: string; role?: UserRole }>
) {
  const insert = db.prepare(
    `INSERT INTO users (username, password_hash, role, display_name, bio, avatar_url, favorite_theme, equalizer_preset, background_style, created_at)
     VALUES (?, ?, ?, ?, '', '', 'neon', 'balanced', 'neon-grid', ?)`
  );

  const findExisting = db.prepare("SELECT id FROM users WHERE username = ?");

  const transaction = db.transaction((rows: typeof entries) => {
    const result: BulkImportResult = { created: 0, skipped: 0, errors: [] };

    rows.forEach((entry, index) => {
      const username = entry.username.trim().toLowerCase();
      const displayName = entry.displayName.trim();
      const password = entry.password.trim();
      const role = entry.role === "admin" ? "admin" : "client";

      if (!username || !displayName || !password) {
        result.skipped += 1;
        result.errors.push(`Fila ${index + 1}: faltan datos obligatorios.`);
        return;
      }

      if (password.length < 6) {
        result.skipped += 1;
        result.errors.push(`Fila ${index + 1}: la clave de ${username} es muy corta.`);
        return;
      }

      const existing = findExisting.get(username) as { id: number } | undefined;
      if (existing) {
        result.skipped += 1;
        result.errors.push(`Fila ${index + 1}: el usuario ${username} ya existe.`);
        return;
      }

      insert.run(username, bcrypt.hashSync(password, 10), role, displayName, now());
      result.created += 1;
    });

    return result;
  });

  return transaction(entries);
}

export function verifyUser(username: string, password: string): SessionUser | null {
  const user = db
    .prepare(
      `SELECT id, username, password_hash, role, display_name, favorite_theme
       FROM users WHERE username = ?`
    )
    .get(username.trim().toLowerCase()) as
    | {
        id: number;
        username: string;
        password_hash: string;
        role: string;
        display_name: string;
        favorite_theme: string;
      }
    | undefined;

  if (!user) {
    return null;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: normalizeRole(user.role),
    displayName: user.display_name,
    favoriteTheme: normalizeTheme(user.favorite_theme),
  };
}

export function getUserById(id: number): SessionUser | null {
  const user = db
    .prepare(
      `SELECT id, username, role, display_name, favorite_theme
       FROM users WHERE id = ?`
    )
    .get(id) as
    | {
        id: number;
        username: string;
        role: string;
        display_name: string;
        favorite_theme: string;
      }
    | undefined;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: normalizeRole(user.role),
    displayName: user.display_name,
    favoriteTheme: normalizeTheme(user.favorite_theme),
  };
}

export function getProfile(userId: number) {
  const user = db
    .prepare(
      `SELECT id, username, role, display_name, bio, avatar_url, favorite_theme, equalizer_preset, background_style, created_at
       FROM users WHERE id = ?`
    )
    .get(userId) as
    | {
        id: number;
        username: string;
        role: string;
        display_name: string;
        bio: string;
        avatar_url: string;
        favorite_theme: string;
        equalizer_preset: string;
        background_style: string;
        created_at: string;
      }
    | undefined;

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: normalizeRole(user.role),
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    favoriteTheme: normalizeTheme(user.favorite_theme),
    equalizerPreset: normalizeEqualizerPreset(user.equalizer_preset),
    backgroundStyle: normalizeBackgroundStyle(user.background_style),
    createdAt: user.created_at,
  };
}

export function updateProfile(
  userId: number,
  payload: {
    displayName: string;
    bio: string;
    avatarUrl: string;
    favoriteTheme: ThemeMode;
    equalizerPreset: EqualizerPreset;
    backgroundStyle: BackgroundStyle;
  }
) {
  db.prepare(
    `UPDATE users
     SET display_name = ?, bio = ?, avatar_url = ?, favorite_theme = ?, equalizer_preset = ?, background_style = ?
     WHERE id = ?`
  ).run(
    payload.displayName.trim(),
    payload.bio.trim(),
    payload.avatarUrl.trim(),
    payload.favoriteTheme,
    payload.equalizerPreset,
    payload.backgroundStyle,
    userId
  );
}

export function listUsers() {
  return db
    .prepare(
      `SELECT id, username, role, display_name, bio, avatar_url, favorite_theme, equalizer_preset, background_style, created_at
       FROM users
       ORDER BY created_at DESC`
    )
    .all()
    .map((user) => {
      const row = user as {
        id: number;
        username: string;
        role: string;
        display_name: string;
        bio: string;
        avatar_url: string;
        favorite_theme: string;
        equalizer_preset: string;
        background_style: string;
        created_at: string;
      };

      return {
        id: row.id,
        username: row.username,
        role: normalizeRole(row.role),
        displayName: row.display_name,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        favoriteTheme: normalizeTheme(row.favorite_theme),
        equalizerPreset: normalizeEqualizerPreset(row.equalizer_preset),
        backgroundStyle: normalizeBackgroundStyle(row.background_style),
        createdAt: row.created_at,
      };
    }) as UserRecord[];
}

export function createTrack(payload: {
  seedKey?: string | null;
  title: string;
  artist: string;
  description: string;
  genre: string;
  mood: string;
  mediaType: "audio" | "video";
  mediaUrl: string;
  coverUrl: string;
  visualUrl: string;
  featured: boolean;
}) {
  const result = db
    .prepare(
      `INSERT INTO tracks (seed_key, title, artist, description, media_type, media_url, cover_url, visual_url, genre, mood, downloads, featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(
      payload.seedKey || null,
      payload.title.trim(),
      payload.artist.trim(),
      payload.description.trim(),
      payload.mediaType,
      payload.mediaUrl.trim(),
      payload.coverUrl.trim(),
      payload.visualUrl.trim(),
      payload.genre.trim(),
      payload.mood.trim(),
      payload.featured ? 1 : 0,
      now()
    );

  return Number(result.lastInsertRowid);
}

export function listTracks() {
  return db
    .prepare(
      `SELECT id, title, artist, description, media_type, media_url, cover_url, visual_url, genre, mood, downloads, featured, created_at
       FROM tracks
       ORDER BY featured DESC, created_at DESC`
    )
    .all()
    .map((track) => {
      const row = track as {
        id: number;
        title: string;
        artist: string;
        description: string;
        media_type: "audio" | "video";
        media_url: string;
        cover_url: string;
        visual_url: string;
        genre: string;
        mood: string;
        downloads: number;
        featured: number;
        created_at: string;
      };

      return {
        id: row.id,
        title: row.title,
        artist: row.artist,
        description: row.description,
        mediaType: row.media_type,
        mediaUrl: row.media_url,
        coverUrl: row.cover_url,
        visualUrl: row.visual_url,
        genre: row.genre,
        mood: row.mood,
        downloads: row.downloads,
        featured: row.featured,
        createdAt: row.created_at,
      };
    }) as TrackRecord[];
}

export function listTracksForUser(userId?: number | null) {
  const favorites = userId
    ? new Set(
        (db
          .prepare("SELECT track_id FROM favorites WHERE user_id = ?")
          .all(userId) as Array<{ track_id: number }>).map((row) => row.track_id)
      )
    : new Set<number>();

  return listTracks().map(
    (track) =>
      ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        description: track.description,
        mediaType: track.mediaType,
        mediaUrl: track.mediaUrl,
        coverUrl: track.coverUrl,
        visualUrl: track.visualUrl,
        genre: track.genre,
        mood: track.mood,
        downloads: track.downloads,
        featured: Boolean(track.featured),
        isFavorite: favorites.has(track.id),
      }) satisfies PublicTrack
  );
}

export function listFavorites(userId: number) {
  return db
    .prepare(
      `SELECT f.id, f.user_id, f.track_id, f.created_at
       FROM favorites f
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`
    )
    .all(userId) as FavoriteRecord[];
}

export function toggleFavorite(userId: number, trackId: number) {
  const existing = db
    .prepare("SELECT id FROM favorites WHERE user_id = ? AND track_id = ?")
    .get(userId, trackId) as { id: number } | undefined;

  if (existing) {
    db.prepare("DELETE FROM favorites WHERE id = ?").run(existing.id);
    return false;
  }

  db.prepare(
    "INSERT INTO favorites (user_id, track_id, created_at) VALUES (?, ?, ?)"
  ).run(userId, trackId, now());

  return true;
}

export function incrementDownload(trackId: number) {
  db.prepare("UPDATE tracks SET downloads = downloads + 1 WHERE id = ?").run(trackId);
}

export function getTrackById(trackId: number) {
  return listTracks().find((track) => track.id === trackId) || null;
}

export function getDashboardStats() {
  const users = db.prepare("SELECT COUNT(*) as total FROM users").get() as { total: number };
  const tracks = db.prepare("SELECT COUNT(*) as total FROM tracks").get() as { total: number };
  const favorites = db.prepare("SELECT COUNT(*) as total FROM favorites").get() as { total: number };
  const downloads = db.prepare("SELECT COALESCE(SUM(downloads), 0) as total FROM tracks").get() as {
    total: number;
  };

  return {
    users: users.total,
    tracks: tracks.total,
    favorites: favorites.total,
    downloads: downloads.total,
  };
}

export function getLiveStationSettings(): LiveStationSettings {
  const accentTheme = getSetting("accentTheme", "aurora");

  return {
    streamUrl: getSetting("streamUrl"),
    streamTitle: getSetting("streamTitle", "TIMIUSIC Live AI"),
    streamTagline: getSetting(
      "streamTagline",
      "Canal en vivo para sesiones continuas, premieres y mezclas automáticas."
    ),
    visualUrl: getSetting(
      "visualUrl",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80"
    ),
    accentTheme: normalizeTheme(accentTheme),
    liveEnabled: getSetting("liveEnabled", "0") === "1",
  };
}

export function updateLiveStationSettings(payload: LiveStationSettings) {
  setSetting("streamUrl", payload.streamUrl.trim());
  setSetting("streamTitle", payload.streamTitle.trim());
  setSetting("streamTagline", payload.streamTagline.trim());
  setSetting("visualUrl", payload.visualUrl.trim());
  setSetting("accentTheme", payload.accentTheme);
  setSetting("liveEnabled", payload.liveEnabled ? "1" : "0");
}
