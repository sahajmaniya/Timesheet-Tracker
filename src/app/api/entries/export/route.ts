import { endOfMonth, format, startOfMonth } from "date-fns";
import { getServerAuthSession } from "@/lib/auth";
import { buildDownloadFilename } from "@/lib/downloads";
import { prisma } from "@/lib/prisma";
import { calcBreakMinutes, calcWorkedMinutes, formatTime12h, minutesToTenthsDecimal } from "@/lib/time";
import { monthQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month") ?? format(new Date(), "yyyy-MM");
  const parsedMonth = monthQuerySchema.safeParse(monthParam);

  if (!parsedMonth.success) {
    return new Response("Invalid month", { status: 400 });
  }

  const monthDate = new Date(`${parsedMonth.data}-01T00:00:00`);
  const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

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

  const csv = [header.join(","), ...rows, totalsRow].join("\n");
  const filename = buildDownloadFilename({
    kind: "timesheet_csv",
    month: parsedMonth.data,
    extension: "csv",
  });

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
