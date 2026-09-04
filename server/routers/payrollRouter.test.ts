import "dotenv/config";
import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

function createContext(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role
      ? {
        id: 7,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        loginMethod: "manus",
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      }
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("payroll router", () => {
  it("returns the structured specification without requiring authentication", async () => {
    const caller = appRouter.createCaller(createContext(null));
    const specification = await caller.payroll.specification();

    expect(specification.version).toBe("1.0.0");
    expect(specification.tables.some(table => table.id === "payrollCalculations")).toBe(true);
  });

  it("blocks a regular user from administrator payroll data", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.payroll.dashboard.summary({})).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.payroll.dashboard.history()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns an empty personal-pay-slip list until an administrator links the user to an employee", async () => {
    const caller = appRouter.createCaller(createContext("user"));

    await expect(caller.payroll.payroll.myPayslips({})).resolves.toEqual([]);
  });
});
