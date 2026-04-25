import { getSessionUser } from "@/lib/auth";
import { getDashboardStats, getLiveStationSettings, getProfile, listTracksForUser } from "@/lib/db";
import { isPublicRegistrationEnabled } from "@/lib/env";
import { RadioApp } from "@/components/radio-app";

export default async function HomePage() {
  const user = await getSessionUser();
  const profile = user ? getProfile(user.id) : null;
  const tracks = listTracksForUser(user?.id ?? null);
  const stats = getDashboardStats();
  const liveSettings = getLiveStationSettings();
  const publicRegistrationEnabled = isPublicRegistrationEnabled();

  return (
    <RadioApp
      user={user}
      profile={profile}
      tracks={tracks}
      stats={stats}
      liveSettings={liveSettings}
      publicRegistrationEnabled={publicRegistrationEnabled}
    />
  );
}
