import type { Metadata } from "next";
import { BadgeCheck, CalendarClock, FileSpreadsheet } from "lucide-react";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/signup-form";
import { getServerAuthSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your PunchPilot account to start tracking work hours.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignUpPage() {
  const session = await getServerAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-100/60 via-background to-sky-100/60 px-4 py-10 sm:py-16 dark:from-emerald-950/30 dark:via-background dark:to-sky-950/30">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="order-2 space-y-5 lg:order-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">New Account</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create your timesheet profile.</h1>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            Get a modern workspace for shift tracking, break logging, and monthly timesheet exports.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card/70 p-3 text-sm"><CalendarClock className="mb-1 h-4 w-4 text-primary" />Daily punch flow</div>
            <div className="rounded-xl border bg-card/70 p-3 text-sm"><FileSpreadsheet className="mb-1 h-4 w-4 text-primary" />CSV + Excel import</div>
            <div className="rounded-xl border bg-card/70 p-3 text-sm"><BadgeCheck className="mb-1 h-4 w-4 text-primary" />Protected account</div>
          </div>
        </section>

        <section className="order-1 lg:order-2">
          <div className="mx-auto w-full max-w-md">
            <SignUpForm />
          </div>
        </section>
      </div>
    </main>
  );
}
