import {
  boolean,
  date,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core identities created during Manus OAuth sign-in. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const positions = mysqlTable(
  "positions",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 160 }).notNull(),
    departmentId: int("departmentId").references(() => departments.id, { onDelete: "set null" }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("positions_department_idx").on(table.departmentId)],
);

export const employees = mysqlTable(
  "employees",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").unique().references(() => users.id, { onDelete: "set null" }),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    iin: varchar("iin", { length: 12 }).notNull().unique(),
    departmentId: int("departmentId").references(() => departments.id, { onDelete: "set null" }),
    positionId: int("positionId").references(() => positions.id, { onDelete: "set null" }),
    grossSalary: int("grossSalary").notNull(),
    hireDate: date("hireDate", { mode: "string" }).notNull(),
    birthDate: date("birthDate", { mode: "string" }),
    iban: varchar("iban", { length: 34 }),
    bankName: varchar("bankName", { length: 120 }),
    applyStandardDeduction: boolean("applyStandardDeduction").default(false).notNull(),
    customDeductionAmount: int("customDeductionAmount").default(0).notNull(),
    opvrApplicable: boolean("opvrApplicable").default(true).notNull(),
    status: mysqlEnum("status", ["active", "new", "vacation", "sick", "quitting", "archived"])
      .default("new")
      .notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("employees_department_idx").on(table.departmentId),
    index("employees_position_idx").on(table.positionId),
  ],
);

export const accrualTypes = mysqlTable("accrualTypes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  kind: mysqlEnum("kind", ["accrual", "deduction"]).notNull(),
  isTaxable: boolean("isTaxable").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A versioned set of RK payroll inputs. No profile is seeded; an administrator creates one before calculation. */
export const taxProfiles = mysqlTable(
  "taxProfiles",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    effectiveFrom: date("effectiveFrom", { mode: "string" }).notNull(),
    effectiveTo: date("effectiveTo", { mode: "string" }),
    mci: int("mci").notNull(),
    minimumWage: int("minimumWage").notNull(),
    standardDeductionMciCount: int("standardDeductionMciCount").notNull(),
    opvRateBps: int("opvRateBps").notNull(),
    opvMaxBaseMinimumWages: int("opvMaxBaseMinimumWages").notNull(),
    vosmsRateBps: int("vosmsRateBps").notNull(),
    vosmsMaxBaseMinimumWages: int("vosmsMaxBaseMinimumWages").notNull(),
    ipnBaseRateBps: int("ipnBaseRateBps").notNull(),
    ipnHighRateBps: int("ipnHighRateBps").notNull(),
    ipnHighRateAnnualMciLimit: int("ipnHighRateAnnualMciLimit").notNull(),
    lowIncomeMonthlyMciLimit: int("lowIncomeMonthlyMciLimit").notNull(),
    lowIncomeCorrectionBps: int("lowIncomeCorrectionBps").notNull(),
    soRateBps: int("soRateBps").notNull(),
    soMinBaseMinimumWages: int("soMinBaseMinimumWages").notNull(),
    soMaxBaseMinimumWages: int("soMaxBaseMinimumWages").notNull(),
    oosmsRateBps: int("oosmsRateBps").notNull(),
    oosmsMaxBaseMinimumWages: int("oosmsMaxBaseMinimumWages").notNull(),
    snRateBps: int("snRateBps").notNull(),
    opvrRateBps: int("opvrRateBps").notNull(),
    opvrMaxBaseMinimumWages: int("opvrMaxBaseMinimumWages").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("tax_profiles_effective_idx").on(table.effectiveFrom, table.effectiveTo)],
);

export const payrollPeriods = mysqlTable("payrollPeriods", {
  id: int("id").autoincrement().primaryKey(),
  periodKey: varchar("periodKey", { length: 7 }).notNull().unique(),
  year: int("year").notNull(),
  month: int("month").notNull(),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  taxProfileId: int("taxProfileId").references(() => taxProfiles.id, { onDelete: "restrict" }),
  closedAt: timestamp("closedAt"),
  closedByUserId: int("closedByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const employeePayrollItems = mysqlTable(
  "employeePayrollItems",
  {
    id: int("id").autoincrement().primaryKey(),
    payrollPeriodId: int("payrollPeriodId").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
    employeeId: int("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
    accrualTypeId: int("accrualTypeId").notNull().references(() => accrualTypes.id, { onDelete: "restrict" }),
    amount: int("amount").notNull(),
    comment: varchar("comment", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("employee_payroll_items_period_employee_idx").on(table.payrollPeriodId, table.employeeId),
    index("employee_payroll_items_type_idx").on(table.accrualTypeId),
  ],
);

/** Frozen monthly calculation. The tax profile snapshot makes closed-period pay slips reproducible. */
export const payrollCalculations = mysqlTable(
  "payrollCalculations",
  {
    id: int("id").autoincrement().primaryKey(),
    payrollPeriodId: int("payrollPeriodId").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
    employeeId: int("employeeId").notNull().references(() => employees.id, { onDelete: "restrict" }),
    status: mysqlEnum("status", ["draft", "verified", "approved", "paid"]).default("draft").notNull(),
    gross: int("gross").notNull(),
    taxableGross: int("taxableGross").notNull(),
    manualAccruals: int("manualAccruals").default(0).notNull(),
    nonTaxableAccruals: int("nonTaxableAccruals").default(0).notNull(),
    manualDeductions: int("manualDeductions").default(0).notNull(),
    opv: int("opv").notNull(),
    vosms: int("vosms").notNull(),
    standardDeduction: int("standardDeduction").notNull(),
    ipnBase: int("ipnBase").notNull(),
    ipnCorrection: int("ipnCorrection").notNull(),
    ipn: int("ipn").notNull(),
    totalWithheld: int("totalWithheld").notNull(),
    netSalary: int("netSalary").notNull(),
    soBase: int("soBase").notNull(),
    so: int("so").notNull(),
    oosms: int("oosms").notNull(),
    snBase: int("snBase").notNull(),
    sn: int("sn").notNull(),
    opvr: int("opvr").notNull(),
    totalEmployerContributions: int("totalEmployerContributions").notNull(),
    totalCompanyCost: int("totalCompanyCost").notNull(),
    taxProfileSnapshot: text("taxProfileSnapshot").notNull(),
    calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
    calculatedByUserId: int("calculatedByUserId").references(() => users.id, { onDelete: "set null" }),
    paidAt: timestamp("paidAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("payroll_calculation_period_employee_unq").on(table.payrollPeriodId, table.employeeId),
    index("payroll_calculation_period_status_idx").on(table.payrollPeriodId, table.status),
  ],
);

export const companySettings = mysqlTable("companySettings", {
  id: int("id").autoincrement().primaryKey(),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  bin: varchar("bin", { length: 12 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  updatedByUserId: int("updatedByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable(
  "auditLogs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    entityType: varchar("entityType", { length: 64 }).notNull(),
    entityId: varchar("entityId", { length: 64 }),
    action: varchar("action", { length: 80 }).notNull(),
    details: text("details"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("audit_logs_entity_idx").on(table.entityType, table.entityId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type TaxProfile = typeof taxProfiles.$inferSelect;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type PayrollCalculation = typeof payrollCalculations.$inferSelect;
