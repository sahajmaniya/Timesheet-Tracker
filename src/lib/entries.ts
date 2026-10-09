import type { Break, TimeEntry } from "@prisma/client";
import { calcBreakMinutes, calcWorkedMinutes, entryTenths } from "@/lib/time";

export type EntryWithBreaks = TimeEntry & { breaks: Break[]; position?: { role: string } | null };

export function serializeEntry(entry: EntryWithBreaks) {
  const breakMinutes = calcBreakMinutes(entry.breaks);
  const workedMinutes = calcWorkedMinutes({
    punchIn: entry.punchIn,
    punchOut: entry.punchOut,
    breaks: entry.breaks,
  });

  return {
    id: entry.id,
    positionId: entry.positionId,
    date: entry.date,
    punchIn: entry.punchIn,
    punchOut: entry.punchOut,
    notes: entry.notes,
    sessionNotes: Array.isArray(entry.sessionNotes)
      ? entry.sessionNotes.map((note) => (typeof note === "string" ? note : ""))
      : [],
    breaks: entry.breaks,
    breakMinutes,
    workedMinutes,
    workedTenths: entryTenths(entry, entry.position?.role),
    sessionBased: entry.position?.role === "instructional_student_assistant",
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
