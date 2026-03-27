import type { Metadata } from "next";
import { BarChart3, CalendarDays, Clock3 } from "lucide-react";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/signin-form";
import { getServerAuthSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to PunchPilot to manage your timesheet entries.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SignInPage() {
  const session = await getServerAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-100/60 via-background to-indigo-100/60 px-4 py-10 sm:py-16 dark:from-slate-950 dark:via-background dark:to-indigo-950/30">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2">
        <section className="order-1 space-y-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">PunchPilot</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back to your timesheet workspace.</h1>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            Log your work, breaks, and notes quickly, then export clean monthly reports.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card/70 p-3 text-sm"><Clock3 className="mb-1 h-4 w-4 text-primary" />Fast daily logging</div>
            <div className="rounded-xl border bg-card/70 p-3 text-sm"><CalendarDays className="mb-1 h-4 w-4 text-primary" />Monthly view</div>
            <div className="rounded-xl border bg-card/70 p-3 text-sm"><BarChart3 className="mb-1 h-4 w-4 text-primary" />Export-ready totals</div>
          </div>
        </section>

        <section className="order-2">
          <div className="mx-auto w-full max-w-md">
            <SignInForm />
          </div>
        </section>
      </div>
    </main>
  );
}
