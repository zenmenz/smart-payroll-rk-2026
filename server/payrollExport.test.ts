import { describe, expect, it } from "vitest";
import { createPayrollJournalCsv, createPayrollJournalXlsx, createPayslipCsv, createPayslipXlsx } from "./payrollExport";

const journalRows = [{
  calculation: {
    status: "paid",
    gross: 100_000,
    opv: 10_000,
    vosms: 2_000,
    ipn: 5_000,
    totalWithheld: 17_000,
    netSalary: 83_000,
    so: 4_000,
    oosms: 3_000,
    sn: 2_000,
    opvr: 3_500,
    totalEmployerContributions: 12_500,
    totalCompanyCost: 112_500,
  },
  employee: { fullName: "Тестовый Сотрудник", iin: "000000000000" },
  department: null,
  period: { periodKey: "2026-08" },
}];

const detailedPayslip = {
  company: { legalName: "ТОО Тест", bin: "000000000000", address: "г. Астана" },
  employee: { fullName: "Тестовый Сотрудник", iin: "000000000000", iban: "KZ000000000000000000", bankName: "Тест Банк" },
  department: { name: "Финансы" },
  position: { name: "Бухгалтер" },
  period: { periodKey: "2026-08" },
  calculation: {
    status: "paid",
    gross: 100_000,
    taxableGross: 100_000,
    manualAccruals: 0,
    nonTaxableAccruals: 0,
    manualDeductions: 0,
    opv: 10_000,
    vosms: 2_000,
    standardDeduction: 0,
    ipnBase: 88_000,
    ipnCorrection: 0,
    ipn: 8_800,
    totalWithheld: 20_800,
    netSalary: 79_200,
    so: 4_000,
    oosms: 3_000,
    sn: 2_000,
    opvr: 3_500,
    totalEmployerContributions: 12_500,
    totalCompanyCost: 112_500,
  },
  items: [{ amount: 5_000, comment: "Разовая доплата", type: { name: "Премия", kind: "accrual" as const, isTaxable: true } }],
};

describe("payroll exports", () => {
  it("builds a UTF-8 CSV suitable for Excel", () => {
    const result = createPayrollJournalCsv(journalRows, "2026-08");
    const content = Buffer.from(result.base64, "base64").toString("utf8");

    expect(result.fileName).toContain("2026-08");
    expect(content).toContain("Тестовый Сотрудник");
    expect(content).toContain("Начислено");
  });

  it("builds an XLSX workbook", () => {
    const result = createPayrollJournalXlsx(journalRows, "2026-08");

    expect(result.fileName.endsWith(".xlsx")).toBe(true);
    expect(result.mimeType).toContain("spreadsheetml");
    expect(Buffer.from(result.base64, "base64").subarray(0, 2).toString()).toBe("PK");
  });

  it("builds detailed payslip files with payroll lines and company requisites", () => {
    const csv = createPayslipCsv(detailedPayslip);
    const xlsx = createPayslipXlsx(detailedPayslip);
    const content = Buffer.from(csv.base64, "base64").toString("utf8");

    expect(content).toContain("РАСЧЁТНЫЙ ЛИСТОК");
    expect(content).toContain("ТОО Тест");
    expect(content).toContain("Премия");
    expect(xlsx.fileName.endsWith(".xlsx")).toBe(true);
    expect(Buffer.from(xlsx.base64, "base64").subarray(0, 2).toString()).toBe("PK");
  });
});
