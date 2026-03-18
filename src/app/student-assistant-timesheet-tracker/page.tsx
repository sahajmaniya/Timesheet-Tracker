import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Student Assistant Timesheet Tracker",
  description:
    "PunchPilot helps student assistants track punch in/out, breaks, and monthly totals with export-ready timesheets.",
  alternates: { canonical: "/student-assistant-timesheet-tracker" },
};

export default function StudentAssistantTimesheetPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can a student assistant track daily work hours?",
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
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-white/75 p-6 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10 dark:bg-slate-900/65">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Guide</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Student Assistant Timesheet Tracker</h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          PunchPilot is designed for student assistant schedules where you need accurate daily logging and clean monthly reporting.
          You can track punch in/out time, unpaid breaks, and shift notes without jumping between spreadsheets.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background/80 p-4">
            <h2 className="text-lg font-semibold">Daily Shift Tracking</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Record each day in minutes with punch in/out and break windows. Worked duration is auto-calculated.
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <h2 className="text-lg font-semibold">Monthly Submission Ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate monthly totals and download CSV exports to complete assistant timesheets quickly.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
            Create Free Account
          </Link>
          <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign In
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Looking for related tools? See{" "}
          <Link className="underline underline-offset-4" href="/punch-in-punch-out-web-app">
            punch in punch out web app
          </Link>{" "}
          and{" "}
          <Link className="underline underline-offset-4" href="/monthly-timesheet-csv-export">
            monthly timesheet CSV export
          </Link>
          .
        </p>

        <p className="mt-4 text-xs text-muted-foreground">Source: {siteConfig.url}</p>
      </section>
    </main>
  );
}

