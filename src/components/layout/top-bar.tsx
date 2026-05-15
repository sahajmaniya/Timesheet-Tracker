"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, ListChecks, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/profile/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entries", label: "Entries", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function TopBar() {
  const pathname = usePathname();
  const { data } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const safeEmail = data?.user?.email ? data.user.email.replace(/\s+/g, "") : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const doSignOut = async () => {
    toast.success("Signed out");
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-40">
      <div
        className={cn(
          "w-full transition-all duration-300",
          scrolled
            ? "border-b border-border/35 bg-gradient-to-b from-background/88 via-background/76 to-background/66 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto w-full max-w-6xl px-2 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3">
          <div className="rounded-2xl border border-white/55 bg-white/80 px-2 py-2 shadow-[0_12px_28px_-22px_rgba(2,6,23,0.75)] backdrop-blur-xl sm:px-3 dark:border-slate-700/70 dark:bg-slate-900/75">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <Link href="/" className="group flex min-w-0 items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/70">
              <span className="transition-transform duration-200 group-hover:scale-[1.02]">
                <Image
                  src="/logo-wordmark-light.svg"
                  alt="PunchPilot wordmark logo"
                  width={164}
                  height={28}
                  priority
                  className="block h-6 w-auto dark:hidden"
                />
                <Image
                  src="/logo-wordmark-dark.svg"
                  alt="PunchPilot wordmark logo"
                  width={164}
                  height={28}
                  priority
                  className="hidden h-6 w-auto dark:block"
                />
              </span>
            </Link>

            <nav className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1 lg:flex dark:border-slate-700 dark:bg-slate-800/70">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                        : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Link
                href="/settings"
                className="hidden items-center gap-2 rounded-xl border border-border/70 bg-background/75 px-2 py-1.5 text-left text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-accent/45 hover:shadow-sm xl:flex"
              >
                <UserAvatar
                  name={data?.user?.name}
                  email={safeEmail}
                  image={data?.user?.image}
                  className="h-8 w-8 shrink-0 border"
                />
                <div className="max-w-[180px]">
                  <p className="truncate font-medium text-foreground">{data?.user?.name ?? "Timesheet User"}</p>
                  <p className="truncate">{safeEmail}</p>
                </div>
              </Link>
              <Button variant="outline" size="sm" className="h-9 min-w-0 rounded-xl px-2.5 sm:px-3.5" onClick={doSignOut}>
                <span className="lg:hidden">Out</span>
                <span className="hidden lg:inline">Sign out</span>
              </Button>
            </div>
          </div>

            <div className="mt-2 lg:hidden">
              <nav className="grid grid-cols-3 items-center gap-1 rounded-xl border border-border/65 bg-background/80 p-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-medium transition-all",
                        active
                          ? "bg-linear-to-r from-primary to-sky-500 text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
