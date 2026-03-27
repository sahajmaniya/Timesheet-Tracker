"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { EntryDialog } from "@/components/entries/entry-dialog";
import { EntriesTable } from "@/components/entries/entries-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { minutesToHM, minutesToTenthsDecimal } from "@/lib/time";
import type { TimeEntry } from "@/types/time-entry";

export function DashboardClient() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

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

  useEffect(() => {
    const controller = new AbortController();
    fetchEntries(controller.signal);
    return () => controller.abort();
  }, [fetchEntries]);

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

  const onDelete = async (entry: TimeEntry) => {
    const ok = window.confirm(`Delete entry for ${entry.date}?`);
    if (!ok) return;

    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not delete entry");
      return;
    }

    toast.success("Entry deleted");
    await fetchEntries();
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

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button
              variant="outline"
              className="h-12 w-full whitespace-nowrap px-3 sm:w-auto sm:px-4"
              onClick={() => window.open(`/api/entries/export?month=${month}`, "_blank")}
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                <Download className="h-4 w-4 shrink-0" />
              </span>
              Export {exportMonthLabel}
            </Button>
            <Button
              className="h-12 w-full whitespace-nowrap px-3 sm:w-auto sm:px-4"
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
            <div className="pt-1">
              <Input
                className="border-emerald-500/30 bg-background/85 font-semibold text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus-visible:ring-emerald-500/45 dark:border-emerald-300/25 dark:text-emerald-50 dark:focus-visible:ring-emerald-400/50"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
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
          {entries.length === 0 ? (
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

      <EntryDialog open={open} entry={selectedEntry} onOpenChange={setOpen} onSaved={fetchEntries} />
    </div>
  );
}
