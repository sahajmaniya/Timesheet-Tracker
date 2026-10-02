"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { weekdayKeys } from "@/lib/work-schedule";
import type { Position } from "@/types/position";

export function usePositions(initialPositions?: Position[]) {
  const [positions, setPositions] = useState<Position[]>(initialPositions ?? []);
  const [loaded, setLoaded] = useState(Boolean(initialPositions));

  const refreshPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/positions");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error || "Could not load positions");
        return;
      }
      setPositions(body.positions ?? []);
    } catch {
      toast.error("Could not load positions");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (initialPositions) return;
    void refreshPositions();
  }, [initialPositions, refreshPositions]);

  return { positions, setPositions, loaded, refreshPositions };
}

/** The position normally worked on this date's weekday, if exactly one is scheduled. */
export function scheduledPositionForDate(positions: Position[], date: string) {
  const weekday = weekdayKeys[new Date(`${date}T00:00:00`).getDay()];
  if (!weekday) return null;
  const scheduled = positions.filter((position) => position.workSchedule[weekday]?.enabled);
  return scheduled.length === 1 ? scheduled[0] : null;
}
