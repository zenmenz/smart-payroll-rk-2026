/* @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      payroll: {
        company: { get: { invalidate: vi.fn() } },
        references: { list: { invalidate: vi.fn() } },
        periods: { list: { invalidate: vi.fn() } },
        employees: { list: { invalidate: vi.fn() } },
        payroll: { journal: { invalidate: vi.fn() } },
        dashboard: { summary: { invalidate: vi.fn() }, history: { invalidate: vi.fn() } },
        audit: { invalidate: vi.fn() },
        database: { tables: { invalidate: vi.fn() } },
      },
    }),
    payroll: {
      company: { get: { useQuery: () => ({ data: null, isLoading: false }) }, save: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
      references: { list: { useQuery: () => ({ data: { departments: [], positions: [], accrualTypes: [], taxProfiles: [] }, isLoading: false }) }, taxProfiles: { create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } }, departments: { create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } }, positions: { create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } }, accrualTypes: { create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } } },
      periods: { list: { useQuery: () => ({ data: [], isLoading: false }) }, create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
      system: { reset: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
      audit: { invalidate: vi.fn() },
    },
  },
}));

import { PayrollSettingsModal } from "./PayrollSettingsModal";

describe("PayrollSettingsModal", () => {
  afterEach(cleanup);

  it("exposes the empty configuration and calculation-period form without seeding data", async () => {
    const user = userEvent.setup();
    render(<PayrollSettingsModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText("Настройка payroll")).toBeTruthy();
    await user.click(screen.getByText("Периоды"));
    expect(screen.getByText(/Создайте расчётный период/i)).toBeTruthy();
    expect(screen.getByText(/Созданные периоды:/)).toBeTruthy();
  });

  it("shows the system reset controls behind confirmation", async () => {
    const user = userEvent.setup();
    render(<PayrollSettingsModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByText("Система"));
    expect(screen.getByText(/Опасная зона/i)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Сбросить систему/i }) as HTMLButtonElement).disabled).toBe(true);
  });
});
