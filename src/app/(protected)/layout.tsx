import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { getServerAuthSession } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 md:px-6">{children}</main>
    </div>
  );
}
