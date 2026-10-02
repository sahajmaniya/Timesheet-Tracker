"use client";

import { Briefcase, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { timesheetRoleOptions, timesheetTemplates, type TimesheetRole } from "@/lib/timesheet-templates";
import { positionSchema } from "@/lib/validators";
import { DAY_LABELS, DEFAULT_WORK_SCHEDULE, weekdayKeys, type DaySchedule, type WeekdayKey } from "@/lib/work-schedule";
import type { Position } from "@/types/position";

const DAY_SHORT_LABELS: Record<WeekdayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

type PositionDraft = Omit<Position, "id" | "hourlyRate"> & { id: string | null; hourlyRate: string };

function emptyDraft(role: TimesheetRole): PositionDraft {
  return {
    id: null,
    name: role === "instructional_student_assistant" ? "Instructional Student Assistant" : "Student Assistant",
    role,
    hourlyRate: "0",
    workSchedule: structuredClone(DEFAULT_WORK_SCHEDULE),
  };
}

function scheduleSummary(position: Position) {
  const days = weekdayKeys.filter((day) => position.workSchedule[day].enabled);
  return days.length === 0 ? "No regular days" : days.map((day) => DAY_SHORT_LABELS[day]).join(", ");
}

export function PositionsManager({
  positions,
  onPositionsChange,
}: {
  positions: Position[];
  onPositionsChange: (positions: Position[]) => void;
}) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState<PositionDraft | null>(null);
  const [activeDay, setActiveDay] = useState<WeekdayKey>("mon");
  const [saving, setSaving] = useState(false);

  const openEditor = (position?: Position) => {
    setActiveDay("mon");
    if (position) {
      setDraft({ ...position, hourlyRate: String(position.hourlyRate), workSchedule: structuredClone(position.workSchedule) });
    } else {
      // A second position is most often the other timesheet type.
      const hasSa = positions.some((item) => item.role === "student_assistant");
      setDraft(emptyDraft(hasSa ? "instructional_student_assistant" : "student_assistant"));
    }
  };

  const updateDay = (day: WeekdayKey, patch: Partial<DaySchedule>) => {
    setDraft((prev) =>
      prev ? { ...prev, workSchedule: { ...prev.workSchedule, [day]: { ...prev.workSchedule[day], ...patch } } } : prev,
    );
  };

  const applyWeekdayTemplate = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const workSchedule = structuredClone(prev.workSchedule);
      for (const day of weekdayKeys) {
        const enabled = day !== "sat" && day !== "sun";
        workSchedule[day] = enabled
          ? { enabled, start: "09:00", end: "17:00", breakStart: "12:30", breakEnd: "13:00" }
          : { ...workSchedule[day], enabled };
      }
      return { ...prev, workSchedule };
    });
  };

  const clearSchedule = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const workSchedule = structuredClone(prev.workSchedule);
      for (const day of weekdayKeys) workSchedule[day].enabled = false;
      return { ...prev, workSchedule };
    });
  };

  const saveDraft = async () => {
    if (!draft) return;
    const parsed = positionSchema.safeParse({
      name: draft.name,
      role: draft.role,
      hourlyRate: Number(draft.hourlyRate),
      workSchedule: draft.workSchedule,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const day = issue?.path[1];
      const dayLabel = typeof day === "string" && day in DAY_LABELS ? `${DAY_LABELS[day as WeekdayKey]}: ` : "";
      toast.error(`${dayLabel}${issue?.message ?? "Please check this position."}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(draft.id ? `/api/positions/${draft.id}` : "/api/positions", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not save position");
        return;
      }
      const saved = body.position as Position;
      onPositionsChange(
        draft.id ? positions.map((position) => (position.id === saved.id ? saved : position)) : [...positions, saved],
      );
      setDraft(null);
      toast.success(draft.id ? "Position updated" : "Position added", { description: saved.name });
    } finally {
      setSaving(false);
    }
  };

  const removePosition = async (position: Position) => {
    const ok = await confirm({
      title: "Remove Position?",
      description: `Remove ${position.name}? Positions that still have time entries can't be removed.`,
      confirmText: "Remove",
      destructive: true,
    });
    if (!ok) return;

    const res = await fetch(`/api/positions/${position.id}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error || "Could not remove position");
      return;
    }
    onPositionsChange(positions.filter((item) => item.id !== position.id));
    toast.success("Position removed");
  };

  const activeDayConfig = draft?.workSchedule[activeDay];

  return (
    <Card className="border-border/65 bg-gradient-to-br from-violet-100/60 via-background to-indigo-100/50 dark:from-violet-500/8 dark:to-indigo-500/8">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            Positions
          </CardTitle>
          <CardDescription className="mt-1">
            Add each job you hold. Every position has its own timesheet type, hourly rate, and regular schedule.
          </CardDescription>
        </div>
        <Button type="button" onClick={() => openEditor()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add position
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {positions.map((position) => (
          <div key={position.id} className="min-w-0 rounded-xl border border-border/70 bg-card/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 break-words font-semibold">{position.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timesheetTemplates[position.role].label}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${position.name}`} onClick={() => openEditor(position)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {positions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${position.name}`}
                    onClick={() => void removePosition(position)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="min-w-0 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800/90 dark:text-emerald-200/90">Rate</p>
                <p className="font-semibold">{position.hourlyRate > 0 ? `$${position.hourlyRate.toFixed(2)}/hr` : "Not set"}</p>
              </div>
              <div className="min-w-0 rounded-lg border border-sky-400/25 bg-sky-500/10 px-2.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-800/90 dark:text-sky-200/90">Schedule</p>
                <p className="truncate font-semibold">{scheduleSummary(position)}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit position" : "Add position"}</DialogTitle>
            <DialogDescription>
              The timesheet type decides which PDF layout is used. The schedule powers &quot;Apply Regular Shift&quot; and the
              missing-shift check.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="position-name">Position name</Label>
                  <Input
                    id="position-name"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Library Front Desk"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="position-role">Timesheet type</Label>
                  <select
                    id="position-role"
                    value={draft.role}
                    onChange={(e) => setDraft({ ...draft, role: e.target.value as TimesheetRole })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {timesheetRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="position-rate">Hourly rate (USD)</Label>
                  <Input
                    id="position-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.hourlyRate}
                    onChange={(e) => setDraft({ ...draft, hourlyRate: e.target.value })}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-card/70 p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Regular schedule</p>
                    <p className="text-xs text-muted-foreground">Turn on the days you normally work this position.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={applyWeekdayTemplate}>
                      Weekday template
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSchedule}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {weekdayKeys.map((day) => {
                    const dayConfig = draft.workSchedule[day];
                    const active = activeDay === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setActiveDay(day)}
                        className={`rounded-lg border px-2 py-2 text-left transition ${
                          active
                            ? "border-primary/45 bg-primary/10 text-foreground"
                            : "border-border/70 bg-background/60 text-muted-foreground hover:bg-accent/60"
                        }`}
                      >
                        <p className="text-xs font-semibold">{DAY_SHORT_LABELS[day]}</p>
                        <p className="truncate text-[10px]">{dayConfig.enabled ? `${dayConfig.start}-${dayConfig.end}` : "Off"}</p>
                      </button>
                    );
                  })}
                </div>

                {activeDayConfig && (
                  <div className="mt-3 rounded-lg border border-border/60 bg-background/60 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{DAY_LABELS[activeDay]}</p>
                      <label className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background px-2 py-1 text-xs">
                        <input
                          type="checkbox"
                          checked={activeDayConfig.enabled}
                          onChange={(e) => updateDay(activeDay, { enabled: e.target.checked })}
                        />
                        Works this day
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      {(
                        [
                          ["start", "Start"],
                          ["end", "End"],
                          ["breakStart", "Break Start"],
                          ["breakEnd", "Break End"],
                        ] as const
                      ).map(([field, label]) => (
                        <div key={field} className="min-w-0 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">{label}</Label>
                          <Input
                            type="time"
                            className="min-w-0"
                            value={activeDayConfig[field]}
                            disabled={!activeDayConfig.enabled}
                            onChange={(e) => updateDay(activeDay, { [field]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveDraft()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : draft?.id ? "Save position" : "Add position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
