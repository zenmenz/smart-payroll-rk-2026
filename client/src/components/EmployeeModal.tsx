import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  Building, 
  CreditCard, 
  Save, 
  Sparkles, 
  ShieldCheck, 
  Info,
  CheckCircle2,
  Calendar,
  Trash2,
} from 'lucide-react';
import { Employee, EmployeeStatus } from '../types/payroll';
import type { PayrollTaxProfile } from '@shared/payrollEngine';
import { formatKZT, getStandardDeductionSummary, previewPayroll } from '../utils/kazakhstanTaxCalculator';

interface EmployeeModalProps {
  employee: Employee | null; // null means creating new
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => void;
  onDelete?: (employee: Employee) => void;
  departments: string[];
  isSaving?: boolean;
  isDeleting?: boolean;
  deductionLabel?: string;
  taxProfile?: PayrollTaxProfile | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSave,
  onDelete,
  departments,
  isSaving = false,
  isDeleting = false,
  deductionLabel = getStandardDeductionSummary().fullLabel,
  taxProfile = null,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [iin, setIin] = useState<string>('');
  const [iban, setIban] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [grossSalary, setGrossSalary] = useState<string>('');
  const [hireDate, setHireDate] = useState<string>('');
  const [applyStandardDeduction, setApplyStandardDeduction] = useState<boolean>(true);
  const [status, setStatus] = useState<EmployeeStatus>('active');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName);
      setPosition(employee.position);
      setDepartment(employee.department);
      setIin(employee.iin);
      setIban(employee.iban);
      setBankName(employee.bankName);
      setGrossSalary(employee.grossSalary.toString());
      setHireDate(employee.hireDate || '');
      setApplyStandardDeduction(employee.applyStandardDeduction);
      setStatus(employee.status);
      setNotes(employee.notes || '');
    } else {
      setFullName('');
      setPosition('');
      setDepartment(departments[0] || '');
      setIin('');
      setIban('');
      setBankName('');
      setGrossSalary('');
      setHireDate(new Date().toISOString().slice(0, 10));
      setApplyStandardDeduction(true);
      setStatus('active');
      setNotes('');
    }
  }, [employee, isOpen, departments]);

  if (!isOpen) return null;

  const currentSalaryNum = parseFloat(grossSalary.replace(/\D/g, '')) || 0;
  const previewCalc = taxProfile && currentSalaryNum > 0
    ? previewPayroll(currentSalaryNum, applyStandardDeduction, taxProfile, employee?.opvrApplicable ?? true)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !position.trim() || currentSalaryNum <= 0 || iin.length !== 12 || !hireDate) return;

    onSave({
      id: employee?.id,
      fullName: fullName.trim(),
      position: position.trim(),
      department,
      iin: iin.trim(),
      iban: iban.trim(),
      bankName,
      grossSalary: currentSalaryNum,
      hireDate,
      applyStandardDeduction,
      status,
      notes: notes.trim(),
      hasVerifiedDeductionDocs: applyStandardDeduction,
      hasVerifiedBank: true,
    });
    onClose();
  };

  const kazakhBanks = [
    'Kaspi Bank',
    'Halyk Bank',
    'Банк ЦентрКредит (BCC)',
    'Jusan Bank',
    'ForteBank',
    'Евразийский Банк',
    'Bereke Bank',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-[#121215] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#fafafa]">
                {employee ? 'Редактировать сотрудника' : 'Добавить нового сотрудника'}
              </h3>
              <p className="text-xs text-zinc-400">
                Заполнение личных данных и параметров начисления заработной платы
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1 bg-[#18181b]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                ФИО сотрудника <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Например: Арман Сейткалиев"
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Должность <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Например: Senior Frontend Разработчик"
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Отдел / Департамент
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Статус сотрудника
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="active">Активен</option>
                <option value="new">Новый</option>
                <option value="vacation">В отпуске</option>
                <option value="sick">На больничном</option>
                <option value="quitting">Увольняется</option>
                <option value="archived">Архив / Уволен</option>
              </select>
            </div>

            {/* IIN */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                ИИН (12 цифр)
              </label>
              <input
                type="text"
                maxLength={12}
                value={iin}
                onChange={(e) => setIin(e.target.value.replace(/\D/g, ''))}
                placeholder="950415301244"
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono-num placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Hire Date */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Дата приёма <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                required
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Банк для выплаты ЗП
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {kazakhBanks.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* IBAN Account */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-zinc-300 mb-1.5">
                Номер банковского счета (IBAN)
              </label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                placeholder="KZ..."
                className="w-full bg-[#121215] border border-zinc-700 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono-num placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Gross Salary in KZT */}
            <div className="sm:col-span-2 bg-[#121215] p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div>
                <label className="block font-bold text-zinc-200 text-sm mb-1.5">
                  Оклад по трудовому договору (Начислено / Gross в тенге):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(e.target.value.replace(/\D/g, ''))}
                    placeholder="Например: 850000"
                    className="w-full bg-[#18181b] border border-zinc-700 rounded-xl pl-4 pr-8 py-2.5 text-base font-bold font-mono-num text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₸</span>
                </div>
              </div>

              {/* Deduction 30 MRP Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="standardDeductionCheck"
                  checked={applyStandardDeduction}
                  onChange={(e) => setApplyStandardDeduction(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-[#18181b]"
                />
                <label htmlFor="standardDeductionCheck" className="text-xs text-zinc-300 leading-snug cursor-pointer select-none">
                  <span className="font-semibold text-emerald-300">Применять базовый налоговый вычет {deductionLabel}</span>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Сотрудник подал заявление о применении стандартного вычета по ст. 346 НК РК.
                  </p>
                </label>
              </div>

              {/* Live Preview Box — тот же движок, что и backend */}
              <div className="p-3 bg-[#18181b] rounded-xl border border-zinc-800 grid grid-cols-3 gap-2 font-mono-num text-center">
                {previewCalc ? (
                  <>
                    <div>
                      <span className="text-[10px] text-zinc-400 block font-sans">Оклад</span>
                      <span className="text-xs font-bold text-zinc-200">{formatKZT(previewCalc.gross)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 block font-sans">Удержания (ОПВ+ВОСМС+ИПН)</span>
                      <span className="text-xs font-bold text-amber-300">-{formatKZT(previewCalc.totalWithheld)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-sans font-bold">На руки (Net)</span>
                      <span className="text-sm font-extrabold text-emerald-400">{formatKZT(previewCalc.netSalary)}</span>
                    </div>
                  </>
                ) : (
                  <div className="col-span-3 text-xs text-zinc-400 font-sans py-1">
                    Предпросмотр появится после выбора периода с профилем ставок и ввода оклада.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-zinc-800">
            {employee && onDelete ? (
              <button
                type="button"
                disabled={isSaving || isDeleting}
                onClick={() => onDelete(employee)}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-rose-300 rounded-xl font-medium transition-colors border border-rose-500/30 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Удаление…' : 'Удалить'}</span>
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium transition-colors border border-zinc-800"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-wait text-zinc-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Сохранение…' : 'Сохранить данные'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
