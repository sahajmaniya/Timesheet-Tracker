import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Punch In Punch Out Web App",
  description:
    "Use PunchPilot as a punch in punch out web app with break tracking, notes, and automatic worked-hour calculations.",
  alternates: { canonical: "/punch-in-punch-out-web-app" },
};

export default function PunchInOutWebAppPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a punch in punch out web app?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A web app that records shift start and end times so you can track worked hours accurately.",
        },
      },
      {
        "@type": "Question",
        name: "Does PunchPilot support break tracking?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can add one or multiple breaks and worked time is adjusted automatically.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use PunchPilot on mobile?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. PunchPilot is responsive and works on phone, tablet, and desktop screens.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-white/75 p-6 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10 dark:bg-slate-900/65">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Solution</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Punch In Punch Out Web App</h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          PunchPilot gives you a modern punch in punch out workflow with fast daily entries, clean monthly summaries,
          and export tools built for hourly work schedules.
        </p>

        <h2 className="mt-7 text-xl font-bold">Why teams use PunchPilot</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Fast start/end shift actions</li>
          <li>Break start/end capture with validation</li>
          <li>Auto-calculated worked hours and decimal hours</li>
          <li>CSV export for payroll or monthly forms</li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
            Start Tracking
          </Link>
          <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign In
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Need student-focused workflow? Visit{" "}
          <Link className="underline underline-offset-4" href="/student-assistant-timesheet-tracker">
            student assistant timesheet tracker
          </Link>
          .
        </p>

        <p className="mt-4 text-xs text-muted-foreground">Source: {siteConfig.url}</p>
      </section>
    </main>
  );
}

