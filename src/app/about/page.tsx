import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About PunchPilot",
  description:
    "Learn about PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About PunchPilot",
    description:
      "Learn about PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
    url: `${siteConfig.url}/about`,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "About PunchPilot" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About PunchPilot",
    description:
      "Learn about PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
    images: ["/og-image.svg"],
  },
};

export default function AboutPage() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About PunchPilot",
    url: `${siteConfig.url}/about`,
    description:
      "About PunchPilot, a timesheet tracker focused on SA and ISA workflows with punch in/out, monthly export, and PDF-ready output.",
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-blue-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
      <section className="mx-auto max-w-4xl rounded-3xl border border-border/60 bg-white/75 p-6 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10 dark:bg-slate-900/65">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">About PunchPilot</h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          PunchPilot helps teams track work hours with a practical SA/ISA-first workflow. You can record daily punch in/out,
          capture breaks, review monthly totals, and export submission-ready files without spreadsheet overhead.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-background/80 p-4">
            <h2 className="text-lg font-semibold">Why teams use PunchPilot</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Faster month-end preparation, cleaner exports, and fewer manual calculation errors.
            </p>
          </div>
          <div className="rounded-2xl border bg-background/80 p-4">
            <h2 className="text-lg font-semibold">What it supports today</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              SA/ISA timesheet roles, CSV export, PDF fill, Excel import, and secure account-based access.
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
      </section>
    </main>
  );
}

