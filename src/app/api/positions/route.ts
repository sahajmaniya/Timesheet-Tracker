import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { ensureUserPositions, serializePosition } from "@/lib/positions";
import { prisma } from "@/lib/prisma";
import { positionSchema } from "@/lib/validators";

const MAX_POSITIONS = 10;

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const positions = await ensureUserPositions(session.user.id);
    return NextResponse.json({ positions });
  } catch (error) {
    console.error("Could not load positions:", error);
    return NextResponse.json({ error: "Could not load positions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = positionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid position" }, { status: 400 });
    }

    const count = await prisma.position.count({ where: { userId: session.user.id } });
    if (count >= MAX_POSITIONS) {
      return NextResponse.json({ error: `You can have up to ${MAX_POSITIONS} positions.` }, { status: 400 });
    }

    const created = await prisma.position.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        role: parsed.data.role,
        hourlyRate: parsed.data.hourlyRate,
        workScheduleJson: parsed.data.workSchedule as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ position: serializePosition(created) }, { status: 201 });
  } catch (error) {
    console.error("Could not create position:", error);
    return NextResponse.json({ error: "Could not create position" }, { status: 500 });
  }
}
