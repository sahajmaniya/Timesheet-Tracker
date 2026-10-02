import { describe, expect, it } from "vitest";
import { getFixedDaySlotIndex, getVoucherMonth, splitHoursAndTenths } from "@/lib/timesheet-pdf";
import { minutesToTenthsDecimal } from "@/lib/time";

describe("ISA voucher layout", () => {
  it("picks the month holding most of a payroll period", () => {
    expect(getVoucherMonth("2026-09")).toBe("2026-09");
    expect(getVoucherMonth("2026-09", "2026-07-31", "2026-08-31")).toBe("2026-08");
    expect(getVoucherMonth("2026-09", "2026-08-31", "2026-10-01")).toBe("2026-09");
  });

  it("maps dates to the voucher's fixed rows", () => {
    expect(getFixedDaySlotIndex("2026-09-01", "2026-09")).toEqual({ columnIndex: 0, rowIndex: 1 });
    expect(getFixedDaySlotIndex("2026-09-10", "2026-09")).toEqual({ columnIndex: 0, rowIndex: 10 });
    expect(getFixedDaySlotIndex("2026-09-11", "2026-09")).toEqual({ columnIndex: 1, rowIndex: 0 });
    expect(getFixedDaySlotIndex("2026-09-21", "2026-09")).toEqual({ columnIndex: 1, rowIndex: 10 });
    expect(getFixedDaySlotIndex("2026-09-22", "2026-09")).toEqual({ columnIndex: 2, rowIndex: 0 });
    expect(getFixedDaySlotIndex("2026-08-31", "2026-08")).toEqual({ columnIndex: 2, rowIndex: 9 });
  });

  it("uses the previous month's 31st and next month's 1st rows", () => {
    expect(getFixedDaySlotIndex("2026-08-31", "2026-09")).toEqual({ columnIndex: 0, rowIndex: 0 });
    expect(getFixedDaySlotIndex("2026-10-01", "2026-09")).toEqual({ columnIndex: 2, rowIndex: 10 });
    expect(getFixedDaySlotIndex("2026-01-31", "2026-02")).toEqual({ columnIndex: 0, rowIndex: 0 });
  });

  it("rejects dates the voucher has no row for", () => {
    expect(getFixedDaySlotIndex("2026-08-30", "2026-09")).toBeNull();
    expect(getFixedDaySlotIndex("2026-10-02", "2026-09")).toBeNull();
    expect(getFixedDaySlotIndex("2026-11-01", "2026-09")).toBeNull();
  });

  it("splits tenths into the HOURS and 10ths boxes like the department voucher", () => {
    expect(splitHoursAndTenths(1.3)).toEqual({ hours: "1.0", tenths: ".3" });
    expect(splitHoursAndTenths(3)).toEqual({ hours: "3.0", tenths: null });
    expect(splitHoursAndTenths(0.5)).toEqual({ hours: null, tenths: ".5" });
    // Float noise from summing tenths must not shift the split.
    expect(splitHoursAndTenths(0.1 + 0.2)).toEqual({ hours: null, tenths: ".3" });
  });

  it("converts minutes with the voucher's tenths table", () => {
    expect(minutesToTenthsDecimal(78)).toBe(1.3); // 1h 18m → 13–18 min = .3
    expect(minutesToTenthsDecimal(132)).toBe(2.2); // 2h 12m → 7–12 min = .2
    expect(minutesToTenthsDecimal(115)).toBe(2); // 1h 55m → 55–60 min = 1.0
  });
});
