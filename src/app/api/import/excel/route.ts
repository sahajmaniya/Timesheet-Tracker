import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { parseTimesheetWorkbook } from "@/lib/excel-import";
import { prisma } from "@/lib/prisma";
import { validateChronology } from "@/lib/time";

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const mode = formData.get("mode") === "skip" ? "skip" : "overwrite";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload an .xlsx file." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const entries = parseTimesheetWorkbook(Buffer.from(arrayBuffer));

    if (entries.length === 0) {
      return NextResponse.json({ error: "No valid rows found in workbook." }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const months = new Set<string>();

    for (const entry of entries) {
      const chronologyError = validateChronology(entry);
      if (chronologyError) {
        skipped += 1;
        continue;
      }

      months.add(entry.date.slice(0, 7));

      const existing = await prisma.timeEntry.findUnique({
        where: {
          userId_date: {
            userId: session.user.id,
            date: entry.date,
          },
        },
      });

      if (existing && mode === "skip") {
        skipped += 1;
        continue;
      }

      if (existing) {
        await prisma.timeEntry.update({
          where: { id: existing.id },
          data: {
            punchIn: entry.punchIn,
            punchOut: entry.punchOut,
            notes: existing.notes ?? entry.notes,
            breaks: {
              deleteMany: {},
              create: entry.breaks.map((item) => ({ start: item.start, end: item.end })),
            },
          },
        });
        updated += 1;
      } else {
        await prisma.timeEntry.create({
          data: {
            userId: session.user.id,
            date: entry.date,
            punchIn: entry.punchIn,
            punchOut: entry.punchOut,
            notes: entry.notes,
            breaks: {
              create: entry.breaks.map((item) => ({ start: item.start, end: item.end })),
            },
          },
        });
        created += 1;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalParsed: entries.length,
        created,
        updated,
        skipped,
        months: Array.from(months).sort(),
      },
    });
  } catch (error) {
    console.error("Excel import failed:", error);
    return NextResponse.json({ error: "Failed to import Excel file." }, { status: 500 });
  }
}
