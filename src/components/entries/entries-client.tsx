"use client";

import { eachDayOfInterval, endOfMonth, format, getDay, isAfter, startOfMonth } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileUp,
  History,
  Layers3,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { EntryDialog } from "@/components/entries/entry-dialog";
import { EntriesTable } from "@/components/entries/entries-table";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildDownloadFilename, getFilenameFromContentDisposition } from "@/lib/downloads";
import { minutesToHM, minutesToTenthsDecimal } from "@/lib/time";
import { DEFAULT_TIMESHEET_ROLE, timesheetRoleOptions, timesheetTemplates, type TimesheetRole } from "@/lib/timesheet-templates";
import type { TimeEntry } from "@/types/time-entry";
import type { TimeEntryInput } from "@/lib/validators";

type EntryValidationIssue = {
  id: string;
  level: "warning" | "error";
  message: string;
  date?: string;
};

type PdfPreferencePreset = {
  id: string;
  name: string;
  role: TimesheetRole;
  layoutMode: "auto" | "standard" | "carry";
  previewBeforeDownload: boolean;
};

type LastGeneratedPdf = {
  month: string;
  role: TimesheetRole;
  generatedAtIso: string;
};

function hhmmToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHhmm(total: number) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, total));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function sanitizePdfFilenameBase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/[^\w.-]/g, "")
    .replace(/^_+|_+$/g, "");
}

function EntriesTableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card md:block">
        <div className="grid grid-cols-7 gap-4 border-b border-border/70 px-4 py-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`head-${index}`} className="h-3 animate-pulse rounded bg-muted/70" />
          ))}
        </div>
        <div className="space-y-3 px-4 py-4">
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={`row-${row}`} className="grid grid-cols-7 gap-4">
              <div className="space-y-2">
                <div className="h-3 animate-pulse rounded bg-muted/70" />
                <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted/60" />
              </div>
              <div className="h-3 animate-pulse rounded bg-muted/70" />
              <div className="h-3 animate-pulse rounded bg-muted/70" />
              <div className="h-3 animate-pulse rounded bg-muted/70" />
              <div className="space-y-2">
                <div className="h-3 animate-pulse rounded bg-muted/70" />
                <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted/60" />
              </div>
              <div className="h-3 animate-pulse rounded bg-muted/60" />
              <div className="ml-auto h-3 w-10 animate-pulse rounded bg-muted/60" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {Array.from({ length: 4 }).map((_, card) => (
          <div key={`mobile-${card}`} className="rounded-xl border border-border/70 bg-card/80 p-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted/70" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted/60" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((__, cell) => (
                <div key={`cell-${cell}`} className="h-3 animate-pulse rounded bg-muted/70" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EntriesClient() {
  const confirm = useConfirm();
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
  const [timesheetRole, setTimesheetRole] = useState<TimesheetRole>(DEFAULT_TIMESHEET_ROLE);
  const [fillingPdf, setFillingPdf] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [previewPdfBeforeDownload, setPreviewPdfBeforeDownload] = useState(true);
  const [savedPresets, setSavedPresets] = useState<PdfPreferencePreset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [lastGenerated, setLastGenerated] = useState<LastGeneratedPdf | null>(null);
  const [showRoleHints, setShowRoleHints] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [bulkPunchIn, setBulkPunchIn] = useState("09:00");
  const [bulkPunchOut, setBulkPunchOut] = useState("13:00");
  const [bulkBreakStart, setBulkBreakStart] = useState("11:00");
  const [bulkBreakEnd, setBulkBreakEnd] = useState("11:30");
  const [bulkIncludeBreak, setBulkIncludeBreak] = useState(false);
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [creatingMissing, setCreatingMissing] = useState(false);
  const [remindersSnoozed, setRemindersSnoozed] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [pendingLayoutMode, setPendingLayoutMode] = useState<"auto" | "standard" | "carry">("auto");
  const [recentActions, setRecentActions] = useState<{ id: number; label: string; at: string }[]>([]);
  const selectedTemplate = timesheetTemplates[timesheetRole];
  const roleBehaviorHints = useMemo(() => {
    if (timesheetRole === "instructional_student_assistant") {
      return ["Total hours only", "No In/Out rows", "No weekly totals", "Fixed day slots"];
    }
    return ["In/Out rows", "Break-aware split", "Weekly totals"];
  }, [timesheetRole]);
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
      const stepRaw = window.localStorage.getItem("entries_walkthrough_step");
      if (stepRaw) setWalkthroughStep(Math.max(0, Math.min(2, Number(stepRaw) || 0)));
      const previewPref = window.localStorage.getItem("entries_preview_pdf_before_download");
      if (previewPref === "false") setPreviewPdfBeforeDownload(false);
      const rolePref = window.localStorage.getItem("entries_timesheet_role");
      if (rolePref && rolePref in timesheetTemplates) {
        setTimesheetRole(rolePref as TimesheetRole);
      }
      const presetsRaw = window.localStorage.getItem("entries_pdf_presets");
      if (presetsRaw) {
        const parsedPresets = JSON.parse(presetsRaw) as PdfPreferencePreset[];
        setSavedPresets(parsedPresets);
        if (parsedPresets.length > 0) {
          setShowRoleHints(false);
        }
      }
      const lastGeneratedRaw = window.localStorage.getItem("entries_last_generated_pdf");
      if (lastGeneratedRaw) {
        setLastGenerated(JSON.parse(lastGeneratedRaw) as LastGeneratedPdf);
        setShowRoleHints(false);
      }
      const hideRoleHintsRaw = window.localStorage.getItem("entries_hide_role_hints");
      if (hideRoleHintsRaw === "true") {
        setShowRoleHints(false);
      }
      const snoozeRaw = window.localStorage.getItem(`entries_reminder_snooze_${month}`);
      setRemindersSnoozed(snoozeRaw === "true");
    } catch {
      setShowWalkthrough(true);
    }
  }, [month, timesheetRole]);

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

  useEffect(() => {
    try {
      window.localStorage.setItem("entries_walkthrough_step", String(walkthroughStep));
    } catch {
      // ignore storage issues
    }
  }, [walkthroughStep]);

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

  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimeEntry>();
    for (const entry of entries) map.set(entry.date, entry);
    return map;
  }, [entries]);

  const monthHeatmap = useMemo(() => {
    const monthDate = new Date(`${month}-01T00:00:00`);
    const allDays = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate),
    });
    return allDays.map((day) => {
      const date = format(day, "yyyy-MM-dd");
      const entry = entriesByDate.get(date);
      const workedMinutes = entry?.workedMinutes ?? 0;
      const intensity =
        workedMinutes === 0
          ? 0
          : workedMinutes < 4 * 60
            ? 1
            : workedMinutes < 7 * 60
              ? 2
              : 3;
      return { date, dayLabel: format(day, "d"), weekday: getDay(day), intensity, hasEntry: Boolean(entry) };
    });
  }, [entriesByDate, month]);

  const validationIssues = useMemo<EntryValidationIssue[]>(() => {
    const issues: EntryValidationIssue[] = [];
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    for (const entry of entries) {
      const start = toMinutes(entry.punchIn);
      const end = toMinutes(entry.punchOut);
      if (end <= start) {
        issues.push({
          id: `${entry.id}-window`,
          level: "error",
          date: entry.date,
          message: "Punch-out is not after punch-in.",
        });
      }
      if (entry.workedMinutes <= 0) {
        issues.push({
          id: `${entry.id}-worked`,
          level: "error",
          date: entry.date,
          message: "Worked minutes are zero or negative.",
        });
      }
      if (entry.workedMinutes > 12 * 60) {
        issues.push({
          id: `${entry.id}-long`,
          level: "warning",
          date: entry.date,
          message: "Worked duration is above 12 hours.",
        });
      }

      const sortedBreaks = [...entry.breaks].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sortedBreaks.length; i++) {
        const item = sortedBreaks[i];
        const breakStart = toMinutes(item.start);
        const breakEnd = toMinutes(item.end);
        if (breakEnd <= breakStart) {
          issues.push({
            id: `${entry.id}-break-window-${i}`,
            level: "error",
            date: entry.date,
            message: `Break ${i + 1} has invalid start/end order.`,
          });
        }
        if (breakStart < start || breakEnd > end) {
          issues.push({
            id: `${entry.id}-break-outside-${i}`,
            level: "warning",
            date: entry.date,
            message: `Break ${i + 1} extends outside shift window.`,
          });
        }
        if (i > 0) {
          const prev = sortedBreaks[i - 1];
          const prevEnd = toMinutes(prev.end);
          if (breakStart < prevEnd) {
            issues.push({
              id: `${entry.id}-break-overlap-${i}`,
              level: "error",
              date: entry.date,
              message: `Break ${i} overlaps with break ${i + 1}.`,
            });
          }
        }
      }
    }

    return issues;
  }, [entries]);

  const blockingValidationCount = useMemo(
    () => validationIssues.filter((item) => item.level === "error").length,
    [validationIssues],
  );

  const confirmValidationForAction = useCallback(
    async (actionLabel: string) => {
      if (blockingValidationCount === 0) return true;
      return confirm({
        title: "Validation Issues Found",
        description: `${blockingValidationCount} critical issue(s) found. Continue ${actionLabel} anyway?`,
        confirmText: "Continue",
      });
    },
    [blockingValidationCount, confirm],
  );

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

  const onExportCsv = useCallback(async () => {
    const ok = await confirmValidationForAction("with CSV export");
    if (!ok) return;
    window.open(`/api/entries/export?month=${month}`, "_blank");
    toast.success("CSV export started", {
      description: `Your ${month} file opened in a new tab.`,
    });
    addRecentAction(`Exported CSV (${month})`);
  }, [addRecentAction, confirmValidationForAction, month]);

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
        {
          description: "Your table was refreshed with the latest imported rows.",
        },
      );
      addRecentAction(`Imported Excel (${summary.created} new, ${summary.updated} updated)`);
      setImportFile(null);
      await fetchEntries();
    } finally {
      setImporting(false);
    }
  };

  const saveCurrentPreset = () => {
    const trimmed = presetName.trim();
    if (!trimmed) {
      toast.error("Enter a preset name first.");
      return;
    }

    const preset: PdfPreferencePreset = {
      id: `${timesheetRole}-${trimmed.toLowerCase().replace(/\s+/g, "-")}`,
      name: trimmed,
      role: timesheetRole,
      layoutMode: timesheetLayoutMode,
      previewBeforeDownload: previewPdfBeforeDownload,
    };
    const next = [preset, ...savedPresets.filter((item) => item.id !== preset.id)].slice(0, 12);
    setSavedPresets(next);
    setPresetName(trimmed);
    try {
      window.localStorage.setItem("entries_pdf_presets", JSON.stringify(next));
    } catch {
      // ignore storage issues
    }
    toast.success(`Preset "${trimmed}" saved.`, {
      description: "Use the dropdown anytime to re-apply this setup.",
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = savedPresets.find((item) => item.id === presetId);
    if (!preset) return;
    setTimesheetRole(preset.role);
    setTimesheetLayoutMode(preset.layoutMode);
    setPreviewPdfBeforeDownload(preset.previewBeforeDownload);
    setPresetName(preset.name);
    toast.success(`Applied preset "${preset.name}".`, {
      description: "Role, layout mode, and preview preference were updated.",
    });
  };

  const removePreset = (presetId: string) => {
    const next = savedPresets.filter((item) => item.id !== presetId);
    setSavedPresets(next);
    try {
      window.localStorage.setItem("entries_pdf_presets", JSON.stringify(next));
    } catch {
      // ignore storage issues
    }
  };

  const downloadSampleImportCsv = () => {
    const csv = [
      "Date,Start Time,End Time,Break Start,Break End,Notes",
      `${month}-03,09:00,13:00,11:00,11:15,Sample entry`,
      `${month}-05,09:30,14:00,12:00,12:30,Imported template row`,
      `${month}-07,10:00,15:00,,,No break row example`,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet_import_sample_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const autoFixValidation = async () => {
    const fixable = entries.filter((entry) => validationIssues.some((issue) => issue.date === entry.date));
    if (fixable.length === 0) {
      toast.message("No fixable issues found.");
      return;
    }
    const ok = await confirm({
      title: "Auto-fix Common Issues?",
      description: `Attempt fixes for ${fixable.length} entries (invalid windows/break overlaps).`,
      confirmText: "Auto-fix",
    });
    if (!ok) return;

    setAutoFixing(true);
    let fixed = 0;
    try {
      for (const entry of fixable) {
        let changed = false;
        const punchIn = entry.punchIn;
        let punchOut = entry.punchOut;

        if (hhmmToMinutes(punchOut) <= hhmmToMinutes(punchIn)) {
          punchOut = minutesToHhmm(hhmmToMinutes(punchIn) + 4 * 60);
          changed = true;
        }

        const normalizedBreaks = [...entry.breaks]
          .map((item) => ({ start: item.start, end: item.end }))
          .filter((item) => hhmmToMinutes(item.end) > hhmmToMinutes(item.start))
          .filter((item) => hhmmToMinutes(item.start) >= hhmmToMinutes(punchIn) && hhmmToMinutes(item.end) <= hhmmToMinutes(punchOut))
          .sort((a, b) => a.start.localeCompare(b.start));

        const nonOverlapping: Array<{ start: string; end: string }> = [];
        for (const br of normalizedBreaks) {
          const prev = nonOverlapping[nonOverlapping.length - 1];
          if (!prev || hhmmToMinutes(br.start) >= hhmmToMinutes(prev.end)) {
            nonOverlapping.push(br);
          } else {
            changed = true;
          }
        }
        if (nonOverlapping.length !== entry.breaks.length) changed = true;

        if (!changed) continue;

        const res = await fetch(`/api/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: entry.date,
            punchIn,
            punchOut,
            notes: entry.notes,
            breaks: nonOverlapping,
          }),
        });
        if (res.ok) fixed += 1;
      }
      if (fixed > 0) {
        toast.success(`Auto-fixed ${fixed} entries.`);
        addRecentAction(`Auto-fixed ${fixed} entries`);
        await fetchEntries();
      } else {
        toast.message("No entries were changed.");
      }
    } finally {
      setAutoFixing(false);
    }
  };

  const applyBulkUpdate = async () => {
    if (bulkSelectedIds.length === 0) {
      toast.error("Select at least one entry for bulk edit.");
      return;
    }

    const ok = await confirm({
      title: "Apply Bulk Edit?",
      description: `Apply this time pattern to ${bulkSelectedIds.length} selected entries.`,
      confirmText: "Apply",
    });
    if (!ok) return;

    setApplyingBulk(true);
    let updated = 0;
    try {
      for (const id of bulkSelectedIds) {
        const entry = entries.find((item) => item.id === id);
        if (!entry) continue;
        const breaks = bulkIncludeBreak ? [{ start: bulkBreakStart, end: bulkBreakEnd }] : [];
        const res = await fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: entry.date,
            punchIn: bulkPunchIn,
            punchOut: bulkPunchOut,
            notes: entry.notes,
            breaks,
          }),
        });
        if (res.ok) updated += 1;
      }
      toast.success(`Updated ${updated} entries.`);
      addRecentAction(`Bulk updated ${updated} entries`);
      setBulkSelectedIds([]);
      await fetchEntries();
    } finally {
      setApplyingBulk(false);
    }
  };

  const createSuggestedMissingEntries = async () => {
    const candidates = scheduleStats.missing.slice(0, 8);
    if (candidates.length === 0) {
      toast.message("No missing expected shifts.");
      return;
    }
    setCreatingMissing(true);
    let created = 0;
    try {
      for (const date of candidates) {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            punchIn: "09:00",
            punchOut: "13:00",
            notes: "Auto-created reminder entry",
            breaks: [],
          }),
        });
        if (res.ok) created += 1;
      }
      if (created > 0) {
        toast.success(`Created ${created} reminder entries.`);
        addRecentAction(`Created ${created} reminder entries`);
        await fetchEntries();
      } else {
        toast.message("No new entries created (they may already exist).");
      }
    } finally {
      setCreatingMissing(false);
    }
  };

  const snoozeReminders = () => {
    setRemindersSnoozed(true);
    try {
      window.localStorage.setItem(`entries_reminder_snooze_${month}`, "true");
    } catch {
      // ignore storage issues
    }
  };

  const submissionChecklist = useMemo(() => {
    const items = [
      { id: "template", label: "Blank PDF template uploaded", done: Boolean(timesheetTemplateFile) },
      { id: "entries", label: "At least one entry in selected month", done: entries.length > 0 },
      { id: "errors", label: "No critical validation errors", done: blockingValidationCount === 0 },
      { id: "role", label: "Timesheet type selected", done: Boolean(timesheetRole) },
    ];
    return { items, allDone: items.every((item) => item.done) };
  }, [blockingValidationCount, entries.length, timesheetRole, timesheetTemplateFile]);

  const onFillTimesheetPdf = useCallback(async (layoutOverride?: "auto" | "standard" | "carry", bypassChecklist = false) => {
    const selectedLayoutMode = layoutOverride ?? timesheetLayoutMode;
    if (!bypassChecklist) {
      setPendingLayoutMode(selectedLayoutMode);
      setChecklistOpen(true);
      return;
    }

    if (!timesheetTemplateFile) {
      toast.error("Select a blank timesheet PDF first.");
      return;
    }
    const allowed = await confirmValidationForAction("with PDF generation");
    if (!allowed) return;

    const fileName = timesheetTemplateFile.name.toLowerCase();
    const looksIsa = fileName.includes("isa") || fileName.includes("instructional");
    const looksSaOrFull = fileName.includes("sa") || fileName.includes("student") || fileName.includes("full");
    if (timesheetRole === "instructional_student_assistant" && looksSaOrFull && !looksIsa) {
      const ok = await confirm({
        title: "Template Type Mismatch?",
        description: "Selected Timesheet Type is ISA, but this filename looks like SA/Full-Time. Continue anyway?",
        confirmText: "Continue",
      });
      if (!ok) return;
    }
    if (timesheetRole !== "instructional_student_assistant" && looksIsa && !looksSaOrFull) {
      const ok = await confirm({
        title: "Template Type Mismatch?",
        description: "Selected Timesheet Type is SA/Full-Time, but this filename looks like ISA. Continue anyway?",
        confirmText: "Continue",
      });
      if (!ok) return;
    }

    const formData = new FormData();
    formData.append("file", timesheetTemplateFile);
    formData.append("month", month);
    formData.append("layoutMode", selectedLayoutMode);
    formData.append("timesheetRole", timesheetRole);

    setFillingPdf(true);
    try {
      const res = await fetch("/api/entries/fill-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || "Could not fill the PDF template. Try switching Timesheet Type or layout mode.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = res.headers.get("content-disposition");
      const filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);
      const customNameBase = sanitizePdfFilenameBase(presetName);
      const customFilename = customNameBase
        ? `${customNameBase.toLowerCase().endsWith(".pdf") ? customNameBase.slice(0, -4) : customNameBase}.pdf`
        : null;
      const filename =
        customFilename ||
        filenameFromHeader ||
        buildDownloadFilename({
          kind: "timesheet_filled_pdf",
          month,
          extension: "pdf",
        });
      a.download = filename;

      if (previewPdfBeforeDownload) {
        window.open(url, "_blank", "noopener,noreferrer");
        const shouldDownload = await confirm({
          title: "Download Filled PDF?",
          description: "Preview opened in a new tab. Do you also want to download this PDF now?",
          confirmText: "Download",
          cancelText: "Not now",
        });
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
          ? "Filled timesheet PDF ready."
          : `Filled timesheet PDF ready (${selectedLayoutMode} layout).`,
        {
          description: `Saved as ${filename}`,
        },
      );
      const generated: LastGeneratedPdf = {
        month,
        role: timesheetRole,
        generatedAtIso: new Date().toISOString(),
      };
      setLastGenerated(generated);
      try {
        window.localStorage.setItem("entries_last_generated_pdf", JSON.stringify(generated));
      } catch {
        // ignore storage issues
      }
      addRecentAction(`Generated ${timesheetTemplates[timesheetRole].label} PDF (${month}, ${selectedLayoutMode})`);
    } finally {
      setFillingPdf(false);
    }
  }, [addRecentAction, confirm, confirmValidationForAction, month, presetName, previewPdfBeforeDownload, timesheetLayoutMode, timesheetRole, timesheetTemplateFile]);

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
        void onExportCsv();
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

    const ok = await confirm({
      title: "Delete All Entries (This Month)?",
      description: `Delete all ${entries.length} entries for ${month}? This cannot be undone.`,
      confirmText: "Delete all",
      destructive: true,
    });
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
    <div className="space-y-6 pb-24 md:pb-0">
      {showWalkthrough && (
        <Card className="border-primary/25 bg-gradient-to-r from-primary/12 via-background to-sky-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Start Tour
            </CardTitle>
            <CardDescription>
              Step {walkthroughStep + 1} of 3
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-5 text-sm">
            {walkthroughStep === 0 && (
              <button
                type="button"
                onClick={() => document.getElementById("entries-import-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="w-full rounded-xl border border-border/70 bg-card/70 p-3 text-left transition hover:bg-accent/60"
              >
                <p className="font-semibold">1. Import or add entries</p>
                <p className="mt-1 text-muted-foreground">Bring past month data from Excel or create daily entries.</p>
              </button>
            )}
            {walkthroughStep === 1 && (
              <button
                type="button"
                onClick={() => document.getElementById("entries-pdf-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="w-full rounded-xl border border-border/70 bg-card/70 p-3 text-left transition hover:bg-accent/60"
              >
                <p className="font-semibold">2. Upload blank PDF</p>
                <p className="mt-1 text-muted-foreground">Pick your blank monthly timesheet PDF template and type.</p>
              </button>
            )}
            {walkthroughStep === 2 && (
              <button
                type="button"
                onClick={() => document.getElementById("entries-pdf-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="w-full rounded-xl border border-border/70 bg-card/70 p-3 text-left transition hover:bg-accent/60"
              >
                <p className="font-semibold">3. Run checklist and generate</p>
                <p className="mt-1 text-muted-foreground">Review checklist, auto-fill PDF, and optionally preview before download.</p>
              </button>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={walkthroughStep === 0}
                  onClick={() => setWalkthroughStep((prev) => Math.max(0, prev - 1))}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={walkthroughStep === 2}
                  onClick={() => setWalkthroughStep((prev) => Math.min(2, prev + 1))}
                >
                  Next
                </Button>
              </div>
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

      <Card className="border-border/65 bg-gradient-to-br from-teal-100/60 via-background to-sky-100/60 dark:from-teal-500/8 dark:to-sky-500/8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck2 className="h-4 w-4 text-teal-600 dark:text-teal-300" />
            Month Activity Heatmap
          </CardTitle>
          <CardDescription>Darker cells mean longer worked hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {monthHeatmap.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  const entry = entriesByDate.get(day.date);
                  if (entry) {
                    setSelectedEntry(entry);
                    setOpen(true);
                  } else {
                    setSelectedEntry(null);
                    setOpen(true);
                  }
                }}
                title={day.date}
                className={`h-8 rounded-md text-[11px] font-medium transition ${
                  day.intensity === 0
                    ? "border border-border/70 bg-background text-muted-foreground"
                    : day.intensity === 1
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100"
                      : day.intensity === 2
                        ? "bg-emerald-300 text-emerald-900 dark:bg-emerald-500/40 dark:text-emerald-50"
                        : "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950"
                }`}
              >
                {day.dayLabel}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: tap any day to open edit/create entry for that date.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/65 bg-gradient-to-br from-rose-100/60 via-background to-amber-100/60 dark:from-rose-500/8 dark:to-amber-500/8">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            Data Validation
          </CardTitle>
          <CardDescription>We check for time conflicts and missing data before export.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 text-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void autoFixValidation()}
              disabled={autoFixing || validationIssues.length === 0}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              {autoFixing ? "Fixing..." : "Auto-fix common issues"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkMode((prev) => !prev)}
            >
              <Layers3 className="mr-2 h-4 w-4" />
              {bulkMode ? "Exit bulk edit" : "Enter bulk edit"}
            </Button>
          </div>
          {validationIssues.length === 0 ? (
            <p className="text-emerald-700 dark:text-emerald-300">No issues found for this month.</p>
          ) : (
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-rose-700 dark:text-rose-200">{blockingValidationCount}</span> critical
                and{" "}
                <span className="font-semibold text-amber-700 dark:text-amber-200">
                  {validationIssues.length - blockingValidationCount}
                </span>{" "}
                warning issues found.
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {validationIssues.slice(0, 8).map((issue) => (
                  <div
                    key={issue.id}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      issue.level === "error"
                        ? "border-rose-500/35 bg-rose-500/8 text-rose-900 dark:text-rose-100"
                        : "border-amber-500/35 bg-amber-500/8 text-amber-900 dark:text-amber-100"
                    }`}
                  >
                    <p className="font-semibold">{issue.date ?? "Entry"}</p>
                    <p>{issue.message}</p>
                  </div>
                ))}
                {validationIssues.length > 8 && (
                  <div className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
                    +{validationIssues.length - 8} more issues in this month.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            ) : remindersSnoozed ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">Reminders snoozed for this month.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRemindersSnoozed(false);
                    try {
                      window.localStorage.removeItem(`entries_reminder_snooze_${month}`);
                    } catch {
                      // ignore storage issues
                    }
                  }}
                >
                  <BellRing className="mr-2 h-4 w-4" />
                  Resume reminders
                </Button>
              </div>
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
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void createSuggestedMissingEntries()}
                    disabled={creatingMissing}
                  >
                    <BellRing className="mr-2 h-4 w-4" />
                    {creatingMissing ? "Creating..." : "Create Missing Shift Drafts"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={snoozeReminders}>
                    Snooze this month
                  </Button>
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
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-slate-800 via-sky-700 to-indigo-700 bg-clip-text text-transparent dark:from-slate-100 dark:via-sky-100 dark:to-indigo-100">Entries</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300/75">Faster monthly logging and edits.</CardDescription>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={onExportCsv}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="w-full border-red-500/35 text-red-700 hover:bg-red-500/10 hover:text-red-800 dark:text-red-200 dark:hover:bg-red-500/15 dark:hover:text-red-100 sm:w-auto"
                onClick={onDeleteMonth}
                disabled={deletingMonth || entries.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deletingMonth ? "Deleting..." : "Delete All Entries (This Month)"}
              </Button>
              <Button
                className="w-full sm:w-auto"
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

        <CardContent className="space-y-4 pt-0">
          <div
            id="entries-import-section"
            className="rounded-xl border border-dashed border-cyan-500/25 bg-gradient-to-r from-cyan-100/65 via-background/80 to-sky-100/60 p-3 sm:p-4 dark:border-cyan-300/20 dark:from-cyan-500/10 dark:via-background/70 dark:to-sky-500/10"
          >
            <div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-cyan-800 dark:text-cyan-100">Import Previous Months (.xlsx)</p>
                <p className="text-xs text-slate-600 dark:text-slate-300/80">
                  Supports your timesheet template with Date, Start Time, End Time, Break Start, Break End.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="w-full max-w-sm text-sm file:mr-3 file:rounded-md file:border file:border-cyan-500/35 file:bg-cyan-500/10 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-cyan-900 hover:file:bg-cyan-500/15 dark:file:border-cyan-300/30 dark:file:text-cyan-100"
                />
              </div>

              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:flex md:w-auto md:items-center md:justify-end">
                <select
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value === "skip" ? "skip" : "overwrite")}
                  className="h-10 min-w-0 rounded-md border border-cyan-500/30 bg-background/90 px-3 text-sm md:w-56 dark:border-cyan-300/25 dark:bg-background/80"
                >
                  <option value="overwrite">Overwrite existing dates</option>
                  <option value="skip">Skip existing dates</option>
                </select>
                <Button className="w-full md:w-auto" onClick={onImportWorkbook} disabled={importing}>
                  <FileUp className="mr-2 h-4 w-4" />
                  {importing ? "Importing..." : "Import Excel"}
                </Button>
              </div>
            </div>
          </div>

          <div
            id="entries-pdf-section"
            className="rounded-xl border border-dashed border-indigo-500/25 bg-gradient-to-r from-indigo-100/65 via-background/80 to-blue-100/60 p-3 sm:p-4 dark:border-indigo-300/20 dark:from-indigo-500/10 dark:via-background/70 dark:to-blue-500/10"
          >
            <div className="flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-100">Auto-Fill Monthly Timesheet PDF</p>
                <p className="text-xs text-slate-600 dark:text-slate-300/80">
                  Upload your blank monthly timesheet PDF template. We fill In/Out/Hours and break ranges from your selected month entries.
                </p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setTimesheetTemplateFile(e.target.files?.[0] ?? null)}
                  className="w-full max-w-sm text-sm file:mr-3 file:rounded-md file:border file:border-indigo-500/35 file:bg-indigo-500/10 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-indigo-900 hover:file:bg-indigo-500/15 dark:file:border-indigo-300/30 dark:file:text-indigo-100"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Timesheet Type: <span className="font-semibold">{selectedTemplate.label}</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Default layout mode: <span className="font-semibold capitalize">{timesheetLayoutMode}</span>
                </p>
                <select
                  value={timesheetRole}
                  onChange={(e) => {
                    const selectedRole =
                      e.target.value in timesheetTemplates
                        ? (e.target.value as TimesheetRole)
                        : DEFAULT_TIMESHEET_ROLE;
                    setTimesheetRole(selectedRole);
                    setTimesheetLayoutMode("auto");
                    try {
                      window.localStorage.setItem("entries_timesheet_role", selectedRole);
                    } catch {
                      // ignore storage issues
                    }
                  }}
                  className="h-10 w-full max-w-sm rounded-md border border-indigo-500/30 bg-background/90 px-3 text-sm dark:border-indigo-300/25 dark:bg-background/80"
                >
                  {timesheetRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedTemplate.description}
                </p>
                {showRoleHints && (
                  <div className="max-w-sm pt-1">
                    <div className="flex flex-wrap gap-1">
                      {roleBehaviorHints.map((hint) => (
                        <span
                          key={hint}
                          className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-900 dark:text-indigo-100"
                        >
                          {hint}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-1 text-[10px] text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
                      onClick={() => {
                        setShowRoleHints(false);
                        try {
                          window.localStorage.setItem("entries_hide_role_hints", "true");
                        } catch {
                          // ignore storage issues
                        }
                      }}
                    >
                      Hide tips
                    </button>
                  </div>
                )}
                {lastGenerated && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Last generated: {format(new Date(lastGenerated.generatedAtIso), "MMM d, yyyy h:mm a")} (
                    {lastGenerated.month}, {timesheetTemplates[lastGenerated.role].label})
                  </p>
                )}
                <div className="grid max-w-sm grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name (e.g. ISA Payroll)"
                    className="h-9 text-xs"
                  />
                  <Button type="button" variant="outline" className="h-9 text-xs" onClick={saveCurrentPreset}>
                    Save Preset
                  </Button>
                </div>
                {savedPresets.length > 0 && (
                  <div className="flex max-w-sm flex-wrap gap-2">
                    <select
                      className="h-9 min-w-0 flex-1 rounded-md border border-indigo-500/30 bg-background/90 px-2 text-xs dark:border-indigo-300/25"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) applyPreset(e.target.value);
                        e.currentTarget.value = "";
                      }}
                    >
                      <option value="" disabled>Apply saved preset</option>
                      {savedPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} ({timesheetTemplates[preset.role].label})
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-9 text-xs"
                      onClick={() => removePreset(savedPresets[0].id)}
                    >
                      Remove first
                    </Button>
                  </div>
                )}
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
                  Open PDF preview before saving
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Checklist: {submissionChecklist.items.filter((item) => item.done).length}/{submissionChecklist.items.length} complete
                </p>
              </div>

              <div className="grid w-full grid-cols-1 gap-2 md:flex md:w-auto md:items-center md:justify-end">
                <Button className="w-full md:w-auto" onClick={() => onFillTimesheetPdf("auto")} disabled={fillingPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  {fillingPdf ? "Generating..." : "Generate Timesheet PDF"}
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
                    Try Standard Layout
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
                    Try Carry-Over Layout
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
                    Try Auto Layout
                  </Button>
                </div>
              </div>
            </details>
          </div>

          {bulkMode && entries.length > 0 && (
            <div className="rounded-xl border border-dashed border-violet-500/30 bg-violet-50/50 p-3 dark:bg-violet-500/10">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">Bulk Edit Mode</p>
              <p className="mt-1 text-xs text-violet-800/80 dark:text-violet-200/80">
                Select dates, set one pattern, and apply in one action.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <Input type="time" value={bulkPunchIn} onChange={(e) => setBulkPunchIn(e.target.value)} />
                <Input type="time" value={bulkPunchOut} onChange={(e) => setBulkPunchOut(e.target.value)} />
                <Input type="time" value={bulkBreakStart} onChange={(e) => setBulkBreakStart(e.target.value)} />
                <Input type="time" value={bulkBreakEnd} onChange={(e) => setBulkBreakEnd(e.target.value)} />
                <label className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 text-xs">
                  <input
                    type="checkbox"
                    checked={bulkIncludeBreak}
                    onChange={(e) => setBulkIncludeBreak(e.target.checked)}
                  />
                  Include break
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {entries.slice(0, 20).map((entry) => {
                  const selected = bulkSelectedIds.includes(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() =>
                        setBulkSelectedIds((prev) =>
                          selected ? prev.filter((id) => id !== entry.id) : [...prev, entry.id],
                        )
                      }
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        selected
                          ? "border-violet-500 bg-violet-500/15 text-violet-900 dark:text-violet-100"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {entry.date}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" onClick={() => void applyBulkUpdate()} disabled={applyingBulk}>
                  <Layers3 className="mr-2 h-4 w-4" />
                  {applyingBulk ? "Applying..." : `Apply to ${bulkSelectedIds.length} selected`}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setBulkSelectedIds([])}>
                  Clear selection
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <EntriesTableSkeleton />
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p>No entries for this month yet.</p>
              <p className="mt-2 text-xs">Start with a sample import file or add your first shift manually.</p>
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
                  onClick={downloadSampleImportCsv}
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Download sample CSV
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

      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Submission Checklist
            </DialogTitle>
            <DialogDescription>Review these items before generating your monthly PDF.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {submissionChecklist.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-sm">
                <span className={item.done ? "text-emerald-600" : "text-amber-500"}>
                  {item.done ? "✓" : "!"}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setChecklistOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setChecklistOpen(false);
                void onFillTimesheetPdf(pendingLayoutMode, true);
              }}
            >
              Continue Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 md:hidden">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-lg backdrop-blur">
          <Button
            type="button"
            variant="outline"
            className="h-10 text-xs"
            onClick={() => {
              setSelectedEntry(null);
              setOpen(true);
            }}
          >
            Add
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 text-xs"
            onClick={() => document.getElementById("entries-import-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Import
          </Button>
          <Button
            type="button"
            className="h-10 text-xs"
            onClick={() => document.getElementById("entries-pdf-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
