/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    payroll: {
      specification: {
        useQuery: () => ({
          isLoading: false,
          data: {
            scope: "Тестовая спецификация payroll",
            roles: [{ id: "admin", title: "Администратор", access: "Полный доступ" }],
            tables: [{ id: "employees", title: "employees", purpose: "Карточки сотрудников" }],
            actions: [{ id: "payroll.employees.create", title: "Создать сотрудника", role: "admin" }],
          },
        }),
      },
    },
  },
}));

import { PayrollHelpModal } from "./PayrollHelpModal";

describe("PayrollHelpModal", () => {
  afterEach(cleanup);

  it("renders the backend specification in the built-in help route content", () => {
    render(<PayrollHelpModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText("Тестовая спецификация payroll")).toBeTruthy();
    expect(screen.getByText("Администратор")).toBeTruthy();
    expect(screen.getByText("employees")).toBeTruthy();
    expect(screen.getByText("Создать сотрудника")).toBeTruthy();
  });
});
