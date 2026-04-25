import { redirect } from "next/navigation";
import { AdminPanel } from "@/components/admin-panel";
import { getSessionUser } from "@/lib/auth";
import { getDashboardStats, getLiveStationSettings, listTracks, listUsers } from "@/lib/db";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return (
    <AdminPanel
      user={user}
      stats={getDashboardStats()}
      liveSettings={getLiveStationSettings()}
      users={listUsers()}
      tracks={listTracks()}
    />
  );
}
