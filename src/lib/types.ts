export type ThemeMode = "neon" | "vinyl" | "aurora";

export type EqualizerPreset =
  | "balanced"
  | "bass-boost"
  | "treble-boost"
  | "vocal-boost"
  | "club"
  | "deep"
  | "acoustic"
  | "electronic"
  | "cinema"
  | "lo-fi";

export type BackgroundStyle =
  | "neon-grid"
  | "sunset-haze"
  | "midnight-vinyl"
  | "ocean-dream"
  | "aurora-sky";

export type UserRole = "admin" | "client";

export type UserRecord = {
  id: number;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  bio: string;
  avatarUrl: string;
  favoriteTheme: ThemeMode;
  equalizerPreset: EqualizerPreset;
  backgroundStyle: BackgroundStyle;
  createdAt: string;
};

export type TrackRecord = {
  id: number;
  title: string;
  artist: string;
  description: string;
  mediaType: "audio" | "video";
  mediaUrl: string;
  coverUrl: string;
  visualUrl: string;
  genre: string;
  mood: string;
  downloads: number;
  featured: number;
  createdAt: string;
};

export type FavoriteRecord = {
  id: number;
  userId: number;
  trackId: number;
  createdAt: string;
};

export type SessionUser = {
  id: number;
  username: string;
  role: UserRole;
  displayName: string;
  favoriteTheme: ThemeMode;
};

export type PublicTrack = {
  id: number;
  title: string;
  artist: string;
  description: string;
  mediaType: "audio" | "video";
  mediaUrl: string;
  coverUrl: string;
  visualUrl: string;
  genre: string;
  mood: string;
  downloads: number;
  featured: boolean;
  isFavorite: boolean;
};

export type LiveStationSettings = {
  streamUrl: string;
  streamTitle: string;
  streamTagline: string;
  visualUrl: string;
  accentTheme: ThemeMode;
  liveEnabled: boolean;
};

export type BulkImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};
