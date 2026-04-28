"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Coffee, Clock3, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addMinutesToHHmm, calcBreakMinutes, calcWorkedMinutes, formatTenthsDecimal, formatTime12h, minutesToHM, nowHHmm } from "@/lib/time";
import { timeEntrySchema, type TimeEntryInput } from "@/lib/validators";
import { type WorkSchedule } from "@/lib/work-schedule";

const defaultEntry: TimeEntryInput = {
  date: format(new Date(), "yyyy-MM-dd"),
  punchIn: "09:00",
  punchOut: "13:00",
  notes: "",
  breaks: [],
};

export function TimeEntryForm({
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initialValues?: TimeEntryInput;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: TimeEntryInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimeEntryInput>({
    resolver: zodResolver(timeEntrySchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: initialValues ?? defaultEntry,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "breaks" });

  const punchIn = useWatch({ control, name: "punchIn" });
  const punchOut = useWatch({ control, name: "punchOut" });
  const breaks = useWatch({ control, name: "breaks" }) ?? [];
  const date = useWatch({ control, name: "date" });

  const breakMinutes = calcBreakMinutes(breaks);
  const workedMinutes = calcWorkedMinutes({ punchIn, punchOut, breaks });
  const allValues = useWatch({ control });
  const hasInvalidShiftWindow = Boolean(punchIn && punchOut && punchOut <= punchIn);

  useEffect(() => {
    if (initialValues) return;

    try {
      const raw = window.localStorage.getItem("time_entry_draft");
      if (!raw) return;
      const parsed = JSON.parse(raw) as TimeEntryInput;
      if (!parsed || !parsed.date || !parsed.punchIn || !parsed.punchOut) return;
      reset(parsed);
    } catch {
      // ignore bad local draft
    }
  }, [initialValues, reset]);

  useEffect(() => {
    if (initialValues) return;
    if (!allValues?.date || !allValues?.punchIn || !allValues?.punchOut) return;

    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem("time_entry_draft", JSON.stringify(allValues));
      } catch {
        // ignore storage issues
      }
    }, 250);

    return () => window.clearTimeout(id);
  }, [allValues, initialValues]);

  useEffect(() => {
    let ignore = false;
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/profile");
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.profile?.workSchedule || ignore) return;
        setWorkSchedule(body.profile.workSchedule as WorkSchedule);
      } catch {
        // ignore profile fetch issues
      }
    };

    void fetchSchedule();
    return () => {
      ignore = true;
    };
  }, []);

  const setPreset = (start: string, end: string) => {
    setValue("punchIn", start, { shouldValidate: true });
    setValue("punchOut", end, { shouldValidate: true });
  };

  const applyPresetWithBreak = (start: string, end: string, breakStart: string, breakEnd: string, label: string) => {
    setValue("punchIn", start, { shouldValidate: true });
    setValue("punchOut", end, { shouldValidate: true });
    setValue("breaks", [{ start: breakStart, end: breakEnd }], { shouldValidate: true });
    toast.success(`Applied ${label}`);
  };

  const applyRegularSchedule = () => {
    if (!date) return;
    const day = new Date(`${date}T00:00:00`).getDay();
    const dayKey = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const)[day];
    const daySchedule = workSchedule?.[dayKey];

    if (!daySchedule || !daySchedule.enabled) {
      toast.message("No regular schedule set for this day. Update it in Settings.");
      return;
    }

    setValue("punchIn", daySchedule.start, { shouldValidate: true });
    setValue("punchOut", daySchedule.end, { shouldValidate: true });
    setValue(
      "breaks",
      [{ start: daySchedule.breakStart, end: daySchedule.breakEnd }],
      { shouldValidate: true },
    );
    toast.success(`Applied ${dayKey.toUpperCase()} regular schedule`);
  };

  const addBreakNow = () => {
    const start = nowHHmm();
    append({ start, end: addMinutesToHHmm(start, 15) });
  };

  const endLatestBreak = () => {
    if (!fields.length) return;
    const index = fields.length - 1;
    setValue(`breaks.${index}.end`, nowHHmm(), { shouldValidate: true });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <Card className="border border-border/60 bg-muted/15">
        <CardContent className="space-y-4 px-4 pb-4 pt-6 sm:px-5 sm:pb-5 sm:pt-7">
          <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick actions
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              className="h-auto min-h-20 flex-col items-start justify-center rounded-2xl border-primary/40 bg-primary/12 px-4 py-3 text-left text-[0.95rem] font-semibold text-primary hover:bg-primary/18"
              type="button"
              variant="outline"
              onClick={applyRegularSchedule}
            >
              <span className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary/80">
                <Sparkles className="h-3.5 w-3.5" />
                Smart
              </span>
              <span>Apply Regular Shift</span>
            </Button>
            <Button
              className="h-auto min-h-20 flex-col items-start justify-center rounded-2xl px-4 py-3 text-left text-[0.95rem] font-semibold"
              type="button"
              variant="outline"
              onClick={() => setValue("punchIn", nowHHmm(), { shouldValidate: true })}
            >
              <span className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Shift
              </span>
              <span>Start Shift Now</span>
            </Button>
            <Button
              className="h-auto min-h-20 flex-col items-start justify-center rounded-2xl px-4 py-3 text-left text-[0.95rem] font-semibold"
              type="button"
              variant="outline"
              onClick={() => setValue("punchOut", nowHHmm(), { shouldValidate: true })}
            >
              <span className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Shift
              </span>
              <span>End Shift Now</span>
            </Button>
            <Button
              className="h-auto min-h-20 flex-col items-start justify-center rounded-2xl px-4 py-3 text-left text-[0.95rem] font-semibold"
              type="button"
              variant="outline"
              onClick={addBreakNow}
            >
              <span className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Coffee className="h-3.5 w-3.5" />
                Break
              </span>
              <span>Start Break</span>
            </Button>
            <Button
              className="h-auto min-h-20 flex-col items-start justify-center rounded-2xl px-4 py-3 text-left text-[0.95rem] font-semibold sm:col-span-2 lg:col-span-2"
              type="button"
              variant="outline"
              onClick={endLatestBreak}
            >
              <span className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Coffee className="h-3.5 w-3.5" />
                Break
              </span>
              <span>End Latest Break</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyPresetWithBreak("09:00", "17:00", "12:30", "13:00", "Mon/Wed 9am-5pm preset")}
            >
              Mon/Wed 9am-5pm
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyPresetWithBreak("12:00", "17:00", "14:30", "15:00", "Fri 12pm-5pm preset")}
            >
              Fri 12pm-5pm
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreset("08:00", "12:00")}>
              8am-12pm
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreset("09:00", "13:00")}>
              9am-1pm
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreset("10:00", "14:00")}>
              10am-2pm
            </Button>
          </div>

          <div className="grid gap-2 rounded-xl bg-background/80 p-3 text-sm md:grid-cols-3">
            <p>
              Shift: <span className="font-semibold">{formatTime12h(punchIn)} - {formatTime12h(punchOut)}</span>
            </p>
            <p>
              Breaks: <span className="font-semibold">{minutesToHM(Math.max(0, breakMinutes))}</span>
            </p>
            <p>
              Worked: <span className="font-semibold text-primary">{minutesToHM(Math.max(0, workedMinutes))}</span>
              <span className="ml-2 text-xs text-muted-foreground">({formatTenthsDecimal(Math.max(0, workedMinutes))} hrs)</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="min-w-0 space-y-1">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" className="min-w-0" {...register("date")} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          {!errors.date && <p className="text-xs text-muted-foreground">Pick the exact work day this row should represent.</p>}
        </div>

        <div className="min-w-0 space-y-1">
          <Label htmlFor="punchIn">Punch In</Label>
          <Input id="punchIn" type="time" className="min-w-0" {...register("punchIn")} />
          {errors.punchIn && <p className="text-xs text-destructive">{errors.punchIn.message}</p>}
          {!errors.punchIn && <p className="text-xs text-muted-foreground">Use 24-hour time, for example `09:00`.</p>}
        </div>

        <div className="min-w-0 space-y-1">
          <Label htmlFor="punchOut">Punch Out</Label>
          <Input id="punchOut" type="time" className="min-w-0" {...register("punchOut")} />
          {errors.punchOut && <p className="text-xs text-destructive">{errors.punchOut.message}</p>}
          {!errors.punchOut && <p className="text-xs text-muted-foreground">Set when the shift ended, for example `17:00`.</p>}
        </div>
      </div>
      {hasInvalidShiftWindow && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Punch-out should be later than punch-in. Try adjusting one of the times.
        </p>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Break timeline</Label>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" size="sm" onClick={addBreakNow}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
            {fields.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => remove(fields.length - 1)}>
                <Minus className="mr-1 h-4 w-4" />
                Remove Last
              </Button>
            )}
          </div>
        </div>

        {fields.length === 0 && <p className="text-sm text-muted-foreground">No breaks logged yet.</p>}

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid min-w-0 grid-cols-1 items-center gap-2 rounded-lg border bg-card p-2 sm:grid-cols-[1fr_1fr_auto]"
            >
              <Input type="time" className="min-w-0" {...register(`breaks.${index}.start`)} />
              <Input type="time" className="min-w-0" {...register(`breaks.${index}.end`)} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="justify-self-end"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {breaks[index]?.start && breaks[index]?.end && breaks[index].end <= breaks[index].start && (
                <p className="text-xs text-amber-700 dark:text-amber-300 sm:col-span-3">
                  Break end should be later than break start.
                </p>
              )}
            </div>
          ))}
        </div>

        {errors.breaks && <p className="text-xs text-destructive">Please check break times.</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Shift notes</Label>
        <Textarea id="notes" placeholder="Tasks completed, reminders, supervisor requests..." {...register("notes")} />
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
