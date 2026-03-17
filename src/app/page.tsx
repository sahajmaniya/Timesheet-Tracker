import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await getServerAuthSession();
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50 to-cyan-50 px-4 py-20">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <p className="rounded-full border border-border bg-background/80 px-4 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          PunchPilot
        </p>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Track Daily Hours. Export Monthly Timesheets.
        </h1>

        <p className="max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          A modern timesheet tracker for student assistants with punch in/out, break tracking, notes,
          and CSV export for monthly submission.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/auth/signup" className={cn(buttonVariants({ variant: "default" }))}>
            Create Account
          </Link>
          <Link href="/auth/signin" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign In
          </Link>
        </div>

        <Card className="w-full max-w-2xl text-left">
          <CardHeader>
            <CardTitle>What you get</CardTitle>
            <CardDescription>Everything needed for monthly timesheets.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <p className="text-sm">Daily punch in/out logging</p>
            <p className="text-sm">Break duration auto-calculation</p>
            <p className="text-sm">Protected dashboard and entries</p>
            <p className="text-sm">Monthly totals + CSV export</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
