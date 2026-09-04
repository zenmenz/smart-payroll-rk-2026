import React, { useEffect, useState } from 'react';
import { Building2, Download, FileText, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Employee, TaxBreakdown } from '../types/payroll';
import { formatKZT } from '../utils/kazakhstanTaxCalculator';

interface PayslipsModalProps {
  employees: Employee[];
  calculations: Map<string, TaxBreakdown>;
  selectedEmployee: Employee | null;
  selectedPeriod: string;
  selectedPeriodId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipsModal: React.FC<PayslipsModalProps> = ({
  employees,
  calculations,
  selectedEmployee,
  selectedPeriod,
  selectedPeriodId,
  isOpen,
  onClose,
}) => {
  const [currentEmpId, setCurrentEmpId] = useState(selectedEmployee?.id ?? employees[0]?.id ?? '');
  const utils = trpc.useUtils();

  useEffect(() => {
    if (selectedEmployee?.id) setCurrentEmpId(selectedEmployee.id);
    else if (employees[0]?.id) setCurrentEmpId(employees[0].id);
  }, [selectedEmployee?.id, employees]);

  const currentEmp = employees.find((employee) => employee.id === currentEmpId) ?? selectedEmployee ?? employees[0];
  const detailedPayslipQuery = trpc.payroll.payroll.getPayslip.useQuery(
    { employeeId: Number(currentEmp?.id ?? 0), payrollPeriodId: selectedPeriodId ?? 0 },
    { enabled: Boolean(isOpen && currentEmp && selectedPeriodId) },
  );
  const detailed = detailedPayslipQuery.data;
  const calculation = detailed?.calculation ?? (currentEmp ? calculations.get(currentEmp.id) : null);
  const employee = detailed ? {
    id: String(detailed.employee.id),
    fullName: detailed.employee.fullName,
    position: detailed.position?.name ?? currentEmp?.position ?? 'Не указана',
    department: detailed.department?.name ?? currentEmp?.department ?? 'Не указано',
    iin: detailed.employee.iin,
    bankName: detailed.employee.bankName ?? currentEmp?.bankName ?? '',
    iban: detailed.employee.iban ?? currentEmp?.iban ?? '',
    applyStandardDeduction: detailed.calculation.standardDeduction > 0,
  } : currentEmp;

  const download = async () => {
    if (!currentEmp || !selectedPeriodId) return toast.error('Выберите период и сотрудника.');
    try {
      const result = await utils.payroll.reports.exportPayslip.fetch({ employeeId: Number(currentEmp.id), payrollPeriodId: selectedPeriodId, format: 'xlsx' });
      const bytes = Uint8Array.from(atob(result.base64), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось экспортировать листок.');
    }
  };

  if (!isOpen) return null;
  const manualAccruals = detailed?.calculation.manualAccruals ?? 0;
  const taxableGross = detailed?.calculation.taxableGross ?? calculation?.gross ?? 0;

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
    <div className="relative w-full max-w-3xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
      <div className="px-6 py-4 border-b border-zinc-800 bg-[#121215] flex items-center justify-between no-print shrink-0">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30"><FileText className="w-5 h-5" /></div><div><h3 className="text-base font-bold text-[#fafafa]">Расчётный листок</h3><p className="text-xs text-zinc-400">Период: {selectedPeriod}</p></div></div>
        <div className="flex items-center gap-2"><select value={currentEmp?.id ?? ''} onChange={(event) => setCurrentEmpId(event.target.value)} className="bg-[#18181b] border border-zinc-700 text-xs text-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500">{employees.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select><button onClick={() => window.print()} className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-colors"><Printer className="w-4 h-4" /><span>Печать / PDF</span></button><button onClick={download} className="px-3 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-zinc-700"><Download className="w-4 h-4 text-blue-400" /><span className="hidden sm:inline">Excel</span></button><button onClick={onClose} className="p-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800"><X className="w-5 h-5" /></button></div>
      </div>
      <div className="p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 font-sans flex-1">
        {detailedPayslipQuery.isLoading ? <p className="text-sm text-slate-500">Загрузка листка…</p> : employee && calculation ? <div className="max-w-2xl mx-auto space-y-5 text-xs">
          <div className="border-b-2 border-slate-900 pb-4"><div className="flex justify-between items-start"><div><h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">{detailed?.company?.legalName || 'Реквизиты работодателя не заполнены'}</h2><p className="text-[11px] text-slate-600">БИН: {detailed?.company?.bin || 'не заполнен'} · {detailed?.company?.address || 'адрес не заполнен'}</p></div><div className="text-right"><span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded border border-slate-300">РАСЧЁТНЫЙ ЛИСТОК</span><p className="text-[11px] text-slate-600 mt-1 font-semibold">за {selectedPeriod}</p></div></div></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs"><div><span className="text-slate-500">ФИО сотрудника: </span><span className="font-bold text-slate-900">{employee.fullName}</span></div><div><span className="text-slate-500">Табельный №: </span><span className="font-mono text-slate-900 font-semibold">{employee.id.toUpperCase()}</span></div><div><span className="text-slate-500">Должность: </span><span className="font-medium text-slate-900">{employee.position}</span></div><div><span className="text-slate-500">ИИН: </span><span className="font-mono text-slate-900">{employee.iin}</span></div><div><span className="text-slate-500">Подразделение: </span><span className="text-slate-900">{employee.department}</span></div><div><span className="text-slate-500">Банк / IBAN: </span><span className="font-mono text-slate-900 text-[11px]">{employee.bankName} ({employee.iban ? `${employee.iban.slice(0, 10)}...` : 'не указан'})</span></div></div>
          <div className="grid grid-cols-2 gap-4"><div className="border border-slate-300 rounded-lg overflow-hidden"><div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-300 text-slate-800">1. НАЧИСЛЕНО</div><div className="p-3 space-y-2"><div className="flex justify-between"><span>Облагаемый доход:</span><span className="font-mono font-semibold">{formatKZT(taxableGross)}</span></div><div className="flex justify-between text-slate-600 text-[11px]"><span>Дополнительные начисления:</span><span>{formatKZT(manualAccruals)}</span></div>{detailed?.items.filter((item) => item.type.kind === 'accrual').map((item) => <div key={item.id} className="flex justify-between text-slate-600 text-[11px]"><span>{item.type.name}</span><span>{formatKZT(item.amount)}</span></div>)}<div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900"><span>Всего начислено:</span><span className="font-mono">{formatKZT(calculation.gross)}</span></div></div></div><div className="border border-slate-300 rounded-lg overflow-hidden"><div className="bg-slate-100 px-3 py-1.5 font-bold border-b border-slate-300 text-slate-800">2. УДЕРЖАНО</div><div className="p-3 space-y-1.5"><div className="flex justify-between"><span>ОПВ:</span><span className="font-mono text-slate-800">-{formatKZT(calculation.opv)}</span></div><div className="flex justify-between"><span>ВОСМС:</span><span className="font-mono text-slate-800">-{formatKZT(calculation.vosms)}</span></div><div className="flex justify-between"><span>ИПН:</span><span className="font-mono text-slate-800">-{formatKZT(calculation.ipn)}</span></div>{detailed?.items.filter((item) => item.type.kind === 'deduction').map((item) => <div key={item.id} className="flex justify-between text-slate-600 text-[11px]"><span>{item.type.name}</span><span>-{formatKZT(item.amount)}</span></div>)}<div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-rose-700"><span>Всего удержано:</span><span className="font-mono">-{formatKZT(calculation.totalWithheld)}</span></div></div></div></div>
          <div className="bg-teal-50 border border-teal-200 p-2.5 rounded-lg flex items-center justify-between text-[11px] text-teal-900"><span><strong>Налоговый вычет по ИПН:</strong> {employee.applyStandardDeduction ? 'Применён согласно карточке сотрудника и профилю ставок' : 'Не применялся'}</span><span className="font-mono font-bold">{formatKZT(calculation.standardDeduction)}</span></div>
          <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between"><div><span className="text-xs uppercase tracking-wider text-slate-300 font-semibold block">СУММА К ВЫПЛАТЕ НА РУКИ (NET):</span><span className="text-[11px] text-slate-400">Перечисление на счет {employee.bankName || 'не указан'}</span></div><span className="text-xl font-extrabold font-mono text-emerald-400">{formatKZT(calculation.netSalary)}</span></div>
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-[11px] text-slate-600"><div className="font-bold text-slate-800 mb-1">Справочно: налоги и отчисления работодателя</div><div className="grid grid-cols-4 gap-2 font-mono text-slate-700"><div>СО: <strong>{formatKZT(calculation.so)}</strong></div><div>ООСМС: <strong>{formatKZT(calculation.oosms)}</strong></div><div>СН: <strong>{formatKZT(calculation.sn)}</strong></div><div>ОПВР: <strong>{formatKZT(calculation.opvr)}</strong></div></div><div className="mt-1.5 pt-1.5 border-t border-slate-200 text-slate-800 flex justify-between"><span>Полная стоимость рабочего места для компании:</span><span className="font-mono font-bold text-slate-900">{formatKZT(calculation.totalCompanyCost)}</span></div></div>
          <div className="pt-6 grid grid-cols-2 gap-8 text-[11px] text-slate-700"><div className="border-t border-slate-400 pt-1">Бухгалтер: _________________ / ________________ /</div><div className="border-t border-slate-400 pt-1">С расчётом ознакомлен: _________________ / {employee.fullName} /</div></div>
        </div> : <div className="max-w-md mx-auto text-center py-14"><Building2 className="w-9 h-9 text-slate-400 mx-auto mb-3" /><p className="font-semibold">Расчётный листок пока не сформирован</p><p className="text-slate-500 mt-1">Создайте период, добавьте сотрудников и запустите расчёт ведомости.</p></div>}
      </div>
      <div className="px-6 py-3 border-t border-zinc-800 bg-[#121215] flex items-center justify-between text-xs text-zinc-400 no-print shrink-0"><span>Сформировано по данным расчётного периода</span><button onClick={onClose} className="px-4 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-xl transition-colors border border-zinc-800">Закрыть</button></div>
    </div>
  </div>;
};
