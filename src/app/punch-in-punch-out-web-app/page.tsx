import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, Smartphone, Sparkles, TimerReset, Zap } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Punch In Punch Out Web App",
  description:
    "Use PunchPilot as a punch in punch out web app with break tracking, shift notes, and automatic worked-hour calculations.",
  keywords: [
    "punch in punch out web app",
    "employee clock in app",
    "timesheet break tracking",
    "worked hours calculator",
  ],
  category: "business",
  alternates: { canonical: "/punch-in-punch-out-web-app" },
  openGraph: {
    title: "Punch In Punch Out Web App | PunchPilot",
    description:
      "Use PunchPilot as a punch in punch out web app with break tracking, notes, and automatic worked-hour calculations.",
    url: `${siteConfig.url}/punch-in-punch-out-web-app`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Punch in punch out web app" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Punch In Punch Out Web App | PunchPilot",
    description:
      "Use PunchPilot as a punch in punch out web app with break tracking, notes, and automatic worked-hour calculations.",
    images: ["/og-image.svg"],
  },
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_6%_10%,rgba(56,189,248,0.24),transparent_33%),radial-gradient(circle_at_93%_5%,rgba(20,184,166,0.23),transparent_31%),linear-gradient(145deg,#f8fbff_0%,#f4f8ff_52%,#f8fffb_100%)] pb-16 dark:bg-[radial-gradient(circle_at_6%_10%,rgba(14,116,144,0.35),transparent_33%),radial-gradient(circle_at_93%_5%,rgba(13,148,136,0.28),transparent_31%),linear-gradient(145deg,#0a1324_0%,#111827_52%,#0a1623_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <LandingNavbar mode="subpage" />
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-3xl border border-cyan-300/45 bg-white/80 p-6 shadow-[0_30px_60px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-cyan-900/45 dark:bg-slate-900/65 sm:p-9">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/45 bg-cyan-100/85 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/35 dark:text-cyan-100">
              <TimerReset className="h-3.5 w-3.5" />
              Punch In/Out App
            </p>
            <h1 className="mt-4 max-w-2xl text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-slate-900 sm:text-5xl dark:text-slate-50">
              Modern clock-in flow for
              {" "}
              <span className="bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
                hourly teams
              </span>
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
              PunchPilot helps your team start shifts fast, log breaks correctly, and end each month with accurate totals.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Fast shift start/end actions",
                "Break capture with validations",
                "Worked-hour + decimal-hour auto-calc",
                "Clean monthly export output",
              ].map((item) => (
                <p key={item} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-white/80 px-3 py-2 text-sm text-slate-700 dark:border-cyan-800/35 dark:bg-slate-900/75 dark:text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  {item}
                </p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
                Start Tracking
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
            <div className="rounded-3xl border border-cyan-300/40 bg-gradient-to-br from-white/90 via-cyan-50/75 to-emerald-50/70 p-6 dark:border-cyan-900/45 dark:from-slate-900/75 dark:via-cyan-950/25 dark:to-emerald-950/20">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-800 dark:text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Best For
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Daily shift operations</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Built for fast entry speed on desktop and mobile for real department workflows.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-sky-50/70 p-4 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-sky-950/25">
                <Clock3 className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">Real-time logging</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Capture exact in/out moments and break windows.</p>
              </article>
              <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-cyan-50/70 p-4 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-cyan-950/25">
                <Smartphone className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">Mobile friendly</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Responsive by default for phones and tablets.</p>
              </article>
              <article className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-emerald-50/70 p-4 dark:border-cyan-800/35 dark:from-slate-900/75 dark:to-emerald-950/25">
                <Zap className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">Quick month-end</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Prepare payroll-ready output in seconds.</p>
              </article>
            </div>
          </aside>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
