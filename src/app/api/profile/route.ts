import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema, workScheduleSchema } from "@/lib/validators";
import { DEFAULT_WORK_SCHEDULE } from "@/lib/work-schedule";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      workScheduleJson: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const parsedSchedule = workScheduleSchema.safeParse(user.workScheduleJson);

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      image: user.image,
      workSchedule: parsedSchedule.success ? parsedSchedule.data : DEFAULT_WORK_SCHEDULE,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile input" },
        { status: 400 },
      );
    }

    const hasImageField =
      typeof body === "object" &&
      body !== null &&
      Object.prototype.hasOwnProperty.call(body, "image");

    const updateData: Prisma.UserUpdateInput = {
      name: parsed.data.name,
    };

    if (hasImageField) {
      updateData.image = parsed.data.image || null;
    }

    if (parsed.data.workSchedule) {
      updateData.workScheduleJson = parsed.data.workSchedule as Prisma.InputJsonValue;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        image: true,
        workScheduleJson: true,
      },
    });

    const parsedSchedule = workScheduleSchema.safeParse(updated.workScheduleJson);

    return NextResponse.json({
      profile: {
        name: updated.name,
        email: updated.email,
        image: updated.image,
        workSchedule: parsedSchedule.success ? parsedSchedule.data : DEFAULT_WORK_SCHEDULE,
      },
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
