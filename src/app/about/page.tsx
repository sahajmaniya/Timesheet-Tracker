import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About PunchPilot",
  description:
    "Learn about PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
  keywords: [
    "about punchpilot",
    "timesheet tracker platform",
    "SA ISA timesheet workflow",
  ],
  category: "business",
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
    <main className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.26),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(16,185,129,0.2),transparent_34%),linear-gradient(145deg,#f8fbff_0%,#f4f8ff_48%,#f9fffe_100%)] pb-12 dark:bg-[radial-gradient(circle_at_8%_8%,rgba(14,116,144,0.38),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(5,150,105,0.24),transparent_34%),linear-gradient(145deg,#0a1324_0%,#111827_48%,#0a1623_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[12%] h-44 w-44 rounded-full border border-cyan-300/35 bg-cyan-300/20 blur-3xl dark:border-cyan-700/35 dark:bg-cyan-500/20" />
        <div className="absolute right-[6%] top-[10%] h-40 w-40 rounded-full border border-emerald-300/35 bg-emerald-300/20 blur-3xl dark:border-emerald-700/35 dark:bg-emerald-500/20" />
      </div>

      <LandingNavbar mode="subpage" />

      <section className="relative mx-auto max-w-6xl space-y-5 px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-white/90 via-cyan-50/75 to-sky-100/60 p-6 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10 dark:border-cyan-800/45 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-cyan-950/35">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-cyan-300/30 bg-cyan-300/15 blur-2xl dark:border-cyan-700/30 dark:bg-cyan-500/20" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full border border-emerald-300/30 bg-emerald-300/15 blur-2xl dark:border-emerald-700/30 dark:bg-emerald-500/20" />

          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-100/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            About PunchPilot
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-[-0.015em] text-slate-900 sm:text-5xl dark:text-slate-50">
            Built for teams that need
            {" "}
            <span className="bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
              clean timesheets
            </span>
            {" "}
            without spreadsheet chaos
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            PunchPilot is a practical SA/ISA-focused timesheet platform for daily logging, monthly review, and export-ready submission.
            From punch in/out to final PDF and CSV output, everything is designed to reduce manual effort and errors.
          </p>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-cyan-300/45 bg-gradient-to-br from-white/95 to-cyan-50/80 p-4 shadow-[0_12px_24px_-18px_rgba(8,47,73,0.55)] dark:border-cyan-700/45 dark:bg-gradient-to-br dark:from-cyan-950/40 dark:to-slate-900/70">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Role Support</p>
              <p className="mt-1 text-lg font-black tracking-tight">SA + ISA</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/45 bg-gradient-to-br from-white/95 to-sky-50/80 p-4 shadow-[0_12px_24px_-18px_rgba(8,47,73,0.55)] dark:border-cyan-700/45 dark:bg-gradient-to-br dark:from-sky-950/35 dark:to-slate-900/70">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Exports</p>
              <p className="mt-1 text-lg font-black tracking-tight">CSV + Filled PDF</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/45 bg-gradient-to-br from-white/95 to-emerald-50/80 p-4 shadow-[0_12px_24px_-18px_rgba(8,47,73,0.55)] dark:border-cyan-700/45 dark:bg-gradient-to-br dark:from-emerald-950/35 dark:to-slate-900/70">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Workflows</p>
              <p className="mt-1 text-lg font-black tracking-tight">Import + Review + Submit</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="group rounded-2xl border border-cyan-300/35 bg-gradient-to-br from-white/95 to-cyan-50/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_35px_-28px_rgba(8,47,73,0.7)] dark:border-cyan-800/35 dark:bg-gradient-to-br dark:from-cyan-950/30 dark:to-slate-900/65 dark:hover:shadow-[0_18px_32px_-26px_rgba(14,165,233,0.35)]">
            <TimerReset className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Fast Daily Tracking</h2>
            <p className="mt-1 text-sm text-muted-foreground">Log punch in/out and breaks in one clean flow with built-in checks.</p>
          </article>
          <article className="group rounded-2xl border border-cyan-300/35 bg-gradient-to-br from-white/95 to-sky-50/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_35px_-28px_rgba(8,47,73,0.7)] dark:border-cyan-800/35 dark:bg-gradient-to-br dark:from-sky-950/30 dark:to-slate-900/65 dark:hover:shadow-[0_18px_32px_-26px_rgba(14,165,233,0.35)]">
            <BarChart3 className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Monthly Clarity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review totals, progress, and validations before final submission.</p>
          </article>
          <article className="group rounded-2xl border border-cyan-300/35 bg-gradient-to-br from-white/95 to-indigo-50/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_35px_-28px_rgba(8,47,73,0.7)] dark:border-cyan-800/35 dark:bg-gradient-to-br dark:from-indigo-950/25 dark:to-slate-900/65 dark:hover:shadow-[0_18px_32px_-26px_rgba(14,165,233,0.35)]">
            <Download className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Export Ready</h2>
            <p className="mt-1 text-sm text-muted-foreground">Generate payroll-friendly CSV and role-aware filled PDF output.</p>
          </article>
          <article className="group rounded-2xl border border-cyan-300/35 bg-gradient-to-br from-white/95 to-emerald-50/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_35px_-28px_rgba(8,47,73,0.7)] dark:border-cyan-800/35 dark:bg-gradient-to-br dark:from-emerald-950/25 dark:to-slate-900/65 dark:hover:shadow-[0_18px_32px_-26px_rgba(14,165,233,0.35)]">
            <ShieldCheck className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-base font-semibold tracking-tight">Secure by Account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Each user sees only their own data through authenticated access.</p>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
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

          <aside className="rounded-3xl border border-emerald-300/45 bg-linear-to-br from-emerald-100/60 via-background/90 to-cyan-100/50 p-6 dark:border-emerald-800/45 dark:from-emerald-950/25 dark:to-cyan-950/20 sm:p-8">
            <h2 className="text-lg font-bold tracking-tight">What you get immediately</h2>
            <ul className="mt-4 space-y-2">
              {[
                "Role-aware SA/ISA timesheet workflow",
                "CSV export with totals and break details",
                "Filled PDF generation from monthly entries",
                "Secure auth with OTP and recovery flow",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/support" className={cn(buttonVariants({ variant: "outline" }), "mt-5 h-10 w-full")}>
              Visit Support
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
