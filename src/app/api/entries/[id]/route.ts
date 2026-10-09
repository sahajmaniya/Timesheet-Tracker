import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { serializeEntry } from "@/lib/entries";
import { findSameDayConflict } from "@/lib/entry-conflicts";
import { resolvePositionForUser } from "@/lib/positions";
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
    include: { breaks: { orderBy: { start: "asc" } }, position: { select: { role: true } } },
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

    // Omitting positionId keeps the entry's current position.
    let positionId = current.positionId;
    if (parsed.data.positionId && parsed.data.positionId !== current.positionId) {
      const position = await resolvePositionForUser(session.user.id, parsed.data.positionId);
      if (!position) {
        return NextResponse.json({ error: "Position not found." }, { status: 400 });
      }
      positionId = position.id;
    }

    const conflict = await findSameDayConflict({
      userId: session.user.id,
      positionId,
      date: parsed.data.date,
      shift: parsed.data,
      excludeEntryId: id,
    });
    if (conflict) {
      return NextResponse.json({ error: conflict.error }, { status: conflict.status });
    }

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
        positionId,
        date: parsed.data.date,
        punchIn: parsed.data.punchIn,
        punchOut: parsed.data.punchOut,
        notes: parsed.data.notes,
        // Omitted (e.g. bulk edits) keeps the existing session notes.
        ...(parsed.data.sessionNotes ? { sessionNotes: parsed.data.sessionNotes } : {}),
        breaks: {
          deleteMany: {},
          create: parsed.data.breaks.map((item) => ({
            start: item.start,
            end: item.end,
          })),
        },
      },
      include: { breaks: { orderBy: { start: "asc" } }, position: { select: { role: true } } },
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
