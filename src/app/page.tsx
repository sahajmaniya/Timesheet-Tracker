import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  GraduationCap,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { PreviewCard } from "@/components/landing/preview-card";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "SA & ISA Timesheet Tracker | Punch In/Out + CSV Export",
  description:
    "PunchPilot is a modern SA/ISA timesheet tracker for punch in/out, monthly totals, CSV export, and PDF-ready output.",
  keywords: [
    "timesheet tracker",
    "punch in punch out app",
    "student assistant timesheet",
    "monthly timesheet export",
    "role-based timesheet",
    "timesheet pdf generator",
  ],
  category: "business",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "PunchPilot | Timesheet Tracker",
    description:
      "Track work hours with punch in/out, role-based timesheets, and export-ready monthly output.",
    url: siteConfig.url,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "PunchPilot timesheet tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PunchPilot | Timesheet Tracker",
    description:
      "Track work hours with punch in/out, role-based timesheets, and export-ready monthly output.",
    images: ["/og-image.svg"],
  },
};

const features = [
  {
    icon: Clock3,
    title: "Fast Daily Tracking",
    description: "Log punch-in, punch-out, and breaks in one clean flow.",
  },
  {
    icon: Users,
    title: "Role-Based Timesheets",
    description: "Switch layouts for SA and ISA workflows.",
  },
  {
    icon: CalendarRange,
    title: "Monthly Clarity",
    description: "Auto totals and summaries for fast month-end review.",
  },
  {
    icon: Download,
    title: "CSV + PDF Ready",
    description: "Generate output formats your department actually needs.",
  },
];

const workflowSteps = [
  {
    title: "Create account",
    description: "Sign up once and choose your role-based workflow.",
  },
  {
    title: "Track entries",
    description: "Capture time, breaks, and notes with built-in validations.",
  },
  {
    title: "Generate output",
    description: "Download monthly CSV/PDF-ready data for submission.",
  },
];

const trustStats = [
  { label: "Entry Time", value: "< 30 sec" },
  { label: "Export Time", value: "1-click CSV" },
  { label: "Layout Modes", value: "SA / ISA" },
  { label: "Device Support", value: "Mobile + Desktop" },
];

const onboardingChecklist = [
  "Create account and set your role",
  "Add your first week of entries",
  "Review monthly totals",
  "Export final output for submission",
];

const audienceGroups = [
  {
    icon: GraduationCap,
    title: "Students",
    description: "Log shifts quickly between classes and keep records ready for monthly submission.",
  },
  {
    icon: ClipboardCheck,
    title: "Supervisors",
    description: "Review entries, verify consistency, and reduce back-and-forth during approvals.",
  },
  {
    icon: Building2,
    title: "Payroll / Admin",
    description: "Get cleaner exports with fewer formatting and alignment corrections at month-end.",
  },
];

const faqs = [
  {
    q: "Can I use different timesheet layouts by role?",
    a: "Yes. PunchPilot supports role-based generation so SA and ISA workflows can differ cleanly.",
  },
  {
    q: "Does this work on mobile?",
    a: "Yes. The app is responsive and optimized for phone, tablet, and desktop screens.",
  },
  {
    q: "Can I export monthly data?",
    a: "Yes. You can export monthly entries to CSV and generate PDF output from tracked records.",
  },
];

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
      "A modern timesheet tracker for punch in/out, role-based layouts, monthly totals, and CSV export.",
    url: siteConfig.url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.svg`,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main className="relative min-h-screen scroll-smooth overflow-x-clip bg-[radial-gradient(circle_at_10%_12%,rgba(56,189,248,0.22),transparent_32%),radial-gradient(circle_at_90%_2%,rgba(20,184,166,0.2),transparent_30%),linear-gradient(145deg,#f8fbff_0%,#f5f9ff_45%,#f8fffb_100%)] pb-20 dark:bg-[radial-gradient(circle_at_10%_12%,rgba(14,116,144,0.35),transparent_32%),radial-gradient(circle_at_90%_2%,rgba(13,148,136,0.28),transparent_30%),linear-gradient(145deg,#0a1324_0%,#101827_45%,#0b1621_100%)] sm:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-60 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <LandingNavbar />

      <section id="top" className="scroll-mt-28 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-10 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-14 lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/55 bg-cyan-100/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-950 dark:border-cyan-400/60 dark:bg-cyan-900/45 dark:text-cyan-50">
            <ShieldCheck className="h-3.5 w-3.5" />
            Role-Based Timesheet Platform
          </p>

          <h1 className="mt-5 max-w-2xl text-balance text-4xl font-black leading-[1.03] tracking-[-0.02em] text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
            Modern Timesheet Tracking
            <span className="block bg-linear-to-r from-cyan-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
              Built For Real Department Work
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
            PunchPilot gives your department a cleaner way to track hours, apply role-specific templates, and generate submission-ready output.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }), "h-11 w-full px-6 text-sm font-semibold sm:w-auto")}>
              Create Account
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full px-6 text-sm font-semibold sm:w-auto")}>
              Sign In
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <p className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              SA / ISA role support
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              CSV and PDF generation
            </p>
            <p className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
              Mobile-ready UX
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_24px_44px_-30px_rgba(8,47,73,0.5)] dark:border-slate-700 dark:bg-slate-900/75">
          <Image
            src="/hero-dashboard-light.png"
            alt="PunchPilot dashboard preview"
            width={1200}
            height={630}
            className="h-auto w-full rounded-2xl border border-border/70 dark:hidden"
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
          <Image
            src="/hero-dashboard.png"
            alt="PunchPilot dashboard preview dark"
            width={1200}
            height={630}
            className="hidden h-auto w-full rounded-2xl border border-border/70 dark:block"
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
        </div>
      </section>

      <RevealOnScroll delayMs={40}>
        <section aria-label="Trust indicators" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {trustStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-black tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      <div aria-hidden className="mx-auto h-px w-full max-w-6xl bg-linear-to-r from-transparent via-border/80 to-transparent px-4 sm:px-6 lg:px-8" />

      <RevealOnScroll delayMs={60}>
        <section id="features" className="scroll-mt-28 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Features</p>
            <h2 className="mt-2 text-balance text-3xl font-black leading-tight tracking-[-0.015em] sm:text-4xl">Everything your team needs in one workflow</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-border/70 bg-background/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:shadow-none"
              >
                <feature.icon className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                <h3 className="mt-2 text-base font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={80}>
        <section aria-label="Who uses PunchPilot" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="rounded-3xl border border-cyan-300/45 bg-linear-to-br from-cyan-100/85 via-background to-emerald-100/65 p-6 dark:border-cyan-800/55 dark:from-cyan-950/35 dark:via-background dark:to-emerald-950/25">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Who It&apos;s For</p>
              <h2 className="mt-2 text-balance text-3xl font-black leading-tight tracking-[-0.015em] sm:text-4xl">
                Built for every role in the timesheet workflow
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
                PunchPilot is designed to support the full chain from daily logging to supervisor verification and payroll-ready output.
              </p>
            </div>

            <div className="space-y-3">
              {audienceGroups.map((group, index) => (
                <article
                  key={group.title}
                  className="rounded-2xl border border-border/70 bg-card/80 p-5 transition-all duration-300 hover:border-cyan-300/45 hover:shadow-[0_16px_30px_-24px_rgba(8,47,73,0.7)] motion-reduce:transition-none motion-reduce:hover:shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <group.icon className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
                      <h3 className="mt-2 text-base font-semibold tracking-tight">{group.title}</h3>
                    </div>
                    <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <div aria-hidden className="mx-auto h-px w-full max-w-6xl bg-linear-to-r from-transparent via-border/80 to-transparent px-4 sm:px-6 lg:px-8" />

      <RevealOnScroll delayMs={100}>
        <section id="workflow" className="scroll-mt-28 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-5">
            <div className="rounded-3xl border border-cyan-300/35 bg-linear-to-br from-cyan-100/50 via-background/90 to-background/80 p-6 dark:border-cyan-800/45 dark:from-cyan-950/20 dark:via-background/85 dark:to-background/80">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">How It Works</p>
              <div className="relative mt-5 space-y-4">
                <div className="absolute left-3.5 top-1 h-[calc(100%-8px)] w-px bg-linear-to-b from-cyan-400/50 to-cyan-400/5 dark:from-cyan-500/45 dark:to-cyan-500/10" />
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="relative flex items-start gap-3 rounded-2xl border border-border/60 bg-card/70 p-3.5 transition-all duration-300 hover:border-cyan-300/50 hover:shadow-[0_14px_28px_-24px_rgba(8,47,73,0.8)] motion-reduce:transition-none motion-reduce:hover:shadow-none"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300 bg-cyan-100 text-xs font-black text-cyan-900 shadow-[0_8px_16px_-12px_rgba(8,47,73,0.8)] dark:border-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-100">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold tracking-tight">{step.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-300/35 bg-linear-to-br from-emerald-100/45 via-card/80 to-background p-6 dark:border-emerald-800/45 dark:from-emerald-950/20 dark:via-card/80 dark:to-background">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-100">
                <Rocket className="h-3.5 w-3.5" />
                Start in 60 Seconds
              </p>
              <div className="mt-4 rounded-xl border border-border/60 bg-background/75 p-3.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Quick-start progress</span>
                  <span>4/4</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className="h-2 w-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500" />
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {onboardingChecklist.map((item) => (
                  <li key={item} className="inline-flex w-full items-start gap-2 rounded-lg bg-background/55 px-2.5 py-1.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "mt-4 h-10 w-full bg-linear-to-r from-emerald-600 to-cyan-600 text-sm font-semibold text-white hover:from-emerald-500 hover:to-cyan-500",
                )}
              >
                Start Setup
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={120}>
        <section id="preview" className="scroll-mt-28 mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
            <h2 className="mt-2 text-balance text-3xl font-black leading-tight tracking-[-0.015em] sm:text-4xl">See PunchPilot in action</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              From daily entry tracking to monthly reporting, these snapshots show how quickly teams move from logging to submission.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:items-start lg:gap-5">
            <PreviewCard
              lightSrc="/preview-entries-light.png"
              darkSrc="/preview-entries.png"
              lightAlt="Timesheet entries view (light theme)"
              darkAlt="Timesheet entries view (dark theme)"
              title="Entries timeline view"
              description="Review daily rows with in/out time, breaks, and worked-hour totals."
            />
            <PreviewCard
              lightSrc="/preview-pdf-output-light.png"
              darkSrc="/preview-pdf-output.png"
              lightAlt="Generated timesheet PDF output preview (light theme)"
              darkAlt="Generated timesheet PDF output preview (dark theme)"
              title="Dashboard summary view"
              description="Track monthly totals, progress indicators, and activity patterns in one place."
            />
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={130}>
        <section aria-label="Security and privacy" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50/75 p-5 dark:border-emerald-800/70 dark:bg-emerald-950/25 sm:p-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/55 bg-emerald-100/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-950 dark:border-emerald-600/70 dark:bg-emerald-900/45 dark:text-emerald-50">
              <ShieldCheck className="h-3.5 w-3.5" />
              Security & Privacy
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
              Each account accesses only its own timesheet data through authenticated routes. Exports are generated on-demand from your entries, helping keep submissions accurate and private.
            </p>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={150}>
        <section id="faq" className="scroll-mt-28 mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-indigo-300/40 bg-linear-to-br from-indigo-100/70 via-background/95 to-cyan-100/55 p-6 dark:border-indigo-800/45 dark:from-indigo-950/25 dark:via-background/85 dark:to-cyan-950/20 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
              <h2 className="mt-2 text-balance text-3xl font-black leading-tight tracking-[-0.015em] sm:text-4xl">Answers for teams moving fast</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Common questions about layouts, exports, and mobile use so you can launch your workflow confidently.
              </p>
              <Link
                href="/auth/signup"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "mt-5 h-10 bg-linear-to-r from-cyan-600 to-indigo-600 px-5 text-sm font-semibold text-white hover:from-cyan-500 hover:to-indigo-500",
                )}
              >
                Get Started
              </Link>
            </div>

            <div className="space-y-3">
              {faqs.map((item, index) => (
                <details
                  key={item.q}
                  className="group overflow-hidden rounded-2xl border border-border/70 bg-card/85 transition-all duration-300 open:border-cyan-300/50 open:shadow-[0_16px_28px_-24px_rgba(8,47,73,0.8)]"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-4 sm:px-5">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300 bg-cyan-100 text-[11px] font-black text-cyan-900 dark:border-cyan-700 dark:bg-cyan-900/35 dark:text-cyan-100">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-base font-semibold tracking-tight">{item.q}</span>
                    <span className="rounded-full border border-border/70 bg-background/65 p-1.5 text-muted-foreground transition-transform group-open:rotate-180">
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </summary>
                  <div className="px-4 pb-4 sm:px-5">
                    <div className="ml-9 border-l border-border/70 pl-4">
                      <p className="text-sm leading-6 text-muted-foreground">{item.a}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <RevealOnScroll delayMs={170}>
        <footer className="mx-auto w-full max-w-6xl px-4 pb-28 sm:px-6 md:pb-10 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-card via-card/90 to-cyan-50/35 p-6 shadow-[0_24px_40px_-30px_rgba(8,47,73,0.65)] dark:from-slate-900/85 dark:via-slate-900/80 dark:to-cyan-950/20 sm:p-7">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 top-0 h-24 w-24 rounded-full bg-cyan-300/30 blur-2xl dark:bg-cyan-600/25" />
              <div className="absolute -right-12 bottom-0 h-24 w-24 rounded-full bg-emerald-300/25 blur-2xl dark:bg-emerald-600/20" />
            </div>

            <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-black tracking-tight">
                  <Image src="/punchpilot-logo.svg" alt="PunchPilot logo" width={18} height={18} />
                  PunchPilot
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Role-based timesheet tracking for students, supervisors, and payroll teams with cleaner exports and faster month-end submission.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Navigate</p>
                  <a href="#features" className="block text-muted-foreground hover:text-foreground">Product</a>
                  <a href="#workflow" className="block text-muted-foreground hover:text-foreground">Workflow</a>
                  <a href="#preview" className="block text-muted-foreground hover:text-foreground">Preview</a>
                  <a href="#faq" className="block text-muted-foreground hover:text-foreground">FAQ</a>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Account</p>
                  <Link href="/auth/signin" className="block text-muted-foreground hover:text-foreground">Sign In</Link>
                  <Link href="/auth/signup" className="block text-muted-foreground hover:text-foreground">Create Account</Link>
                </div>
              </div>
            </div>

            <div className="relative mt-6 flex flex-col gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} PunchPilot. All rights reserved.</p>
              <p>Built for reliable monthly timesheet submission.</p>
            </div>
          </div>
        </footer>
      </RevealOnScroll>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-md items-center gap-2">
          <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }), "h-10 flex-1 text-sm")}>
            Sign In
          </Link>
          <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }), "h-10 flex-1 text-sm")}>
            Start Free
          </Link>
        </div>
      </div>
    </main>
  );
}
