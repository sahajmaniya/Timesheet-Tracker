"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Boxes, CircleHelp, Menu, Workflow, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: "#features" | "#workflow" | "#faq";
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "#features", label: "Product", icon: Boxes },
  { href: "#workflow", label: "Workflow", icon: Workflow },
  { href: "#faq", label: "FAQ", icon: CircleHelp },
];

const SECTION_OFFSET = 104;

export function LandingNavbar() {
  const [activeHref, setActiveHref] = useState<NavItem["href"]>("#features");
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionIds = useMemo(
    () => navItems.map((item) => item.href.replace("#", "")),
    [],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveHref(`#${visible[0].target.id}` as NavItem["href"]);
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0.1, 0.35, 0.6],
      },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  const onNavClick = (href: NavItem["href"]) => {
    const id = href.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - SECTION_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveHref(href);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/55 bg-white/80 px-3 py-2 shadow-[0_12px_28px_-22px_rgba(2,6,23,0.75)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/75">
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
            setMobileOpen(false);
          }}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-slate-100/70 motion-reduce:transition-none dark:hover:bg-slate-800/70"
        >
          <Image src="/punchpilot-logo.svg" alt="PunchPilot" width={30} height={30} priority />
          <span className="text-sm font-black tracking-tight">PunchPilot</span>
        </a>

        <div className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 md:flex dark:border-slate-700 dark:bg-slate-800/70">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                onNavClick(item.href);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                activeHref === item.href
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                  : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100",
              )}
              aria-current={activeHref === item.href ? "page" : undefined}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/about"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 border-slate-300/80 bg-white px-4 text-sm dark:border-slate-700 dark:bg-slate-900",
            )}
          >
            About
          </Link>
          <Link
            href="/auth/signin"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 border-slate-300/80 bg-white px-4 text-sm dark:border-slate-700 dark:bg-slate-900",
            )}
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-9 bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 text-sm text-white hover:from-cyan-500 hover:to-emerald-500",
            )}
          >
            Start Free
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg border border-border/70 bg-background p-2 text-foreground md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="mx-auto mt-2 max-h-[70vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-border bg-background p-3 shadow-xl md:hidden">
          <div className="space-y-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  onNavClick(item.href);
                }}
                className={cn(
                  "block rounded-md px-2 py-1 text-sm hover:bg-muted",
                  activeHref === item.href ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
            <Link href="/about" className={cn(buttonVariants({ variant: "outline" }), "h-9 text-sm")} onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }), "h-9 text-sm")} onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
            <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }), "h-9 text-sm")} onClick={() => setMobileOpen(false)}>
              Start Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
