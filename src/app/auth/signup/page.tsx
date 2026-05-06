import type { Metadata } from "next";
import { BadgeCheck, CalendarClock, FileSpreadsheet, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/signup-form";
import { MarketingFooter } from "@/components/layout/marketing-footer";
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
    <main className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.25),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(79,70,229,0.18),transparent_34%),linear-gradient(145deg,#f8fbff_0%,#f4f8ff_48%,#f9fffe_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_8%_8%,rgba(14,116,144,0.35),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(67,56,202,0.25),transparent_34%),linear-gradient(145deg,#0a1324_0%,#111827_48%,#0a1623_100%)] sm:py-14">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[12%] h-40 w-40 rounded-full border border-cyan-300/40 bg-cyan-300/25 blur-3xl dark:border-cyan-600/35 dark:bg-cyan-500/20" />
        <div className="absolute right-[7%] top-[8%] h-44 w-44 rounded-full border border-indigo-300/40 bg-indigo-300/20 blur-3xl dark:border-indigo-600/35 dark:bg-indigo-500/20" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-7 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/45 bg-cyan-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-500/15 dark:text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            New Account
          </p>
          <h1 className="max-w-xl text-balance text-3xl font-black leading-tight tracking-[-0.015em] text-slate-900 sm:text-5xl dark:text-slate-50">
            Create your
            {" "}
            <span className="bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
              PunchPilot workspace
            </span>
          </h1>
          <p className="max-w-lg text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
            Set up your account once and start managing daily entries, monthly totals, and export-ready timesheets with a cleaner workflow.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/85 to-cyan-50/60 p-4 text-sm text-slate-700 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-cyan-950/20 dark:text-slate-200">
              <CalendarClock className="mb-2 h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              Daily punch flow
            </div>
            <div className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/85 to-sky-50/60 p-4 text-sm text-slate-700 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-sky-950/20 dark:text-slate-200">
              <FileSpreadsheet className="mb-2 h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              CSV + Excel import
            </div>
            <div className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/85 to-emerald-50/60 p-4 text-sm text-slate-700 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-emerald-950/20 dark:text-slate-200">
              <BadgeCheck className="mb-2 h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              Protected account
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-md rounded-3xl border border-border/70 bg-white/65 p-2 shadow-[0_30px_55px_-42px_rgba(2,6,23,0.85)] backdrop-blur dark:bg-slate-900/45">
            <SignUpForm />
          </div>
        </section>
      </div>
      <MarketingFooter className="mt-14 lg:mt-16" />
    </main>
  );
}
