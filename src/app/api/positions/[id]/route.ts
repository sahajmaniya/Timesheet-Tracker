import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { serializePosition } from "@/lib/positions";
import { prisma } from "@/lib/prisma";
import { positionSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const parsed = positionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid position" }, { status: 400 });
    }

    const existing = await prisma.position.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.position.update({
      where: { id },
      data: {
        name: parsed.data.name,
        role: parsed.data.role,
        hourlyRate: parsed.data.hourlyRate,
        workScheduleJson: parsed.data.workSchedule as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ position: serializePosition(updated) });
  } catch (error) {
    console.error("Could not update position:", error);
    return NextResponse.json({ error: "Could not update position" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    const existing = await prisma.position.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, _count: { select: { entries: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const total = await prisma.position.count({ where: { userId: session.user.id } });
    if (total <= 1) {
      return NextResponse.json({ error: "You need at least one position." }, { status: 400 });
    }
    if (existing._count.entries > 0) {
      return NextResponse.json(
        { error: `This position still has ${existing._count.entries} time entries. Move or delete them first.` },
        { status: 409 },
      );
    }

    await prisma.position.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not delete position:", error);
    return NextResponse.json({ error: "Could not delete position" }, { status: 500 });
  }
}
