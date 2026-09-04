import * as XLSX from "xlsx";

type JournalEntry = {
  calculation: {
    status: string;
    gross: number;
    opv: number;
    vosms: number;
    ipn: number;
    totalWithheld: number;
    netSalary: number;
    so: number;
    oosms: number;
    sn: number;
    opvr: number;
    totalEmployerContributions: number;
    totalCompanyCost: number;
  };
  employee: { fullName: string; iin: string };
  department: { name: string } | null;
  period: { periodKey: string };
};

export type GeneratedExport = {
  fileName: string;
  mimeType: string;
  base64: string;
};

export type DetailedPayslip = {
  company: { legalName: string; bin: string; address: string } | null;
  employee: { fullName: string; iin: string; iban: string | null; bankName: string | null };
  department: { name: string } | null;
  position: { name: string } | null;
  period: { periodKey: string };
  calculation: {
    gross: number;
    taxableGross: number;
    manualAccruals: number;
    nonTaxableAccruals: number;
    manualDeductions: number;
    opv: number;
    vosms: number;
    standardDeduction: number;
    ipnBase: number;
    ipnCorrection: number;
    ipn: number;
    totalWithheld: number;
    netSalary: number;
    so: number;
    oosms: number;
    sn: number;
    opvr: number;
    totalEmployerContributions: number;
    totalCompanyCost: number;
    status: string;
  };
  items: Array<{ amount: number; comment: string | null; type: { name: string; kind: "accrual" | "deduction"; isTaxable: boolean } }>;
};

function normalizeRows(rows: JournalEntry[]) {
  return rows.map(row => ({
    "Период": row.period.periodKey,
    "Сотрудник": row.employee.fullName,
    "ИИН": row.employee.iin,
    "Подразделение": row.department?.name ?? "",
    "Статус выплаты": row.calculation.status,
    "Начислено": row.calculation.gross,
    "ОПВ": row.calculation.opv,
    "ВОСМС": row.calculation.vosms,
    "ИПН": row.calculation.ipn,
    "Удержано всего": row.calculation.totalWithheld,
    "К выплате": row.calculation.netSalary,
    "СО": row.calculation.so,
    "ООСМС": row.calculation.oosms,
    "СН": row.calculation.sn,
    "ОПВР": row.calculation.opvr,
    "Взносы работодателя": row.calculation.totalEmployerContributions,
    "Стоимость сотрудника": row.calculation.totalCompanyCost,
  }));
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[;"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createPayrollJournalCsv(rows: JournalEntry[], suffix = "все-периоды"): GeneratedExport {
  const normalized = normalizeRows(rows);
  const headers = Object.keys(normalized[0] ?? {
    "Период": "",
    "Сотрудник": "",
    "ИИН": "",
    "Подразделение": "",
    "Статус выплаты": "",
    "Начислено": 0,
    "ОПВ": 0,
    "ВОСМС": 0,
    "ИПН": 0,
    "Удержано всего": 0,
    "К выплате": 0,
    "СО": 0,
    "ООСМС": 0,
    "СН": 0,
    "ОПВР": 0,
    "Взносы работодателя": 0,
    "Стоимость сотрудника": 0,
  });
  const content = [headers.join(";"), ...normalized.map(row => headers.map(header => csvCell(row[header as keyof typeof row])).join(";"))].join("\n");
  return {
    fileName: `Журнал_начислений_${suffix}.csv`,
    mimeType: "text/csv;charset=utf-8",
    base64: Buffer.from(`\uFEFF${content}`, "utf8").toString("base64"),
  };
}

export function createPayrollJournalXlsx(rows: JournalEntry[], suffix = "все-периоды"): GeneratedExport {
  const worksheet = XLSX.utils.json_to_sheet(normalizeRows(rows));
  worksheet["!cols"] = [
    { wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 18 },
    { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
    { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 22 }, { wch: 22 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Журнал начислений");
  return {
    fileName: `Журнал_начислений_${suffix}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: XLSX.write(workbook, { type: "base64", bookType: "xlsx" }),
  };
}

function payslipRows(payslip: DetailedPayslip): Array<Array<string | number>> {
  const { calculation, employee, period } = payslip;
  const itemRows = payslip.items.map(item => [
    item.type.kind === "accrual" ? "Дополнительное начисление" : "Дополнительное удержание",
    item.type.name,
    item.type.isTaxable ? "Облагается" : "Не облагается",
    item.amount,
    item.comment ?? "",
  ]);

  return [
    ["РАСЧЁТНЫЙ ЛИСТОК", "", "", "", ""],
    ["Период", period.periodKey, "Статус", calculation.status, ""],
    ["Работодатель", payslip.company?.legalName ?? "Не заполнено", "БИН", payslip.company?.bin ?? "Не заполнено", ""],
    ["Адрес", payslip.company?.address ?? "Не заполнено", "", "", ""],
    ["Сотрудник", employee.fullName, "ИИН", employee.iin, ""],
    ["Подразделение", payslip.department?.name ?? "Не указано", "Должность", payslip.position?.name ?? "Не указана", ""],
    ["Банк", employee.bankName ?? "Не указан", "IBAN", employee.iban ?? "Не указан", ""],
    [],
    ["НАЧИСЛЕНИЯ", "Сумма", "", "", ""],
    ["Облагаемый доход", calculation.taxableGross, "", "", ""],
    ["Необлагаемые начисления", calculation.nonTaxableAccruals, "", "", ""],
    ["Начислено всего", calculation.gross, "", "", ""],
    [],
    ["ДОПОЛНИТЕЛЬНЫЕ СТРОКИ", "Сумма", "Налогообложение", "Комментарий", ""],
    ...itemRows,
    [],
    ["УДЕРЖАНИЯ", "Сумма", "", "", ""],
    ["ОПВ", calculation.opv, "", "", ""],
    ["ВОСМС", calculation.vosms, "", "", ""],
    ["Стандартный вычет", calculation.standardDeduction, "", "", ""],
    ["ИПН", calculation.ipn, "", "", ""],
    ["Ручные удержания", calculation.manualDeductions, "", "", ""],
    ["Удержано всего", calculation.totalWithheld, "", "", ""],
    ["К выплате", calculation.netSalary, "", "", ""],
    [],
    ["ВЗНОСЫ РАБОТОДАТЕЛЯ", "Сумма", "", "", ""],
    ["СО", calculation.so, "", "", ""],
    ["ООСМС", calculation.oosms, "", "", ""],
    ["СН", calculation.sn, "", "", ""],
    ["ОПВР", calculation.opvr, "", "", ""],
    ["Взносы работодателя", calculation.totalEmployerContributions, "", "", ""],
    ["Полная стоимость сотрудника", calculation.totalCompanyCost, "", "", ""],
  ];
}

export function createPayslipCsv(payslip: DetailedPayslip): GeneratedExport {
  const content = payslipRows(payslip)
    .map(row => row.map(value => csvCell(value)).join(";"))
    .join("\n");
  return {
    fileName: `Расчётный_листок_${payslip.period.periodKey}_${payslip.employee.iin}.csv`,
    mimeType: "text/csv;charset=utf-8",
    base64: Buffer.from(`\uFEFF${content}`, "utf8").toString("base64"),
  };
}

export function createPayslipXlsx(payslip: DetailedPayslip): GeneratedExport {
  const worksheet = XLSX.utils.aoa_to_sheet(payslipRows(payslip));
  worksheet["!cols"] = [{ wch: 32 }, { wch: 28 }, { wch: 20 }, { wch: 32 }, { wch: 5 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Расчётный листок");
  return {
    fileName: `Расчётный_листок_${payslip.period.periodKey}_${payslip.employee.iin}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: XLSX.write(workbook, { type: "base64", bookType: "xlsx" }),
  };
}
