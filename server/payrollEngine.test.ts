import { describe, expect, it } from "vitest";
import { calculatePayroll, type PayrollTaxProfile } from "./payrollEngine";

const testProfile: PayrollTaxProfile = {
  mci: 4_000,
  minimumWage: 80_000,
  standardDeductionMciCount: 30,
  opvRateBps: 1_000,
  opvMaxBaseMinimumWages: 50,
  vosmsRateBps: 200,
  vosmsMaxBaseMinimumWages: 10,
  ipnBaseRateBps: 1_000,
  ipnHighRateBps: 1_500,
  ipnHighRateAnnualMciLimit: 8_500,
  lowIncomeMonthlyMciLimit: 0,
  lowIncomeCorrectionBps: 0,
  soRateBps: 500,
  soMinBaseMinimumWages: 1,
  soMaxBaseMinimumWages: 7,
  oosmsRateBps: 300,
  oosmsMaxBaseMinimumWages: 10,
  snRateBps: 600,
  opvrRateBps: 350,
  opvrMaxBaseMinimumWages: 50,
};

describe("calculatePayroll", () => {
  it("calculates employee withholdings and employer contributions from a supplied profile", () => {
    const result = calculatePayroll({
      baseSalary: 500_000,
      taxableAccruals: 20_000,
      nonTaxableAccruals: 10_000,
      manualDeductions: 5_000,
      customTaxDeductions: 0,
      applyStandardDeduction: true,
      opvrApplicable: true,
      taxProfile: testProfile,
    });

    expect(result.gross).toBe(530_000);
    expect(result.taxableGross).toBe(520_000);
    expect(result.opv).toBe(52_000);
    expect(result.vosms).toBe(10_400);
    expect(result.standardDeduction).toBe(120_000);
    expect(result.ipnBase).toBe(337_600);
    expect(result.ipn).toBe(33_760);
    expect(result.totalWithheld).toBe(101_160);
    expect(result.netSalary).toBe(428_840);
    expect(result.opvr).toBe(18_200);
    expect(result.totalCompanyCost).toBe(result.gross + result.totalEmployerContributions);
  });

  it("does not create negative amounts and omits OPVR when it is not applicable", () => {
    const result = calculatePayroll({
      baseSalary: -100,
      applyStandardDeduction: true,
      opvrApplicable: false,
      taxProfile: testProfile,
    });

    expect(result.gross).toBe(0);
    expect(result.netSalary).toBe(0);
    expect(result.opvr).toBe(0);
    expect(result.totalEmployerContributions).toBe(0);
  });

  it("applies the high IPN band only to the amount above the configured annual threshold", () => {
    const result = calculatePayroll({
      baseSalary: 100_000,
      applyStandardDeduction: false,
      opvrApplicable: true,
      yearToDateTaxableIncomeBefore: testProfile.mci * testProfile.ipnHighRateAnnualMciLimit - 30_000,
      taxProfile: testProfile,
    });

    expect(result.ipn).toBe(11_700);
  });
});
