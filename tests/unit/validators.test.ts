import { describe, expect, it } from "vitest";
import {
  monthQuerySchema,
  payrollPeriodSchema,
  signupSchema,
  timesheetCalibrationSchema,
  workScheduleSchema,
} from "@/lib/validators";
import { DEFAULT_WORK_SCHEDULE } from "@/lib/work-schedule";

describe("validators", () => {
  it("accepts valid signup payload and rejects weak passwords", () => {
    expect(
      signupSchema.safeParse({
        name: "Alex Doe",
        email: "alex@example.com",
        password: "StrongPass1!",
      }).success,
    ).toBe(true);

    expect(
      signupSchema.safeParse({
        name: "Alex Doe",
        email: "alex@example.com",
        password: "weakpass",
      }).success,
    ).toBe(false);

    expect(
      signupSchema.safeParse({
        name: "Alex Doe",
        email: "alex@example.com",
        password: "NoSpecial123",
      }).success,
    ).toBe(false);

    expect(
      signupSchema.safeParse({
        name: "Alex Doe",
        email: "alex@example.com",
        password: "Short1!",
      }).success,
    ).toBe(false);
  });

  it("validates month query format", () => {
    expect(monthQuerySchema.safeParse("2026-05").success).toBe(true);
    expect(monthQuerySchema.safeParse("2026-13").success).toBe(false);
    expect(monthQuerySchema.safeParse("05-2026").success).toBe(false);
  });

  it("validates payroll periods with real, chronological dates", () => {
    expect(
      payrollPeriodSchema.safeParse({
        label: "Jul 31 – Aug 31, 2026",
        startDate: "2026-07-31",
        endDate: "2026-08-31",
      }).success,
    ).toBe(true);
    expect(
      payrollPeriodSchema.safeParse({
        label: "Invalid date",
        startDate: "2026-02-30",
        endDate: "2026-03-01",
      }).success,
    ).toBe(false);
    expect(
      payrollPeriodSchema.safeParse({
        label: "Backwards period",
        startDate: "2026-08-31",
        endDate: "2026-07-31",
      }).success,
    ).toBe(false);
  });

  it("applies defaults to timesheet calibration", () => {
    const parsed = timesheetCalibrationSchema.parse({});
    expect(parsed.shiftX).toBe(0);
    expect(parsed.shiftY).toBe(0);
    expect(parsed.totalsShiftX).toBe(0);
  });

  it("enforces enabled work-schedule chronology", () => {
    const valid = structuredClone(DEFAULT_WORK_SCHEDULE);
    valid.mon.enabled = true;
    valid.mon.start = "09:00";
    valid.mon.end = "17:00";
    valid.mon.breakStart = "12:30";
    valid.mon.breakEnd = "13:00";
    expect(workScheduleSchema.safeParse(valid).success).toBe(true);

    const invalid = structuredClone(valid);
    invalid.mon.breakStart = "13:15";
    invalid.mon.breakEnd = "13:00";
    const parsed = workScheduleSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("Break end must be after break start");
    }
  });
});
