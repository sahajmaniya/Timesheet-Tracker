import { endOfMonth, format, startOfMonth } from "date-fns";
import { getServerAuthSession } from "@/lib/auth";
import { buildDownloadFilename } from "@/lib/downloads";
import { finalizeApiTimer, startApiTimer } from "@/lib/perf";
import { prisma } from "@/lib/prisma";
import { clientIpFromHeaders, enforceRateLimit } from "@/lib/security";
import { calcBreakMinutes, calcWorkedMinutes, formatTime12h, minutesToTenthsDecimal } from "@/lib/time";
import { dateRangeQuerySchema, monthQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const startedAt = startApiTimer();
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return finalizeApiTimer(new Response("Unauthorized", { status: 401 }), "entries.export", startedAt);
  }
  const ip = clientIpFromHeaders(request.headers);
  const rateLimit = enforceRateLimit({
    key: `entries-export:${session.user.id}:${ip}`,
    limit: 25,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return finalizeApiTimer(
      new Response("Too many export requests. Try again later.", {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }),
      "entries.export",
      startedAt,
    );
  }

  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  if (Boolean(startParam) !== Boolean(endParam)) {
    return finalizeApiTimer(new Response("Both payroll period dates are required", { status: 400 }), "entries.export", startedAt);
  }
  const parsedRange = startParam && endParam ? dateRangeQuerySchema.safeParse({ start: startParam, end: endParam }) : null;
  const monthParam = searchParams.get("month") ?? format(new Date(), "yyyy-MM");
  const parsedMonth = parsedRange ? null : monthQuerySchema.safeParse(monthParam);

  if (parsedRange && !parsedRange.success) {
    return finalizeApiTimer(new Response("Invalid payroll period", { status: 400 }), "entries.export", startedAt);
  }
  if (parsedMonth && !parsedMonth.success) {
    return finalizeApiTimer(new Response("Invalid month", { status: 400 }), "entries.export", startedAt);
  }

  const monthDate = parsedMonth ? new Date(`${parsedMonth.data}-01T00:00:00`) : null;
  const start = parsedRange?.data.start ?? format(startOfMonth(monthDate!), "yyyy-MM-dd");
  const end = parsedRange?.data.end ?? format(endOfMonth(monthDate!), "yyyy-MM-dd");
  const periodLabel = parsedRange?.data ? `${start}_to_${end}` : parsedMonth!.data;

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
    },
    include: {
      breaks: { orderBy: { start: "asc" } },
    },
    orderBy: { date: "asc" },
  });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hourlyRate: true },
  });

  const header = [
    "Date",
    "Punch In",
    "Punch Out",
    "Breaks",
    "Break Minutes",
    "Worked Minutes",
    "Worked Hours (Decimal Tenths)",
    "Notes",
  ];

  let totalMinutes = 0;
  let totalDecimal = 0;

  const rows = entries.map((entry) => {
    const breakMinutes = calcBreakMinutes(entry.breaks);
    const workedMinutes = calcWorkedMinutes({
      punchIn: entry.punchIn,
      punchOut: entry.punchOut,
      breaks: entry.breaks,
    });
    const workedDecimal = minutesToTenthsDecimal(workedMinutes);
    totalMinutes += workedMinutes;
    totalDecimal += workedDecimal;

    const breaksText = entry.breaks
      .map((item) => `${formatTime12h(item.start)}-${formatTime12h(item.end)}`)
      .join(" | ");
    const notes = (entry.notes ?? "").replaceAll('"', '""');

    return [
      entry.date,
      formatTime12h(entry.punchIn),
      formatTime12h(entry.punchOut),
      `"${breaksText}"`,
      String(breakMinutes),
      String(workedMinutes),
      workedDecimal.toFixed(1),
      `"${notes}"`,
    ].join(",");
  });

  const totalsRow = [
    "TOTAL",
    "",
    "",
    "",
    "",
    String(totalMinutes),
    totalDecimal.toFixed(1),
    "\"\"",
  ].join(",");

  const hourlyRate = Math.max(user?.hourlyRate ?? 0, 0);
  const totalGrossPay = (totalMinutes / 60) * hourlyRate;
  const summaryRows = [
    "",
    `"Summary"`,
    `"Hourly Rate (USD)","$${hourlyRate.toFixed(2)}"`,
    `"Total Gross Pay (${periodLabel})","$${totalGrossPay.toFixed(2)}"`,
  ];

  const csv = [header.join(","), ...rows, totalsRow, ...summaryRows].join("\n");
  const filename = buildDownloadFilename({
    kind: "timesheet_csv",
    month: periodLabel,
    extension: "csv",
  });

  return finalizeApiTimer(
    new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    }),
    "entries.export",
    startedAt,
  );
}
