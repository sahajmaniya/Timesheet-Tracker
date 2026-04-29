export type TimesheetRole = "student_assistant" | "instructional_student_assistant";

export type TimesheetLayoutConfig = {
  gridXByWeekday: [number, number, number, number, number, number, number];
  firstWeekY: number;
  weekYStep: number;
  topRowOffsetY: number;
  bottomRowOffsetY: number;
  inOffsetX: number;
  outOffsetX: number;
  hoursOffsetX: number;
  weeklyTotalX: number;
  weeklyTotalOffsetY: number;
  monthlyTotalY: number;
  signatureBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  typedSignature: {
    x: number;
    y: number;
    rotateDeg: number;
  };
  generatedDateCenters: number[];
  generatedDateY: number;
  fixedDaySlotMapping?: {
    enabled: boolean;
    columnBaseX: [number, number, number];
    firstRowTextY: number;
    rowStepY: number;
  };
};

export type TimesheetTemplateDefinition = {
  role: TimesheetRole;
  label: string;
  description: string;
  section1TrcCodes: string[];
  section2TrcCodes: string[];
  hoursRenderMode: "split_by_break" | "total_only";
  layout: TimesheetLayoutConfig;
};

const baseLayout: TimesheetLayoutConfig = {
  gridXByWeekday: [69, 159, 249, 339, 429, 519, 609],
  firstWeekY: 416,
  weekYStep: 55,
  topRowOffsetY: 14,
  bottomRowOffsetY: -22,
  inOffsetX: 12,
  outOffsetX: 36,
  hoursOffsetX: 63,
  weeklyTotalX: 724,
  weeklyTotalOffsetY: -2,
  monthlyTotalY: 92,
  signatureBox: {
    x: -10,
    y: 55,
    width: 220,
    height: 20,
  },
  typedSignature: {
    x: 28,
    y: 49,
    rotateDeg: -2,
  },
  generatedDateCenters: [200],
  generatedDateY: 65,
};

export const timesheetTemplates: Record<TimesheetRole, TimesheetTemplateDefinition> = {
  student_assistant: {
    role: "student_assistant",
    label: "Student Assistant (SA)",
    description: "CSULB-style Student Assistant timesheet with REG + leave sections.",
    section1TrcCodes: ["REG"],
    section2TrcCodes: ["HOL", "OTPR", "PH", "SHE08", "SHGRV", "SHIN08", "SHSWG", "SL", "VA"],
    hoursRenderMode: "split_by_break",
    layout: {
      ...baseLayout,
      fixedDaySlotMapping: {
        enabled: false,
        columnBaseX: [69, 339, 609],
        firstRowTextY: 430,
        rowStepY: 18,
      },
    },
  },
  instructional_student_assistant: {
    role: "instructional_student_assistant",
    label: "Instructional Student Assistant (ISA)",
    description: "ISA role template with total-hours rendering (no break rows in the PDF).",
    section1TrcCodes: ["REG"],
    section2TrcCodes: ["HOL", "OTPR", "PH", "SHE08", "SHGRV", "SHIN08", "SHSWG", "SL", "VA"],
    hoursRenderMode: "total_only",
    layout: {
      ...baseLayout,
      fixedDaySlotMapping: {
        enabled: true,
        // Tuned to align with existing ISA filled-sheet coordinate system.
        // Day blocks are [1-10], [11-21], [22-31].
        columnBaseX: [74, 247, 420],
        firstRowTextY: 572.2,
        rowStepY: 12.36,
      },
    },
  },
};

export const timesheetRoleOptions = Object.values(timesheetTemplates).map((template) => ({
  value: template.role,
  label: template.label,
  description: template.description,
}));

export const DEFAULT_TIMESHEET_ROLE: TimesheetRole = "student_assistant";

export function parseTimesheetRole(value: unknown): TimesheetRole {
  if (typeof value === "string" && value in timesheetTemplates) {
    return value as TimesheetRole;
  }
  return DEFAULT_TIMESHEET_ROLE;
}

export function getTimesheetTemplate(role: TimesheetRole) {
  return timesheetTemplates[role];
}
