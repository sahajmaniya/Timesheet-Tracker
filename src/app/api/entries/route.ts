import { startOfMonth, endOfMonth, format } from "date-fns";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { serializeEntry } from "@/lib/entries";
import { prisma } from "@/lib/prisma";
import { validateChronology } from "@/lib/time";
import { monthQuerySchema, timeEntrySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month") ?? format(new Date(), "yyyy-MM");
  const parsedMonth = monthQuerySchema.safeParse(monthParam);

  if (!parsedMonth.success) {
    return NextResponse.json({ error: parsedMonth.error.issues[0]?.message }, { status: 400 });
  }

  const monthDate = new Date(`${parsedMonth.data}-01T00:00:00`);
  const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: { breaks: { orderBy: { start: "asc" } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    entries: entries.map(serializeEntry),
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = timeEntrySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const chronologyError = validateChronology(parsed.data);
    if (chronologyError) {
      return NextResponse.json({ error: chronologyError }, { status: 400 });
    }

    const existing = await prisma.timeEntry.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: parsed.data.date,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An entry for this date already exists. Edit it instead." },
        { status: 409 },
      );
    }

    const created = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        date: parsed.data.date,
        punchIn: parsed.data.punchIn,
        punchOut: parsed.data.punchOut,
        notes: parsed.data.notes,
        breaks: {
          create: parsed.data.breaks.map((item) => ({ start: item.start, end: item.end })),
        },
      },
      include: { breaks: { orderBy: { start: "asc" } } },
    });

    return NextResponse.json({ entry: serializeEntry(created) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month") ?? format(new Date(), "yyyy-MM");
  const parsedMonth = monthQuerySchema.safeParse(monthParam);

  if (!parsedMonth.success) {
    return NextResponse.json({ error: parsedMonth.error.issues[0]?.message }, { status: 400 });
  }

  const monthDate = new Date(`${parsedMonth.data}-01T00:00:00`);
  const start = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const end = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const result = await prisma.timeEntry.deleteMany({
    where: {
      userId: session.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
  });

  return NextResponse.json({
    success: true,
    deletedCount: result.count,
    month: parsedMonth.data,
  });
}
