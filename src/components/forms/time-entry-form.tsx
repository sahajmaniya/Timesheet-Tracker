"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Coffee, Clock3, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { scheduledPositionForDate } from "@/components/positions/use-positions";
import {
  addMinutesToHHmm,
  calcBreakMinutes,
  calcWorkedMinutes,
  entryTenths,
  formatTime12h,
  minutesBetween,
  minutesToHM,
  minutesToTenthsDecimal,
  nowHHmm,
  workedSegments,
} from "@/lib/time";
import { timesheetTemplates } from "@/lib/timesheet-templates";
import { timeEntrySchema, type TimeEntryInput } from "@/lib/validators";
import { weekdayKeys } from "@/lib/work-schedule";
import type { Position } from "@/types/position";

type WorkSession = { start: string; end: string };

function toHHmm(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

/** Work sessions of a day: the shift split at its gaps (stored as breaks). */
function toSessions(punchIn: string, punchOut: string, breaks: { start: string; end: string }[]): WorkSession[] {
  const segments = workedSegments({ punchIn, punchOut, breaks });
  if (segments.length === 0) return [{ start: punchIn, end: punchOut }];
  return segments.map((segment) => ({ start: toHHmm(segment.start), end: toHHmm(segment.end) }));
}

function sessionsError(sessions: WorkSession[]) {
  const sorted = [...sessions].sort((a, b) => a.start.localeCompare(b.start));
  for (let i = 0; i < sorted.length; i++) {
    if (!sorted[i].start || !sorted[i].end) return "Fill in every session's start and end.";
    if (sorted[i].end <= sorted[i].start) return "Each session must end after it starts.";
    if (i > 0 && sorted[i].start < sorted[i - 1].end) return "Sessions can't overlap.";
  }
  return null;
}

const defaultEntry: TimeEntryInput = {
  date: format(new Date(), "yyyy-MM-dd"),
  punchIn: "09:00",
  punchOut: "13:00",
  notes: "",
  breaks: [],
};

export function TimeEntryForm({
  initialValues,
  positions,
  defaultPositionId,
  autoSelectPosition = false,
  isEditing = false,
  holidayName,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initialValues?: TimeEntryInput;
  positions: Position[];
  defaultPositionId?: string | null;
  /** New entries: follow the date to the position scheduled on that weekday. */
  autoSelectPosition?: boolean;
  isEditing?: boolean;
  holidayName?: string | null;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: TimeEntryInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const fallbackPositionId = defaultPositionId ?? positions[0]?.id;
  // Once the user picks a position by hand, stop auto-switching it when the date changes.
  const positionTouchedRef = useRef(false);
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
    defaultValues: initialValues ?? { ...defaultEntry, positionId: fallbackPositionId },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "breaks" });

  const punchIn = useWatch({ control, name: "punchIn" });
  const punchOut = useWatch({ control, name: "punchOut" });
  const breaks = useWatch({ control, name: "breaks" }) ?? [];
  const date = useWatch({ control, name: "date" });
  const positionId = useWatch({ control, name: "positionId" });
  const selectedPosition = positions.find((position) => position.id === positionId) ?? null;
  // ISA days are logged as separate work sessions; the gaps between them are stored as breaks.
  const sessionMode = selectedPosition?.role === "instructional_student_assistant";
  const formSessions = toSessions(punchIn, punchOut, breaks);
  // Holds edits that are not valid yet (e.g. overlapping) so the form values stay consistent.
  const [draftSessions, setDraftSessions] = useState<WorkSession[] | null>(null);
  const sessions = draftSessions ?? formSessions;
  const sessionError = draftSessions ? sessionsError(draftSessions) : null;

  const updateSessions = (next: WorkSession[]) => {
    if (sessionsError(next)) {
      setDraftSessions(next);
      return;
    }
    setDraftSessions(null);
    const sorted = [...next].sort((a, b) => a.start.localeCompare(b.start));
    setValue("punchIn", sorted[0].start, { shouldValidate: true });
    setValue("punchOut", sorted[sorted.length - 1].end, { shouldValidate: true });
    replace(
      sorted.slice(1).flatMap((session, index) =>
        session.start > sorted[index].end ? [{ start: sorted[index].end, end: session.start }] : [],
      ),
    );
  };

  const addSession = () => {
    const lastEnd = sessions[sessions.length - 1]?.end ?? "09:00";
    const start = minutesBetween("00:00", lastEnd) >= 22 * 60 ? lastEnd : addMinutesToHHmm(lastEnd, 60);
    const end = minutesBetween("00:00", start) >= 23 * 60 ? "23:59" : addMinutesToHHmm(start, 60);
    updateSessions([...sessions, { start, end }]);
  };

  const breakMinutes = calcBreakMinutes(breaks);
  const workedMinutes = calcWorkedMinutes({ punchIn, punchOut, breaks });
  const dayTenths = entryTenths({ punchIn, punchOut, breaks }, selectedPosition?.role);
  const allValues = useWatch({ control });
  const hasInvalidShiftWindow = Boolean(punchIn && punchOut && punchOut <= punchIn);

  useEffect(() => {
    if (initialValues) return;

    try {
      const raw = window.localStorage.getItem("time_entry_draft");
      if (!raw) return;
      const parsed = JSON.parse(raw) as TimeEntryInput;
      if (!parsed || !parsed.date || !parsed.punchIn || !parsed.punchOut) return;
      const draftPositionExists = positions.some((position) => position.id === parsed.positionId);
      reset({ ...parsed, positionId: draftPositionExists ? parsed.positionId : fallbackPositionId });
    } catch {
      // ignore bad local draft
    }
    // Restore the draft once; later position list refreshes must not wipe edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!autoSelectPosition || positionTouchedRef.current || !date) return;
    const scheduled = scheduledPositionForDate(positions, date);
    if (scheduled && scheduled.id !== positionId) {
      setValue("positionId", scheduled.id, { shouldValidate: true });
    }
  }, [autoSelectPosition, date, positionId, positions, setValue]);

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
    const dayKey = weekdayKeys[new Date(`${date}T00:00:00`).getDay()];
    const daySchedule = selectedPosition?.workSchedule[dayKey];

    if (!daySchedule || !daySchedule.enabled) {
      toast.message(
        selectedPosition
          ? `No regular ${selectedPosition.name} shift on this day. Update it in Settings.`
          : "No regular schedule set for this day. Update it in Settings.",
      );
      return;
    }

    setValue("punchIn", daySchedule.start, { shouldValidate: true });
    setValue("punchOut", daySchedule.end, { shouldValidate: true });
    setValue(
      "breaks",
      [{ start: daySchedule.breakStart, end: daySchedule.breakEnd }],
      { shouldValidate: true },
    );
    toast.success(
      selectedPosition
        ? `Applied ${dayKey.toUpperCase()} regular ${selectedPosition.name} shift`
        : `Applied ${dayKey.toUpperCase()} regular schedule`,
    );
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

  const markHolidayNoWork = () => {
    setValue("notes", holidayName ? `Public holiday (${holidayName}) - no shift worked.` : "Public holiday - no shift worked.", {
      shouldValidate: true,
    });
    setValue("breaks", [], { shouldValidate: true });
    toast.message("No-work holiday note added. You can close dialog if no entry is needed.");
  };

  const logWorkedHoliday = () => {
    setPreset("09:00", "13:00");
    setValue("breaks", [], { shouldValidate: true });
    setValue("notes", holidayName ? `Worked on public holiday: ${holidayName}` : "Worked on public holiday", {
      shouldValidate: true,
    });
    toast.success("Holiday work template applied");
  };

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        if (sessionError) {
          toast.error(sessionError);
          return;
        }
        await onSubmit(values);
      })}
    >
      <Card className="border border-border/60 bg-muted/15">
        <CardContent className="space-y-4 px-4 pb-4 pt-6 sm:px-5 sm:pb-5 sm:pt-7">
          {/* Collapsed while editing an existing day, where "now" actions rarely apply. */}
          <details open={!isEditing} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium tracking-wide [&::-webkit-details-marker]:hidden">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick actions
            <span className="ml-auto text-xs font-normal text-muted-foreground group-open:hidden">Show</span>
            <span className="ml-auto hidden text-xs font-normal text-muted-foreground group-open:inline">Hide</span>
          </summary>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
            {!sessionMode && (
            <>
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
            </>
            )}
            {holidayName && (
              <>
                <Button
                  className="h-auto min-h-20 flex-col items-start justify-center rounded-2xl border-amber-300/70 bg-amber-100/70 px-4 py-3 text-left text-[0.95rem] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-300/30 dark:bg-amber-500/15 dark:text-amber-100 dark:hover:bg-amber-500/20"
                  type="button"
                  variant="outline"
                  onClick={markHolidayNoWork}
                >
                  <span className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-amber-800/90 dark:text-amber-100/85">
                    Holiday
                  </span>
                  <span>Mark No Work</span>
                </Button>
                <Button
                  className="h-auto min-h-20 flex-col items-start justify-center rounded-2xl border-amber-300/70 bg-amber-100/70 px-4 py-3 text-left text-[0.95rem] font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-300/30 dark:bg-amber-500/15 dark:text-amber-100 dark:hover:bg-amber-500/20"
                  type="button"
                  variant="outline"
                  onClick={logWorkedHoliday}
                >
                  <span className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wider text-amber-800/90 dark:text-amber-100/85">
                    Holiday
                  </span>
                  <span>Log Worked Holiday</span>
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyPresetWithBreak("09:00", "17:00", "12:30", "13:00", "full-day preset")}
            >
              Full Day (9am-5pm)
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyPresetWithBreak("12:00", "17:00", "14:30", "15:00", "afternoon preset")}
            >
              Afternoon (12pm-5pm)
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
          </details>

          <div className="grid gap-2 rounded-xl bg-background/80 p-3 text-sm md:grid-cols-3">
            <p>
              {sessionMode ? "Day:" : "Shift:"} <span className="font-semibold">{formatTime12h(punchIn)} - {formatTime12h(punchOut)}</span>
            </p>
            <p>
              {sessionMode ? (
                <>
                  Sessions: <span className="font-semibold">{sessions.length}</span>
                </>
              ) : (
                <>
                  Breaks: <span className="font-semibold">{minutesToHM(Math.max(0, breakMinutes))}</span>
                </>
              )}
            </p>
            <p>
              Worked: <span className="font-semibold text-primary">{minutesToHM(Math.max(0, workedMinutes))}</span>
              <span className="ml-2 text-xs text-muted-foreground">({Math.max(0, dayTenths).toFixed(1)} hrs)</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {positions.length > 1 && (
        <div className="min-w-0 space-y-1">
          <Label htmlFor="positionId">Position</Label>
          <select
            id="positionId"
            className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
            {...register("positionId", {
              onChange: () => {
                positionTouchedRef.current = true;
              },
            })}
          >
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name} · {timesheetTemplates[position.role].shortLabel}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Hours count toward this position&apos;s timesheet and pay rate.
          </p>
        </div>
      )}

      <div className={`grid gap-4 ${sessionMode ? "" : "sm:grid-cols-3"}`}>
        <div className="min-w-0 space-y-1">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" className="min-w-0" {...register("date")} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          {!errors.date && <p className="text-xs text-muted-foreground">Pick the exact work day this row should represent.</p>}
        </div>

        {!sessionMode && (
        <>
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
        </>
        )}
      </div>
      {!sessionMode && hasInvalidShiftWindow && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Punch-out should be later than punch-in. Try adjusting one of the times.
        </p>
      )}

      {sessionMode ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label>Work sessions</Label>
              <p className="text-xs text-muted-foreground">
                Add each separate time you worked on this day. Each session is rounded to tenths, then added up.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {sessions.map((session, index) => {
              const minutes = session.end > session.start ? minutesBetween(session.start, session.end) : 0;
              return (
                <div
                  key={index}
                  className="grid min-w-0 grid-cols-[auto_1fr_1fr_auto] items-center gap-2 rounded-lg border bg-card p-2 sm:grid-cols-[auto_1fr_1fr_auto_auto]"
                >
                  <span className="text-xs font-semibold text-muted-foreground">#{index + 1}</span>
                  <Input
                    type="time"
                    aria-label={`Session ${index + 1} start`}
                    className="min-w-0"
                    value={session.start}
                    onChange={(e) => updateSessions(sessions.map((item, i) => (i === index ? { ...item, start: e.target.value } : item)))}
                  />
                  <Input
                    type="time"
                    aria-label={`Session ${index + 1} end`}
                    className="min-w-0"
                    value={session.end}
                    onChange={(e) => updateSessions(sessions.map((item, i) => (i === index ? { ...item, end: e.target.value } : item)))}
                  />
                  <span className="col-span-3 col-start-2 text-xs text-muted-foreground sm:col-span-1 sm:col-start-auto sm:w-16 sm:text-right">
                    {minutesToTenthsDecimal(minutes).toFixed(1)} hrs
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove session ${index + 1}`}
                    className="col-start-4 row-start-1 justify-self-end sm:col-start-auto sm:row-start-auto"
                    disabled={sessions.length === 1}
                    onClick={() => updateSessions(sessions.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addSession}>
            <Plus className="mr-1 h-4 w-4" />
            Add session
          </Button>

          {sessionError ? (
            <p className="text-xs text-destructive">{sessionError}</p>
          ) : (
            <p className="text-sm font-medium">
              Day total: <span className="text-primary">{Math.max(0, dayTenths).toFixed(1)} hrs</span>
              {sessions.length > 1 && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  ({sessions.map((session) => minutesToTenthsDecimal(minutesBetween(session.start, session.end)).toFixed(1)).join(" + ")})
                </span>
              )}
            </p>
          )}
        </div>
      ) : (
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
      )}

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
