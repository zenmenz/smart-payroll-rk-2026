export type EmployeeStatus = 'active' | 'new' | 'vacation' | 'sick' | 'quitting' | 'archived';

export type PayrollStage = 'draft' | 'verified' | 'approved' | 'paid';

export type DisplayMode = 'desktop' | 'mobile';

export type SalaryViewType = 'gross' | 'net';

export interface Employee {
  id: string;
  userId?: number | null;
  departmentId?: number | null;
  positionId?: number | null;
  fullName: string; // ФИО
  position: string; // Должность
  department: string; // Отдел
  iin: string; // ИИН (12 цифр)
  iban: string; // Номер счета KZ...
  bankName: string; // Банк (Kaspi, Halyk, BCC, Jusan, Forte)
  birthDate: string; // Дата рождения (для ОПВР рожденных с 1975)
  hireDate?: string;
  grossSalary: number; // Оклад / Начислено в тенге
  applyStandardDeduction: boolean; // Вычет 30 МРП (129 750 ₸ в 2026 г.)
  customDeductionAmount?: number; // Дополнительные вычеты (если есть)
  status: EmployeeStatus;
  notes?: string;
  avatarColor?: string;
  previousMonthSalary?: number; // Для сравнения с прошлым месяцем
  hasVerifiedDeductionDocs?: boolean; // Документы на вычет подтверждены
  hasVerifiedBank?: boolean; // Реквизиты проверены
  opvrApplicable?: boolean;
}

export interface TaxBreakdown {
  // Начислено
  gross: number;
  
  // Удержания с работника (Employee Withholdings)
  opv: number; // ОПВ (10%)
  vosms: number; // ВОСМС (2%)
  standardDeduction: number; // Стандартный налоговый вычет 30 МРП (129 750 ₸)
  ipnBase: number; // База ИПН = Gross - ОПВ - ВОСМС - Вычет
  ipnCorrection: number; // Корректировка 90% (если доход < 25 МРП)
  ipn: number; // ИПН (10% от базы с учетом вычетов)
  totalWithheld: number; // Всего удержано (ОПВ + ВОСМС + ИПН)
  netSalary: number; // На руки (Gross - TotalWithheld)
  
  // Налоги и отчисления работодателя (Employer Expenses)
  soBase: number; // База СО (Gross - ОПВ в пределах от 1 до 7 МЗП)
  so: number; // СО (3.5%)
  oosms: number; // ООСМС (3% от Gross, макс 10 МЗП)
  snBase: number; // База СН (Gross - ОПВ - ВОСМС)
  sn: number; // Социальный налог (9.5% - СО)
  opvr: number; // ОПВР (2.0% от Gross за счет компании)
  totalEmployerContributions: number; // Всего отчислений работодателя (СО + ООСМС + СН + ОПВР)
  
  // Полная стоимость для компании
  totalCompanyCost: number; // Gross + totalEmployerContributions
}

export interface AuditIssue {
  id: string;
  employeeId?: string;
  employeeName?: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  actionText?: string;
  actionType?: 'edit_employee' | 'apply_deduction' | 'verify_iban' | 'review_salary';
}

export interface PayrollHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  employeeName?: string;
  details: string;
}
