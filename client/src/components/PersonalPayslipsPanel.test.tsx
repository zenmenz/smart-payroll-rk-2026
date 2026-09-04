/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonalPayslipsPanel } from "./PersonalPayslipsPanel";

describe("PersonalPayslipsPanel", () => {
  afterEach(cleanup);

  it("shows a safe empty state when the signed-in employee is not linked to a payroll card", () => {
    render(<PersonalPayslipsPanel isLoading={false} payslips={[]} onOpenHelp={vi.fn()} />);

    expect(screen.getByText("Мои расчётные листки")).toBeTruthy();
    expect(screen.getByText(/привязки вашей учётной записи/i)).toBeTruthy();
    expect(screen.getByTitle("Справка")).toBeTruthy();
    expect(screen.queryByText("Настройка payroll")).toBeNull();
  });
});
