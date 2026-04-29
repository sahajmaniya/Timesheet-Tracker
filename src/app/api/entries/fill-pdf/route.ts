import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { buildDownloadFilename } from "@/lib/downloads";
import { finalizeApiTimer, startApiTimer } from "@/lib/perf";
import { prisma } from "@/lib/prisma";
import { clientIpFromHeaders, enforceRateLimit } from "@/lib/security";
import { fillTimesheetPdfTemplate } from "@/lib/timesheet-pdf";
import { parseTimesheetRole } from "@/lib/timesheet-templates";
import { monthQuerySchema, timesheetCalibrationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const startedAt = startApiTimer();
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return finalizeApiTimer(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), "entries.fill-pdf", startedAt);
  }
  const ip = clientIpFromHeaders(request.headers);
  const rateLimit = enforceRateLimit({
    key: `entries-fill-pdf:${session.user.id}:${ip}`,
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return finalizeApiTimer(
      NextResponse.json(
        { error: "Too many PDF generation requests. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      ),
      "entries.fill-pdf",
      startedAt,
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const monthRaw = String(formData.get("month") ?? format(new Date(), "yyyy-MM"));
    const generatedDateRaw = String(formData.get("generatedDate") ?? "").trim();
    const layoutModeRaw = String(formData.get("layoutMode") ?? "auto");
    const calibrationRaw = formData.get("calibration");
    const timesheetRole = parseTimesheetRole(formData.get("timesheetRole"));
    const layoutMode =
      layoutModeRaw === "standard" || layoutModeRaw === "carry" || layoutModeRaw === "auto"
        ? layoutModeRaw
        : "auto";
    const parsedCalibration =
      typeof calibrationRaw === "string"
        ? timesheetCalibrationSchema.safeParse(
            (() => {
              try {
                return JSON.parse(calibrationRaw) as unknown;
              } catch {
                return {};
              }
            })(),
          )
        : timesheetCalibrationSchema.safeParse({});
    const parsedMonth = monthQuerySchema.safeParse(monthRaw);

    if (!parsedMonth.success) {
      return finalizeApiTimer(NextResponse.json({ error: "Invalid month format." }, { status: 400 }), "entries.fill-pdf", startedAt);
    }

    if (!(file instanceof File)) {
      return finalizeApiTimer(
        NextResponse.json({ error: "Please upload a blank timesheet PDF." }, { status: 400 }),
        "entries.fill-pdf",
        startedAt,
      );
    }
    const isPdfMime = file.type === "application/pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      return finalizeApiTimer(NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 }), "entries.fill-pdf", startedAt);
    }

    const monthDate = new Date(`${parsedMonth.data}-01T00:00:00`);
    const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
    const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        date: { gte: start, lte: end },
      },
      include: { breaks: { orderBy: { start: "asc" } } },
      orderBy: { date: "asc" },
    });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, signature: true },
    });
    const employeeName =
      user?.name?.trim() ||
      user?.email?.split("@")[0] ||
      session.user.name?.trim() ||
      session.user.email?.split("@")[0] ||
      "Employee";
    const generatedDate = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(generatedDateRaw)
      ? generatedDateRaw
      : format(new Date(), "M/d/yyyy");

    const filled = await fillTimesheetPdfTemplate({
      templateBytes: bytes,
      month: parsedMonth.data,
      entries,
      employeeName,
      signatureDataUrl: user?.signature ?? null,
      generatedDate,
      layoutMode,
      role: timesheetRole,
      calibration: parsedCalibration.success ? parsedCalibration.data : undefined,
    });

    const filename = buildDownloadFilename({
      kind: "timesheet_filled_pdf",
      month: parsedMonth.data,
      extension: "pdf",
    });

    return finalizeApiTimer(
      new NextResponse(Buffer.from(filled), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      }),
      "entries.fill-pdf",
      startedAt,
    );
  } catch (error) {
    console.error("Fill timesheet PDF failed:", error);
    const message = error instanceof Error ? error.message : "Could not fill this template.";
    return finalizeApiTimer(
      NextResponse.json(
        {
          error:
            process.env.NODE_ENV === "development"
              ? `Could not fill this template: ${message}`
              : "Could not fill this template. Upload a compatible blank monthly timesheet PDF template.",
        },
        { status: 500 },
      ),
      "entries.fill-pdf",
      startedAt,
    );
  }
}
