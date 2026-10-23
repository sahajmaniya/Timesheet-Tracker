import { describe, expect, it } from "vitest";
import { buildTimesheetFileName, lastFirstName, normalizePdfFileName } from "@/lib/timesheet-naming";

describe("timesheet file names", () => {
  it("follows the Dept_TYPE_Last_First_MMYYYY convention", () => {
    expect(buildTimesheetFileName({ deptCode: "010", roleShortLabel: "SA", fullName: "Sahaj Maniya", voucherMonth: "2026-10" }))
      .toBe("010_SA_Maniya_Sahaj_102026.pdf");
    expect(buildTimesheetFileName({ deptCode: "096", roleShortLabel: "ISA", fullName: "Sahaj Maniya", voucherMonth: "2026-09" }))
      .toBe("096_ISA_Maniya_Sahaj_092026.pdf");
  });

  it("leaves out parts that are not set", () => {
    expect(buildTimesheetFileName({ deptCode: "", roleShortLabel: "ISA", fullName: "Sahaj Maniya", voucherMonth: "2026-09" }))
      .toBe("ISA_Maniya_Sahaj_092026.pdf");
    expect(buildTimesheetFileName({ roleShortLabel: "SA", fullName: null, voucherMonth: "2026-01" })).toBe("SA_012026.pdf");
  });

  it("uses last name, then first name", () => {
    expect(lastFirstName("Sahaj Vijaykumar Maniya")).toBe("Maniya_Sahaj");
    expect(lastFirstName("  Mili   Virani ")).toBe("Virani_Mili");
    expect(lastFirstName("Vraj")).toBe("Vraj");
  });

  it("cleans edited names and keeps the .pdf extension", () => {
    expect(normalizePdfFileName("010_SA_Maniya_Sahaj_102026")).toBe("010_SA_Maniya_Sahaj_102026.pdf");
    expect(normalizePdfFileName("my sheet?.PDF")).toBe("my_sheet.pdf");
    expect(normalizePdfFileName("  ")).toBe("");
  });
});
