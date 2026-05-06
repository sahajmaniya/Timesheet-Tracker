import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { calcWorkedMinutes } from "@/lib/time";
import { prisma } from "@/lib/prisma";

export type MonthlySummaryData = {
  month: string;
  totalWorkedMinutes: number;
  totalWorkedHoursDecimal: number;
  hourlyRate: number;
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

  const [entries, user] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: params.userId,
        date: { gte: start, lte: end },
      },
      include: { breaks: true },
    }),
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { hourlyRate: true },
    }),
  ]);

  const totalWorkedMinutes = entries.reduce((sum, entry) => {
    const workedMinutes = calcWorkedMinutes({
      punchIn: entry.punchIn,
      punchOut: entry.punchOut,
      breaks: entry.breaks,
    });
    return sum + workedMinutes;
  }, 0);

  const totalWorkedHoursDecimal = round2(totalWorkedMinutes / 60);
  const hourlyRate = Math.max(user?.hourlyRate ?? 0, 0);
  const grossPayEstimate = round2(totalWorkedHoursDecimal * hourlyRate);

  return {
    month: params.month,
    totalWorkedMinutes,
    totalWorkedHoursDecimal,
    hourlyRate,
    grossPayEstimate,
  };
}
