import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Info, 
  FileText, 
  Edit3, 
  Archive, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  Building,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { Employee, TaxBreakdown, SalaryViewType, EmployeeStatus } from '../types/payroll';
import { formatKZT, formatNumber, getStandardDeductionSummary } from '../utils/kazakhstanTaxCalculator';

interface MobilePayrollCardsProps {
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

export const MobilePayrollCards: React.FC<MobilePayrollCardsProps> = ({
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
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Активен</span>;
      case 'new':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Новый</span>;
      case 'vacation':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">В отпуске</span>;
      case 'sick':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Больничный</span>;
      case 'quitting':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Увольняется</span>;
      case 'archived':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/50 text-slate-400 border border-slate-600/30">В архиве</span>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Mobile view subheader */}
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium text-zinc-300">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Мобильные карточки сотрудников ({employees.length})
        </span>
        <span className="text-[11px] text-zinc-400">
          Нажмите на карточку для раскрытия
        </span>
      </div>

      {/* List of Mobile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {employees.map((emp) => {
          const calc = calculations.get(emp.id);
          if (!calc) return null;

          const isExpanded = !!expandedCards[emp.id];
          const isArchived = emp.status === 'archived';

          return (
            <div
              key={emp.id}
              className={`bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all ${
                isArchived ? 'opacity-60 border-zinc-800/50' : 'hover:border-zinc-700'
              }`}
            >
              {/* Card Header (Always visible) */}
              <div 
                onClick={() => onSelectEmployeeForDetails(emp)}
                className="p-4 cursor-pointer hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${emp.avatarColor || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}>
                      {emp.fullName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#fafafa] flex items-center gap-1.5">
                        {emp.fullName}
                      </h4>
                      <p className="text-xs text-zinc-400">{emp.position}</p>
                      <p className="text-[11px] text-zinc-500">{emp.department}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getStatusBadge(emp.status)}
                    {emp.applyStandardDeduction && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        Вычет {deductionSummary.shortLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Main 3 Numbers: Accrued -> Net -> Company Cost */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#121215] border border-zinc-800 text-center font-mono-num mb-2">
                  <div className="text-left pl-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-sans block">Начислено</span>
                    <span className="text-xs font-bold text-zinc-200">{formatKZT(calc.gross)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-sans block">Удержано</span>
                    <span className="text-xs font-bold text-amber-300">-{formatKZT(calc.totalWithheld)}</span>
                  </div>
                  <div className="text-right pr-1">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-sans block">На руки</span>
                    <span className="text-xs font-extrabold text-emerald-400">{formatKZT(calc.netSalary)}</span>
                  </div>
                </div>

                {/* Bottom Card Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-zinc-400">
                    Затраты фирмы: <span className="font-mono-num font-semibold text-purple-300">{formatKZT(calc.totalCompanyCost)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => toggleExpand(emp.id, e)}
                      className="px-2.5 py-1 bg-[#121215] hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors border border-zinc-800"
                    >
                      <span>{isExpanded ? 'Скрыть' : 'Налоги'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEmployeeForDetails(emp);
                      }}
                      className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Подробнее</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable detailed tax breakdown */}
              {isExpanded && (
                <div className="border-t border-zinc-800 bg-[#121215] p-3.5 space-y-3 text-xs">
                  {/* Employee Taxes Section */}
                  <div>
                    <h5 className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Удержания с работника:</span>
                      <span className="font-mono-num text-amber-400">Всего: {formatKZT(calc.totalWithheld)}</span>
                    </h5>
                    <div className="space-y-1.5 bg-[#18181b] p-2.5 rounded-xl border border-zinc-800 font-mono-num">
                      <div className="flex justify-between text-zinc-300">
                        <span className="text-zinc-400 font-sans">ОПВ (10% пенсионные):</span>
                        <span>{formatKZT(calc.opv)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span className="text-zinc-400 font-sans">ВОСМС (2% медстрах):</span>
                        <span>{formatKZT(calc.vosms)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span className="text-zinc-400 font-sans flex items-center gap-1">
                          ИПН (10% подоходный):
                          {emp.applyStandardDeduction && (
                            <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded font-sans">
                              Вычет {deductionSummary.fullLabel}
                            </span>
                          )}
                        </span>
                        <span>{formatKZT(calc.ipn)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Employer Contributions Section */}
                  <div>
                    <h5 className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Налоги работодателя (сверх оклада):</span>
                      <span className="font-mono-num text-purple-300">+{formatKZT(calc.totalEmployerContributions)}</span>
                    </h5>
                    <div className="space-y-1.5 bg-[#18181b] p-2.5 rounded-xl border border-zinc-800 font-mono-num">
                      <div className="flex justify-between text-zinc-300">
                        <span className="text-zinc-400 font-sans">СО (3.5% соц. отчисления):</span>
                        <span>{formatKZT(calc.so)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span className="text-zinc-400 font-sans">ООСМС (3% медстрах компании):</span>
                        <span>{formatKZT(calc.oosms)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span className="text-zinc-400 font-sans">СН (Социальный налог 9.5%-СО):</span>
                        <span>{formatKZT(calc.sn)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span className="text-zinc-400 font-sans">ОПВР (2.0% пенсионные фирмы):</span>
                        <span>{formatKZT(calc.opvr)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank & Identification */}
                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono-num">ИИН: {emp.iin}</span>
                    <span className="font-mono-num truncate">{emp.bankName} · {emp.iban.slice(0, 8)}...</span>
                  </div>

                  {/* Mobile Quick Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => onOpenSinglePayslip(emp)}
                      className="px-2.5 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-800"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Листок</span>
                    </button>
                    <button
                      onClick={() => onEditEmployee(emp)}
                      className="px-2.5 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-800"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Изменить</span>
                    </button>
                    <button
                      onClick={() => onToggleArchive(emp)}
                      className="px-2.5 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-800"
                    >
                      {isArchived ? <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> : <Archive className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{isArchived ? 'Восстановить' : 'В архив'}</span>
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(emp)}
                      className="px-2.5 py-1.5 bg-[#18181b] hover:bg-rose-500/20 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-800 hover:border-rose-500/40"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Удалить</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
