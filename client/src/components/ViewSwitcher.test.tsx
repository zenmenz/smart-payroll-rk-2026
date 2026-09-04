/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ViewSwitcher } from "./ViewSwitcher";

describe("ViewSwitcher payroll status filter", () => {
  afterEach(cleanup);
  it("forwards the selected payment status to the server-query owner", async () => {
    const user = userEvent.setup();
    const onPayrollStatusChange = vi.fn();

    render(
      <ViewSwitcher
        currentMode="desktop"
        onModeChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedDepartment="all"
        onDepartmentChange={vi.fn()}
        selectedStatus="all"
        onStatusChange={vi.fn()}
        selectedPayrollStatus="all"
        onPayrollStatusChange={onPayrollStatusChange}
        selectedEmployeeId="all"
        onEmployeeChange={vi.fn()}
        employees={[]}
        departments={[]}
        totalFiltered={0}
        totalAll={0}
      />,
    );

    const selector = screen.getByDisplayValue("Все выплаты");
    await user.selectOptions(selector, "paid");

    expect(onPayrollStatusChange).toHaveBeenCalledWith("paid");
  });

  it("forwards the selected employee to the server-query owner", async () => {
    const user = userEvent.setup();
    const onEmployeeChange = vi.fn();

    render(
      <ViewSwitcher
        currentMode="desktop"
        onModeChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedDepartment="all"
        onDepartmentChange={vi.fn()}
        selectedStatus="all"
        onStatusChange={vi.fn()}
        selectedPayrollStatus="all"
        onPayrollStatusChange={vi.fn()}
        selectedEmployeeId="all"
        onEmployeeChange={onEmployeeChange}
        employees={[{ id: "15", fullName: "Тестовый Сотрудник" }]}
        departments={[]}
        totalFiltered={0}
        totalAll={1}
      />,
    );

    await user.selectOptions(screen.getByDisplayValue("Все сотрудники"), "15");
    expect(onEmployeeChange).toHaveBeenCalledWith("15");
  });
});
