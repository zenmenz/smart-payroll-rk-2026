import { payrollSpecification } from "@shared/payrollSpecification";
import { z } from "zod";
import * as payrollDb from "../payrollDb";
import { createPayrollJournalCsv, createPayrollJournalXlsx, createPayslipCsv, createPayslipXlsx } from "../payrollExport";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const idSchema = z.object({ id: z.number().int().positive() });
const optionalId = z.number().int().positive().nullable().optional();
const periodStatus = z.enum(["draft", "verified", "approved", "paid"]);

const employeeSchema = z.object({
  userId: optionalId,
  fullName: z.string().trim().min(2).max(255),
  iin: z.string().regex(/^\d{12}$/, "ИИН должен содержать 12 цифр."),
  departmentId: optionalId,
  positionId: optionalId,
  grossSalary: z.number().finite().nonnegative(),
  hireDate: z.string().date(),
  birthDate: z.string().date().nullable().optional(),
  iban: z.string().trim().min(5).max(34).nullable().optional(),
  bankName: z.string().trim().max(120).nullable().optional(),
  applyStandardDeduction: z.boolean().optional(),
  customDeductionAmount: z.number().finite().nonnegative().optional(),
  opvrApplicable: z.boolean().optional(),
  status: z.enum(["active", "new", "vacation", "sick", "quitting", "archived"]).optional(),
  notes: z.string().trim().max(10_000).nullable().optional(),
});

const taxProfileSchema = z.object({
  name: z.string().trim().min(2).max(160),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().nullable().optional(),
  mci: z.number().int().positive(),
  minimumWage: z.number().int().positive(),
  standardDeductionMciCount: z.number().int().nonnegative(),
  opvRateBps: z.number().int().nonnegative(),
  opvMaxBaseMinimumWages: z.number().int().positive(),
  vosmsRateBps: z.number().int().nonnegative(),
  vosmsMaxBaseMinimumWages: z.number().int().positive(),
  ipnBaseRateBps: z.number().int().nonnegative(),
  ipnHighRateBps: z.number().int().nonnegative(),
  ipnHighRateAnnualMciLimit: z.number().int().positive(),
  lowIncomeMonthlyMciLimit: z.number().int().nonnegative(),
  lowIncomeCorrectionBps: z.number().int().nonnegative(),
  soRateBps: z.number().int().nonnegative(),
  soMinBaseMinimumWages: z.number().int().nonnegative(),
  soMaxBaseMinimumWages: z.number().int().positive(),
  oosmsRateBps: z.number().int().nonnegative(),
  oosmsMaxBaseMinimumWages: z.number().int().positive(),
  snRateBps: z.number().int().nonnegative(),
  opvrRateBps: z.number().int().nonnegative(),
  opvrMaxBaseMinimumWages: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

const journalFilterSchema = z.object({
  periodId: z.number().int().positive().optional(),
  departmentId: z.number().int().positive().optional(),
  employeeId: z.number().int().positive().optional(),
  status: periodStatus.optional(),
});

export const payrollRouter = router({
  specification: publicProcedure.query(() => payrollSpecification),

  dashboard: router({
    summary: adminProcedure.input(journalFilterSchema.optional()).query(({ input }) =>
      payrollDb.getDashboardSummary(input ?? {}),
    ),
    history: adminProcedure.query(({ ctx }) => payrollDb.getDashboardHistory(ctx.user.id)),
  }),

  references: router({
    list: adminProcedure.query(({ ctx }) => payrollDb.listReferenceData(ctx.user.id)),
    departments: router({
      create: adminProcedure.input(z.object({ code: z.string().trim().min(1).max(32), name: z.string().trim().min(1).max(160), isActive: z.boolean().optional() })).mutation(({ input, ctx }) =>
        payrollDb.createDepartment(input, ctx.user.id),
      ),
      update: adminProcedure.input(idSchema.extend({ code: z.string().trim().min(1).max(32), name: z.string().trim().min(1).max(160), isActive: z.boolean() })).mutation(({ input, ctx }) => {
        const { id, ...values } = input;
        return payrollDb.updateDepartment(id, values, ctx.user.id);
      }),
    }),
    positions: router({
      create: adminProcedure.input(z.object({ code: z.string().trim().min(1).max(32), name: z.string().trim().min(1).max(160), departmentId: optionalId, isActive: z.boolean().optional() })).mutation(({ input, ctx }) =>
        payrollDb.createPosition(input, ctx.user.id),
      ),
      update: adminProcedure.input(idSchema.extend({ code: z.string().trim().min(1).max(32), name: z.string().trim().min(1).max(160), departmentId: optionalId, isActive: z.boolean() })).mutation(({ input, ctx }) => {
        const { id, ...values } = input;
        return payrollDb.updatePosition(id, values, ctx.user.id);
      }),
    }),
    accrualTypes: router({
      create: adminProcedure.input(z.object({ code: z.string().trim().min(1).max(32), name: z.string().trim().min(1).max(160), kind: z.enum(["accrual", "deduction"]), isTaxable: z.boolean().optional(), isActive: z.boolean().optional() })).mutation(({ input, ctx }) =>
        payrollDb.createAccrualType(input, ctx.user.id),
      ),
      update: adminProcedure.input(idSchema.extend({ code: z.string().trim().min(1).max(32), name: z.string().trim().min(1).max(160), kind: z.enum(["accrual", "deduction"]), isTaxable: z.boolean(), isActive: z.boolean() })).mutation(({ input, ctx }) => {
        const { id, ...values } = input;
        return payrollDb.updateAccrualType(id, values, ctx.user.id);
      }),
    }),
    taxProfiles: router({
      create: adminProcedure.input(taxProfileSchema).mutation(({ input, ctx }) => payrollDb.createTaxProfile(input, ctx.user.id)),
      update: adminProcedure.input(idSchema.extend(taxProfileSchema.shape)).mutation(({ input, ctx }) => {
        const { id, ...values } = input;
        return payrollDb.updateTaxProfile(id, values, ctx.user.id);
      }),
    }),
  }),

  employees: router({
    list: adminProcedure.input(z.object({ departmentId: z.number().int().positive().optional(), status: z.string().optional(), query: z.string().max(255).optional() }).optional()).query(({ input }) =>
      payrollDb.listEmployees(input),
    ),
    create: adminProcedure.input(employeeSchema).mutation(async ({ input, ctx }) => {
      const id = await payrollDb.createEmployee(input, ctx.user.id);
      await payrollDb.recalculateOpenPeriods(ctx.user.id);
      return id;
    }),
    update: adminProcedure.input(idSchema.extend(employeeSchema.shape)).mutation(async ({ input, ctx }) => {
      const { id, ...values } = input;
      await payrollDb.updateEmployee(id, values, ctx.user.id);
      await payrollDb.recalculateOpenPeriods(ctx.user.id);
    }),
    archive: adminProcedure.input(idSchema).mutation(({ input, ctx }) => payrollDb.archiveEmployee(input.id, ctx.user.id)),
    delete: adminProcedure.input(idSchema).mutation(({ input, ctx }) => payrollDb.deleteEmployeeIfUnused(input.id, ctx.user.id)),
  }),

  periods: router({
    list: adminProcedure.query(({ ctx }) => payrollDb.listPayrollPeriodsForUser(ctx.user.id)),
    create: adminProcedure.input(z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12), taxProfileId: optionalId })).mutation(async ({ input, ctx }) => {
      const id = await payrollDb.createPayrollPeriod(input, ctx.user.id);
      if (input.taxProfileId) await payrollDb.calculatePeriod(id, ctx.user.id);
      return id;
    }),
    close: adminProcedure.input(idSchema).mutation(({ input, ctx }) => payrollDb.setPayrollPeriodStatus(input.id, "closed", ctx.user.id)),
    reopen: adminProcedure.input(idSchema).mutation(({ input, ctx }) => payrollDb.setPayrollPeriodStatus(input.id, "open", ctx.user.id)),
  }),

  payroll: router({
    upsertItem: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), payrollPeriodId: z.number().int().positive(), employeeId: z.number().int().positive(), accrualTypeId: z.number().int().positive(), amount: z.number().finite().nonnegative(), comment: z.string().trim().max(500).nullable().optional() })).mutation(({ input, ctx }) =>
      payrollDb.upsertPayrollItem(input, ctx.user.id),
    ),
    deleteItem: adminProcedure.input(idSchema).mutation(({ input, ctx }) => payrollDb.deletePayrollItem(input.id, ctx.user.id)),
    calculatePeriod: adminProcedure.input(idSchema).mutation(({ input, ctx }) => payrollDb.calculatePeriod(input.id, ctx.user.id)),
    journal: adminProcedure.input(journalFilterSchema.optional()).query(({ input }) => payrollDb.listPayrollJournal(input ?? {})),
    updateCalculationStatus: adminProcedure.input(idSchema.extend({ status: periodStatus })).mutation(({ input, ctx }) =>
      payrollDb.updateCalculationStatus(input.id, input.status, ctx.user.id),
    ),
    getPayslip: adminProcedure.input(z.object({ employeeId: z.number().int().positive(), payrollPeriodId: z.number().int().positive() })).query(({ input }) =>
      payrollDb.getDetailedPayslip(input.employeeId, input.payrollPeriodId),
    ),
    myPayslips: protectedProcedure.input(z.object({ periodId: z.number().int().positive().optional() })).query(async ({ input, ctx }) => {
      const employee = await payrollDb.getEmployeeByUserId(ctx.user.id);
      return employee ? payrollDb.getPayslipsForEmployee(employee.id, input) : [];
    }),
    myPayslip: protectedProcedure.input(z.object({ payrollPeriodId: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const employee = await payrollDb.getEmployeeByUserId(ctx.user.id);
      return employee ? payrollDb.getDetailedPayslip(employee.id, input.payrollPeriodId) : null;
    }),
  }),

  reports: router({
    exportJournal: adminProcedure.input(journalFilterSchema.extend({ format: z.enum(["csv", "xlsx"]) })).query(async ({ input }) => {
      const { format, ...filters } = input;
      const rows = await payrollDb.listPayrollJournal(filters);
      const suffix = filters.periodId ? `период-${filters.periodId}` : "все-периоды";
      return format === "csv" ? createPayrollJournalCsv(rows, suffix) : createPayrollJournalXlsx(rows, suffix);
    }),
    exportPayslip: adminProcedure.input(z.object({ employeeId: z.number().int().positive(), payrollPeriodId: z.number().int().positive(), format: z.enum(["csv", "xlsx"]) })).query(async ({ input }) => {
      const payslip = await payrollDb.getDetailedPayslip(input.employeeId, input.payrollPeriodId);
      return input.format === "csv" ? createPayslipCsv(payslip) : createPayslipXlsx(payslip);
    }),
  }),

  company: router({
    get: adminProcedure.query(() => payrollDb.getCompanySettings()),
    save: adminProcedure.input(z.object({ legalName: z.string().trim().min(2).max(255), bin: z.string().regex(/^\d{12}$/, "БИН должен содержать 12 цифр."), address: z.string().trim().min(2).max(500) })).mutation(({ input, ctx }) =>
      payrollDb.saveCompanySettings(input, ctx.user.id),
    ),
  }),

  system: router({
    reset: adminProcedure
      .input(
        z.object({
          confirmation: z
            .string()
            .refine((value) => value === "СБРОС", { message: "Для подтверждения введите слово СБРОС" }),
        }),
      )
      .mutation(({ ctx }) => payrollDb.resetSystemData(ctx.user.id)),
  }),

  database: router({
    tables: adminProcedure.query(() => payrollDb.listDatabaseTables()),
  }),

  audit: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(500).optional() })).query(({ input }) => payrollDb.listAuditLogs(input.limit)),
});
