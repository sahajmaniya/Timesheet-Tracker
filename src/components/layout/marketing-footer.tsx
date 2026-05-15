import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MarketingFooterProps = {
  className?: string;
};

const productLinks = [
  { href: "/student-assistant-timesheet-tracker", label: "SA Timesheet Guide" },
  { href: "/punch-in-punch-out-web-app", label: "Punch In/Out App" },
  { href: "/monthly-timesheet-csv-export", label: "Monthly CSV Export" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
  { href: "/contact", label: "Contact" },
];

const accountLinks = [
  { href: "/auth/signin", label: "Sign In" },
  { href: "/auth/signup", label: "Create Account" },
];

export function MarketingFooter({ className }: MarketingFooterProps) {
  return (
    <footer className={cn("mx-auto mt-10 w-full max-w-6xl px-4 pb-12 sm:mt-12 sm:px-6 lg:mt-14 lg:px-8", className)}>
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-card via-card/92 to-cyan-50/35 p-6 shadow-[0_24px_44px_-30px_rgba(8,47,73,0.65)] dark:from-slate-900/88 dark:via-slate-900/83 dark:to-cyan-950/20 sm:p-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-8 top-0 h-20 w-20 rounded-full bg-cyan-300/30 blur-2xl dark:bg-cyan-600/25" />
          <div className="absolute -right-10 bottom-0 h-20 w-20 rounded-full bg-emerald-300/25 blur-2xl dark:bg-emerald-600/20" />
        </div>

        <div className="relative grid gap-7 lg:grid-cols-[1.02fr_0.98fr] lg:gap-9">
          <div>
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo-wordmark-light.svg"
                alt="PunchPilot wordmark logo"
                width={208}
                height={40}
                className="block h-8 w-auto dark:hidden"
              />
              <Image
                src="/logo-wordmark-dark.svg"
                alt="PunchPilot wordmark logo"
                width={208}
                height={40}
                className="hidden h-8 w-auto dark:block"
              />
            </Link>
            <p className="mt-3 max-w-md text-base leading-8 text-slate-600 dark:text-slate-300">
              Role-based timesheet tracking with cleaner exports, better month-end confidence, and a modern workflow for SA/ISA teams.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                Product
              </p>
              {productLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                Company
              </p>
              {companyLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                Account
              </p>
              {accountLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-7 flex flex-col items-center gap-2 border-t border-border/70 pt-4 text-center text-xs text-muted-foreground md:flex-row md:justify-between md:text-left">
          <p>© {new Date().getFullYear()} PunchPilot. All rights reserved.</p>
          <p>Built for reliable monthly timesheet submission.</p>
        </div>
      </div>
    </footer>
  );
}
