/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    payroll: {
      database: {
        tables: {
          useQuery: () => ({
            data: [
              {
                id: "employees",
                label: "Сотрудники",
                columns: ["id", "fullName"],
                rowCount: 1,
                rows: [{ id: 1, fullName: "Иванов Иван" }],
              },
              {
                id: "departments",
                label: "Подразделения",
                columns: ["id", "name"],
                rowCount: 0,
                rows: [],
              },
            ],
            isLoading: false,
            isFetching: false,
            error: null,
            refetch: vi.fn(),
          }),
        },
      },
    },
  },
}));

import { DatabaseModal } from "./DatabaseModal";

describe("DatabaseModal", () => {
  afterEach(cleanup);

  it("shows live table names and employee rows", async () => {
    const user = userEvent.setup();
    render(<DatabaseModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText("База данных")).toBeTruthy();
    expect(screen.getByText("Иванов Иван")).toBeTruthy();

    await user.click(screen.getByText("Подразделения"));
    expect(screen.getByText("Записей пока нет")).toBeTruthy();
  });
});
