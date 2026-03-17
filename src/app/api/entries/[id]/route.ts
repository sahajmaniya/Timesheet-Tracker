import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { serializeEntry } from "@/lib/entries";
import { prisma } from "@/lib/prisma";
import { validateChronology } from "@/lib/time";
import { timeEntrySchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const entry = await prisma.timeEntry.findFirst({
    where: { id, userId: session.user.id },
    include: { breaks: { orderBy: { start: "asc" } } },
  });

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ entry: serializeEntry(entry) });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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

    const current = await prisma.timeEntry.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const duplicateDate = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        date: parsed.data.date,
        id: { not: id },
      },
    });

    if (duplicateDate) {
      return NextResponse.json(
        { error: "An entry for this date already exists." },
        { status: 409 },
      );
    }

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
        date: parsed.data.date,
        punchIn: parsed.data.punchIn,
        punchOut: parsed.data.punchOut,
        notes: parsed.data.notes,
        breaks: {
          deleteMany: {},
          create: parsed.data.breaks.map((item) => ({
            start: item.start,
            end: item.end,
          })),
        },
      },
      include: { breaks: { orderBy: { start: "asc" } } },
    });

    return NextResponse.json({ entry: serializeEntry(updated) });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.timeEntry.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.timeEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
