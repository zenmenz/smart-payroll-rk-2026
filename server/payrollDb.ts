import { and, asc, desc, eq, lt, ne, or, sql } from "drizzle-orm";
import {
  accrualTypes,
  auditLogs,
  companySettings,
  departments,
  employeePayrollItems,
  employees,
  payrollCalculations,
  payrollPeriods,
  positions,
  taxProfiles,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { calculatePayroll } from "./payrollEngine";
import { isEmployeeEligibleForPeriod } from "@shared/payrollPeriod";

const IIN_LIKE_NAME = /^\d{12}$/;

const DEFAULT_DEPARTMENTS = [
  { code: "IT", name: "IT отдел" },
  { code: "FIN", name: "Финансовый отдел" },
  { code: "MKT", name: "Маркетинговый отдел" },
  { code: "SALES", name: "Отдел продаж" },
  { code: "HR", name: "Отдел кадров (HR)" },
  { code: "ACC", name: "Бухгалтерия" },
  { code: "LEGAL", name: "Юридический отдел" },
  { code: "ADMIN", name: "Административный отдел" },
  { code: "PROC", name: "Отдел закупок" },
  { code: "SUPP", name: "Служба поддержки" },
] as const;

const DEFAULT_PERIODS_2026 = [
  { year: 2026, month: 2 },
  { year: 2026, month: 3 },
] as const;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна.");
  return db;
}

async function writeAudit(
  userId: number | undefined,
  entityType: string,
  entityId: number | string | undefined,
  action: string,
  details?: Record<string, unknown>,
) {
  const db = await requireDb();
  await db.insert(auditLogs).values({
    userId,
    entityType,
    entityId: entityId === undefined ? null : String(entityId),
    action,
    details: details ? JSON.stringify(details) : null,
  });
}

export async function ensureDefaultDepartments(userId: number) {
  const db = await requireDb();
  const existing = await db.select().from(departments);
  for (const row of existing) {
    if (IIN_LIKE_NAME.test(row.name.trim()) || IIN_LIKE_NAME.test(row.code.trim())) {
      if (row.isActive) {
        await db.update(departments).set({ isActive: false }).where(eq(departments.id, row.id));
        await writeAudit(userId, "department", row.id, "deactivate", { reason: "iin-like-name" });
      }
    }
  }
  const refreshed = await db.select().from(departments);
  for (const preset of DEFAULT_DEPARTMENTS) {
    const already = refreshed.some(
      (row) =>
        row.code.toLowerCase() === preset.code.toLowerCase()
        || row.name.trim().toLowerCase() === preset.name.toLowerCase(),
    );
    if (already) continue;
    await createDepartment({ code: preset.code, name: preset.name }, userId);
  }
}

export async function listReferenceData(userId?: number) {
  if (userId) await ensureDefaultDepartments(userId);
  const db = await requireDb();
  const [departmentRows, positionRows, accrualTypeRows, profileRows] = await Promise.all([
    db.select().from(departments).orderBy(asc(departments.name)),
    db.select().from(positions).orderBy(asc(positions.name)),
    db.select().from(accrualTypes).orderBy(asc(accrualTypes.kind), asc(accrualTypes.name)),
    db.select().from(taxProfiles).orderBy(desc(taxProfiles.effectiveFrom)),
  ]);
  return { departments: departmentRows, positions: positionRows, accrualTypes: accrualTypeRows, taxProfiles: profileRows };
}

export async function createDepartment(
  input: { code: string; name: string; isActive?: boolean },
  userId: number,
) {
  const db = await requireDb();
  const result = await db.insert(departments).values({ ...input, isActive: input.isActive ?? true });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "department", id, "create", input);
  return id;
}

export async function updateDepartment(
  id: number,
  input: { code: string; name: string; isActive: boolean },
  userId: number,
) {
  const db = await requireDb();
  await db.update(departments).set(input).where(eq(departments.id, id));
  await writeAudit(userId, "department", id, "update", input);
}

export async function createPosition(
  input: { code: string; name: string; departmentId?: number | null; isActive?: boolean },
  userId: number,
) {
  const db = await requireDb();
  const result = await db.insert(positions).values({ ...input, isActive: input.isActive ?? true });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "position", id, "create", input);
  return id;
}

export async function updatePosition(
  id: number,
  input: { code: string; name: string; departmentId?: number | null; isActive: boolean },
  userId: number,
) {
  const db = await requireDb();
  await db.update(positions).set(input).where(eq(positions.id, id));
  await writeAudit(userId, "position", id, "update", input);
}

export async function createAccrualType(
  input: { code: string; name: string; kind: "accrual" | "deduction"; isTaxable?: boolean; isActive?: boolean },
  userId: number,
) {
  const db = await requireDb();
  const result = await db.insert(accrualTypes).values({
    ...input,
    isTaxable: input.isTaxable ?? true,
    isActive: input.isActive ?? true,
  });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "accrualType", id, "create", input);
  return id;
}

export async function updateAccrualType(
  id: number,
  input: { code: string; name: string; kind: "accrual" | "deduction"; isTaxable: boolean; isActive: boolean },
  userId: number,
) {
  const db = await requireDb();
  await db.update(accrualTypes).set(input).where(eq(accrualTypes.id, id));
  await writeAudit(userId, "accrualType", id, "update", input);
}

export type TaxProfileInput = Omit<typeof taxProfiles.$inferInsert, "id" | "createdAt" | "updatedAt" | "isActive"> & {
  isActive?: boolean;
};

export async function createTaxProfile(input: TaxProfileInput, userId: number) {
  const db = await requireDb();
  const result = await db.insert(taxProfiles).values({ ...input, isActive: input.isActive ?? true });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "taxProfile", id, "create", { name: input.name, effectiveFrom: input.effectiveFrom });
  return id;
}

export async function updateTaxProfile(id: number, input: TaxProfileInput, userId: number) {
  const db = await requireDb();
  await db.update(taxProfiles).set({ ...input, isActive: input.isActive ?? true }).where(eq(taxProfiles.id, id));
  await writeAudit(userId, "taxProfile", id, "update", { name: input.name, effectiveFrom: input.effectiveFrom });
}

export type EmployeeInput = {
  userId?: number | null;
  fullName: string;
  iin: string;
  departmentId?: number | null;
  positionId?: number | null;
  grossSalary: number;
  hireDate: string;
  birthDate?: string | null;
  iban?: string | null;
  bankName?: string | null;
  applyStandardDeduction?: boolean;
  customDeductionAmount?: number;
  opvrApplicable?: boolean;
  status?: "active" | "new" | "vacation" | "sick" | "quitting" | "archived";
  notes?: string | null;
};

const employeeProjection = {
  id: employees.id,
  userId: employees.userId,
  fullName: employees.fullName,
  iin: employees.iin,
  grossSalary: employees.grossSalary,
  hireDate: employees.hireDate,
  birthDate: employees.birthDate,
  iban: employees.iban,
  bankName: employees.bankName,
  applyStandardDeduction: employees.applyStandardDeduction,
  customDeductionAmount: employees.customDeductionAmount,
  opvrApplicable: employees.opvrApplicable,
  status: employees.status,
  notes: employees.notes,
  departmentId: departments.id,
  department: departments.name,
  positionId: positions.id,
  position: positions.name,
};

export async function listEmployees(filters?: { departmentId?: number; status?: string; query?: string }) {
  const db = await requireDb();
  const conditions = [];
  if (filters?.departmentId) conditions.push(eq(employees.departmentId, filters.departmentId));
  if (filters?.status) conditions.push(eq(employees.status, filters.status as typeof employees.status.enumValues[number]));
  if (filters?.query?.trim()) {
    const term = `%${filters.query.trim()}%`;
    conditions.push(or(sql`${employees.fullName} LIKE ${term}`, sql`${employees.iin} LIKE ${term}`));
  }
  return db
    .select(employeeProjection)
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(employees.fullName));
}

export async function getEmployee(id: number) {
  const rows = await listEmployees();
  return rows.find(row => row.id === id) ?? null;
}

export async function getEmployeeByUserId(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function createEmployee(input: EmployeeInput, userId: number) {
  const db = await requireDb();
  const result = await db.insert(employees).values({
    ...input,
    grossSalary: Math.round(input.grossSalary),
    customDeductionAmount: Math.round(input.customDeductionAmount ?? 0),
    applyStandardDeduction: input.applyStandardDeduction ?? false,
    opvrApplicable: input.opvrApplicable ?? true,
    status: input.status ?? "new",
  });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "employee", id, "create", { fullName: input.fullName });
  return id;
}

export async function updateEmployee(id: number, input: EmployeeInput, userId: number) {
  const db = await requireDb();
  await db.update(employees).set({
    ...input,
    grossSalary: Math.round(input.grossSalary),
    customDeductionAmount: Math.round(input.customDeductionAmount ?? 0),
    applyStandardDeduction: input.applyStandardDeduction ?? false,
    opvrApplicable: input.opvrApplicable ?? true,
    status: input.status ?? "new",
  }).where(eq(employees.id, id));
  await writeAudit(userId, "employee", id, "update", { fullName: input.fullName });
}

export async function archiveEmployee(id: number, userId: number) {
  const db = await requireDb();
  await db.update(employees).set({ status: "archived" }).where(eq(employees.id, id));
  await writeAudit(userId, "employee", id, "archive");
}

export async function deleteEmployeeIfUnused(id: number, userId: number) {
  const db = await requireDb();
  const [calculation] = await db.select({ count: sql<number>`count(*)` }).from(payrollCalculations).where(eq(payrollCalculations.employeeId, id));
  const [item] = await db.select({ count: sql<number>`count(*)` }).from(employeePayrollItems).where(eq(employeePayrollItems.employeeId, id));
  if (Number(calculation?.count ?? 0) > 0 || Number(item?.count ?? 0) > 0) {
    throw new Error("Сотрудник участвует в расчётных документах и может быть только архивирован.");
  }
  await db.delete(employees).where(eq(employees.id, id));
  await writeAudit(userId, "employee", id, "delete");
}

export async function createPayrollPeriod(input: { year: number; month: number; taxProfileId?: number | null }, userId: number) {
  const db = await requireDb();
  const periodKey = `${input.year}-${String(input.month).padStart(2, "0")}`;
  const result = await db.insert(payrollPeriods).values({ ...input, periodKey, status: "open" });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "payrollPeriod", id, "create", { periodKey });
  return id;
}

export async function listPayrollPeriods() {
  const db = await requireDb();
  return db
    .select({
      id: payrollPeriods.id,
      periodKey: payrollPeriods.periodKey,
      year: payrollPeriods.year,
      month: payrollPeriods.month,
      status: payrollPeriods.status,
      taxProfileId: payrollPeriods.taxProfileId,
      taxProfileName: taxProfiles.name,
      closedAt: payrollPeriods.closedAt,
    })
    .from(payrollPeriods)
    .leftJoin(taxProfiles, eq(payrollPeriods.taxProfileId, taxProfiles.id))
    .orderBy(desc(payrollPeriods.year), desc(payrollPeriods.month));
}

export async function ensureDefaultPayrollPeriods(userId: number) {
  const existing = await listPayrollPeriods();
  const august = existing.find((period) => period.year === 2026 && period.month === 8);
  const fallbackProfile = existing.find((period) => period.taxProfileId)?.taxProfileId
    ?? (await listReferenceData()).taxProfiles[0]?.id
    ?? null;
  const taxProfileId = august?.taxProfileId ?? fallbackProfile;
  if (!taxProfileId) return;

  for (const preset of DEFAULT_PERIODS_2026) {
    if (existing.some((period) => period.year === preset.year && period.month === preset.month)) continue;
    try {
      const id = await createPayrollPeriod({ year: preset.year, month: preset.month, taxProfileId }, userId);
      await calculatePeriod(id, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/Duplicate|ER_DUP_ENTRY/i.test(message)) throw error;
    }
  }
}

export async function listPayrollPeriodsForUser(userId: number) {
  await ensureDefaultPayrollPeriods(userId);
  return listPayrollPeriods();
}

export async function setPayrollPeriodStatus(id: number, status: "open" | "closed", userId: number) {
  const db = await requireDb();
  await db.update(payrollPeriods).set({
    status,
    closedAt: status === "closed" ? new Date() : null,
    closedByUserId: status === "closed" ? userId : null,
  }).where(eq(payrollPeriods.id, id));
  await writeAudit(userId, "payrollPeriod", id, status === "closed" ? "close" : "reopen");
}

export async function upsertPayrollItem(
  input: { id?: number; payrollPeriodId: number; employeeId: number; accrualTypeId: number; amount: number; comment?: string | null },
  userId: number,
) {
  const db = await requireDb();
  const [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, input.payrollPeriodId)).limit(1);
  if (!period || period.status !== "open") throw new Error("Редактировать начисления можно только в открытом периоде.");

  if (input.id) {
    await db.update(employeePayrollItems).set({ ...input, amount: Math.round(input.amount) }).where(eq(employeePayrollItems.id, input.id));
    await writeAudit(userId, "payrollItem", input.id, "update");
    return input.id;
  }
  const result = await db.insert(employeePayrollItems).values({ ...input, amount: Math.round(input.amount) });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "payrollItem", id, "create");
  return id;
}

export async function deletePayrollItem(id: number, userId: number) {
  const db = await requireDb();
  const [item] = await db.select().from(employeePayrollItems).where(eq(employeePayrollItems.id, id)).limit(1);
  if (!item) return;
  const [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, item.payrollPeriodId)).limit(1);
  if (!period || period.status !== "open") throw new Error("Удалять начисления можно только в открытом периоде.");
  await db.delete(employeePayrollItems).where(eq(employeePayrollItems.id, id));
  await writeAudit(userId, "payrollItem", id, "delete");
}

export async function calculatePeriod(periodId: number, userId: number) {
  const db = await requireDb();
  const [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, periodId)).limit(1);
  if (!period) throw new Error("Расчётный период не найден.");
  if (period.status !== "open") throw new Error("Пересчёт доступен только для открытого периода.");
  if (!period.taxProfileId) throw new Error("Для периода не выбран профиль ставок.");

  const [profile] = await db.select().from(taxProfiles).where(eq(taxProfiles.id, period.taxProfileId)).limit(1);
  if (!profile) throw new Error("Профиль ставок расчёта не найден.");
  const employeeRows = await db.select().from(employees);
  const eligibleEmployees = employeeRows.filter((employee) =>
    isEmployeeEligibleForPeriod(employee.hireDate, employee.status, period.year, period.month),
  );
  const itemRows = await db
    .select({ item: employeePayrollItems, type: accrualTypes })
    .from(employeePayrollItems)
    .innerJoin(accrualTypes, eq(employeePayrollItems.accrualTypeId, accrualTypes.id))
    .where(eq(employeePayrollItems.payrollPeriodId, periodId));

  const results = [];
  for (const employee of eligibleEmployees) {
    const [prior] = await db
      .select({ taxableGross: sql<number>`coalesce(sum(${payrollCalculations.taxableGross}), 0)` })
      .from(payrollCalculations)
      .innerJoin(payrollPeriods, eq(payrollCalculations.payrollPeriodId, payrollPeriods.id))
      .where(and(
        eq(payrollCalculations.employeeId, employee.id),
        eq(payrollPeriods.year, period.year),
        lt(payrollPeriods.month, period.month),
      ));
    const employeeItems = itemRows.filter(row => row.item.employeeId === employee.id);
    const taxableAccruals = employeeItems
      .filter(row => row.type.kind === "accrual" && row.type.isTaxable)
      .reduce((total, row) => total + row.item.amount, 0);
    const nonTaxableAccruals = employeeItems
      .filter(row => row.type.kind === "accrual" && !row.type.isTaxable)
      .reduce((total, row) => total + row.item.amount, 0);
    const manualDeductions = employeeItems
      .filter(row => row.type.kind === "deduction")
      .reduce((total, row) => total + row.item.amount, 0);
    const calculation = calculatePayroll({
      baseSalary: employee.grossSalary,
      taxableAccruals,
      nonTaxableAccruals,
      manualDeductions,
      customTaxDeductions: employee.customDeductionAmount,
      applyStandardDeduction: employee.applyStandardDeduction,
      opvrApplicable: employee.opvrApplicable,
      yearToDateTaxableIncomeBefore: Number(prior?.taxableGross ?? 0),
      taxProfile: profile,
    });
    await db.insert(payrollCalculations).values({
      payrollPeriodId: periodId,
      employeeId: employee.id,
      status: "draft",
      ...calculation,
      taxProfileSnapshot: JSON.stringify(profile),
      calculatedAt: new Date(),
      calculatedByUserId: userId,
      paidAt: null,
    }).onDuplicateKeyUpdate({
      set: {
        ...calculation,
        taxProfileSnapshot: JSON.stringify(profile),
        calculatedAt: new Date(),
        calculatedByUserId: userId,
      },
    });
    results.push({ employeeId: employee.id, ...calculation });
  }
  await writeAudit(userId, "payrollPeriod", periodId, "calculate", { employeeCount: results.length });
  return results;
}

export async function recalculateOpenPeriods(userId: number) {
  const periods = await listPayrollPeriods();
  const calculated = [];
  for (const period of periods) {
    if (period.status !== "open" || !period.taxProfileId) continue;
    calculated.push(...await calculatePeriod(period.id, userId));
  }
  return calculated;
}

export async function listPayrollJournal(filters: {
  periodId?: number;
  departmentId?: number;
  employeeId?: number;
  status?: "draft" | "verified" | "approved" | "paid";
}) {
  const db = await requireDb();
  const conditions = [];
  if (filters.periodId) conditions.push(eq(payrollCalculations.payrollPeriodId, filters.periodId));
  if (filters.departmentId) conditions.push(eq(employees.departmentId, filters.departmentId));
  if (filters.employeeId) conditions.push(eq(payrollCalculations.employeeId, filters.employeeId));
  if (filters.status) conditions.push(eq(payrollCalculations.status, filters.status));
  return db
    .select({
      calculation: payrollCalculations,
      employee: { id: employees.id, fullName: employees.fullName, iin: employees.iin },
      department: { id: departments.id, name: departments.name },
      period: { id: payrollPeriods.id, periodKey: payrollPeriods.periodKey, status: payrollPeriods.status },
    })
    .from(payrollCalculations)
    .innerJoin(employees, eq(payrollCalculations.employeeId, employees.id))
    .innerJoin(payrollPeriods, eq(payrollCalculations.payrollPeriodId, payrollPeriods.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(payrollPeriods.year), desc(payrollPeriods.month), asc(employees.fullName));
}

export async function updateCalculationStatus(
  calculationId: number,
  status: "draft" | "verified" | "approved" | "paid",
  userId: number,
) {
  const db = await requireDb();
  const [calculation] = await db.select().from(payrollCalculations).where(eq(payrollCalculations.id, calculationId)).limit(1);
  if (!calculation) throw new Error("Расчёт не найден.");
  const [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, calculation.payrollPeriodId)).limit(1);
  if (!period || period.status !== "open") throw new Error("Статус расчёта можно менять только в открытом периоде.");
  await db.update(payrollCalculations).set({ status, paidAt: status === "paid" ? new Date() : null }).where(eq(payrollCalculations.id, calculationId));
  await writeAudit(userId, "payrollCalculation", calculationId, `status:${status}`);
}

export async function getPayslipsForEmployee(employeeId: number, filters?: { periodId?: number }) {
  const journal = await listPayrollJournal({ employeeId, periodId: filters?.periodId });
  return journal;
}

export async function getDetailedPayslip(employeeId: number, payrollPeriodId: number) {
  const db = await requireDb();
  const [header] = await db
    .select({
      calculation: payrollCalculations,
      employee: {
        id: employees.id,
        fullName: employees.fullName,
        iin: employees.iin,
        hireDate: employees.hireDate,
        iban: employees.iban,
        bankName: employees.bankName,
      },
      department: { id: departments.id, name: departments.name },
      position: { id: positions.id, name: positions.name },
      period: { id: payrollPeriods.id, periodKey: payrollPeriods.periodKey, year: payrollPeriods.year, month: payrollPeriods.month, status: payrollPeriods.status },
    })
    .from(payrollCalculations)
    .innerJoin(employees, eq(payrollCalculations.employeeId, employees.id))
    .innerJoin(payrollPeriods, eq(payrollCalculations.payrollPeriodId, payrollPeriods.id))
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(positions, eq(employees.positionId, positions.id))
    .where(and(
      eq(payrollCalculations.employeeId, employeeId),
      eq(payrollCalculations.payrollPeriodId, payrollPeriodId),
    ))
    .limit(1);

  if (!header) throw new Error("Расчётный листок для сотрудника и периода не найден.");

  const items = await db
    .select({
      id: employeePayrollItems.id,
      amount: employeePayrollItems.amount,
      comment: employeePayrollItems.comment,
      type: {
        id: accrualTypes.id,
        code: accrualTypes.code,
        name: accrualTypes.name,
        kind: accrualTypes.kind,
        isTaxable: accrualTypes.isTaxable,
      },
    })
    .from(employeePayrollItems)
    .innerJoin(accrualTypes, eq(employeePayrollItems.accrualTypeId, accrualTypes.id))
    .where(and(
      eq(employeePayrollItems.employeeId, employeeId),
      eq(employeePayrollItems.payrollPeriodId, payrollPeriodId),
    ))
    .orderBy(asc(accrualTypes.kind), asc(accrualTypes.name));

  return {
    company: await getCompanySettings(),
    ...header,
    items,
  };
}

export async function getDashboardSummary(filters: {
  periodId?: number;
  departmentId?: number;
  employeeId?: number;
  status?: "draft" | "verified" | "approved" | "paid";
} = {}) {
  const db = await requireDb();
  const conditions = [];
  if (filters.periodId) conditions.push(eq(payrollCalculations.payrollPeriodId, filters.periodId));
  if (filters.departmentId) conditions.push(eq(employees.departmentId, filters.departmentId));
  if (filters.employeeId) conditions.push(eq(payrollCalculations.employeeId, filters.employeeId));
  if (filters.status) conditions.push(eq(payrollCalculations.status, filters.status));
  const [summary] = await db
    .select({
      payrollFund: sql<number>`coalesce(sum(${payrollCalculations.gross}), 0)`,
      taxesAndContributions: sql<number>`coalesce(sum(${payrollCalculations.opv} + ${payrollCalculations.vosms} + ${payrollCalculations.ipn} + ${payrollCalculations.so} + ${payrollCalculations.oosms} + ${payrollCalculations.sn} + ${payrollCalculations.opvr}), 0)`,
      calculationCount: sql<number>`count(*)`,
    })
    .from(payrollCalculations)
    .innerJoin(employees, eq(payrollCalculations.employeeId, employees.id))
    .where(conditions.length ? and(...conditions) : undefined);
  const employeeConditions = [eq(employees.status, "active")];
  if (filters.departmentId) employeeConditions.push(eq(employees.departmentId, filters.departmentId));
  if (filters.employeeId) employeeConditions.push(eq(employees.id, filters.employeeId));
  const [employeeCount] = await db.select({ count: sql<number>`count(*)` }).from(employees).where(and(...employeeConditions));
  return {
    payrollFund: Number(summary?.payrollFund ?? 0),
    taxesAndContributions: Number(summary?.taxesAndContributions ?? 0),
    calculationCount: Number(summary?.calculationCount ?? 0),
    employeeCount: Number(employeeCount?.count ?? 0),
  };
}

export async function getDashboardHistory(userId?: number) {
  if (userId) await ensureDefaultPayrollPeriods(userId);
  const db = await requireDb();
  const periods = await listPayrollPeriods();
  const calculationRows = await db
    .select({
      payrollPeriodId: payrollCalculations.payrollPeriodId,
      gross: payrollCalculations.gross,
      netSalary: payrollCalculations.netSalary,
      totalEmployerContributions: payrollCalculations.totalEmployerContributions,
    })
    .from(payrollCalculations);

  return [...periods]
    .sort((left, right) => left.year - right.year || left.month - right.month)
    .map((period) => {
      const rows = calculationRows.filter((row) => row.payrollPeriodId === period.id);
      return {
        periodId: period.id,
        periodKey: period.periodKey,
        year: period.year,
        month: period.month,
        status: period.status,
        gross: rows.reduce((total, row) => total + row.gross, 0),
        net: rows.reduce((total, row) => total + row.netSalary, 0),
        employerTaxes: rows.reduce((total, row) => total + row.totalEmployerContributions, 0),
        calcCount: rows.length,
      };
    });
}

export async function getCompanySettings() {
  const db = await requireDb();
  const rows = await db.select().from(companySettings).orderBy(desc(companySettings.updatedAt)).limit(1);
  return rows[0] ?? null;
}

export async function saveCompanySettings(
  input: { legalName: string; bin: string; address: string },
  userId: number,
) {
  const db = await requireDb();
  const existing = await getCompanySettings();
  if (existing) {
    await db.update(companySettings).set({ ...input, updatedByUserId: userId }).where(eq(companySettings.id, existing.id));
    await writeAudit(userId, "companySettings", existing.id, "update");
    return existing.id;
  }
  const result = await db.insert(companySettings).values({ ...input, updatedByUserId: userId });
  const id = Number(result[0].insertId);
  await writeAudit(userId, "companySettings", id, "create");
  return id;
}

export async function listAuditLogs(limit = 100) {
  const db = await requireDb();
  return db
    .select({
      id: auditLogs.id,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      action: auditLogs.action,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

/** Полный сброс бизнес-данных. Текущий администратор сохраняется. */
export async function resetSystemData(adminUserId: number) {
  const db = await requireDb();

  await db.delete(auditLogs);
  await db.delete(payrollCalculations);
  await db.delete(employeePayrollItems);
  await db.delete(payrollPeriods);
  await db.delete(employees);
  await db.delete(positions);
  await db.delete(departments);
  await db.delete(accrualTypes);
  await db.delete(taxProfiles);
  await db.delete(companySettings);
  await db.delete(users).where(ne(users.id, adminUserId));

  await writeAudit(adminUserId, "system", "all", "reset", {
    message: "Полный сброс системы: удалены все данные расчёта",
  });

  return { ok: true as const };
}

const DATABASE_TABLE_ROW_LIMIT = 500;

export type DatabaseCell = string | number | boolean | null;

export type DatabaseTableView = {
  id: string;
  label: string;
  columns: string[];
  rowCount: number;
  rows: Array<Record<string, DatabaseCell>>;
};

function serializeDatabaseCell(value: unknown): DatabaseCell {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

function packDatabaseTable(
  id: string,
  label: string,
  columns: string[],
  records: Array<Record<string, unknown>>,
): DatabaseTableView {
  return {
    id,
    label,
    columns,
    rowCount: records.length,
    rows: records.slice(0, DATABASE_TABLE_ROW_LIMIT).map((record) =>
      Object.fromEntries(columns.map((column) => [column, serializeDatabaseCell(record[column])])),
    ),
  };
}

/** Живой просмотр всех бизнес-таблиц. Пользователи — без секретов сессии. */
export async function listDatabaseTables(): Promise<DatabaseTableView[]> {
  const db = await requireDb();
  const [
    employeeRows,
    departmentRows,
    positionRows,
    accrualRows,
    taxProfileRows,
    periodRows,
    itemRows,
    calculationRows,
    companyRows,
    auditRows,
    userRows,
  ] = await Promise.all([
    db.select().from(employees).orderBy(desc(employees.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(departments).orderBy(desc(departments.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(positions).orderBy(desc(positions.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(accrualTypes).orderBy(desc(accrualTypes.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(taxProfiles).orderBy(desc(taxProfiles.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(payrollPeriods).orderBy(desc(payrollPeriods.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(employeePayrollItems).orderBy(desc(employeePayrollItems.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(payrollCalculations).orderBy(desc(payrollCalculations.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(companySettings).orderBy(desc(companySettings.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(DATABASE_TABLE_ROW_LIMIT),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.id))
      .limit(DATABASE_TABLE_ROW_LIMIT),
  ]);

  return [
    packDatabaseTable("employees", "Сотрудники", ["id", "userId", "fullName", "iin", "departmentId", "positionId", "grossSalary", "hireDate", "birthDate", "iban", "bankName", "applyStandardDeduction", "customDeductionAmount", "opvrApplicable", "status", "notes", "createdAt", "updatedAt"], employeeRows as Array<Record<string, unknown>>),
    packDatabaseTable("departments", "Подразделения", ["id", "code", "name", "isActive", "createdAt", "updatedAt"], departmentRows as Array<Record<string, unknown>>),
    packDatabaseTable("positions", "Должности", ["id", "code", "name", "departmentId", "isActive", "createdAt", "updatedAt"], positionRows as Array<Record<string, unknown>>),
    packDatabaseTable("accrualTypes", "Виды начислений", ["id", "code", "name", "kind", "isTaxable", "isActive", "createdAt", "updatedAt"], accrualRows as Array<Record<string, unknown>>),
    packDatabaseTable("taxProfiles", "Профили ставок", ["id", "name", "effectiveFrom", "effectiveTo", "mci", "minimumWage", "standardDeductionMciCount", "opvRateBps", "opvMaxBaseMinimumWages", "vosmsRateBps", "vosmsMaxBaseMinimumWages", "ipnBaseRateBps", "ipnHighRateBps", "ipnHighRateAnnualMciLimit", "lowIncomeMonthlyMciLimit", "lowIncomeCorrectionBps", "soRateBps", "soMinBaseMinimumWages", "soMaxBaseMinimumWages", "oosmsRateBps", "oosmsMaxBaseMinimumWages", "snRateBps", "opvrRateBps", "opvrMaxBaseMinimumWages", "isActive", "createdAt", "updatedAt"], taxProfileRows as Array<Record<string, unknown>>),
    packDatabaseTable("payrollPeriods", "Периоды", ["id", "periodKey", "year", "month", "status", "taxProfileId", "closedAt", "closedByUserId", "createdAt", "updatedAt"], periodRows as Array<Record<string, unknown>>),
    packDatabaseTable("employeePayrollItems", "Начисления по сотрудникам", ["id", "payrollPeriodId", "employeeId", "accrualTypeId", "amount", "comment", "createdAt", "updatedAt"], itemRows as Array<Record<string, unknown>>),
    packDatabaseTable("payrollCalculations", "Расчёты ведомости", ["id", "payrollPeriodId", "employeeId", "status", "gross", "taxableGross", "manualAccruals", "nonTaxableAccruals", "manualDeductions", "opv", "vosms", "standardDeduction", "ipnBase", "ipnCorrection", "ipn", "totalWithheld", "netSalary", "soBase", "so", "oosms", "snBase", "sn", "opvr", "totalEmployerContributions", "totalCompanyCost", "taxProfileSnapshot", "calculatedAt", "calculatedByUserId", "paidAt", "createdAt", "updatedAt"], calculationRows as Array<Record<string, unknown>>),
    packDatabaseTable("companySettings", "Компания", ["id", "legalName", "bin", "address", "updatedByUserId", "createdAt", "updatedAt"], companyRows as Array<Record<string, unknown>>),
    packDatabaseTable("auditLogs", "Журнал аудита", ["id", "userId", "entityType", "entityId", "action", "details", "createdAt"], auditRows as Array<Record<string, unknown>>),
    packDatabaseTable("users", "Пользователи", ["id", "name", "email", "role", "lastSignedIn"], userRows as Array<Record<string, unknown>>),
  ];
}
