"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { EntryDialog } from "@/components/entries/entry-dialog";
import { EntriesTable } from "@/components/entries/entries-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { minutesToHM, minutesToTenthsDecimal } from "@/lib/time";
import type { TimeEntry } from "@/types/time-entry";

export function EntriesClient() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"overwrite" | "skip">("overwrite");
  const [importing, setImporting] = useState(false);

  const fetchEntries = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?month=${month}`, { signal });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Could not load entries");
        return;
      }
      setEntries(body.entries ?? []);
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

  const totals = useMemo(() => {
    const total = entries.reduce((sum, entry) => sum + entry.workedMinutes, 0);
    const avg = entries.length ? Math.round(total / entries.length) : 0;
    const totalDecimal = entries.reduce(
      (sum, entry) => sum + minutesToTenthsDecimal(entry.workedMinutes),
      0,
    );
    const avgDecimal = entries.length ? totalDecimal / entries.length : 0;
    return { total, avg, totalDecimal, avgDecimal };
  }, [entries]);

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

  const onImportWorkbook = async () => {
    if (!importFile) {
      toast.error("Select an Excel file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("mode", importMode);

    setImporting(true);
    try {
      const res = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Import failed");
        return;
      }

      const summary = body.summary;
      toast.success(
        `Import complete: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`,
      );
      setImportFile(null);
      await fetchEntries();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-sky-200/70 via-background to-cyan-200/60 shadow-[0_18px_40px_-24px_rgba(34,211,238,0.35)] dark:from-sky-500/15 dark:to-cyan-500/10 dark:shadow-[0_18px_40px_-24px_rgba(34,211,238,0.55)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(56,189,248,0.2),transparent_52%)]" />
          <CardHeader className="relative pb-2">
            <CardDescription className="font-medium text-sky-700 dark:text-sky-100/80">Monthly total</CardDescription>
            <CardTitle className="bg-gradient-to-r from-sky-700 via-cyan-700 to-blue-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-cyan-200 dark:via-sky-200 dark:to-blue-200">
              {totals.totalDecimal.toFixed(1)} hrs
            </CardTitle>
            <p className="text-xs font-medium text-sky-700/80 dark:text-cyan-100/75">{minutesToHM(totals.total)} clock time</p>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-violet-200/70 via-background to-blue-200/60 shadow-[0_18px_40px_-24px_rgba(99,102,241,0.32)] dark:from-violet-500/15 dark:to-blue-500/10 dark:shadow-[0_18px_40px_-24px_rgba(99,102,241,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_24%,rgba(139,92,246,0.24),transparent_54%)]" />
          <CardHeader className="relative pb-2">
            <CardDescription className="font-medium text-violet-700 dark:text-violet-100/80">Average hours/day</CardDescription>
            <CardTitle className="bg-gradient-to-r from-violet-700 via-indigo-700 to-sky-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-violet-200 dark:via-indigo-200 dark:to-sky-200">
              {totals.avgDecimal.toFixed(1)} hrs
            </CardTitle>
            <p className="text-xs font-medium text-indigo-700/80 dark:text-indigo-100/75">{minutesToHM(totals.avg)} clock time</p>
          </CardHeader>
        </Card>

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-emerald-200/70 via-background to-teal-200/60 shadow-[0_18px_40px_-24px_rgba(16,185,129,0.3)] dark:from-emerald-500/12 dark:to-teal-500/10 dark:shadow-[0_18px_40px_-24px_rgba(16,185,129,0.45)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_70%,rgba(16,185,129,0.16),transparent_56%)]" />
          <CardHeader className="relative pb-2">
            <CardDescription className="font-medium text-emerald-700 dark:text-emerald-100/80">Selected month</CardDescription>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-slate-800 via-sky-700 to-indigo-700 bg-clip-text text-transparent dark:from-slate-100 dark:via-sky-100 dark:to-indigo-100">Entries</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300/75">Faster monthly logging and edits.</CardDescription>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  window.open(`/api/entries/export?month=${month}`, "_blank");
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={() => {
                  setSelectedEntry(null);
                  setOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-5 rounded-xl border border-dashed border-cyan-500/25 bg-gradient-to-r from-cyan-100/65 via-background/80 to-sky-100/60 p-4 dark:border-cyan-300/20 dark:from-cyan-500/10 dark:via-background/70 dark:to-sky-500/10">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-100">Import Previous Months (.xlsx)</p>
                <p className="text-xs text-slate-600 dark:text-slate-300/80">
                  Supports your timesheet template with Date, Start Time, End Time, Break Start, Break End.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value === "skip" ? "skip" : "overwrite")}
                  className="h-10 min-w-0 flex-1 rounded-md border border-cyan-500/30 bg-background/90 px-3 text-sm md:w-56 md:flex-none dark:border-cyan-300/25 dark:bg-background/80"
                >
                  <option value="overwrite">Overwrite existing dates</option>
                  <option value="skip">Skip existing dates</option>
                </select>
                <Button className="flex-1 md:flex-none" onClick={onImportWorkbook} disabled={importing}>
                  <FileUp className="mr-2 h-4 w-4" />
                  {importing ? "Importing..." : "Import Excel"}
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading entries...</p>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No entries for this month yet.
            </div>
          ) : (
            <Tabs defaultValue="table">
              <TabsList className="w-full overflow-x-auto whitespace-nowrap">
                <TabsTrigger value="table">Timeline Table</TabsTrigger>
                <TabsTrigger value="notes">Notes Digest</TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <EntriesTable
                  entries={entries}
                  onEdit={(entry) => {
                    setSelectedEntry(entry);
                    setOpen(true);
                  }}
                  onDelete={onDelete}
                />
              </TabsContent>

              <TabsContent value="notes">
                <div className="grid gap-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-border/70 bg-gradient-to-r from-background to-sky-500/5 p-3">
                      <p className="text-sm font-semibold">{entry.date}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.notes || "No notes"}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <EntryDialog open={open} entry={selectedEntry} onOpenChange={setOpen} onSaved={fetchEntries} />
    </div>
  );
}
