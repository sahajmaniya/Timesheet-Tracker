import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircleHeart, Sparkles } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { resolveSupportEmail } from "@/lib/support-email";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact PunchPilot",
  description:
    "Contact PunchPilot for product questions, onboarding help, and workflow support for SA/ISA timesheet teams.",
  keywords: [
    "contact punchpilot",
    "timesheet app contact",
    "timesheet onboarding help",
  ],
  category: "business",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact PunchPilot",
    description:
      "Contact PunchPilot for product questions, onboarding help, and workflow support for SA/ISA timesheet teams.",
    url: `${siteConfig.url}/contact`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Contact PunchPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact PunchPilot",
    description:
      "Contact PunchPilot for product questions, onboarding help, and workflow support for SA/ISA timesheet teams.",
    images: ["/og-image.svg"],
  },
};

export default function ContactPage() {
  const supportEmail = resolveSupportEmail(
    process.env.SUPPORT_INBOX ||
      process.env.SMTP_USER ||
      "support@punchpilot.online",
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_6%_8%,rgba(56,189,248,0.24),transparent_35%),radial-gradient(circle_at_92%_2%,rgba(20,184,166,0.22),transparent_32%),linear-gradient(145deg,#f8fbff_0%,#f4f8ff_50%,#f8fffb_100%)] pb-12 dark:bg-[radial-gradient(circle_at_6%_8%,rgba(14,116,144,0.34),transparent_35%),radial-gradient(circle_at_92%_2%,rgba(13,148,136,0.28),transparent_32%),linear-gradient(145deg,#0a1324_0%,#111827_50%,#0a1623_100%)]">
      <LandingNavbar mode="subpage" />
      <section className="mx-auto mt-12 max-w-4xl rounded-3xl border border-cyan-300/45 bg-white/75 p-6 shadow-[0_30px_65px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-10 lg:mt-16 dark:border-cyan-900/45 dark:bg-slate-900/65">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/45 bg-cyan-100/85 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          Contact
        </p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
          Get in touch with
          {" "}
          <span className="bg-linear-to-r from-cyan-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-emerald-300">
            PunchPilot
          </span>
        </h1>
        <p className="mt-4 text-base text-slate-600 sm:text-lg dark:text-slate-300">
          Need help with onboarding, timesheet templates, or exports? Reach us and we will help you move quickly.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-cyan-50/70 p-4 dark:border-cyan-800/40 dark:from-slate-900/80 dark:to-cyan-950/25">
            <Mail className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Email Support</h2>
            <a
              className="mt-1 inline-block text-sm text-emerald-700 underline decoration-dotted underline-offset-4 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
          </div>
          <div className="rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-white/90 to-sky-50/70 p-4 dark:border-cyan-800/40 dark:from-slate-900/80 dark:to-sky-950/25">
            <MessageCircleHeart className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Use In-App Support</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Share your issue details from Settings or Support page.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/support" className={cn(buttonVariants({ variant: "default" }))}>
            Go to Support
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
