import type { Position as PositionRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseTimesheetRole } from "@/lib/timesheet-templates";
import { workScheduleSchema } from "@/lib/validators";
import { DEFAULT_WORK_SCHEDULE } from "@/lib/work-schedule";
import type { Position } from "@/types/position";

export function serializePosition(row: PositionRow): Position {
  const parsedSchedule = workScheduleSchema.safeParse(row.workScheduleJson);
  return {
    id: row.id,
    name: row.name,
    role: parseTimesheetRole(row.role),
    hourlyRate: Math.max(row.hourlyRate ?? 0, 0),
    workSchedule: parsedSchedule.success ? parsedSchedule.data : DEFAULT_WORK_SCHEDULE,
  };
}

/**
 * Returns the user's positions (oldest first). Accounts created before positions
 * existed, or through a sign-in path that does not create one, get a default
 * position seeded from their profile rate and schedule.
 */
export async function ensureUserPositions(userId: string): Promise<Position[]> {
  const rows = await prisma.position.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (rows.length > 0) return rows.map(serializePosition);

  // Parallel first requests would each create a default; serialize per user.
  const seeded = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    const existing = await tx.position.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    if (existing.length > 0) return existing;

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { hourlyRate: true, workScheduleJson: true },
    });
    const created = await tx.position.create({
      data: {
        userId,
        name: "Student Assistant",
        role: "student_assistant",
        hourlyRate: Math.max(user?.hourlyRate ?? 0, 0),
        workScheduleJson: user?.workScheduleJson ?? undefined,
      },
    });
    return [created];
  });
  return seeded.map(serializePosition);
}

/**
 * Resolves the position an entry should belong to. A requested id must belong
 * to the user; with no id, the user's first position is used.
 */
export async function resolvePositionForUser(userId: string, requestedId?: string | null) {
  const positions = await ensureUserPositions(userId);
  if (!requestedId) return positions[0];
  return positions.find((position) => position.id === requestedId) ?? null;
}
