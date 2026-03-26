"use client";

import { eachDayOfInterval, endOfMonth, format, getDay, isAfter, startOfMonth } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, FileUp, History, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EntryDialog } from "@/components/entries/entry-dialog";
import { EntriesTable } from "@/components/entries/entries-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildDownloadFilename, getFilenameFromContentDisposition } from "@/lib/downloads";
import { minutesToHM, minutesToTenthsDecimal } from "@/lib/time";
import type { TimeEntry } from "@/types/time-entry";
import type { TimeEntryInput } from "@/lib/validators";

export function EntriesClient() {
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"overwrite" | "skip">("overwrite");
  const [importing, setImporting] = useState(false);
  const [timesheetTemplateFile, setTimesheetTemplateFile] = useState<File | null>(null);
  const [timesheetLayoutMode, setTimesheetLayoutMode] = useState<"auto" | "standard" | "carry">("auto");
  const [fillingPdf, setFillingPdf] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [previewPdfBeforeDownload, setPreviewPdfBeforeDownload] = useState(true);
  const [recentActions, setRecentActions] = useState<{ id: number; label: string; at: string }[]>([]);

  const addRecentAction = useCallback((label: string) => {
    setRecentActions((prev) => [
      { id: Date.now() + Math.floor(Math.random() * 1000), label, at: format(new Date(), "MMM d, h:mm a") },
      ...prev.slice(0, 5),
    ]);
  }, []);

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

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem("entries_walkthrough_dismissed");
      setShowWalkthrough(dismissed !== "true");
      const previewPref = window.localStorage.getItem("entries_preview_pdf_before_download");
      if (previewPref === "false") setPreviewPdfBeforeDownload(false);
    } catch {
      setShowWalkthrough(true);
    }
  }, []);

  const restoreEntry = useCallback(async (entry: TimeEntry) => {
    const payload: TimeEntryInput = {
      date: entry.date,
      punchIn: entry.punchIn,
      punchOut: entry.punchOut,
      notes: entry.notes,
      breaks: entry.breaks.map((item) => ({ start: item.start, end: item.end })),
    };

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.error || "Could not restore deleted entry.");
    }
  }, []);

  const dismissWalkthrough = () => {
    setShowWalkthrough(false);
    try {
      window.localStorage.setItem("entries_walkthrough_dismissed", "true");
    } catch {
      // ignore storage issues
    }
  };

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

  const scheduleStats = useMemo(() => {
    const monthDate = new Date(`${month}-01T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentMonth = format(today, "yyyy-MM") === month;
    const loggedDates = new Set(entries.map((entry) => entry.date));

    const expectedDates = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    })
      .filter((day) => {
        const weekday = getDay(day);
        const isWorkday = weekday === 1 || weekday === 3 || weekday === 5;
        if (!isWorkday) return false;
        if (!isCurrentMonth) return true;
        return !isAfter(day, today);
      })
      .map((day) => format(day, "yyyy-MM-dd"));

    const loggedExpected = expectedDates.filter((date) => loggedDates.has(date)).length;
    const missing = expectedDates.filter((date) => !loggedDates.has(date));
    const progress = expectedDates.length
      ? Math.min(100, Math.round((loggedExpected / expectedDates.length) * 100))
      : 100;

    return {
      expectedCount: expectedDates.length,
      loggedExpected,
      missing,
      progress,
    };
  }, [entries, month]);

  const onDelete = async (entry: TimeEntry) => {
    const ok = window.confirm(`Delete entry for ${entry.date}?`);
    if (!ok) return;

    const res = await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(body.error || "Could not delete entry");
      return;
    }

    toast("Entry deleted.", {
      action: {
        label: "Undo",
        onClick: () => {
          void (async () => {
            try {
              await restoreEntry(entry);
              await fetchEntries();
              toast.success("Entry restored.");
              addRecentAction(`Restored deleted entry (${entry.date})`);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not restore entry.");
            }
          })();
        },
      },
    });
    addRecentAction(`Deleted entry (${entry.date})`);
    await fetchEntries();
  };

  const onExportCsv = useCallback(() => {
    window.open(`/api/entries/export?month=${month}`, "_blank");
    addRecentAction(`Exported CSV (${month})`);
  }, [addRecentAction, month]);

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
      addRecentAction(`Imported Excel (${summary.created} new, ${summary.updated} updated)`);
      setImportFile(null);
      await fetchEntries();
    } finally {
      setImporting(false);
    }
  };

  const onFillTimesheetPdf = useCallback(async (layoutOverride?: "auto" | "standard" | "carry") => {
    if (!timesheetTemplateFile) {
      toast.error("Select a blank timesheet PDF first.");
      return;
    }

    const selectedLayoutMode = layoutOverride ?? timesheetLayoutMode;
    const formData = new FormData();
    formData.append("file", timesheetTemplateFile);
    formData.append("month", month);
    formData.append("layoutMode", selectedLayoutMode);

    setFillingPdf(true);
    try {
      const res = await fetch("/api/entries/fill-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || "Could not fill the PDF template.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = res.headers.get("content-disposition");
      const filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);
      const filename =
        filenameFromHeader ||
        buildDownloadFilename({
          kind: "timesheet_filled_pdf",
          month,
          extension: "pdf",
        });
      a.download = filename;

      if (previewPdfBeforeDownload) {
        window.open(url, "_blank", "noopener,noreferrer");
        const shouldDownload = window.confirm("Preview opened in a new tab. Download this PDF now?");
        if (shouldDownload) {
          a.click();
        } else {
          toast.message("Preview opened. You can download after checking alignment.");
        }
      } else {
        a.click();
      }
      URL.revokeObjectURL(url);
      toast.success(
        selectedLayoutMode === "auto"
          ? "Filled timesheet PDF downloaded."
          : `Filled timesheet PDF downloaded (${selectedLayoutMode} layout).`,
      );
      addRecentAction(`Generated filled PDF (${month}, ${selectedLayoutMode})`);
    } finally {
      setFillingPdf(false);
    }
  }, [addRecentAction, month, previewPdfBeforeDownload, timesheetLayoutMode, timesheetTemplateFile]);

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable) return;

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        setSelectedEntry(null);
        setOpen(true);
      } else if (key === "e") {
        event.preventDefault();
        onExportCsv();
      } else if (key === "p") {
        event.preventDefault();
        if (timesheetTemplateFile) {
          void onFillTimesheetPdf("auto");
        } else {
          document.getElementById("entries-pdf-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
          toast.message("Upload a blank PDF first, then press P again.");
        }
      }
    };

    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [onExportCsv, onFillTimesheetPdf, timesheetTemplateFile]);

  const onDeleteMonth = async () => {
    if (entries.length === 0) {
      toast.error("No entries to delete for this month.");
      return;
    }

    const ok = window.confirm(
      `Delete all ${entries.length} entries for ${month}? This cannot be undone.`,
    );
    if (!ok) return;

    setDeletingMonth(true);
    try {
      const res = await fetch(`/api/entries?month=${month}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not delete month entries");
        return;
      }

      const deletedSnapshot = [...entries];
      toast(`Deleted ${body.deletedCount ?? entries.length} entries for ${month}.`, {
        action: {
          label: "Undo",
          onClick: () => {
            void (async () => {
              try {
                let restored = 0;
                for (const item of deletedSnapshot) {
                  await restoreEntry(item);
                  restored += 1;
                }
                await fetchEntries();
                toast.success(`Restored ${restored} entries.`);
                addRecentAction(`Restored ${restored} deleted entries (${month})`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not restore all entries.");
              }
            })();
          },
        },
      });
      addRecentAction(`Deleted month entries (${month})`);
      await fetchEntries();
    } finally {
      setDeletingMonth(false);
    }
  };

  return (
    <div className="space-y-6">
      {showWalkthrough && (
        <Card className="border-primary/25 bg-gradient-to-r from-primary/12 via-background to-sky-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Start: 3 Steps
            </CardTitle>
            <CardDescription>
              New here? Use this simple flow to finish your monthly timesheet in minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 pb-5 text-sm md:grid-cols-3">
            <button
              type="button"
              onClick={() => document.getElementById("entries-import-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="rounded-xl border border-border/70 bg-card/70 p-3 text-left transition hover:bg-accent/60"
            >
              <p className="font-semibold">1. Import or add entries</p>
              <p className="mt-1 text-muted-foreground">Bring past month data from Excel or create daily entries.</p>
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("entries-pdf-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="rounded-xl border border-border/70 bg-card/70 p-3 text-left transition hover:bg-accent/60"
            >
              <p className="font-semibold">2. Upload blank PDF</p>
              <p className="mt-1 text-muted-foreground">Pick your blank monthly timesheet PDF template.</p>
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("entries-pdf-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="rounded-xl border border-border/70 bg-card/70 p-3 text-left transition hover:bg-accent/60"
            >
              <p className="font-semibold">3. Auto fill & download</p>
              <p className="mt-1 text-muted-foreground">Generate your filled timesheet and submit confidently.</p>
            </button>
            <div className="md:col-span-3">
              <Button type="button" variant="ghost" size="sm" onClick={dismissWalkthrough}>
                Dismiss guide
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-amber-200/60 via-background to-lime-100/65 shadow-[0_18px_40px_-24px_rgba(132,204,22,0.28)] dark:from-amber-500/12 dark:to-lime-500/10 dark:shadow-[0_18px_40px_-24px_rgba(132,204,22,0.45)]">
          <CardHeader className="relative pb-2">
            <CardDescription className="font-medium text-amber-700 dark:text-amber-100/80">Schedule progress</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-100">
              {scheduleStats.loggedExpected}/{scheduleStats.expectedCount}
            </CardTitle>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-amber-200/70 dark:bg-amber-200/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-lime-500 transition-all"
                style={{ width: `${scheduleStats.progress}%` }}
              />
            </div>
            <p className="pt-1 text-xs font-medium text-amber-700/80 dark:text-amber-100/75">
              {scheduleStats.progress}% of expected Mon/Wed/Fri shifts logged
            </p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/65 bg-gradient-to-br from-amber-100/70 via-background to-orange-100/60 dark:from-amber-500/8 dark:to-orange-500/8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Missing Shift Check
            </CardTitle>
            <CardDescription>
              Based on your usual Mon/Wed/Fri schedule for the selected month.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            {scheduleStats.missing.length === 0 ? (
              <p className="text-emerald-700 dark:text-emerald-300">All expected shifts are logged. Nice work.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-amber-800 dark:text-amber-200">
                  {scheduleStats.missing.length} expected shift(s) missing.
                </p>
                <div className="flex flex-wrap gap-2">
                  {scheduleStats.missing.slice(0, 6).map((date) => (
                    <span key={date} className="rounded-full border border-amber-400/40 bg-amber-50 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                      {format(new Date(`${date}T00:00:00`), "MMM d (EEE)")}
                    </span>
                  ))}
                  {scheduleStats.missing.length > 6 && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      +{scheduleStats.missing.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/65 bg-gradient-to-br from-slate-100/70 via-background to-blue-100/60 dark:from-slate-500/8 dark:to-blue-500/8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-blue-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest import, export, PDF, and restore actions.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            {recentActions.length === 0 ? (
              <p className="text-muted-foreground">No recent actions yet.</p>
            ) : (
              <div className="space-y-2">
                {recentActions.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/70 bg-card/70 px-3 py-2">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.at}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
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
                onClick={onExportCsv}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-500/35 text-red-700 hover:bg-red-500/10 hover:text-red-800 dark:text-red-200 dark:hover:bg-red-500/15 dark:hover:text-red-100 sm:flex-none"
                onClick={onDeleteMonth}
                disabled={deletingMonth || entries.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deletingMonth ? "Deleting..." : "Delete Month"}
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
          <div
            id="entries-import-section"
            className="mb-5 rounded-xl border border-dashed border-cyan-500/25 bg-gradient-to-r from-cyan-100/65 via-background/80 to-sky-100/60 p-4 dark:border-cyan-300/20 dark:from-cyan-500/10 dark:via-background/70 dark:to-sky-500/10"
          >
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
                  className="w-full max-w-sm text-sm"
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

          <div
            id="entries-pdf-section"
            className="mb-5 rounded-xl border border-dashed border-indigo-500/25 bg-gradient-to-r from-indigo-100/65 via-background/80 to-blue-100/60 p-4 dark:border-indigo-300/20 dark:from-indigo-500/10 dark:via-background/70 dark:to-blue-500/10"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-100">Auto-Fill Monthly Timesheet PDF</p>
                <p className="text-xs text-slate-600 dark:text-slate-300/80">
                  Upload your blank monthly timesheet PDF template. We fill In/Out/Hours and break ranges from your selected month entries.
                </p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setTimesheetTemplateFile(e.target.files?.[0] ?? null)}
                  className="w-full max-w-sm text-sm"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Default layout mode: <span className="font-semibold capitalize">{timesheetLayoutMode}</span>
                </p>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300/80">
                  <input
                    type="checkbox"
                    checked={previewPdfBeforeDownload}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setPreviewPdfBeforeDownload(enabled);
                      try {
                        window.localStorage.setItem(
                          "entries_preview_pdf_before_download",
                          enabled ? "true" : "false",
                        );
                      } catch {
                        // ignore storage issues
                      }
                    }}
                  />
                  Preview PDF before download
                </label>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
                <Button className="flex-1 md:flex-none" onClick={() => onFillTimesheetPdf("auto")} disabled={fillingPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  {fillingPdf ? "Filling..." : "Auto Fill & Download"}
                </Button>
              </div>
            </div>
            <details className="mt-3 rounded-lg border border-indigo-500/20 bg-background/55 p-3 text-xs dark:bg-background/30">
              <summary className="cursor-pointer font-medium text-indigo-800 dark:text-indigo-100">
                Having alignment issues? Use advanced layout options
              </summary>
              <div className="mt-3 space-y-2">
                <p className="text-slate-600 dark:text-slate-300/80">
                  Shortcuts: <span className="font-semibold">N</span> new entry, <span className="font-semibold">E</span> export CSV, <span className="font-semibold">P</span> fill PDF
                </p>
                <p className="text-slate-600 dark:text-slate-300/80">
                  If values appear one week above or below, retry using one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-full sm:w-auto"
                    onClick={() => {
                      setTimesheetLayoutMode("standard");
                      void onFillTimesheetPdf("standard");
                    }}
                    disabled={fillingPdf}
                  >
                    Retry: Standard Month Start
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-full sm:w-auto"
                    onClick={() => {
                      setTimesheetLayoutMode("carry");
                      void onFillTimesheetPdf("carry");
                    }}
                    disabled={fillingPdf}
                  >
                    Retry: Carry-Over First Week
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-full sm:w-auto"
                    onClick={() => {
                      setTimesheetLayoutMode("auto");
                      void onFillTimesheetPdf("auto");
                    }}
                    disabled={fillingPdf}
                  >
                    Retry: Auto Detect
                  </Button>
                </div>
              </div>
            </details>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading entries...</p>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p>No entries for this month yet.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedEntry(null);
                    setOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Entry
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    document.getElementById("entries-import-section")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Import Excel
                </Button>
              </div>
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
