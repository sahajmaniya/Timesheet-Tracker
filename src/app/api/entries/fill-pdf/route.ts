import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { buildDownloadFilename } from "@/lib/downloads";
import { prisma } from "@/lib/prisma";
import { fillTimesheetPdfTemplate } from "@/lib/timesheet-pdf";
import { monthQuerySchema } from "@/lib/validators";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const monthRaw = String(formData.get("month") ?? format(new Date(), "yyyy-MM"));
    const layoutModeRaw = String(formData.get("layoutMode") ?? "auto");
    const layoutMode =
      layoutModeRaw === "standard" || layoutModeRaw === "carry" || layoutModeRaw === "auto"
        ? layoutModeRaw
        : "auto";
    const parsedMonth = monthQuerySchema.safeParse(monthRaw);

    if (!parsedMonth.success) {
      return NextResponse.json({ error: "Invalid month format." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a blank timesheet PDF." }, { status: 400 });
    }
    const isPdfMime = file.type === "application/pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
    if (!isPdfMime && !isPdfExt) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
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
    const employeeName =
      session.user.name?.trim() ||
      session.user.email?.split("@")[0] ||
      "Employee";
    const generatedDate = format(new Date(), "M/d/yyyy");

    const filled = await fillTimesheetPdfTemplate({
      templateBytes: bytes,
      month: parsedMonth.data,
      entries,
      employeeName,
      generatedDate,
      layoutMode,
    });

    const filename = buildDownloadFilename({
      kind: "timesheet_filled_pdf",
      month: parsedMonth.data,
      extension: "pdf",
    });

    return new NextResponse(Buffer.from(filled), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Fill timesheet PDF failed:", error);
    const message = error instanceof Error ? error.message : "Could not fill this template.";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Could not fill this template: ${message}`
            : "Could not fill this template. Upload a compatible blank monthly timesheet PDF template.",
      },
      { status: 500 },
    );
  }
}
