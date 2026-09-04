/* @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmployeeModal } from "./EmployeeModal";

describe("EmployeeModal empty state", () => {
  afterEach(cleanup);

  it("does not generate demo personal or payroll data for a new employee", () => {
    render(<EmployeeModal employee={null} isOpen onClose={vi.fn()} onSave={vi.fn()} departments={[]} />);

    expect(screen.getByPlaceholderText("950415301244")).toHaveProperty("value", "");
    expect(screen.getByPlaceholderText("Например: 850000")).toHaveProperty("value", "");
    expect(screen.getByPlaceholderText("KZ...")).toHaveProperty("value", "");
    expect(screen.getByText("Добавить нового сотрудника")).toBeTruthy();
  });

  it("submits entered employee data instead of generated demo values", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<EmployeeModal employee={null} isOpen onClose={vi.fn()} onSave={onSave} departments={[]} />);

    await user.type(screen.getByPlaceholderText("Например: Арман Сейткалиев"), "Тестовый Сотрудник");
    await user.type(screen.getByPlaceholderText("Например: Senior Frontend Разработчик"), "Бухгалтер");
    await user.type(screen.getByPlaceholderText("950415301244"), "950415301244");
    await user.type(screen.getByPlaceholderText("Например: 850000"), "500000");
    const hireDate = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(hireDate, { target: { value: "2026-01-01" } });
    await user.click(screen.getByText("Сохранить данные"));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Тестовый Сотрудник", iin: "950415301244", grossSalary: 500000, hireDate: "2026-01-01" }));
  });
});
