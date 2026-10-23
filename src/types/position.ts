import type { TimesheetRole } from "@/lib/timesheet-templates";
import type { WorkSchedule } from "@/lib/work-schedule";

export type Position = {
  id: string;
  name: string;
  role: TimesheetRole;
  hourlyRate: number;
  /** Unit code from the voucher (e.g. "010"); empty when not set. */
  unitCode: string;
  workSchedule: WorkSchedule;
};
