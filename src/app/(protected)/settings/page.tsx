import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { ensureUserPositions } from "@/lib/positions";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) redirect("/auth/signin");

  const [user, positions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        signature: true,
        monthlySummaryEmailEnabled: true,
      },
    }),
    ensureUserPositions(userId),
  ]);

  return (
    <ProfileSettingsForm
      initialPositions={positions}
      initialProfile={{
        name: user?.name ?? session?.user?.name ?? null,
        email: user?.email ?? session?.user?.email ?? null,
        image: user?.image ?? session?.user?.image ?? null,
        signature: user?.signature ?? null,
        monthlySummaryEmailEnabled: user?.monthlySummaryEmailEnabled ?? true,
      }}
    />
  );
}
