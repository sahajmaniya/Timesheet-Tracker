"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { EntryDialog } from "@/components/entries/entry-dialog";
import { EntriesTable } from "@/components/entries/entries-table";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MonthlyPayEstimate, PayrollProfile } from "@/lib/payroll";
import { minutesToHM, minutesToTenthsDecimal } from "@/lib/time";
import type { TimeEntry } from "@/types/time-entry";

function DashboardEntriesSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card md:block">
        <div className="grid grid-cols-7 gap-4 border-b border-border/70 px-4 py-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`dash-head-${index}`} className="h-3 animate-pulse rounded bg-muted/70" />
          ))}
        </div>
        <div className="space-y-3 px-4 py-4">
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={`dash-row-${row}`} className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((__, col) => (
                <div key={`dash-cell-${row}-${col}`} className="h-3 animate-pulse rounded bg-muted/70" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 3 }).map((_, card) => (
          <div key={`dash-mobile-${card}`} className="rounded-xl border border-border/70 bg-card/80 p-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted/70" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted/60" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((__, cell) => (
                <div key={`dash-mobile-cell-${card}-${cell}`} className="h-3 animate-pulse rounded bg-muted/70" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardClient() {
  const confirm = useConfirm();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [payrollProfile, setPayrollProfile] = useState<PayrollProfile | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [payEstimate, setPayEstimate] = useState<MonthlyPayEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [editHourlyOpen, setEditHourlyOpen] = useState(false);
  const [hourlyRateDraft, setHourlyRateDraft] = useState("");
  const [savingHourlyRate, setSavingHourlyRate] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const exportMonthLabel = useMemo(() => {
    const parsed = new Date(`${month}-01T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? month : format(parsed, "MMM yyyy");
  }, [month]);

  const fetchEntries = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?month=${month}`, { signal });
      const body = await res.json();
      if (res.ok) {
        setEntries(body.entries ?? []);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Could not load entries");
      }
    } finally {
      setLoading(false);
    }
  }, [month]);

  const fetchPayrollProfile = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/profile", { signal });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setProfileName(body?.profile?.name ?? null);
      setPayrollProfile(body?.profile?.payrollProfile ?? null);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Could not load payroll profile:", error);
      }
    }
  }, []);

  const fetchPayEstimate = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/payroll/estimate?month=${month}`, { signal });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setPayEstimate(body?.estimate ?? null);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Could not load pay estimate:", error);
      }
    }
  }, [month]);

  const saveHourlyRate = async () => {
    if (!payrollProfile) {
      toast.error("Payroll profile is not loaded yet");
      return;
    }
    if (!profileName || profileName.trim().length < 2) {
      toast.error("Please set your profile name in Settings first.");
      return;
    }

    const parsedRate = Number(hourlyRateDraft);
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      toast.error("Enter a valid hourly rate");
      return;
    }

    setSavingHourlyRate(true);
    try {
      const updatedProfile: PayrollProfile = {
        ...payrollProfile,
        hourlyRate: parsedRate,
      };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          payrollProfile: updatedProfile,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not update hourly rate");
        return;
      }

      setPayrollProfile(body?.profile?.payrollProfile ?? updatedProfile);
      setEditHourlyOpen(false);
      toast.success("Hourly rate updated");
      await fetchPayEstimate();
    } finally {
      setSavingHourlyRate(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEntries(controller.signal);
    return () => controller.abort();
  }, [fetchEntries]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPayrollProfile(controller.signal);
    return () => controller.abort();
  }, [fetchPayrollProfile]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPayEstimate(controller.signal);
    return () => controller.abort();
  }, [fetchPayEstimate]);

  const todayEntry = useMemo(
    () => entries.find((entry) => entry.date === today) ?? null,
    [entries, today],
  );

  const totalMinutes = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.workedMinutes, 0),
    [entries],
  );

  const averageMinutes = entries.length ? Math.round(totalMinutes / entries.length) : 0;
  const totalDecimal = useMemo(
    () => entries.reduce((sum, entry) => sum + minutesToTenthsDecimal(entry.workedMinutes), 0),
    [entries],
  );
  const averageDecimal = entries.length ? totalDecimal / entries.length : 0;
  const hasPayrollProfile = Boolean(payrollProfile && payrollProfile.hourlyRate > 0);

  const onDelete = async (entry: TimeEntry) => {
    const ok = await confirm({
      title: "Delete Entry?",
      description: `This will permanently remove the entry for ${entry.date}.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not delete entry");
      return;
    }

    toast.success("Entry deleted");
    await fetchEntries();
    await fetchPayEstimate();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-gradient-to-br from-sky-100/70 via-background to-emerald-100/60 p-4 sm:p-6 dark:from-slate-900 dark:via-background dark:to-emerald-950/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Today</p>
            <h1 className="mt-1 text-2xl font-bold">{format(new Date(), "EEEE, MMM d")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Keep your shift updated in a few taps.</p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:w-auto md:flex">
            <Button
              variant="outline"
              className="h-11 w-full px-3 text-sm sm:h-12 sm:w-auto sm:px-4"
              onClick={() => {
                window.open(`/api/entries/export?month=${month}`, "_blank");
                toast.success("CSV export started", {
                  description: `Your ${month} file opened in a new tab.`,
                });
              }}
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                <Download className="h-4 w-4 shrink-0" />
              </span>
              Export {exportMonthLabel}
            </Button>
            <Button
              className="h-11 w-full px-3 text-sm sm:h-12 sm:w-auto sm:px-4"
              onClick={() => {
                setSelectedEntry(todayEntry);
                setOpen(true);
              }}
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                {todayEntry ? <Pencil className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
              </span>
              {todayEntry ? "Edit Today" : "Log Today"}
            </Button>
          </div>
        </div>
      </section>

      {!hasPayrollProfile ? (
        <Card className="border-amber-400/35 bg-gradient-to-br from-amber-100/70 via-background to-orange-100/65 dark:from-amber-500/12 dark:to-orange-500/10">
          <CardHeader className="gap-3">
            <CardTitle className="text-xl">Set your hourly rate to unlock pay estimate</CardTitle>
            <CardDescription className="text-sm text-slate-700 dark:text-slate-300">
              Add your hourly pay once, and we will automatically calculate your monthly gross estimate from worked hours.
            </CardDescription>
            <div>
              <Button
                type="button"
                onClick={() => {
                  setHourlyRateDraft(String(payrollProfile?.hourlyRate ?? 0));
                  setEditHourlyOpen(true);
                }}
                className="h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 font-semibold text-white hover:from-cyan-400 hover:to-blue-400"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Set Hourly Rate
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-sky-200/70 via-background to-cyan-200/60 shadow-[0_18px_40px_-24px_rgba(34,211,238,0.35)] dark:from-sky-500/15 dark:to-cyan-500/10 dark:shadow-[0_18px_40px_-24px_rgba(34,211,238,0.55)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(56,189,248,0.2),transparent_52%)]" />
          <CardHeader className="relative pb-2">
            <CardDescription className="font-medium text-sky-700 dark:text-sky-100/80">Total this month</CardDescription>
            <CardTitle className="bg-gradient-to-r from-sky-700 via-cyan-700 to-blue-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-cyan-200 dark:via-sky-200 dark:to-blue-200">
              {totalDecimal.toFixed(1)} hrs
            </CardTitle>
            <p className="text-xs font-medium text-sky-700/80 dark:text-cyan-100/75">{minutesToHM(totalMinutes)} clock time</p>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-violet-200/70 via-background to-blue-200/60 shadow-[0_18px_40px_-24px_rgba(99,102,241,0.32)] dark:from-violet-500/15 dark:to-blue-500/10 dark:shadow-[0_18px_40px_-24px_rgba(99,102,241,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_24%,rgba(139,92,246,0.24),transparent_54%)]" />
          <CardHeader className="relative pb-2">
            <CardDescription className="font-medium text-violet-700 dark:text-violet-100/80">Average per day</CardDescription>
            <CardTitle className="bg-gradient-to-r from-violet-700 via-indigo-700 to-sky-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-violet-200 dark:via-indigo-200 dark:to-sky-200">
              {averageDecimal.toFixed(1)} hrs
            </CardTitle>
            <p className="text-xs font-medium text-indigo-700/80 dark:text-indigo-100/75">{minutesToHM(averageMinutes)} clock time</p>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-emerald-200/70 via-background to-teal-200/60 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.3)] dark:from-emerald-500/12 dark:to-teal-500/10 dark:shadow-[0_18px_40px_-24px_rgba(16,185,129,0.45)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_70%,rgba(16,185,129,0.16),transparent_56%)]" />
          <CardHeader className="relative pb-2">
            <CardDescription className="font-medium text-emerald-700 dark:text-emerald-100/80">Month</CardDescription>
            <div className="min-w-0 pt-1">
              <Input
                className="min-w-0 border-emerald-500/30 bg-background/85 font-semibold text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus-visible:ring-emerald-500/45 dark:border-emerald-300/25 dark:text-emerald-50 dark:focus-visible:ring-emerald-400/50"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="relative overflow-hidden border border-emerald-300/40 bg-gradient-to-br from-emerald-100/75 via-background to-lime-100/70 shadow-[0_24px_50px_-30px_rgba(16,185,129,0.35)] dark:border-emerald-500/25 dark:from-emerald-500/15 dark:via-slate-900/80 dark:to-lime-500/10 dark:shadow-[0_24px_50px_-30px_rgba(16,185,129,0.45)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-400/15" />
            <div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
          </div>
          <CardHeader className="relative p-5 sm:p-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">
                  Estimated Pay
                </span>
                <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">
                  Gross Only
                </span>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setHourlyRateDraft(String(payrollProfile?.hourlyRate ?? 0));
                  setEditHourlyOpen(true);
                }}
                className="h-10 w-full gap-2 rounded-full border border-sky-500/35 bg-sky-500/12 px-4 font-semibold text-sky-800 shadow-none transition hover:bg-sky-500/18 dark:border-sky-400/35 dark:bg-sky-400/10 dark:text-sky-100 dark:hover:bg-sky-400/18 sm:w-auto"
              >
                <Wallet className="h-4 w-4" />
                Update Rate
              </Button>
            </div>
            <CardDescription className="font-medium text-emerald-700 dark:text-emerald-100/85">Gross pay (est.)</CardDescription>
            <CardTitle className="mt-1 bg-gradient-to-r from-emerald-800 via-emerald-700 to-cyan-700 bg-clip-text text-4xl font-black tracking-tight text-transparent dark:from-emerald-100 dark:via-emerald-200 dark:to-cyan-200 sm:text-5xl">
              {hasPayrollProfile && payEstimate ? `$${payEstimate.grossPay.toFixed(2)}` : "—"}
            </CardTitle>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700/90 dark:text-emerald-200/90">Worked This Month</p>
                <p className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-100">{totalDecimal.toFixed(1)} hrs</p>
              </div>
              <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700/90 dark:text-cyan-200/90">Taxable Gross</p>
                <p className="mt-1 text-lg font-bold text-cyan-800 dark:text-cyan-100">${payEstimate?.taxableGross.toFixed(2) ?? "0.00"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Taxes and deductions are not included yet. Final take-home pay will be lower after payroll withholding.
              </p>
            </div>

          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/65 bg-gradient-to-br from-sky-200/45 via-background to-indigo-200/35 shadow-[0_22px_45px_-30px_rgba(59,130,246,0.25)] dark:from-sky-500/8 dark:to-indigo-500/6 dark:shadow-[0_22px_45px_-30px_rgba(59,130,246,0.45)]">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-slate-800 via-sky-700 to-indigo-700 bg-clip-text text-transparent dark:from-slate-100 dark:via-sky-100 dark:to-indigo-100">Monthly Entries</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300/75">
            {loading ? "Loading..." : `${entries.length} entries for ${month}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DashboardEntriesSkeleton />
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No entries for this month. Click <span className="font-medium">Log Today</span> to start.
            </div>
          ) : (
            <EntriesTable
              entries={entries}
              onEdit={(entry) => {
                setSelectedEntry(entry);
                setOpen(true);
              }}
              onDelete={onDelete}
            />
          )}
        </CardContent>
      </Card>

      <EntryDialog
        open={open}
        entry={selectedEntry}
        onOpenChange={setOpen}
        onSaved={async () => {
          await fetchEntries();
          await fetchPayEstimate();
        }}
      />

      <Dialog open={editHourlyOpen} onOpenChange={setEditHourlyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Hourly Rate</DialogTitle>
            <DialogDescription>
              Update the hourly rate used for your gross pay estimate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="hourly-rate-input" className="text-sm font-medium">
              Hourly Rate (USD)
            </label>
            <Input
              id="hourly-rate-input"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRateDraft}
              onChange={(e) => setHourlyRateDraft(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditHourlyOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveHourlyRate} disabled={savingHourlyRate}>
              {savingHourlyRate ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
