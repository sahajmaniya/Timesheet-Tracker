import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, FileSpreadsheet, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "SA Timesheet Tracker Guide",
  description:
    "Student Assistant timesheet tracker guide for daily punch in/out, break logging, monthly totals, and CSV export.",
  keywords: [
    "student assistant timesheet tracker",
    "SA timesheet guide",
    "punch in punch out student assistant",
    "monthly timesheet export",
  ],
  category: "business",
  alternates: { canonical: "/student-assistant-timesheet-tracker" },
  openGraph: {
    title: "SA Timesheet Tracker Guide | PunchPilot",
    description:
      "Student Assistant timesheet tracker guide for daily punch in/out, break logging, monthly totals, and CSV export.",
    url: `${siteConfig.url}/student-assistant-timesheet-tracker`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Student assistant timesheet tracker guide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SA Timesheet Tracker Guide | PunchPilot",
    description:
      "Student Assistant timesheet tracker guide for daily punch in/out, break logging, monthly totals, and CSV export.",
    images: ["/og-image.svg"],
  },
};

export default function StudentAssistantTimesheetPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I track daily work hours?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use PunchPilot to log punch in and punch out times, add breaks, and keep notes for each day.",
        },
      },
      {
        "@type": "Question",
        name: "Can I export monthly timesheets?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. PunchPilot provides monthly totals and CSV export for easy timesheet submission.",
        },
      },
      {
        "@type": "Question",
        name: "Is the timesheet data private per user?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Each account only sees its own records, with authenticated protected routes.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_8%_8%,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_90%_6%,rgba(20,184,166,0.22),transparent_30%),linear-gradient(145deg,#f8fbff_0%,#f4f8ff_48%,#f8fffb_100%)] pb-16 dark:bg-[radial-gradient(circle_at_8%_8%,rgba(14,116,144,0.35),transparent_34%),radial-gradient(circle_at_90%_6%,rgba(13,148,136,0.28),transparent_30%),linear-gradient(145deg,#0a1324_0%,#111827_48%,#0a1623_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <LandingNavbar mode="subpage" />
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="rounded-3xl border border-cyan-300/45 bg-white/75 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-cyan-900/45 dark:bg-slate-900/65 sm:p-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/45 bg-cyan-100/85 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/35 dark:text-cyan-100">
            <GraduationCap className="h-3.5 w-3.5" />
            SA Timesheet Guide
          </p>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-slate-900 sm:text-5xl dark:text-slate-50">
            Student Assistant tracking that feels
            {" "}
            <span className="bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
              clear, fast, and accurate
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
            Track daily in/out times, breaks, and notes without spreadsheet overhead. PunchPilot keeps your monthly output tidy and submission-ready.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-cyan-50/70 p-4 dark:border-cyan-800/35 dark:from-slate-900/80 dark:to-cyan-950/25">
              <Clock3 className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              <h2 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">Daily Shift Clarity</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Punch in/out and break logs mapped cleanly by day.</p>
            </article>
            <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-sky-50/70 p-4 dark:border-cyan-800/35 dark:from-slate-900/80 dark:to-sky-950/25">
              <FileSpreadsheet className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              <h2 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">Monthly Export Ready</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Generate CSV summaries without manual recalculation.</p>
            </article>
            <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-emerald-50/70 p-4 dark:border-cyan-800/35 dark:from-slate-900/80 dark:to-emerald-950/25">
              <ShieldCheck className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              <h2 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">Private By Account</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Each user works only with their own data.</p>
            </article>
          </div>

          <div className="mt-7 rounded-2xl border border-emerald-300/45 bg-gradient-to-r from-emerald-100/60 via-background/90 to-cyan-100/45 p-4 dark:border-emerald-800/45 dark:from-emerald-950/20 dark:to-cyan-950/20">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Recommended Flow
            </p>
            <ul className="mt-2 space-y-1.5">
              {["Log entries daily", "Review totals weekly", "Export at month-end"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
              Create Free Account
            </Link>
            <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }))}>
              Sign In
            </Link>
            <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
              Back to Home
            </Link>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
