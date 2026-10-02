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
  /**
   * Voucher with fixed date rows (CSULB ISA hourly voucher). Three columns of
   * 11 rows: [prev-month 31, 1–10], [11–21], [22–31, next-month 1].
   */
  fixedDaySlotMapping?: {
    enabled: boolean;
    /** Centers of the HOURS (whole hours) and 10ths columns, per column. */
    hoursCenterX: [number, number, number];
    tenthsCenterX: [number, number, number];
    firstRowTextY: number;
    rowStepY: number;
    textSize: number;
  };
  /** "MM/YY" pay period box; any value printed on the blank is painted over first. */
  payPeriodField?: {
    centerX: number;
    baselineY: number;
    size: number;
    clearRect: { x: number; y: number; width: number; height: number };
    /** Cell background as 0–1 RGB. */
    background: [number, number, number];
  };
};

export type TimesheetTemplateDefinition = {
  role: TimesheetRole;
  label: string;
  shortLabel: string;
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
    shortLabel: "SA",
    description: "CSULB-style Student Assistant timesheet with REG + leave sections.",
    section1TrcCodes: ["REG"],
    section2TrcCodes: ["HOL", "OTPR", "PH", "SHE08", "SHGRV", "SHIN08", "SHSWG", "SL", "VA"],
    hoursRenderMode: "split_by_break",
    layout: baseLayout,
  },
  instructional_student_assistant: {
    role: "instructional_student_assistant",
    label: "Instructional Student Assistant (ISA)",
    shortLabel: "ISA",
    description: "ISA role template with total-hours rendering (no break rows in the PDF).",
    section1TrcCodes: ["REG"],
    section2TrcCodes: ["HOL", "OTPR", "PH", "SHE08", "SHGRV", "SHIN08", "SHSWG", "SL", "VA"],
    hoursRenderMode: "total_only",
    layout: {
      ...baseLayout,
      fixedDaySlotMapping: {
        enabled: true,
        // Measured from a submitted CSULB ISA voucher (Letter portrait, 612x792).
        hoursCenterX: [144.1, 317.17, 490.26],
        tenthsCenterX: [194.33, 367.42, 540.49],
        firstRowTextY: 572.26,
        rowStepY: 12.36,
        textSize: 10.2,
      },
      payPeriodField: {
        centerX: 107.79,
        baselineY: 695.02,
        size: 10.2,
        clearRect: { x: 70, y: 689.5, width: 80, height: 17.5 },
        background: [0.8, 1, 1], // #ccffff
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
