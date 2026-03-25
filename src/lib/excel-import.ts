import { format } from "date-fns";
import * as XLSX from "xlsx";
import type { TimeEntryInput } from "@/lib/validators";

const DATE_KEYS = ["Date", "date"];
const START_KEYS = ["Start Time", "Start", "Punch In", "punchIn"];
const END_KEYS = ["End Time", "End", "Punch Out", "punchOut"];
const BREAK_START_KEYS = ["Break Start", "Break Start Time", "breakStart"];
const BREAK_END_KEYS = ["Break End", "Break End Time", "breakEnd"];

function pickValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key];
  }
  return null;
}

function toDateString(value: unknown): string | null {
  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd");
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const year = String(parsed.y).padStart(4, "0");
    const month = String(parsed.m).padStart(2, "0");
    const day = String(parsed.d).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const plainYmd = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (plainYmd) {
      // Keep plain YYYY-MM-DD as-is to avoid timezone day shifting.
      return trimmed;
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return null;
    return format(date, "yyyy-MM-dd");
  }

  return null;
}

function toTimeString(value: unknown): string | null {
  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  }

  if (typeof value === "number") {
    const total = Math.round((value % 1) * 24 * 60);
    const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
    const mm = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const basic = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (basic) {
      const hh = basic[1].padStart(2, "0");
      const mm = basic[2].padStart(2, "0");
      return `${hh}:${mm}`;
    }

    const date = new Date(`2000-01-01 ${trimmed}`);
    if (!Number.isNaN(date.getTime())) {
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }
  }

  return null;
}

export type ImportedSheetEntry = TimeEntryInput & {
  sheetName: string;
};

export function parseTimesheetWorkbook(buffer: Buffer): ImportedSheetEntry[] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: true,
  });

  const output: ImportedSheetEntry[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });

    for (const row of rows) {
      const date = toDateString(pickValue(row, DATE_KEYS));
      const punchIn = toTimeString(pickValue(row, START_KEYS));
      const punchOut = toTimeString(pickValue(row, END_KEYS));

      if (!date || !punchIn || !punchOut) {
        continue;
      }

      const breakStart = toTimeString(pickValue(row, BREAK_START_KEYS));
      const breakEnd = toTimeString(pickValue(row, BREAK_END_KEYS));

      output.push({
        date,
        punchIn,
        punchOut,
        breaks: breakStart && breakEnd ? [{ start: breakStart, end: breakEnd }] : [],
        notes: `Imported from ${sheetName}`,
        sheetName,
      });
    }
  }

  return output;
}
