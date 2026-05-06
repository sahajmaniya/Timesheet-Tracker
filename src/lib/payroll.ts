export type PayrollProfile = {
  hourlyRate: number;
  federalStatus: string;
  stateStatus: string;
  federalTaxPercent: number;
  stateTaxPercent: number;
  otherDeductionMonthly: number;
};

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

function calculateBuiltInAutoTaxEstimate(
  workedMinutes: number,
  profile: PayrollProfile,
): MonthlyPayEstimate {
  const workedHours = workedMinutes / 60;
  const grossPay = roundCurrency(workedHours * Math.max(profile.hourlyRate || 0, 0));
  const taxableGross = grossPay;
  const federalTax = 0;
  const stateTax = 0;
  const otherDeductions = 0;
  const totalDeductions = 0;
  const netPay = grossPay;

  return {
    grossPay,
    taxableGross,
    federalTax,
    stateTax,
    otherDeductions,
    totalDeductions,
    netPay,
    source: "local_estimate",
  };
}

export async function calculateMonthlyPayEstimateWithSource(params: {
  month: string;
  workedMinutes: number;
  profile: PayrollProfile;
}): Promise<MonthlyPayEstimate> {
  void params.month;
  return calculateBuiltInAutoTaxEstimate(params.workedMinutes, params.profile);
}
