/** Last calendar day of a 1–12 month, as an ISO date string. */
export function lastDayOfPeriod(year: number, month: number): string {
  const day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isHiredByPeriod(
  hireDate: string | null | undefined,
  year: number,
  month: number,
): boolean {
  const hired = (hireDate ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hired)) return false;
  return hired <= lastDayOfPeriod(year, month);
}

/** Non-archived employees whose hire date is not after the period month. */
export function isEmployeeEligibleForPeriod(
  hireDate: string | null | undefined,
  status: string,
  year: number,
  month: number,
): boolean {
  if (status === "archived") return false;
  return isHiredByPeriod(hireDate, year, month);
}

export function monthOverMonthGrowthPercent(values: number[]): number | null {
  const withAmounts = values.filter((value) => value > 0);
  if (withAmounts.length < 2) return null;
  const previous = withAmounts[withAmounts.length - 2];
  const current = withAmounts[withAmounts.length - 1];
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
