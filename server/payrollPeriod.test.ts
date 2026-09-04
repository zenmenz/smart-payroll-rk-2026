import { describe, expect, it } from "vitest";
import {
  isEmployeeEligibleForPeriod,
  isHiredByPeriod,
  lastDayOfPeriod,
  monthOverMonthGrowthPercent,
} from "@shared/payrollPeriod";

describe("payroll period eligibility", () => {
  it("uses the last calendar day of the month", () => {
    expect(lastDayOfPeriod(2026, 8)).toBe("2026-08-31");
    expect(lastDayOfPeriod(2026, 2)).toBe("2026-02-28");
  });

  it("includes employees hired on the last day of the period and excludes later hires", () => {
    expect(isHiredByPeriod("2026-08-31", 2026, 8)).toBe(true);
    expect(isHiredByPeriod("2026-09-03", 2026, 8)).toBe(false);
    expect(isEmployeeEligibleForPeriod("2026-01-15", "new", 2026, 8)).toBe(true);
    expect(isEmployeeEligibleForPeriod("2026-01-15", "archived", 2026, 8)).toBe(false);
  });

  it("computes month-over-month growth only when two periods have amounts", () => {
    expect(monthOverMonthGrowthPercent([0, 0])).toBeNull();
    expect(monthOverMonthGrowthPercent([100, 110])).toBe(10);
  });
});
