import type { Break, TimeEntry } from "@prisma/client";
import { calcBreakMinutes, calcWorkedMinutes } from "@/lib/time";

export type EntryWithBreaks = TimeEntry & { breaks: Break[] };

export function serializeEntry(entry: EntryWithBreaks) {
  const breakMinutes = calcBreakMinutes(entry.breaks);
  const workedMinutes = calcWorkedMinutes({
    punchIn: entry.punchIn,
    punchOut: entry.punchOut,
    breaks: entry.breaks,
  });

  return {
    id: entry.id,
    date: entry.date,
    punchIn: entry.punchIn,
    punchOut: entry.punchOut,
    notes: entry.notes,
    breaks: entry.breaks,
    breakMinutes,
    workedMinutes,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
