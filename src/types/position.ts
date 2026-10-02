import type { TimesheetRole } from "@/lib/timesheet-templates";
import type { WorkSchedule } from "@/lib/work-schedule";

export type Position = {
  id: string;
  name: string;
  role: TimesheetRole;
  hourlyRate: number;
  workSchedule: WorkSchedule;
};
