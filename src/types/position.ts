import type { TimesheetRole } from "@/lib/timesheet-templates";
import type { WorkSchedule } from "@/lib/work-schedule";

export type Position = {
  id: string;
  name: string;
  role: TimesheetRole;
  hourlyRate: number;
  /** Dept code that starts timesheet file names (e.g. "010"); empty when not set. */
  unitCode: string;
  workSchedule: WorkSchedule;
};
