import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getServerAuthSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your PunchPilot account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ForgotPasswordPage() {
  const session = await getServerAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100/60 via-background to-indigo-100/60 px-4 py-10 sm:py-16 dark:from-slate-950 dark:via-background dark:to-indigo-950/30">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
