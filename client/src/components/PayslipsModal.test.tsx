/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ payroll: { reports: { exportPayslip: { fetch: vi.fn() } } } }),
    payroll: { payroll: { getPayslip: { useQuery: () => ({ data: undefined, isLoading: false }) } } },
  },
}));

import { PayslipsModal } from "./PayslipsModal";

describe("PayslipsModal empty state", () => {
  afterEach(cleanup);

  it("explains how to generate a pay slip before payroll data exists", () => {
    render(<PayslipsModal isOpen employees={[]} calculations={new Map()} selectedEmployee={null} selectedPeriod="Период не выбран" selectedPeriodId={null} onClose={vi.fn()} />);

    expect(screen.getByText("Расчётный листок пока не сформирован")).toBeTruthy();
    expect(screen.getByText(/Создайте период, добавьте сотрудников/i)).toBeTruthy();
  });
});
