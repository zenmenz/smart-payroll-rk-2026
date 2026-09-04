import React, { useState } from 'react';
import { 
  Info, 
  ChevronRight, 
  HelpCircle, 
  Edit3, 
  Archive, 
  RotateCcw, 
  FileText, 
  Sparkles,
  ArrowUpDown,
  Trash2,
} from 'lucide-react';
import { Employee, TaxBreakdown, SalaryViewType, EmployeeStatus } from '../types/payroll';
import { formatKZT, formatNumber, getStandardDeductionSummary } from '../utils/kazakhstanTaxCalculator';

interface DesktopPayrollTableProps {
  employees: Employee[];
  calculations: Map<string, TaxBreakdown>;
  salaryViewType: SalaryViewType;
  deductionSummary?: ReturnType<typeof getStandardDeductionSummary>;
  onSelectEmployeeForDetails: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onToggleArchive: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
  onOpenSinglePayslip: (emp: Employee) => void;
}

type SortField = 'fullName' | 'position' | 'gross' | 'net' | 'totalWithheld' | 'companyCost' | 'status';

export const DesktopPayrollTable: React.FC<DesktopPayrollTableProps> = ({
  employees,
  calculations,
  salaryViewType,
  deductionSummary = getStandardDeductionSummary(),
  onSelectEmployeeForDetails,
  onEditEmployee,
  onToggleArchive,
  onDeleteEmployee,
  onOpenSinglePayslip,
}) => {
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    const calcA = calculations.get(a.id);
    const calcB = calculations.get(b.id);

    let valA: any = a.fullName;
    let valB: any = b.fullName;

    if (sortField === 'fullName') {
      valA = a.fullName;
      valB = b.fullName;
    } else if (sortField === 'position') {
      valA = a.position;
      valB = b.position;
    } else if (sortField === 'gross') {
      valA = calcA?.gross || 0;
      valB = calcB?.gross || 0;
    } else if (sortField === 'net') {
      valA = calcA?.netSalary || 0;
      valB = calcB?.netSalary || 0;
    } else if (sortField === 'totalWithheld') {
      valA = calcA?.totalWithheld || 0;
      valB = calcB?.totalWithheld || 0;
    } else if (sortField === 'companyCost') {
      valA = calcA?.totalCompanyCost || 0;
      valB = calcB?.totalCompanyCost || 0;
    } else if (sortField === 'status') {
      valA = a.status;
      valB = b.status;
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Активен</span>;
      case 'new':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Новый</span>;
      case 'vacation':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">В отпуске</span>;
      case 'sick':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Больничный</span>;
      case 'quitting':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Увольняется</span>;
      case 'archived':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30">В архиве</span>;
    }
  };

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
      {/* Table Subheader hint */}
      <div className="px-4 py-2.5 bg-[#121215] border-b border-zinc-800/80 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Нажмите на любую сумму или строку для открытия пошагового объяснения «Почему эта сумма?»</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Удержания с работника (ОПВ, ВОСМС, ИПН)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span> За счет работодателя
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Table with Sticky First Column */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#121215] border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider select-none">
              {/* Sticky Column: Employee */}
              <th 
                onClick={() => handleSort('fullName')}
                className="sticky left-0 z-20 bg-[#121215] px-4 py-3.5 min-w-[220px] cursor-pointer hover:text-white transition-colors border-r border-zinc-800"
              >
                <div className="flex items-center gap-1.5">
                  <span>Сотрудник</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>

              {/* Position */}
              <th 
                onClick={() => handleSort('position')}
                className="px-3 py-3.5 min-w-[160px] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Должность</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>

              {/* Accrued (Gross) */}
              <th 
                onClick={() => handleSort('gross')}
                className="px-3 py-3.5 text-right min-w-[130px] cursor-pointer hover:text-emerald-400 transition-colors bg-emerald-950/10"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Начислено</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>

              {/* OPV (10%) */}
              <th className="px-3 py-3.5 text-right min-w-[100px] text-zinc-400 group">
                <div className="flex items-center justify-end gap-1" title="Обязательные пенсионные взносы (10%, макс 50 МЗП)">
                  <span>ОПВ (10%)</span>
                  <HelpCircle className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                </div>
              </th>

              {/* VOSMS (2%) */}
              <th className="px-3 py-3.5 text-right min-w-[100px] text-zinc-400 group">
                <div className="flex items-center justify-end gap-1" title="Взносы на обязательное медстрахование (2%, макс 10 МЗП)">
                  <span>ВОСМС (2%)</span>
                  <HelpCircle className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                </div>
              </th>

              {/* IPN */}
              <th className="px-3 py-3.5 text-right min-w-[125px] text-zinc-400 group">
                <div className="flex items-center justify-end gap-1" title={`Индивидуальный подоходный налог (10% с вычетом ${deductionSummary.fullLabel})`}>
                  <span>ИПН (10%)</span>
                  <HelpCircle className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
                </div>
              </th>

              {/* Total Withheld */}
              <th 
                onClick={() => handleSort('totalWithheld')}
                className="px-3 py-3.5 text-right min-w-[115px] cursor-pointer hover:text-amber-400 transition-colors text-amber-400/90 font-bold"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Удержано</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>

              {/* On Hand (Net) */}
              <th 
                onClick={() => handleSort('net')}
                className="px-4 py-3.5 text-right min-w-[140px] cursor-pointer hover:text-emerald-400 transition-colors bg-emerald-950/20 text-emerald-400 font-extrabold border-l border-r border-zinc-800"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>На руки</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>

              {/* Cost for Company */}
              <th 
                onClick={() => handleSort('companyCost')}
                className="px-3 py-3.5 text-right min-w-[140px] cursor-pointer hover:text-purple-300 transition-colors text-purple-300 font-bold"
              >
                <div className="flex items-center justify-end gap-1.5" title="Gross + СО (3.5%) + ООСМС (3%) + СН + ОПВР (2%)">
                  <span>Затраты фирмы</span>
                  <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                </div>
              </th>

              {/* Status */}
              <th 
                onClick={() => handleSort('status')}
                className="px-3 py-3.5 text-center min-w-[100px] cursor-pointer hover:text-white transition-colors"
              >
                <span>Статус</span>
              </th>

              {/* Actions */}
              <th className="px-3 py-3.5 text-right min-w-[90px]">
                <span>Действия</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800/80">
            {sortedEmployees.map((emp) => {
              const calc = calculations.get(emp.id);
              const isArchived = emp.status === 'archived';
              const amount = (value: number | undefined) => (calc ? formatKZT(value ?? 0) : '—');

              return (
                <tr
                  key={emp.id}
                  className={`group hover:bg-[#202024]/60 transition-colors ${
                    isArchived ? 'opacity-60 bg-[#09090b]/40' : ''
                  }`}
                >
                  {/* Sticky Column: Employee name, IIN, Avatar */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`sticky left-0 z-10 bg-[#18181b] group-hover:bg-[#202024] transition-colors px-4 py-3 border-r border-zinc-800 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${emp.avatarColor || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0`}>
                        {emp.fullName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate flex items-center gap-1.5">
                          {emp.fullName}
                          {emp.applyStandardDeduction && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-normal border border-emerald-500/30" title={`Применен стандартный вычет ${deductionSummary.fullLabel}`}>
                              {deductionSummary.shortLabel}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono-num truncate flex items-center gap-1">
                          ИИН: {emp.iin} · <span className="text-zinc-500">{emp.bankName}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Position & Department */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-3 py-3 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    <p className="font-medium text-zinc-200 truncate">{emp.position}</p>
                    <p className="text-[11px] text-zinc-400">{emp.department}</p>
                  </td>

                  {/* Accrued (Gross) */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-3 py-3 text-right font-mono-num font-bold text-zinc-100 bg-emerald-950/5 group-hover:bg-emerald-950/20 transition-colors ${calc ? 'cursor-pointer' : ''}`}
                  >
                    {amount(calc?.gross)}
                  </td>

                  {/* OPV */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-3 py-3 text-right font-mono-num text-zinc-300 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    {amount(calc?.opv)}
                  </td>

                  {/* VOSMS */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-3 py-3 text-right font-mono-num text-zinc-300 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    {amount(calc?.vosms)}
                  </td>

                  {/* IPN */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-3 py-3 text-right font-mono-num text-zinc-300 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    <div>{amount(calc?.ipn)}</div>
                    {calc && emp.applyStandardDeduction && (
                      <span className="text-[9px] text-emerald-400 font-sans">
                        с вычетом
                      </span>
                    )}
                  </td>

                  {/* Total Withheld */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-3 py-3 text-right font-mono-num font-semibold text-amber-300 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    {amount(calc?.totalWithheld)}
                  </td>

                  {/* On Hand (Net) */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-4 py-3 text-right font-mono-num font-extrabold text-sm text-emerald-400 bg-emerald-950/10 group-hover:bg-emerald-950/30 transition-colors border-l border-r border-zinc-800 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    {amount(calc?.netSalary)}
                  </td>

                  {/* Total Company Cost */}
                  <td 
                    onClick={() => calc && onSelectEmployeeForDetails(emp)}
                    className={`px-3 py-3 text-right font-mono-num font-semibold text-purple-300 ${calc ? 'cursor-pointer' : ''}`}
                  >
                    <div>{amount(calc?.totalCompanyCost)}</div>
                    {calc && (
                      <span className="text-[10px] text-purple-400/80 font-sans">
                        +{formatKZT(calc.totalEmployerContributions)}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3 text-center">
                    {getStatusBadge(emp.status)}
                  </td>

                  {/* Quick Action buttons */}
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => calc && onSelectEmployeeForDetails(emp)}
                        disabled={!calc}
                        className="p-1.5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={calc ? 'Подробный расчет налогов' : 'Сначала выполните расчёт периода'}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => calc && onOpenSinglePayslip(emp)}
                        disabled={!calc}
                        className="p-1.5 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-300 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={calc ? 'Расчетный листок' : 'Сначала выполните расчёт периода'}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEditEmployee(emp)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                        title="Редактировать сотрудника"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleArchive(emp)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isArchived 
                            ? 'hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400' 
                            : 'hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300'
                        }`}
                        title={isArchived ? 'Восстановить из архива' : 'Уволить / В архив'}
                      >
                        {isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => onDeleteEmployee(emp)}
                        className="p-1.5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
                        title="Удалить сотрудника"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Totals row */}
      <div className="px-4 py-3 bg-[#121215] border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
        <div className="text-zinc-400">
          Итого по ведомости ({sortedEmployees.length} специалистов):
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono-num">
          <div>
            <span className="text-zinc-400 font-normal">ФОТ: </span>
            <span className="text-zinc-100">
              {formatKZT(sortedEmployees.reduce((sum, e) => sum + (calculations.get(e.id)?.gross || 0), 0))}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 font-normal">Всего удержано: </span>
            <span className="text-amber-400">
              {formatKZT(sortedEmployees.reduce((sum, e) => sum + (calculations.get(e.id)?.totalWithheld || 0), 0))}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 font-normal">К выплате на руки: </span>
            <span className="text-emerald-400 text-sm font-extrabold">
              {formatKZT(sortedEmployees.reduce((sum, e) => sum + (calculations.get(e.id)?.netSalary || 0), 0))}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 font-normal">Полные затраты фирмы: </span>
            <span className="text-purple-300">
              {formatKZT(sortedEmployees.reduce((sum, e) => sum + (calculations.get(e.id)?.totalCompanyCost || 0), 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
