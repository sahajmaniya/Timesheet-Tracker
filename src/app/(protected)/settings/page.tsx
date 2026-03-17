import { getServerAuthSession } from "@/lib/auth";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";

export default async function SettingsPage() {
  const session = await getServerAuthSession();

  return (
    <ProfileSettingsForm
      initialProfile={{
        name: session?.user?.name ?? null,
        email: session?.user?.email ?? null,
        image: session?.user?.image ?? null,
      }}
    />
  );
}
