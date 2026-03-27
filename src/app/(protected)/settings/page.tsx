import { getServerAuthSession } from "@/lib/auth";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { prisma } from "@/lib/prisma";
import { workScheduleSchema } from "@/lib/validators";
import { DEFAULT_WORK_SCHEDULE } from "@/lib/work-schedule";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <ProfileSettingsForm
        initialProfile={{
          name: session?.user?.name ?? null,
          email: session?.user?.email ?? null,
          image: session?.user?.image ?? null,
          signature: null,
          workSchedule: DEFAULT_WORK_SCHEDULE,
        }}
      />
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      signature: true,
      workScheduleJson: true,
    },
  });

  const parsedSchedule = workScheduleSchema.safeParse(user?.workScheduleJson);

  return (
    <ProfileSettingsForm
      initialProfile={{
        name: user?.name ?? session?.user?.name ?? null,
        email: user?.email ?? session?.user?.email ?? null,
        image: user?.image ?? session?.user?.image ?? null,
        signature: user?.signature ?? null,
        workSchedule: parsedSchedule.success ? parsedSchedule.data : DEFAULT_WORK_SCHEDULE,
      }}
    />
  );
}
