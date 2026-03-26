import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, Clock3, Download } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Timesheet Tracker for Punch In/Out",
  description:
    "PunchPilot is a modern timesheet tracker for punch in/out, break tracking, monthly totals, and CSV export.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PunchPilot | Timesheet Tracker",
    description:
      "Track work hours with punch in/out, break logging, and export-ready monthly timesheets.",
    url: siteConfig.url,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "PunchPilot timesheet tracker" }],
  },
};

export default async function HomePage() {
  const session = await getServerAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PunchPilot",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "A modern timesheet tracker for punch in/out, break tracking, monthly totals, and CSV export.",
    url: siteConfig.url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 px-4 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute bottom-8 left-1/3 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/15" />
      </div>

      <section className="relative mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-border/60 bg-white/70 p-6 shadow-[0_30px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10 dark:bg-slate-900/65">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center rounded-full border border-sky-300/50 bg-sky-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-900 dark:border-sky-500/35 dark:bg-sky-500/15 dark:text-sky-100">
              PunchPilot
            </p>

            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
              Timesheets That Feel Fast,
              <span className="block bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-indigo-300">
                Clean, and Stress-Free
              </span>
            </h1>

            <p className="mt-5 text-pretty text-base text-slate-600 sm:text-lg dark:text-slate-300">
              Track punch in/out, breaks, and notes in seconds. Get reliable monthly totals and export-ready CSV files without spreadsheet stress.
            </p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }), "h-11 px-6")}>
                Create Account
              </Link>
              <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }), "h-11 px-6 border-slate-300/80 bg-white/80 text-slate-800 dark:border-border dark:bg-background/80 dark:text-slate-100")}>
                Sign In
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-900/75">
              <Clock3 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Daily Time Logging</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Punch in/out + breaks in one streamlined flow.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-900/75">
              <CalendarRange className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Monthly Clarity</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Totals and averages are calculated automatically.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-white/80 p-4 dark:bg-slate-900/75">
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Export Ready</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Download a clean CSV for timesheet submission.</p>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-border/60 bg-background/65 p-4">
            <p className="text-sm font-semibold">Learn More</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <Link className="underline underline-offset-4 hover:text-foreground" href="/student-assistant-timesheet-tracker">
                General timesheet tracker guide
              </Link>
              <Link className="underline underline-offset-4 hover:text-foreground" href="/punch-in-punch-out-web-app">
                Punch in punch out web app
              </Link>
              <Link className="underline underline-offset-4 hover:text-foreground" href="/monthly-timesheet-csv-export">
                Monthly timesheet CSV export
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
