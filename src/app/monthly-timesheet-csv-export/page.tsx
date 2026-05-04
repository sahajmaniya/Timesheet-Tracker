import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Download, FileSpreadsheet, Sparkles, TableProperties } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Monthly Timesheet CSV Export",
  description:
    "Create accurate monthly timesheet summaries and export CSV files with PunchPilot for payroll-ready submission.",
  keywords: [
    "monthly timesheet csv export",
    "timesheet csv download",
    "payroll timesheet export",
    "timesheet monthly summary",
  ],
  category: "business",
  alternates: { canonical: "/monthly-timesheet-csv-export" },
  openGraph: {
    title: "Monthly Timesheet CSV Export | PunchPilot",
    description:
      "Create accurate monthly timesheet summaries and export CSV files with PunchPilot.",
    url: `${siteConfig.url}/monthly-timesheet-csv-export`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Monthly timesheet CSV export" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Monthly Timesheet CSV Export | PunchPilot",
    description:
      "Create accurate monthly timesheet summaries and export CSV files with PunchPilot.",
    images: ["/og-image.svg"],
  },
};

export default function MonthlyTimesheetCsvExportPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I export a monthly timesheet to CSV?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "In PunchPilot, select a month and use the export action to download a CSV file with daily records and totals.",
        },
      },
      {
        "@type": "Question",
        name: "Does CSV export include break and worked durations?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Export includes break details, worked minutes, and decimal-hour summaries.",
        },
      },
      {
        "@type": "Question",
        name: "Can I import old monthly records?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. PunchPilot supports importing previous month records from Excel templates.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_12%,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_92%_6%,rgba(20,184,166,0.24),transparent_31%),linear-gradient(145deg,#f8fbff_0%,#f4f8ff_50%,#f8fffb_100%)] pb-16 dark:bg-[radial-gradient(circle_at_10%_12%,rgba(14,116,144,0.35),transparent_34%),radial-gradient(circle_at_92%_6%,rgba(13,148,136,0.3),transparent_31%),linear-gradient(145deg,#0a1324_0%,#111827_50%,#0a1623_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <LandingNavbar mode="subpage" />
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="rounded-3xl border border-cyan-300/45 bg-white/75 p-6 shadow-[0_30px_62px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-cyan-900/45 dark:bg-slate-900/65 sm:p-10">
          <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/45 bg-cyan-100/85 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/35 dark:text-cyan-100">
                <Download className="h-3.5 w-3.5" />
                Monthly CSV Export
              </p>
              <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-slate-900 sm:text-5xl dark:text-slate-50">
                Close month-end with
                {" "}
                <span className="bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
                  accurate export output
                </span>
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
                Skip manual spreadsheet totals. Track throughout the month and export a structured CSV when you are ready to submit.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[
                  "Date + shift details",
                  "Break timeline and minutes",
                  "Worked minutes and decimal totals",
                  "Consistent monthly summary format",
                ].map((item) => (
                  <p key={item} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-cyan-800/35 dark:bg-slate-900/70 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    {item}
                  </p>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
                  Create Account
                </Link>
                <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }))}>
                  Sign In
                </Link>
                <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                  Back to Home
                </Link>
              </div>
            </div>

            <aside className="space-y-4">
              <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-cyan-50/70 p-5 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-cyan-950/25">
                <FileSpreadsheet className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">What’s inside the export</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Daily in/out rows, break durations, worked minutes, and decimal-hour totals.
                </p>
              </article>
              <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-sky-50/70 p-5 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-sky-950/25">
                <CalendarDays className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">Why it saves time</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Faster monthly submission, cleaner records, fewer formula errors.
                </p>
              </article>
              <article className="rounded-2xl border border-emerald-300/40 bg-gradient-to-r from-emerald-100/60 via-background/90 to-cyan-100/45 p-5 dark:border-emerald-800/45 dark:from-emerald-950/20 dark:to-cyan-950/20">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pro Tip
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  Keep entries updated weekly to make month-end exports almost instant.
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <TableProperties className="h-3.5 w-3.5" />
                  Format is structured for payroll and review workflows.
                </p>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
