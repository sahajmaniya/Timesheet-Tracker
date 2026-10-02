import { describe, expect, it } from "vitest";
import {
  calcBreakMinutes,
  calcWorkedMinutes,
  formatTenthsDecimal,
  formatTime12h,
  minutesBetween,
  minutesToHM,
  entryTenths,
  minutesToTenthsDecimal,
  sessionTenthsTotal,
  shiftsOverlap,
  validateChronology,
  workedSegments,
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

describe("shift overlap across positions", () => {
  it("splits a shift into worked segments around breaks", () => {
    expect(workedSegments({ punchIn: "08:00", punchOut: "18:00", breaks: [{ start: "09:00", end: "16:00" }] })).toEqual([
      { start: 480, end: 540 },
      { start: 960, end: 1080 },
    ]);
  });

  it("ignores time inside another shift's break", () => {
    const isa = { punchIn: "08:00", punchOut: "18:00", breaks: [{ start: "09:00", end: "16:00" }] };
    expect(shiftsOverlap(isa, { punchIn: "10:00", punchOut: "14:00", breaks: [] })).toBe(false);
    expect(shiftsOverlap(isa, { punchIn: "08:30", punchOut: "10:00", breaks: [] })).toBe(true);
  });

  it("allows back-to-back shifts", () => {
    const morning = { punchIn: "11:00", punchOut: "12:15", breaks: [] };
    expect(shiftsOverlap(morning, { punchIn: "12:15", punchOut: "17:00", breaks: [] })).toBe(false);
    expect(shiftsOverlap(morning, { punchIn: "13:00", punchOut: "17:00", breaks: [] })).toBe(false);
  });
});

describe("ISA work sessions", () => {
  // Sep 17: 10:55–12:19 and 2:00–2:45, stored as one day with the gap as a break.
  const sep17 = { punchIn: "10:55", punchOut: "14:45", breaks: [{ start: "12:19", end: "14:00" }] };

  it("rounds each session with the voucher table, then sums", () => {
    expect(sessionTenthsTotal(sep17)).toBe(2.2); // 1.4 + 0.8
    expect(sessionTenthsTotal({ punchIn: "08:00", punchOut: "18:00", breaks: [{ start: "09:00", end: "16:00" }] })).toBe(3);
  });

  it("differs from day rounding only where the voucher rules do", () => {
    const twoShortSessions = { punchIn: "09:00", punchOut: "10:02", breaks: [{ start: "09:31", end: "09:31" }] };
    const split = { punchIn: "09:00", punchOut: "11:01", breaks: [{ start: "09:31", end: "10:30" }] };
    expect(sessionTenthsTotal(split)).toBe(1.2); // 31 min = .6, twice
    expect(entryTenths(split, "student_assistant")).toBe(1.1); // 62 min as one day = 1.1
    expect(entryTenths(split, "instructional_student_assistant")).toBe(1.2);
    expect(sessionTenthsTotal(twoShortSessions)).toBe(1.1); // zero-length gap = one 62-min session
  });
});

