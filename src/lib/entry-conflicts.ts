import { prisma } from "@/lib/prisma";
import { formatTime12h, shiftsOverlap } from "@/lib/time";

type ShiftInput = { punchIn: string; punchOut: string; breaks: { start: string; end: string }[] };

/**
 * A user may log one entry per position per day, and shifts for different
 * positions on the same day must not overlap. Returns an error message, or null.
 */
export async function findSameDayConflict(params: {
  userId: string;
  positionId: string;
  date: string;
  shift: ShiftInput;
  excludeEntryId?: string;
}) {
  const sameDay = await prisma.timeEntry.findMany({
    where: { userId: params.userId, date: params.date, id: params.excludeEntryId ? { not: params.excludeEntryId } : undefined },
    include: { breaks: true, position: { select: { name: true } } },
  });

  if (sameDay.some((entry) => entry.positionId === params.positionId)) {
    return { status: 409, error: "This position already has an entry for this date. Edit it instead." };
  }

  const clash = sameDay.find((entry) => shiftsOverlap(entry, params.shift));
  if (clash) {
    return {
      status: 409,
      error: `This overlaps your ${clash.position.name} shift (${formatTime12h(clash.punchIn)}–${formatTime12h(clash.punchOut)}) on ${params.date}.`,
    };
  }
  return null;
}
