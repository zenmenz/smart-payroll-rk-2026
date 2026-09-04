import "dotenv/config";
import { afterEach, describe, expect, it } from "vitest";
import {
  accrualTypes,
  auditLogs,
  departments,
  employeePayrollItems,
  employees,
  payrollCalculations,
  payrollPeriods,
  positions,
  taxProfiles,
  users,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import * as payrollDb from "./payrollDb";

type Fixture = {
  userId: number;
  departmentId: number;
  positionId: number;
  taxProfileId: number;
  accrualTypeId: number;
  employeeId: number;
  periodId: number;
  extraEmployeeIds: number[];
};

let fixture: Fixture | null = null;

async function cleanFixture() {
  if (!fixture) return;
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна для очистки теста.");
  await db.delete(auditLogs).where(eq(auditLogs.userId, fixture.userId));
  await db.delete(payrollCalculations).where(eq(payrollCalculations.payrollPeriodId, fixture.periodId));
  await db.delete(employeePayrollItems).where(eq(employeePayrollItems.payrollPeriodId, fixture.periodId));
  await db.delete(payrollPeriods).where(eq(payrollPeriods.id, fixture.periodId));
  for (const extraId of fixture.extraEmployeeIds) {
    await db.delete(payrollCalculations).where(eq(payrollCalculations.employeeId, extraId));
    await db.delete(employees).where(eq(employees.id, extraId));
  }
  await db.delete(employees).where(eq(employees.id, fixture.employeeId));
  await db.delete(accrualTypes).where(eq(accrualTypes.id, fixture.accrualTypeId));
  await db.delete(positions).where(eq(positions.id, fixture.positionId));
  await db.delete(departments).where(eq(departments.id, fixture.departmentId));
  await db.delete(taxProfiles).where(eq(taxProfiles.id, fixture.taxProfileId));
  await db.delete(users).where(eq(users.id, fixture.userId));
  fixture = null;
}

afterEach(cleanFixture);

describe("payroll backend integration", () => {
  it("executes employee, period, calculation, journal, payslip and close/reopen workflows without leaving records", async () => {
    const db = await getDb();
    if (!db) throw new Error("База данных недоступна для интеграционного теста.");
    const marker = `it-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const userInsert = await db.insert(users).values({
      openId: `${marker}-admin`,
      name: "Integration Test Admin",
      email: `${marker}@example.test`,
      loginMethod: "test",
      role: "admin",
      lastSignedIn: new Date(),
    });
    const userId = Number(userInsert[0].insertId);
    const departmentId = await payrollDb.createDepartment({ code: `${marker}-dept`, name: "Интеграционный отдел" }, userId);
    const positionId = await payrollDb.createPosition({ code: `${marker}-position`, name: "Интеграционная должность", departmentId }, userId);
    const taxProfileId = await payrollDb.createTaxProfile({
      name: `Integration profile ${marker}`,
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      mci: 4_000,
      minimumWage: 80_000,
      standardDeductionMciCount: 30,
      opvRateBps: 1_000,
      opvMaxBaseMinimumWages: 50,
      vosmsRateBps: 200,
      vosmsMaxBaseMinimumWages: 10,
      ipnBaseRateBps: 1_000,
      ipnHighRateBps: 1_500,
      ipnHighRateAnnualMciLimit: 8_500,
      lowIncomeMonthlyMciLimit: 0,
      lowIncomeCorrectionBps: 0,
      soRateBps: 500,
      soMinBaseMinimumWages: 1,
      soMaxBaseMinimumWages: 7,
      oosmsRateBps: 300,
      oosmsMaxBaseMinimumWages: 10,
      snRateBps: 600,
      opvrRateBps: 350,
      opvrMaxBaseMinimumWages: 50,
    }, userId);
    const accrualTypeId = await payrollDb.createAccrualType({ code: `${marker}-bonus`, name: "Интеграционная премия", kind: "accrual", isTaxable: true }, userId);
    const employeeId = await payrollDb.createEmployee({
      fullName: "Интеграционный Сотрудник",
      iin: `${String(Date.now()).slice(-11)}1`,
      departmentId,
      positionId,
      grossSalary: 500_000,
      hireDate: "2026-01-01",
      status: "active",
      applyStandardDeduction: true,
    }, userId);
    await payrollDb.updateEmployee(employeeId, {
      fullName: "Интеграционный Сотрудник Обновлён",
      iin: `${String(Date.now()).slice(-11)}1`,
      departmentId,
      positionId,
      grossSalary: 500_000,
      hireDate: "2026-01-01",
      status: "active",
      applyStandardDeduction: true,
    }, userId);
    const listedEmployees = await payrollDb.listEmployees({ departmentId, query: "Обновлён" });
    expect(listedEmployees).toHaveLength(1);
    expect(listedEmployees[0]?.grossSalary).toBe(500_000);
    await expect(payrollDb.getEmployee(employeeId)).resolves.toMatchObject({ fullName: "Интеграционный Сотрудник Обновлён" });

    const disposableEmployeeId = await payrollDb.createEmployee({
      fullName: "Удаляемый Сотрудник",
      iin: `${String(Date.now()).slice(-10)}23`,
      departmentId,
      positionId,
      grossSalary: 100_000,
      hireDate: "2026-01-01",
      status: "new",
    }, userId);
    await payrollDb.deleteEmployeeIfUnused(disposableEmployeeId, userId);
    const employeesAfterDelete = await payrollDb.listEmployees({ query: "Удаляемый" });
    expect(employeesAfterDelete).toHaveLength(0);

    const periodId = await payrollDb.createPayrollPeriod({ year: 2099, month: (Date.now() % 12) + 1, taxProfileId }, userId);
    fixture = { userId, departmentId, positionId, taxProfileId, accrualTypeId, employeeId, periodId, extraEmployeeIds: [] };

    await payrollDb.setPayrollPeriodStatus(periodId, "closed", userId);
    await expect(payrollDb.upsertPayrollItem({ payrollPeriodId: periodId, employeeId, accrualTypeId, amount: 25_000 }, userId))
      .rejects.toThrow("только в открытом периоде");
    await payrollDb.setPayrollPeriodStatus(periodId, "open", userId);
    await payrollDb.upsertPayrollItem({ payrollPeriodId: periodId, employeeId, accrualTypeId, amount: 25_000, comment: "Проверка" }, userId);

    const calculations = await payrollDb.calculatePeriod(periodId, userId);
    const employeeCalculation = calculations.find((row) => row.employeeId === employeeId);
    expect(employeeCalculation).toBeTruthy();
    expect(employeeCalculation?.gross).toBe(525_000);

    const journal = await payrollDb.listPayrollJournal({ periodId, departmentId, employeeId, status: "draft" });
    expect(journal).toHaveLength(1);
    expect(journal[0]?.employee.fullName).toBe("Интеграционный Сотрудник Обновлён");

    const dashboard = await payrollDb.getDashboardSummary({ periodId, departmentId, employeeId, status: "draft" });
    expect(dashboard.calculationCount).toBe(1);
    expect(dashboard.employeeCount).toBe(1);
    expect(dashboard.payrollFund).toBe(525_000);

    const payslip = await payrollDb.getDetailedPayslip(employeeId, periodId);
    expect(payslip.items).toHaveLength(1);
    expect(payslip.calculation.taxProfileSnapshot).toContain("Integration profile");

    await expect(payrollDb.deleteEmployeeIfUnused(employeeId, userId)).rejects.toThrow("может быть только архивирован");
    await payrollDb.archiveEmployee(employeeId, userId);
    await payrollDb.setPayrollPeriodStatus(periodId, "closed", userId);
    await expect(payrollDb.updateCalculationStatus(payslip.calculation.id, "paid", userId))
      .rejects.toThrow("только в открытом периоде");
    await payrollDb.setPayrollPeriodStatus(periodId, "open", userId);
    await payrollDb.updateCalculationStatus(payslip.calculation.id, "paid", userId);
    const paidJournal = await payrollDb.listPayrollJournal({ periodId, status: "paid" });
    expect(paidJournal).toHaveLength(1);
  }, 15_000);

  it("calculates new-status employees hired by the month, skips later hires, and keeps verified status", async () => {
    const db = await getDb();
    if (!db) throw new Error("База данных недоступна для интеграционного теста.");
    const marker = `el-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    const userInsert = await db.insert(users).values({
      openId: `${marker}-admin`,
      name: "Eligibility Admin",
      email: `${marker}@example.test`,
      loginMethod: "test",
      role: "admin",
      lastSignedIn: new Date(),
    });
    const userId = Number(userInsert[0].insertId);
    const departmentId = await payrollDb.createDepartment({ code: `${marker}-dept`, name: "Отдел допуска" }, userId);
    const positionId = await payrollDb.createPosition({ code: `${marker}-position`, name: "Должность допуска", departmentId }, userId);
    const taxProfileId = await payrollDb.createTaxProfile({
      name: `Eligibility profile ${marker}`,
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      mci: 4_000,
      minimumWage: 80_000,
      standardDeductionMciCount: 30,
      opvRateBps: 1_000,
      opvMaxBaseMinimumWages: 50,
      vosmsRateBps: 200,
      vosmsMaxBaseMinimumWages: 10,
      ipnBaseRateBps: 1_000,
      ipnHighRateBps: 1_500,
      ipnHighRateAnnualMciLimit: 8_500,
      lowIncomeMonthlyMciLimit: 0,
      lowIncomeCorrectionBps: 0,
      soRateBps: 500,
      soMinBaseMinimumWages: 1,
      soMaxBaseMinimumWages: 7,
      oosmsRateBps: 300,
      oosmsMaxBaseMinimumWages: 10,
      snRateBps: 600,
      opvrRateBps: 350,
      opvrMaxBaseMinimumWages: 50,
    }, userId);
    const accrualTypeId = await payrollDb.createAccrualType({ code: `${marker}-bonus`, name: "Премия допуска", kind: "accrual", isTaxable: true }, userId);
    const iinBase = `${Date.now()}`.slice(-10);
    const newHireId = await payrollDb.createEmployee({
      fullName: "Новый Сотрудник Июня",
      iin: `${iinBase}01`,
      departmentId,
      positionId,
      grossSalary: 300_000,
      hireDate: "2098-06-15",
      status: "new",
    }, userId);
    const futureHireId = await payrollDb.createEmployee({
      fullName: "Будущий Сотрудник Июля",
      iin: `${iinBase}02`,
      departmentId,
      positionId,
      grossSalary: 300_000,
      hireDate: "2098-07-01",
      status: "active",
    }, userId);
    const periodId = await payrollDb.createPayrollPeriod({ year: 2098, month: 6, taxProfileId }, userId);
    fixture = { userId, departmentId, positionId, taxProfileId, accrualTypeId, employeeId: newHireId, periodId, extraEmployeeIds: [futureHireId] };

    const calculations = await payrollDb.calculatePeriod(periodId, userId);
    expect(calculations.some((row) => row.employeeId === newHireId)).toBe(true);
    expect(calculations.some((row) => row.employeeId === futureHireId)).toBe(false);

    const journal = await payrollDb.listPayrollJournal({ periodId, employeeId: newHireId });
    expect(journal[0]?.calculation.status).toBe("draft");
    await payrollDb.updateCalculationStatus(journal[0]!.calculation.id, "verified", userId);
    await payrollDb.calculatePeriod(periodId, userId);
    const again = await payrollDb.listPayrollJournal({ periodId, employeeId: newHireId });
    expect(again[0]?.calculation.status).toBe("verified");
  }, 15_000);
});
