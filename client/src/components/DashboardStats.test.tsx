/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardStats } from "./DashboardStats";
import type { Employee } from "../types/payroll";

const employee: Employee = {
  id: "1",
  userId: null,
  departmentId: 1,
  positionId: 1,
  fullName: "Иванов Иван",
  position: "Разработчик",
  department: "IT отдел",
  iin: "900101300123",
  iban: "",
  bankName: "",
  birthDate: "",
  hireDate: "2026-01-15",
  grossSalary: 500_000,
  applyStandardDeduction: true,
  customDeductionAmount: 0,
  opvrApplicable: true,
  status: "active",
  notes: "",
  avatarColor: "from-teal-600 to-emerald-600",
  hasVerifiedDeductionDocs: true,
  hasVerifiedBank: false,
};

const calculation = {
  gross: 500_000,
  opv: 50_000,
  vosms: 10_000,
  standardDeduction: 0,
  ipnBase: 0,
  ipnCorrection: 0,
  ipn: 20_000,
  totalWithheld: 80_000,
  netSalary: 420_000,
  soBase: 0,
  so: 10_000,
  oosms: 5_000,
  snBase: 0,
  sn: 15_000,
  opvr: 12_500,
  totalEmployerContributions: 42_500,
  totalCompanyCost: 542_500,
};

describe("DashboardStats history chart", () => {
  afterEach(cleanup);

  it("renders a bar for each period and selects a month on click", async () => {
    const user = userEvent.setup();
    const onSelectPeriod = vi.fn();
    render(
      <DashboardStats
        employees={[employee]}
        calculations={new Map([["1", calculation]])}
        selectedPeriod="август 2026"
        selectedPeriodKey="2026-08"
        history={[
          { periodId: 1, periodKey: "2026-02", year: 2026, month: 2, gross: 400_000, net: 330_000, employerTaxes: 30_000, calcCount: 1 },
          { periodId: 2, periodKey: "2026-08", year: 2026, month: 8, gross: 500_000, net: 420_000, employerTaxes: 42_500, calcCount: 1 },
        ]}
        onSelectPeriod={onSelectPeriod}
        onOpenAudit={vi.fn()}
        auditIssuesCount={0}
      />,
    );

    expect(screen.getByText(/Динамика зарплатного фонда/)).toBeTruthy();
    await user.click(screen.getByTitle(/февр/i));
    expect(onSelectPeriod).toHaveBeenCalledWith("2026-02");
  });
});
