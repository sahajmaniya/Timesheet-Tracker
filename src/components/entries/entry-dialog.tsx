"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeEntryForm } from "@/components/forms/time-entry-form";
import { getUsFederalHolidayName } from "@/lib/holidays";
import type { TimeEntry } from "@/types/time-entry";
import type { TimeEntryInput } from "@/lib/validators";

function mapToInput(entry?: TimeEntry | null, initialDate?: string | null): TimeEntryInput | undefined {
  if (!entry && !initialDate) return undefined;
  if (!entry && initialDate) {
    return {
      date: initialDate,
      punchIn: "09:00",
      punchOut: "13:00",
      notes: "",
      breaks: [],
    };
  }
  if (!entry) return undefined;

  return {
    date: entry.date,
    punchIn: entry.punchIn,
    punchOut: entry.punchOut,
    notes: entry.notes,
    breaks: entry.breaks.map((b) => ({ id: b.id, start: b.start, end: b.end })),
  };
}

export function EntryDialog({
  open,
  entry,
  initialDate,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  entry?: TimeEntry | null;
  initialDate?: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const inputData = useMemo(() => mapToInput(entry, initialDate), [entry, initialDate]);
  const selectedDate = entry?.date ?? initialDate ?? null;
  const fallbackHolidayName = useMemo(() => {
    if (!selectedDate) return null;
    return getUsFederalHolidayName(selectedDate);
  }, [selectedDate]);
  const [holidayName, setHolidayName] = useState<string | null>(fallbackHolidayName);

  useEffect(() => {
    setHolidayName(fallbackHolidayName);
  }, [fallbackHolidayName]);

  useEffect(() => {
    let ignore = false;
    if (!selectedDate) return;
    const year = Number(selectedDate.slice(0, 4));
    if (!Number.isFinite(year)) return;

    const fetchHoliday = async () => {
      try {
        const res = await fetch(`/api/holidays?year=${year}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok || ignore) return;
        const nextName = (body?.holidays as Record<string, string> | undefined)?.[selectedDate] ?? null;
        setHolidayName(nextName);
      } catch {
        // keep local fallback
      }
    };

    void fetchHoliday();
    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  const submit = async (values: TimeEntryInput) => {
    setSubmitting(true);
    try {
      const endpoint = entry ? `/api/entries/${entry.id}` : "/api/entries";
      const method = entry ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not save entry");
        return;
      }

      toast.success(entry ? "Entry updated" : "Entry created", {
        description: entry ? "Your timesheet row was saved successfully." : "Your new row is now included in monthly totals.",
      });
      if (!entry) {
        try {
          window.localStorage.removeItem("time_entry_draft");
        } catch {
          // ignore storage issues
        }
      }
      onOpenChange(false);
      await onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit time entry" : "New time entry"}</DialogTitle>
          <DialogDescription>
            Use quick actions for faster logging, then fine-tune as needed.
          </DialogDescription>
          {holidayName && selectedDate && (
            <p className="mt-1 rounded-md border border-amber-300/60 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900 dark:border-amber-300/25 dark:bg-amber-500/10 dark:text-amber-100">
              Public holiday on {selectedDate}: {holidayName}
            </p>
          )}
        </DialogHeader>
        <TimeEntryForm
          key={`${entry?.id ?? "new"}-${initialDate ?? "today"}`}
          initialValues={inputData}
          holidayName={holidayName}
          submitLabel={entry ? "Save changes" : "Create entry"}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
