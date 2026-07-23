import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { calculateMonthlyPayEstimateWithSource } from "@/lib/payroll";
import { prisma } from "@/lib/prisma";
import { dateRangeQuerySchema, monthQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  if (Boolean(startParam) !== Boolean(endParam)) {
    return NextResponse.json({ error: "Both payroll period dates are required" }, { status: 400 });
  }
  const parsedRange = startParam && endParam ? dateRangeQuerySchema.safeParse({ start: startParam, end: endParam }) : null;
  const monthParam = searchParams.get("month") ?? format(new Date(), "yyyy-MM");
  const parsedMonth = parsedRange ? null : monthQuerySchema.safeParse(monthParam);

  if (parsedRange && !parsedRange.success) {
    return NextResponse.json({ error: parsedRange.error.issues[0]?.message }, { status: 400 });
  }
  if (parsedMonth && !parsedMonth.success) {
    return NextResponse.json({ error: parsedMonth.error.issues[0]?.message }, { status: 400 });
  }

  const monthDate = parsedMonth ? new Date(`${parsedMonth.data}-01T00:00:00`) : null;
  const start = parsedRange?.data.start ?? format(startOfMonth(monthDate!), "yyyy-MM-dd");
  const end = parsedRange?.data.end ?? format(endOfMonth(monthDate!), "yyyy-MM-dd");
  const periodKey = parsedRange?.data ? `${start}_to_${end}` : parsedMonth!.data;

  const [entries, user] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        date: { gte: start, lte: end },
      },
      include: { breaks: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        calculationSource: true,
        hourlyRate: true,
        federalStatus: true,
        stateStatus: true,
        federalTaxPercent: true,
        stateTaxPercent: true,
        otherDeductionMonthly: true,
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const totalWorkedMinutes = entries.reduce((sum, entry) => {
    const inMinutes = toMinutes(entry.punchIn);
    const outMinutes = toMinutes(entry.punchOut);
    const base = Math.max(outMinutes - inMinutes, 0);
    const breakMinutes = entry.breaks.reduce((breakSum, item) => {
      return breakSum + Math.max(toMinutes(item.end) - toMinutes(item.start), 0);
    }, 0);
    return sum + Math.max(base - breakMinutes, 0);
  }, 0);

  const estimate = await calculateMonthlyPayEstimateWithSource({
    month: periodKey,
    workedMinutes: totalWorkedMinutes,
    profile: {
      hourlyRate: user.hourlyRate ?? 0,
      federalStatus: user.federalStatus ?? "S",
      stateStatus: user.stateStatus ?? "S-00",
      federalTaxPercent: user.federalTaxPercent ?? 0,
      stateTaxPercent: user.stateTaxPercent ?? 0,
      otherDeductionMonthly: user.otherDeductionMonthly ?? 0,
    },
  });

  return NextResponse.json({
    month: periodKey,
    start,
    end,
    workedMinutes: totalWorkedMinutes,
    estimate,
  });
}

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}
