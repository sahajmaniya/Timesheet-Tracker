import { eachDayOfInterval, format, parseISO } from "date-fns";

/**
 * The month a voucher is for: the selected month, or for a payroll period the
 * month holding most of its days (e.g. Jul 31–Aug 31 → August).
 */
export function getVoucherMonth(month: string, periodStart?: string, periodEnd?: string) {
  if (!periodStart || !periodEnd) return month;
  const daysByMonth = new Map<string, number>();
  for (const day of eachDayOfInterval({ start: parseISO(periodStart), end: parseISO(periodEnd) })) {
    const key = format(day, "yyyy-MM");
    daysByMonth.set(key, (daysByMonth.get(key) ?? 0) + 1);
  }
  let best = month;
  let bestCount = -1;
  for (const [key, count] of daysByMonth) {
    if (count >= bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

/** Keeps characters that are safe in file names, including the comma in "Last,_First". */
function cleanPart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w,.-]/g, "")
    .replace(/^_+|_+$/g, "");
}

/** "Sahaj Vijaykumar Maniya" → "Maniya,_Sahaj" (last name, first name). */
export function lastFirstName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return cleanPart(parts[0]);
  return `${cleanPart(parts[parts.length - 1])},_${cleanPart(parts[0])}`;
}

/**
 * Department naming convention for filled vouchers:
 * {UNIT}_{SA|ISA}_TIMESHEET_{Last},_{First}_{MMYYYY}.pdf, e.g.
 * 010_SA_TIMESHEET_Maniya,_Sahaj_102026.pdf. Parts that are unknown are left out.
 */
export function buildTimesheetFileName(params: {
  unitCode?: string | null;
  roleShortLabel: string;
  fullName?: string | null;
  voucherMonth: string;
}) {
  const parts = [
    cleanPart(params.unitCode ?? ""),
    cleanPart(params.roleShortLabel),
    "TIMESHEET",
    lastFirstName(params.fullName),
    format(parseISO(`${params.voucherMonth}-01`), "MMyyyy"),
  ].filter(Boolean);
  return `${parts.join("_")}.pdf`;
}

/** Normalises a user-edited name: safe characters only, always ending in .pdf. */
export function normalizePdfFileName(value: string) {
  const base = cleanPart(value.replace(/\.pdf$/i, ""));
  return base ? `${base}.pdf` : "";
}
