import { DashboardClient } from "@/components/entries/dashboard-client";
import { getServerAuthSession } from "@/lib/auth";
import { ensureUserPositions } from "@/lib/positions";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  const positions = userId ? await ensureUserPositions(userId) : undefined;

  return <DashboardClient initialPositions={positions} />;
}
