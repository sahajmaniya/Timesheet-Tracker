"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeEntryForm } from "@/components/forms/time-entry-form";
import type { TimeEntry } from "@/types/time-entry";
import type { TimeEntryInput } from "@/lib/validators";

function mapToInput(entry?: TimeEntry | null): TimeEntryInput | undefined {
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
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  entry?: TimeEntry | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const inputData = useMemo(() => mapToInput(entry), [entry]);

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

      toast.success(entry ? "Entry updated" : "Entry created");
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
        </DialogHeader>
        <TimeEntryForm
          initialValues={inputData}
          submitLabel={entry ? "Save changes" : "Create entry"}
          submitting={submitting}
          onSubmit={submit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
