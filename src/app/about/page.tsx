import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BarChart3, Download, FileSpreadsheet, ShieldCheck, TimerReset, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About PunchPilot",
  description:
    "Learn about PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About PunchPilot",
    description:
      "Learn about PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
    url: `${siteConfig.url}/about`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "About PunchPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About PunchPilot",
    description:
      "Learn about PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
    images: ["/og-image.svg"],
  },
};

export default function AboutPage() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About PunchPilot",
    url: `${siteConfig.url}/about`,
    description:
      "About PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <header className="mx-auto mb-5 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/55 bg-white/80 px-3 py-2 shadow-[0_12px_28px_-22px_rgba(2,6,23,0.75)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/75">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
          <Image src="/punchpilot-logo.svg" alt="PunchPilot" width={30} height={30} priority />
          <span className="text-sm font-black tracking-tight">PunchPilot</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 border-slate-300/80 bg-white px-4 text-sm dark:border-slate-700 dark:bg-slate-900",
            )}
          >
            Home
          </Link>
          <Link
            href="/auth/signin"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "hidden h-9 border-slate-300/80 bg-white px-4 text-sm sm:inline-flex dark:border-slate-700 dark:bg-slate-900",
            )}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-9 bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 text-sm text-white hover:from-cyan-500 hover:to-emerald-500",
            )}
          >
            Start Free
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-white/90 via-cyan-50/75 to-sky-100/60 p-6 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10 dark:border-cyan-800/45 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-cyan-950/35">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800 transition-colors hover:text-cyan-700 dark:text-cyan-200 dark:hover:text-cyan-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back To Home
          </Link>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-100/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-100">
            <Users className="h-3.5 w-3.5" />
            About PunchPilot
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold tracking-tight sm:text-5xl">
            Built for teams that need clean timesheets without spreadsheet chaos
          </h1>
          <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
            PunchPilot is a practical SA/ISA-focused timesheet platform for daily logging, monthly review, and export-ready submission.
            From punch in/out to final PDF and CSV output, everything is designed to reduce manual effort and errors.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Role Support</p>
              <p className="mt-1 text-lg font-black tracking-tight">SA + ISA</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Exports</p>
              <p className="mt-1 text-lg font-black tracking-tight">CSV + Filled PDF</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Workflows</p>
              <p className="mt-1 text-lg font-black tracking-tight">Import + Review + Submit</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border/70 bg-background/75 p-5">
            <TimerReset className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Fast Daily Tracking</h2>
            <p className="mt-1 text-sm text-muted-foreground">Log punch in/out and breaks in one clean flow with built-in checks.</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background/75 p-5">
            <BarChart3 className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Monthly Clarity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review totals, progress, and validations before final submission.</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background/75 p-5">
            <Download className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Export Ready</h2>
            <p className="mt-1 text-sm text-muted-foreground">Generate payroll-friendly CSV and role-aware filled PDF output.</p>
          </article>
          <article className="rounded-2xl border border-border/70 bg-background/75 p-5">
            <ShieldCheck className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Secure by Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Each user sees only their own data through authenticated access.</p>
          </article>
        </div>

        <div className="rounded-3xl border border-indigo-300/40 bg-linear-to-br from-indigo-100/60 via-background/90 to-cyan-100/45 p-6 dark:border-indigo-800/45 dark:from-indigo-950/25 dark:to-cyan-950/20 sm:p-8">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-indigo-700 dark:text-indigo-300" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">How teams use PunchPilot</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                Teams import previous data, track daily entries, run validations, and export final files for month-end submission.
                This reduces back-and-forth and keeps timesheet processing consistent.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
              Create Account
            </Link>
            <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }))}>
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
