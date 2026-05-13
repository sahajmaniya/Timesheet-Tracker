import { describe, expect, it } from "vitest";
import {
  calcBreakMinutes,
  calcWorkedMinutes,
  formatTenthsDecimal,
  formatTime12h,
  minutesBetween,
  minutesToHM,
  minutesToTenthsDecimal,
  validateChronology,
} from "@/lib/time";

describe("time utilities", () => {
  it("computes minute differences", () => {
    expect(minutesBetween("09:00", "10:30")).toBe(90);
  });

  it("formats 24h to 12h display", () => {
    expect(formatTime12h("14:05")).toBe("2:05 PM");
  });

  it("sums break minutes while ignoring negative ranges", () => {
    const mins = calcBreakMinutes([
      { start: "12:00", end: "12:30" },
      { start: "14:00", end: "13:45" },
    ]);
    expect(mins).toBe(30);
  });

  it("computes worked minutes from shift minus breaks", () => {
    const worked = calcWorkedMinutes({
      punchIn: "09:00",
      punchOut: "17:00",
      breaks: [{ start: "12:30", end: "13:00" }],
    });
    expect(worked).toBe(450);
  });

  it("converts minutes to hour-minute label", () => {
    expect(minutesToHM(125)).toBe("2h 05m");
  });

  it("rounds payroll tenths correctly", () => {
    expect(minutesToTenthsDecimal(0)).toBe(0);
    expect(minutesToTenthsDecimal(61)).toBe(1.1);
    expect(minutesToTenthsDecimal(66)).toBe(1.1);
    expect(minutesToTenthsDecimal(67)).toBe(1.2);
    expect(minutesToTenthsDecimal(119)).toBe(2);
    expect(formatTenthsDecimal(127)).toBe("2.2");
  });

  it("validates chronology and break boundaries", () => {
    const ok = validateChronology({
      date: "2026-05-01",
      punchIn: "09:00",
      punchOut: "17:00",
      notes: null,
      breaks: [{ start: "12:00", end: "12:30" }],
    });
    expect(ok).toBeNull();

    const badBreak = validateChronology({
      date: "2026-05-01",
      punchIn: "09:00",
      punchOut: "17:00",
      notes: null,
      breaks: [{ start: "08:50", end: "09:10" }],
    });
    expect(badBreak).toBe("Break starts before punch in.");
  });
});
