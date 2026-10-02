export type MonthlyPayEstimate = {
  grossPay: number;
  taxableGross: number;
  federalTax: number;
  stateTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  source: "local_estimate";
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

export type PositionPayLine = {
  positionId: string;
  name: string;
  role: string;
  hourlyRate: number;
  workedMinutes: number;
  grossPay: number;
};

/**
 * Splits worked minutes by position and prices each at its own hourly rate.
 * Every position is listed (with zeros when unused) so callers can show the
 * full breakdown; entries for unknown positions are ignored.
 */
export function calculatePositionPayBreakdown(
  entries: { positionId: string; workedMinutes: number }[],
  positions: { id: string; name: string; role: string; hourlyRate: number }[],
) {
  const minutesByPosition = new Map<string, number>();
  for (const entry of entries) {
    minutesByPosition.set(entry.positionId, (minutesByPosition.get(entry.positionId) ?? 0) + entry.workedMinutes);
  }

  const lines: PositionPayLine[] = positions.map((position) => {
    const workedMinutes = minutesByPosition.get(position.id) ?? 0;
    const hourlyRate = Math.max(position.hourlyRate || 0, 0);
    return {
      positionId: position.id,
      name: position.name,
      role: position.role,
      hourlyRate,
      workedMinutes,
      grossPay: roundCurrency((workedMinutes / 60) * hourlyRate),
    };
  });

  return {
    lines,
    workedMinutes: lines.reduce((sum, line) => sum + line.workedMinutes, 0),
    grossPay: roundCurrency(lines.reduce((sum, line) => sum + line.grossPay, 0)),
  };
}

/** Wraps a gross amount in the estimate shape (taxes are not modelled yet). */
export function grossOnlyEstimate(grossPay: number): MonthlyPayEstimate {
  return {
    grossPay,
    taxableGross: grossPay,
    federalTax: 0,
    stateTax: 0,
    otherDeductions: 0,
    totalDeductions: 0,
    netPay: grossPay,
    source: "local_estimate",
  };
}
