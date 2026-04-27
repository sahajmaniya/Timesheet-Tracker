import type { Metadata } from "next";
import { BarChart3, CalendarDays, Clock3, Sparkles } from "lucide-react";
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
    <main className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.25),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(79,70,229,0.18),transparent_34%),linear-gradient(145deg,#f8fbff_0%,#f4f8ff_48%,#f9fffe_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_8%_8%,rgba(14,116,144,0.35),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(67,56,202,0.25),transparent_34%),linear-gradient(145deg,#0a1324_0%,#111827_48%,#0a1623_100%)] sm:py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[12%] h-40 w-40 rounded-full border border-cyan-300/40 bg-cyan-300/25 blur-3xl dark:border-cyan-600/35 dark:bg-cyan-500/20" />
        <div className="absolute right-[7%] top-[8%] h-44 w-44 rounded-full border border-indigo-300/40 bg-indigo-300/20 blur-3xl dark:border-indigo-600/35 dark:bg-indigo-500/20" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-7 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/45 bg-cyan-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            PunchPilot
          </p>
          <h1 className="max-w-xl text-balance text-3xl font-black leading-tight tracking-[-0.015em] sm:text-5xl">
            Welcome back to your timesheet workspace
          </h1>
          <p className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
            Sign in, verify with your code, and continue from where you left off with your entries, monthly totals, and exports.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card/75 p-4 text-sm">
              <Clock3 className="mb-2 h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              Fast daily logging
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/75 p-4 text-sm">
              <CalendarDays className="mb-2 h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              Monthly clarity
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/75 p-4 text-sm">
              <BarChart3 className="mb-2 h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              Export-ready totals
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-md rounded-3xl border border-border/70 bg-white/65 p-2 shadow-[0_30px_55px_-42px_rgba(2,6,23,0.85)] backdrop-blur dark:bg-slate-900/45">
            <SignInForm />
          </div>
        </section>
      </div>
    </main>
  );
}
