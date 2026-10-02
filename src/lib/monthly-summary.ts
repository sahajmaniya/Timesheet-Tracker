import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { calculatePositionPayBreakdown } from "@/lib/payroll";
import { ensureUserPositions } from "@/lib/positions";
import { prisma } from "@/lib/prisma";
import { calcWorkedMinutes } from "@/lib/time";

export type MonthlySummaryPositionLine = {
  name: string;
  hoursDecimal: number;
  hourlyRate: number;
  grossPay: number;
};

export type MonthlySummaryData = {
  month: string;
  totalWorkedMinutes: number;
  totalWorkedHoursDecimal: number;
  positions: MonthlySummaryPositionLine[];
  grossPayEstimate: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export function getPreviousMonthKey(now = new Date()) {
  return format(subMonths(now, 1), "yyyy-MM");
}

export async function buildMonthlySummaryForUser(params: {
  userId: string;
  month: string;
}): Promise<MonthlySummaryData> {
  const monthDate = new Date(`${params.month}-01T00:00:00`);
  const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const [entries, positions] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: params.userId,
        date: { gte: start, lte: end },
      },
      include: { breaks: true },
    }),
    ensureUserPositions(params.userId),
  ]);

  const pay = calculatePositionPayBreakdown(
    entries.map((entry) => ({
      positionId: entry.positionId,
      workedMinutes: calcWorkedMinutes({ punchIn: entry.punchIn, punchOut: entry.punchOut, breaks: entry.breaks }),
    })),
    positions,
  );

  // Show every position that had hours; with a single position, show it even when idle.
  const lines = pay.lines.filter((line) => line.workedMinutes > 0 || positions.length === 1);

  return {
    month: params.month,
    totalWorkedMinutes: pay.workedMinutes,
    totalWorkedHoursDecimal: round2(pay.workedMinutes / 60),
    positions: lines.map((line) => ({
      name: line.name,
      hoursDecimal: round2(line.workedMinutes / 60),
      hourlyRate: line.hourlyRate,
      grossPay: line.grossPay,
    })),
    grossPayEstimate: pay.grossPay,
  };
}
