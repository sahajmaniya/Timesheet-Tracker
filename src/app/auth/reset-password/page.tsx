import type { Metadata } from "next";
import { isAfter } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getServerAuthSession } from "@/lib/auth";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your PunchPilot account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getServerAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const { token } = await searchParams;
  if (!token || token.trim().length < 20) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-100/60 via-background to-indigo-100/60 px-4 py-10 sm:py-16 dark:from-slate-950 dark:via-background dark:to-indigo-950/30">
        <div className="mx-auto max-w-md rounded-xl border bg-background/90 p-6 text-center shadow-xl">
          <h1 className="text-xl font-semibold">Invalid reset link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This reset link is missing or malformed. Request a new one.
          </p>
          <Link className="mt-4 inline-block underline" href="/auth/forgot-password">
            Request new reset link
          </Link>
        </div>
      </main>
    );
  }

  const tokenHash = hashPasswordResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { usedAt: true, expiresAt: true },
  });

  const tokenState = !resetToken
    ? "invalid"
    : resetToken.usedAt
      ? "used"
      : isAfter(new Date(), resetToken.expiresAt)
        ? "expired"
        : "valid";

  if (tokenState !== "valid") {
    const message =
      tokenState === "used"
        ? "This reset link was already used. Request a fresh link to set a new password."
        : tokenState === "expired"
          ? "This reset link has expired. Request a new reset link."
          : "This reset link is invalid. Request a new one.";
    return (
      <main className="min-h-screen bg-gradient-to-br from-sky-100/60 via-background to-indigo-100/60 px-4 py-10 sm:py-16 dark:from-slate-950 dark:via-background dark:to-indigo-950/30">
        <div className="mx-auto max-w-md rounded-xl border bg-background/90 p-6 text-center shadow-xl">
          <h1 className="text-xl font-semibold">
            {tokenState === "used" ? "Link already used" : tokenState === "expired" ? "Link expired" : "Invalid reset link"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Link className="mt-4 inline-block underline" href="/auth/forgot-password">
            Request new reset link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100/60 via-background to-indigo-100/60 px-4 py-10 sm:py-16 dark:from-slate-950 dark:via-background dark:to-indigo-950/30">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
