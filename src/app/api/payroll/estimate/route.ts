import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { calculatePositionPayBreakdown, grossOnlyEstimate } from "@/lib/payroll";
import { ensureUserPositions } from "@/lib/positions";
import { prisma } from "@/lib/prisma";
import { calcWorkedMinutes } from "@/lib/time";
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

  const positionId = searchParams.get("positionId") || undefined;
  const [entries, allPositions] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        positionId,
        date: { gte: start, lte: end },
      },
      include: { breaks: true },
    }),
    ensureUserPositions(session.user.id),
  ]);
  const positions = positionId ? allPositions.filter((position) => position.id === positionId) : allPositions;

  const breakdown = calculatePositionPayBreakdown(
    entries.map((entry) => ({
      positionId: entry.positionId,
      workedMinutes: calcWorkedMinutes({ punchIn: entry.punchIn, punchOut: entry.punchOut, breaks: entry.breaks }),
    })),
    positions,
  );

  return NextResponse.json({
    month: periodKey,
    start,
    end,
    workedMinutes: breakdown.workedMinutes,
    estimate: grossOnlyEstimate(breakdown.grossPay),
    byPosition: breakdown.lines,
  });
}
