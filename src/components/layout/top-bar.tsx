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
    await signOut({ callbackUrl: "/dashboard" });
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
        <div className="mx-auto w-full max-w-6xl px-3 py-2.5 md:px-6 md:py-3">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-sky-200/40 via-background/95 to-indigo-200/30 px-3 py-2 shadow-[0_16px_35px_-24px_rgba(59,130,246,0.45)] dark:from-sky-500/10 dark:to-indigo-500/10">
          <div className="flex items-center justify-between gap-2">
            <Link href="/dashboard" className="group flex items-center gap-2.5 text-sm font-semibold tracking-wide">
              <span className="rounded-xl border border-primary/30 bg-primary/15 p-1 text-primary transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="/punchpilot-logo.svg"
                  alt="PunchPilot logo"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-lg"
                  priority
                />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold text-foreground">PunchPilot</p>
                <p className="hidden text-[11px] text-muted-foreground sm:block">Timesheet workspace</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 rounded-xl border border-border/65 bg-background/75 p-1 md:flex">
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
                        ? "bg-gradient-to-r from-primary to-sky-500 text-primary-foreground shadow-[0_8px_20px_-12px_rgba(37,99,235,0.75)]"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Link
                href="/settings"
                className="hidden items-center gap-2 rounded-xl border border-border/70 bg-background/75 px-2 py-1.5 text-left text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-accent/45 hover:shadow-sm sm:flex"
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
              <Button variant="outline" size="sm" className="rounded-xl" onClick={doSignOut}>
                <span className="sm:hidden">Out</span>
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>

            <div className="mt-2 md:hidden">
              <nav className="flex items-center gap-1 rounded-xl border border-border/65 bg-background/80 p-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition-all",
                        active
                          ? "bg-gradient-to-r from-primary to-sky-500 text-primary-foreground"
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
