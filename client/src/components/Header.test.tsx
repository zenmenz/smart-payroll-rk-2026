/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

function props(overrides: Record<string, unknown> = {}) {
  return {
    selectedPeriod: "2026-08",
    onPeriodChange: vi.fn(),
    periods: [{ key: "2026-08", label: "август 2026" }],
    regulatorySummary: "Профиль ставок выбран",
    salaryViewType: "gross" as const,
    onSalaryViewTypeChange: vi.fn(),
    isDarkMode: true,
    onToggleDarkMode: vi.fn(),
    payrollStage: "draft" as const,
    onStageChange: vi.fn(),
    onOpenNewEmployee: vi.fn(),
    onExportExcel: vi.fn(),
    onOpenPayslips: vi.fn(),
    onOpenHistory: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenDatabase: vi.fn(),
    onOpenHelp: vi.fn(),
    totalEmployees: 0,
    ...overrides,
  };
}

describe("Header payroll actions", () => {
  afterEach(cleanup);

  it("invokes help, settings, export and the next payroll stage", async () => {
    const user = userEvent.setup();
    const onOpenSettings = vi.fn();
    const onOpenDatabase = vi.fn();
    const onOpenHelp = vi.fn();
    const onExportExcel = vi.fn();
    const onStageChange = vi.fn();
    render(<Header {...props({ onOpenSettings, onOpenDatabase, onOpenHelp, onExportExcel, onStageChange })} />);

    await user.click(screen.getByTitle("Настройки payroll"));
    await user.click(screen.getByTitle("База данных"));
    await user.click(screen.getByTitle("Справка"));
    await user.click(screen.getByTitle("Экспорт ведомости в Excel (CSV)"));
    await user.click(screen.getByText("Отправить на проверку"));

    expect(onOpenSettings).toHaveBeenCalledOnce();
    expect(onOpenDatabase).toHaveBeenCalledOnce();
    expect(onOpenHelp).toHaveBeenCalledOnce();
    expect(onExportExcel).toHaveBeenCalledOnce();
    expect(onStageChange).toHaveBeenCalledWith("verified");
  });

  it("disables state-changing controls while an operation is pending", () => {
    render(<Header {...props({ isProcessing: true })} />);
    expect(screen.getByTitle("Экспорт ведомости в Excel (CSV)")).toHaveProperty("disabled", true);
    expect(screen.getByText("Сотрудник").closest("button")).toHaveProperty("disabled", true);
  });

  it("disables export while the file is being prepared", () => {
    render(<Header {...props({ isExporting: true })} />);
    expect(screen.getByTitle("Экспорт ведомости в Excel (CSV)")).toHaveProperty("disabled", true);
    expect(screen.getByText("Подготовка…")).toBeTruthy();
  });
});
