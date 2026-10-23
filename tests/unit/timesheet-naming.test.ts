import { describe, expect, it } from "vitest";
import { buildTimesheetFileName, lastFirstName, normalizePdfFileName } from "@/lib/timesheet-naming";

describe("timesheet file names", () => {
  it("follows the department convention", () => {
    expect(buildTimesheetFileName({ unitCode: "010", roleShortLabel: "SA", fullName: "Sahaj Maniya", voucherMonth: "2026-10" }))
      .toBe("010_SA_TIMESHEET_Maniya,_Sahaj_102026.pdf");
    expect(buildTimesheetFileName({ unitCode: "096", roleShortLabel: "ISA", fullName: "Sahaj Maniya", voucherMonth: "2026-09" }))
      .toBe("096_ISA_TIMESHEET_Maniya,_Sahaj_092026.pdf");
  });

  it("leaves out parts that are not set", () => {
    expect(buildTimesheetFileName({ unitCode: "", roleShortLabel: "ISA", fullName: "Sahaj Maniya", voucherMonth: "2026-09" }))
      .toBe("ISA_TIMESHEET_Maniya,_Sahaj_092026.pdf");
    expect(buildTimesheetFileName({ roleShortLabel: "SA", fullName: null, voucherMonth: "2026-01" })).toBe("SA_TIMESHEET_012026.pdf");
  });

  it("uses last name, first name", () => {
    expect(lastFirstName("Sahaj Vijaykumar Maniya")).toBe("Maniya,_Sahaj");
    expect(lastFirstName("  Mili   Virani ")).toBe("Virani,_Mili");
    expect(lastFirstName("Vraj")).toBe("Vraj");
  });

  it("cleans edited names and keeps the .pdf extension", () => {
    expect(normalizePdfFileName("010_SA_TIMESHEET_Maniya,_Sahaj_102026")).toBe("010_SA_TIMESHEET_Maniya,_Sahaj_102026.pdf");
    expect(normalizePdfFileName("my sheet?.PDF")).toBe("my_sheet.pdf");
    expect(normalizePdfFileName("  ")).toBe("");
  });
});
