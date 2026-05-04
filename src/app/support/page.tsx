import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleHelp, Clock3, FileSpreadsheet, FileUp, LifeBuoy, MessageSquareText } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { SupportQueryForm } from "@/components/support/support-query-form";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { resolveSupportEmail } from "@/lib/support-email";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "PunchPilot Support",
  description:
    "Get support for PunchPilot with guided issue reporting, faster troubleshooting, and direct email delivery to support.",
  keywords: [
    "punchpilot support",
    "timesheet app support",
    "csv export support",
    "timesheet troubleshooting",
  ],
  category: "business",
  alternates: { canonical: "/support" },
  openGraph: {
    title: "PunchPilot Support",
    description:
      "Get support for PunchPilot with guided issue reporting, faster troubleshooting, and direct email delivery to support.",
    url: `${siteConfig.url}/support`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "PunchPilot support" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PunchPilot Support",
    description:
      "Get support for PunchPilot with guided issue reporting, faster troubleshooting, and direct email delivery to support.",
    images: ["/og-image.svg"],
  },
};

const lanes = [
  {
    icon: FileUp,
    title: "Import Issues",
    desc: "Excel column mismatch, date parsing, and failed import flows.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export & PDF",
    desc: "CSV output checks, mapped fields, and PDF alignment troubleshooting.",
  },
  {
    icon: MessageSquareText,
    title: "Account & Access",
    desc: "Sign-in challenge, password reset, profile access, and permissions.",
  },
];

const steps = [
  "Share role + month + issue summary",
  "Add exact error text or screenshot context",
  "Receive support response in your email thread",
];

export default function SupportPage() {
  const supportEmail = resolveSupportEmail(
    process.env.SUPPORT_INBOX ||
      process.env.SMTP_USER ||
      "support@punchpilot.online",
  );

  const supportJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "PunchPilot Support",
    url: `${siteConfig.url}/support`,
    description:
      "Get support for PunchPilot with guided issue reporting, faster troubleshooting, and direct email delivery to support.",
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_4%_10%,rgba(56,189,248,0.26),transparent_33%),radial-gradient(circle_at_94%_8%,rgba(20,184,166,0.24),transparent_30%),linear-gradient(145deg,#f7fbff_0%,#f5f8ff_52%,#f8fffb_100%)] pb-16 dark:bg-[radial-gradient(circle_at_4%_10%,rgba(14,116,144,0.35),transparent_33%),radial-gradient(circle_at_94%_8%,rgba(13,148,136,0.3),transparent_30%),linear-gradient(145deg,#091426_0%,#111827_52%,#091a27_100%)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(supportJsonLd) }} />
      <LandingNavbar mode="subpage" />

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pt-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pt-16">
        <aside className="space-y-5">
          <div className="rounded-3xl border border-cyan-300/50 bg-white/75 p-6 backdrop-blur-xl dark:border-cyan-900/55 dark:bg-slate-900/65 sm:p-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/45 bg-cyan-100/85 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-100">
              <LifeBuoy className="h-3.5 w-3.5" />
              Support Desk
            </p>
            <h1 className="mt-4 text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-slate-900 sm:text-5xl dark:text-slate-50">
              Let’s solve your issue in
              {" "}
              <span className="bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
                one clean thread
              </span>
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
              Submit details once and our team receives a structured support email with everything needed to help quickly.
            </p>

            <div className="mt-6 space-y-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-500/45 bg-cyan-100/75 text-xs font-bold text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            {lanes.map((lane) => (
              <article
                key={lane.title}
                className="rounded-2xl border border-white/65 bg-gradient-to-r from-white/90 to-cyan-50/65 p-4 shadow-[0_12px_30px_-24px_rgba(8,47,73,0.5)] dark:border-slate-800 dark:from-slate-900/75 dark:to-cyan-950/25"
              >
                <div className="flex items-center gap-2">
                  <lane.icon className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">{lane.title}</h2>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{lane.desc}</p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-300/45 bg-gradient-to-r from-emerald-100/60 via-background/90 to-cyan-100/45 p-4 dark:border-emerald-800/45 dark:from-emerald-950/20 dark:to-cyan-950/20">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-200">
              <Clock3 className="h-3.5 w-3.5" />
              Response Window
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Typical first response: within 1 business day.</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Direct email:
              {" "}
              <a className="font-semibold text-emerald-700 underline decoration-dotted underline-offset-4 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
            </p>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-cyan-100/70 via-white/90 to-emerald-100/60 p-4 dark:border-cyan-800/45 dark:from-cyan-950/28 dark:via-slate-900/82 dark:to-emerald-950/24">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <CircleHelp className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              Create Support Request
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              The form sends your request to support inbox and keeps your email as reply target.
            </p>
          </div>

          <SupportQueryForm />

          <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full")}>
            Prefer direct contact options?
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
