import { describe, expect, it } from "vitest";
import { calculatePositionPayBreakdown } from "@/lib/payroll";

const sa = { id: "sa", name: "Library SA", role: "student_assistant", hourlyRate: 18 };
const isa = { id: "isa", name: "CS Lab ISA", role: "instructional_student_assistant", hourlyRate: 22.5 };

describe("calculatePositionPayBreakdown", () => {
  it("prices each position at its own rate and sums the gross", () => {
    const result = calculatePositionPayBreakdown(
      [
        { positionId: "sa", workedMinutes: 240 },
        { positionId: "isa", workedMinutes: 90 },
        { positionId: "sa", workedMinutes: 120 },
      ],
      [sa, isa],
    );

    expect(result.lines).toEqual([
      { positionId: "sa", name: "Library SA", role: "student_assistant", hourlyRate: 18, workedMinutes: 360, grossPay: 108 },
      { positionId: "isa", name: "CS Lab ISA", role: "instructional_student_assistant", hourlyRate: 22.5, workedMinutes: 90, grossPay: 33.75 },
    ]);
    expect(result.workedMinutes).toBe(450);
    expect(result.grossPay).toBe(141.75);
  });

  it("lists idle positions with zeros and ignores entries for unknown positions", () => {
    const result = calculatePositionPayBreakdown([{ positionId: "gone", workedMinutes: 60 }], [sa]);
    expect(result.lines[0]).toMatchObject({ positionId: "sa", workedMinutes: 0, grossPay: 0 });
    expect(result.grossPay).toBe(0);
  });

  it("treats negative rates as zero", () => {
    const result = calculatePositionPayBreakdown([{ positionId: "sa", workedMinutes: 60 }], [{ ...sa, hourlyRate: -5 }]);
    expect(result.grossPay).toBe(0);
  });
});
