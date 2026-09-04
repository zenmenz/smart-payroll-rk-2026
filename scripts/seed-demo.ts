/**
 * One-off local demo seed for manual / E2E testing.
 * Run: pnpm exec tsx scripts/seed-demo.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "../server/db";
import * as payrollDb from "../server/payrollDb";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is missing or DB is unreachable");

  const existing = await db.select().from(users).where(eq(users.openId, "local-admin")).limit(1);
  let userId = existing[0]?.id;
  if (!userId) {
    const inserted = await db.insert(users).values({
      openId: "local-admin",
      name: "Local Admin",
      email: "admin@localhost",
      loginMethod: "local",
      role: "admin",
      lastSignedIn: new Date(),
    });
    userId = Number(inserted[0].insertId);
  }

  await payrollDb.saveCompanySettings(
    {
      legalName: "ТОО Тест Пейролл",
      bin: "000000000000",
      address: "г. Алматы, ул. Абая 1",
    },
    userId,
  );

  const taxProfileId = await payrollDb.createTaxProfile(
    {
      name: "РК 2026 базовый",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      mci: 3932,
      minimumWage: 85000,
      standardDeductionMciCount: 14,
      opvRateBps: 1000,
      opvMaxBaseMinimumWages: 50,
      vosmsRateBps: 200,
      vosmsMaxBaseMinimumWages: 10,
      ipnBaseRateBps: 1000,
      ipnHighRateBps: 1500,
      ipnHighRateAnnualMciLimit: 8500,
      lowIncomeMonthlyMciLimit: 0,
      lowIncomeCorrectionBps: 0,
      soRateBps: 350,
      soMinBaseMinimumWages: 1,
      soMaxBaseMinimumWages: 7,
      oosmsRateBps: 300,
      oosmsMaxBaseMinimumWages: 10,
      snRateBps: 950,
      opvrRateBps: 250,
      opvrMaxBaseMinimumWages: 50,
    },
    userId,
  );

  const departmentId = await payrollDb.createDepartment(
    { code: "IT", name: "IT отдел" },
    userId,
  );
  const positionId = await payrollDb.createPosition(
    { code: "DEV", name: "Разработчик", departmentId },
    userId,
  );

  const periods = await payrollDb.listPayrollPeriods();
  let periodId = periods.find((p) => p.year === 2026 && p.month === 8)?.id;
  if (!periodId) {
    periodId = await payrollDb.createPayrollPeriod(
      { year: 2026, month: 8, taxProfileId },
      userId,
    );
  }

  const employees = await payrollDb.listEmployees({ query: "Иванов" });
  let employeeId = employees[0]?.id;
  if (!employeeId) {
    employeeId = await payrollDb.createEmployee(
      {
        fullName: "Иванов Иван Иванович",
        iin: "900101300123",
        departmentId,
        positionId,
        grossSalary: 500_000,
        hireDate: "2026-01-15",
        status: "active",
        applyStandardDeduction: true,
        opvrApplicable: true,
      },
      userId,
    );
  }

  const calculations = await payrollDb.calculatePeriod(periodId, userId);
  console.log(
    JSON.stringify(
      {
        ok: true,
        userId,
        taxProfileId,
        departmentId,
        positionId,
        periodId,
        employeeId,
        calculations: calculations.length,
        gross: calculations[0]?.gross,
        net: calculations[0]?.net,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
