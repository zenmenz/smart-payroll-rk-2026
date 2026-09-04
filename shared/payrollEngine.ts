export type PayrollTaxProfile = {
  mci: number;
  minimumWage: number;
  standardDeductionMciCount: number;
  opvRateBps: number;
  opvMaxBaseMinimumWages: number;
  vosmsRateBps: number;
  vosmsMaxBaseMinimumWages: number;
  ipnBaseRateBps: number;
  ipnHighRateBps: number;
  ipnHighRateAnnualMciLimit: number;
  lowIncomeMonthlyMciLimit: number;
  lowIncomeCorrectionBps: number;
  soRateBps: number;
  soMinBaseMinimumWages: number;
  soMaxBaseMinimumWages: number;
  oosmsRateBps: number;
  oosmsMaxBaseMinimumWages: number;
  snRateBps: number;
  opvrRateBps: number;
  opvrMaxBaseMinimumWages: number;
};

export type PayrollCalculationInput = {
  baseSalary: number;
  taxableAccruals?: number;
  nonTaxableAccruals?: number;
  manualDeductions?: number;
  customTaxDeductions?: number;
  applyStandardDeduction: boolean;
  opvrApplicable: boolean;
  yearToDateTaxableIncomeBefore?: number;
  taxProfile: PayrollTaxProfile;
};

export type PayrollCalculationResult = {
  gross: number;
  taxableGross: number;
  manualAccruals: number;
  nonTaxableAccruals: number;
  manualDeductions: number;
  opv: number;
  vosms: number;
  standardDeduction: number;
  ipnBase: number;
  ipnCorrection: number;
  ipn: number;
  totalWithheld: number;
  netSalary: number;
  soBase: number;
  so: number;
  oosms: number;
  snBase: number;
  sn: number;
  opvr: number;
  totalEmployerContributions: number;
  totalCompanyCost: number;
};

const BPS_DIVISOR = 10_000;

function wholeTenge(value: number): number {
  return Math.round(value);
}

function nonNegativeWhole(value: number | undefined): number {
  return wholeTenge(Math.max(0, value ?? 0));
}

function applyRate(base: number, rateBps: number): number {
  return wholeTenge((base * rateBps) / BPS_DIVISOR);
}

function cappedBase(base: number, maximum: number): number {
  return Math.min(Math.max(0, base), Math.max(0, maximum));
}

function assertProfile(profile: PayrollTaxProfile): void {
  const values = [
    profile.mci,
    profile.minimumWage,
    profile.standardDeductionMciCount,
    profile.opvRateBps,
    profile.opvMaxBaseMinimumWages,
    profile.vosmsRateBps,
    profile.vosmsMaxBaseMinimumWages,
    profile.ipnBaseRateBps,
    profile.ipnHighRateBps,
    profile.ipnHighRateAnnualMciLimit,
    profile.lowIncomeMonthlyMciLimit,
    profile.lowIncomeCorrectionBps,
    profile.soRateBps,
    profile.soMinBaseMinimumWages,
    profile.soMaxBaseMinimumWages,
    profile.oosmsRateBps,
    profile.oosmsMaxBaseMinimumWages,
    profile.snRateBps,
    profile.opvrRateBps,
    profile.opvrMaxBaseMinimumWages,
  ];
  if (values.some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error("Профиль налоговых ставок содержит некорректное значение.");
  }
  if (profile.mci === 0 || profile.minimumWage === 0) {
    throw new Error("В профиле ставок должны быть указаны положительные значения МРП и МЗП.");
  }
}

/**
 * Calculates a payroll snapshot only from the supplied profile. The caller is responsible for
 * selecting a legally applicable and approved rate profile for the payroll period.
 */
export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const profile = input.taxProfile;
  assertProfile(profile);

  const baseSalary = nonNegativeWhole(input.baseSalary);
  const taxableAccruals = nonNegativeWhole(input.taxableAccruals);
  const nonTaxableAccruals = nonNegativeWhole(input.nonTaxableAccruals);
  const manualDeductions = nonNegativeWhole(input.manualDeductions);
  const customTaxDeductions = nonNegativeWhole(input.customTaxDeductions);
  const taxableGross = baseSalary + taxableAccruals;
  const gross = taxableGross + nonTaxableAccruals;

  const opv = applyRate(
    cappedBase(taxableGross, profile.minimumWage * profile.opvMaxBaseMinimumWages),
    profile.opvRateBps,
  );
  const vosms = applyRate(
    cappedBase(taxableGross, profile.minimumWage * profile.vosmsMaxBaseMinimumWages),
    profile.vosmsRateBps,
  );
  const standardDeduction = input.applyStandardDeduction
    ? profile.mci * profile.standardDeductionMciCount
    : 0;

  const ipnBaseBeforeCorrection = Math.max(
    0,
    taxableGross - opv - vosms - standardDeduction - customTaxDeductions,
  );
  const lowIncomeThreshold = profile.mci * profile.lowIncomeMonthlyMciLimit;
  const ipnCorrection = taxableGross > 0 && taxableGross <= lowIncomeThreshold
    ? applyRate(ipnBaseBeforeCorrection, profile.lowIncomeCorrectionBps)
    : 0;
  const ipnBase = Math.max(0, ipnBaseBeforeCorrection - ipnCorrection);

  const priorTaxableIncome = nonNegativeWhole(input.yearToDateTaxableIncomeBefore);
  const annualHighRateThreshold = profile.mci * profile.ipnHighRateAnnualMciLimit;
  const baseBandRemaining = Math.max(0, annualHighRateThreshold - priorTaxableIncome);
  const baseRateIncome = Math.min(ipnBase, baseBandRemaining);
  const highRateIncome = Math.max(0, ipnBase - baseRateIncome);
  const ipn = applyRate(baseRateIncome, profile.ipnBaseRateBps)
    + applyRate(highRateIncome, profile.ipnHighRateBps);

  const totalWithheld = opv + vosms + ipn + manualDeductions;
  const netSalary = Math.max(0, gross - totalWithheld);

  const minSoBase = profile.minimumWage * profile.soMinBaseMinimumWages;
  const maxSoBase = profile.minimumWage * profile.soMaxBaseMinimumWages;
  const unboundedSoBase = Math.max(0, taxableGross - opv);
  const soBase = taxableGross === 0 ? 0 : Math.min(Math.max(unboundedSoBase, minSoBase), maxSoBase);
  const so = taxableGross === 0 ? 0 : applyRate(soBase, profile.soRateBps);
  const oosms = applyRate(
    cappedBase(taxableGross, profile.minimumWage * profile.oosmsMaxBaseMinimumWages),
    profile.oosmsRateBps,
  );
  const snBase = Math.max(0, taxableGross - opv - vosms);
  const sn = Math.max(0, applyRate(snBase, profile.snRateBps) - so);
  const opvr = input.opvrApplicable
    ? applyRate(
      cappedBase(taxableGross, profile.minimumWage * profile.opvrMaxBaseMinimumWages),
      profile.opvrRateBps,
    )
    : 0;
  const totalEmployerContributions = so + oosms + sn + opvr;

  return {
    gross,
    taxableGross,
    manualAccruals: taxableAccruals + nonTaxableAccruals,
    nonTaxableAccruals,
    manualDeductions,
    opv,
    vosms,
    standardDeduction,
    ipnBase,
    ipnCorrection,
    ipn,
    totalWithheld,
    netSalary,
    soBase,
    so,
    oosms,
    snBase,
    sn,
    opvr,
    totalEmployerContributions,
    totalCompanyCost: gross + totalEmployerContributions,
  };
}
