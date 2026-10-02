import { differenceInMinutes, format, isValid, parse } from "date-fns";
import type { TimeEntryInput } from "@/lib/validators";

const anchorDate = "2000-01-01";

function toDateTime(timeHHmm: string) {
  return parse(`${anchorDate} ${timeHHmm}`, "yyyy-MM-dd HH:mm", new Date());
}

export function minutesBetween(start: string, end: string) {
  return differenceInMinutes(toDateTime(end), toDateTime(start));
}

export function formatTime12h(timeHHmm: string) {
  const parsed = toDateTime(timeHHmm);
  if (!isValid(parsed)) return timeHHmm;
  return format(parsed, "h:mm a");
}

export function calcBreakMinutes(breaks: { start: string; end: string }[]) {
  return breaks.reduce(
    (sum, item) => sum + Math.max(0, minutesBetween(item.start, item.end)),
    0,
  );
}

export function calcWorkedMinutes(
  entry: Pick<TimeEntryInput, "punchIn" | "punchOut" | "breaks">,
) {
  const totalShift = minutesBetween(entry.punchIn, entry.punchOut);
  const breakMinutes = calcBreakMinutes(entry.breaks);
  return Math.max(0, totalShift - breakMinutes);
}

export function minutesToHM(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

// Converts minutes to payroll-style tenths:
// 1-6 => .1, 7-12 => .2, ... , 55-59 => +1.0 hour.
export function minutesToTenthsDecimal(totalMinutes: number) {
  if (totalMinutes <= 0) return 0;
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  if (remainder === 0) return wholeHours;

  const tenthBuckets = Math.ceil(remainder / 6);
  if (tenthBuckets >= 10) return wholeHours + 1;
  return wholeHours + tenthBuckets / 10;
}

export function formatTenthsDecimal(totalMinutes: number) {
  return minutesToTenthsDecimal(totalMinutes).toFixed(1);
}

export function validateChronology(entry: TimeEntryInput) {
  if (minutesBetween(entry.punchIn, entry.punchOut) <= 0) {
    return "Punch out must be after punch in.";
  }

  for (const item of entry.breaks) {
    if (minutesBetween(item.start, item.end) <= 0) {
      return "Break end must be after break start.";
    }
    if (minutesBetween(entry.punchIn, item.start) < 0) {
      return "Break starts before punch in.";
    }
    if (minutesBetween(item.end, entry.punchOut) < 0) {
      return "Break ends after punch out.";
    }
  }

  return null;
}

export function nowHHmm() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function addMinutesToHHmm(time: string, delta: number) {
  const [hh, mm] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hh, mm, 0, 0);
  date.setMinutes(date.getMinutes() + delta);
  const nextH = String(date.getHours()).padStart(2, "0");
  const nextM = String(date.getMinutes()).padStart(2, "0");
  return `${nextH}:${nextM}`;
}

/** Worked intervals of a shift (minutes since midnight), i.e. the shift minus its breaks. */
export function workedSegments(entry: { punchIn: string; punchOut: string; breaks: { start: string; end: string }[] }) {
  const toMinutes = (time: string) => minutesBetween("00:00", time);
  const sortedBreaks = [...entry.breaks]
    .map((item) => ({ start: toMinutes(item.start), end: toMinutes(item.end) }))
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start);

  const segments: { start: number; end: number }[] = [];
  let cursor = toMinutes(entry.punchIn);
  const shiftEnd = toMinutes(entry.punchOut);
  for (const item of sortedBreaks) {
    if (item.start > cursor) segments.push({ start: cursor, end: Math.min(item.start, shiftEnd) });
    cursor = Math.max(cursor, item.end);
  }
  if (shiftEnd > cursor) segments.push({ start: cursor, end: shiftEnd });
  return segments.filter((segment) => segment.end > segment.start);
}

/** True when two shifts have overlapping worked time (touching end/start is fine). */
export function shiftsOverlap(
  a: { punchIn: string; punchOut: string; breaks: { start: string; end: string }[] },
  b: { punchIn: string; punchOut: string; breaks: { start: string; end: string }[] },
) {
  const bSegments = workedSegments(b);
  return workedSegments(a).some((x) => bSegments.some((y) => x.start < y.end && y.start < x.end));
}

/**
 * ISA timesheets: each separate work session is converted to tenths with the
 * voucher table, then summed (e.g. 1h24m + 45m → 1.4 + 0.8 = 2.2).
 */
export function sessionTenthsTotal(entry: { punchIn: string; punchOut: string; breaks: { start: string; end: string }[] }) {
  const tenths = workedSegments(entry).reduce(
    (sum, segment) => sum + Math.round(minutesToTenthsDecimal(segment.end - segment.start) * 10),
    0,
  );
  return tenths / 10;
}

/** Day hours in tenths as the position's voucher counts them. */
export function entryTenths(
  entry: { punchIn: string; punchOut: string; breaks: { start: string; end: string }[] },
  role?: string | null,
) {
  if (role === "instructional_student_assistant") return sessionTenthsTotal(entry);
  return minutesToTenthsDecimal(calcWorkedMinutes(entry));
}
