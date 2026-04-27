import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Monthly Timesheet CSV Export",
  description:
    "Create accurate monthly timesheet summaries and export CSV files with PunchPilot.",
  alternates: { canonical: "/monthly-timesheet-csv-export" },
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
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-white/75 p-6 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10 dark:bg-slate-900/65">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Export</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Monthly Timesheet CSV Export</h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          PunchPilot helps you close each month faster with accurate totals and one-click CSV export.
          Instead of manually summing spreadsheets, you keep daily logs and let the app generate clean monthly output.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background/80 p-4">
            <h2 className="text-lg font-semibold">What’s in the export</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Date, punch in/out, break timeline, break minutes, worked minutes, and decimal-hour totals.
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <h2 className="text-lg font-semibold">Why it helps</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Faster monthly submission, fewer calculation mistakes, and easy record keeping.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
            Create Account
          </Link>
          <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign In
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Related pages:{" "}
          <Link className="underline underline-offset-4" href="/punch-in-punch-out-web-app">
            punch in punch out web app
          </Link>{" "}
          and{" "}
          <Link className="underline underline-offset-4" href="/student-assistant-timesheet-tracker">
            timesheet tracker guide
          </Link>
          .
        </p>

      </section>
    </main>
  );
}
