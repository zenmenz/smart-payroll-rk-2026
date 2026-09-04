import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Receipt, 
  Wallet, 
  FileText, 
  ShieldCheck, 
  BookOpen
} from 'lucide-react';
import { Employee, TaxBreakdown } from '../types/payroll';
import type { PayrollTaxProfile } from '@shared/payrollEngine';
import { 
  formatKZT, 
  getDetailedExplanations, 
  getStandardDeductionSummary,
} from '../utils/kazakhstanTaxCalculator';

interface SalaryDetailModalProps {
  employee: Employee | null;
  calculation: TaxBreakdown | null;
  deductionSummary?: ReturnType<typeof getStandardDeductionSummary>;
  taxProfile?: PayrollTaxProfile | null;
  onClose: () => void;
  onOpenPayslip: (emp: Employee) => void;
}

export const SalaryDetailModal: React.FC<SalaryDetailModalProps> = ({
  employee,
  calculation,
  deductionSummary = getStandardDeductionSummary(),
  taxProfile = null,
  onClose,
  onOpenPayslip,
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'why'>('steps');

  if (!employee || !calculation) return null;

  const explanations = getDetailedExplanations(calculation, employee, taxProfile);
  const mzp = taxProfile?.minimumWage ?? 0;
  const opvCap = taxProfile ? formatKZT(mzp * taxProfile.opvMaxBaseMinimumWages) : 'по профилю';
  const vosmsCap = taxProfile ? formatKZT(mzp * taxProfile.vosmsMaxBaseMinimumWages) : 'по профилю';
  const opvRateLabel = taxProfile ? `${(taxProfile.opvRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const vosmsRateLabel = taxProfile ? `${(taxProfile.vosmsRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const ipnRateLabel = taxProfile ? `${(taxProfile.ipnBaseRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const soRateLabel = taxProfile ? `${(taxProfile.soRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const oosmsRateLabel = taxProfile ? `${(taxProfile.oosmsRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const snRateLabel = taxProfile ? `${(taxProfile.snRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const opvrRateLabel = taxProfile ? `${(taxProfile.opvrRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const soMinLabel = taxProfile ? `${taxProfile.soMinBaseMinimumWages}–${taxProfile.soMaxBaseMinimumWages} МЗП` : 'по профилю';
  const oosmsMaxLabel = taxProfile ? `${taxProfile.oosmsMaxBaseMinimumWages} МЗП` : 'по профилю';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-[#121215] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${employee.avatarColor || 'from-emerald-600 to-teal-700'} flex items-center justify-center text-white font-extrabold text-base shadow-md`}>
              {employee.fullName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#fafafa]">{employee.fullName}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  {employee.position}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono-num">
                ИИН: {employee.iin} · {employee.bankName} · {employee.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPayslip(employee)}
              className="px-3 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Печать расчетного листка</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Core Big KPI Banner ("A Payroll that explains itself") */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-6 bg-[#121215] border-b border-zinc-800 shrink-0">
          {/* 1. Gross */}
          <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl">
            <div className="text-xs text-zinc-400 font-medium mb-1">1. Начислено по договору (Gross)</div>
            <div className="text-2xl font-extrabold text-zinc-100 font-mono-num">
              {formatKZT(calculation.gross)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Оклад за полный отработанный месяц
            </div>
          </div>

          {/* 2. Net on Hand */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
            <div className="text-xs text-emerald-300 font-medium mb-1">2. Получает на руки (Net)</div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono-num">
              {formatKZT(calculation.netSalary)}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1">
              Удержано налогов: -{formatKZT(calculation.totalWithheld)} ({((calculation.totalWithheld / (calculation.gross || 1)) * 100).toFixed(1)}%)
            </div>
          </div>

          {/* 3. Total Company Cost */}
          <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl">
            <div className="text-xs text-purple-300 font-medium mb-1">3. Полная стоимость для компании</div>
            <div className="text-2xl font-extrabold text-purple-300 font-mono-num">
              {formatKZT(calculation.totalCompanyCost)}
            </div>
            <div className="text-[11px] text-purple-300/80 mt-1">
              Налоги фирмы: +{formatKZT(calculation.totalEmployerContributions)} ({((calculation.totalEmployerContributions / (calculation.gross || 1)) * 100).toFixed(1)}%)
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-[#121215] px-6 gap-4 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'steps'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Пошаговый расчет налогов</span>
          </button>

          <button
            onClick={() => setActiveTab('why')}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'why'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Почему эта сумма? (Пояснение статей)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#18181b]">
          {/* TAB 1: STEP-BY-STEP CALCULATION */}
          {activeTab === 'steps' && (
            <div className="space-y-6">
              {/* Block 1: Employee Withholdings Step-by-Step Flow */}
              <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">A</span>
                  Расчет удержаний с работника (от Начислено до На руки)
                </h4>

                <div className="space-y-3 font-mono-num text-xs">
                  {/* Step 1: Gross */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="font-sans">
                      <span className="font-bold text-zinc-200">1. Начислено (Gross оклад):</span>
                      <p className="text-zinc-400 text-[11px]">Исходный доход работника за месяц</p>
                    </div>
                    <span className="text-base font-bold text-zinc-100">{formatKZT(calculation.gross)}</span>
                  </div>

                  {/* Step 2: OPV */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="font-sans">
                      <span className="font-bold text-zinc-200">2. ОПВ ({opvRateLabel}):</span>
                      <p className="text-zinc-400 text-[11px]">{formatKZT(calculation.gross)} × {opvRateLabel} (предел = {opvCap})</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">-{formatKZT(calculation.opv)}</span>
                  </div>

                  {/* Step 3: VOSMS */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="font-sans">
                      <span className="font-bold text-zinc-200">3. ВОСМС ({vosmsRateLabel}):</span>
                      <p className="text-zinc-400 text-[11px]">{formatKZT(calculation.gross)} × {vosmsRateLabel} (предел = {vosmsCap})</p>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">-{formatKZT(calculation.vosms)}</span>
                  </div>

                  {/* Step 4: Tax Deductions */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <div className="font-sans">
                      <span className="font-bold text-emerald-300">4. Стандартный налоговый вычет ({deductionSummary.shortLabel}):</span>
                      <p className="text-emerald-400/80 text-[11px]">
                        {employee.applyStandardDeduction
                          ? `${deductionSummary.shortLabel} = ${formatKZT(calculation.standardDeduction || deductionSummary.amount)} (уменьшает облагаемую базу ИПН, не является удержанием)`
                          : 'Вычет не применен (нет заявления)'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-300 font-sans">
                      {employee.applyStandardDeduction ? `-${formatKZT(calculation.standardDeduction)} (льгота)` : '0 ₸'}
                    </span>
                  </div>

                  {/* Step 5: IPN Base & IPN Calculation */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="font-sans">
                      <span className="font-bold text-zinc-200">5. База для ИПН и налог ИПН ({ipnRateLabel}):</span>
                      <p className="text-zinc-400 text-[11px]">
                        База = {formatKZT(calculation.gross)} - {formatKZT(calculation.opv)} - {formatKZT(calculation.vosms)} - {formatKZT(calculation.standardDeduction)} = <span className="text-zinc-200 font-semibold">{formatKZT(calculation.ipnBase)}</span>
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-amber-400">-{formatKZT(calculation.ipn)}</span>
                  </div>

                  {/* Result Net */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
                    <div className="font-sans">
                      <span className="text-sm font-extrabold text-emerald-300">6. Итого на руки сотруднику (Net):</span>
                      <p className="text-emerald-400/80 text-[11px]">
                        {formatKZT(calculation.gross)} - {formatKZT(calculation.totalWithheld)} (Всего удержано)
                      </p>
                    </div>
                    <span className="text-xl font-extrabold text-emerald-400">{formatKZT(calculation.netSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Block 2: Employer Costs & Mandatory Contributions */}
              <div className="bg-[#121215] border border-purple-500/30 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-purple-200 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">B</span>
                    Платежи и налоги работодателя (за счет компании сверх оклада)
                  </div>
                  <span className="text-xs font-mono-num text-purple-300 font-semibold">
                    Итого: +{formatKZT(calculation.totalEmployerContributions)}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-num">
                  {/* SO */}
                  <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="flex justify-between font-sans mb-1">
                      <span className="font-bold text-zinc-200">СО ({soRateLabel}):</span>
                      <span className="font-mono-num text-purple-300 font-bold">{formatKZT(calculation.so)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      База: {formatKZT(calculation.soBase)} (пределы {soMinLabel})
                    </p>
                  </div>

                  {/* OOSMS */}
                  <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="flex justify-between font-sans mb-1">
                      <span className="font-bold text-zinc-200">ООСМС ({oosmsRateLabel}):</span>
                      <span className="font-mono-num text-purple-300 font-bold">{formatKZT(calculation.oosms)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Отчисления в медстрах за счёт фирмы (макс {oosmsMaxLabel})
                    </p>
                  </div>

                  {/* SN */}
                  <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="flex justify-between font-sans mb-1">
                      <span className="font-bold text-zinc-200">СН ({snRateLabel}):</span>
                      <span className="font-mono-num text-purple-300 font-bold">{formatKZT(calculation.sn)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      База {formatKZT(calculation.snBase)} по ставке профиля минус СО ({formatKZT(calculation.so)})
                    </p>
                  </div>

                  {/* OPVR */}
                  <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800">
                    <div className="flex justify-between font-sans mb-1">
                      <span className="font-bold text-zinc-200">ОПВР ({opvrRateLabel}):</span>
                      <span className="font-mono-num text-purple-300 font-bold">{formatKZT(calculation.opvr)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Пенсионные взносы работодателя в ЕНПФ
                    </p>
                  </div>
                </div>

                {/* Total Company Cost Banner */}
                <div className="mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-purple-200">Полная себестоимость сотрудника:</span>
                    <p className="text-[11px] text-purple-300/80">Оклад ({formatKZT(calculation.gross)}) + Налоги фирмы ({formatKZT(calculation.totalEmployerContributions)})</p>
                  </div>
                  <span className="text-xl font-extrabold text-purple-300 font-mono-num">
                    {formatKZT(calculation.totalCompanyCost)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: "ПОЧЕМУ ЭТА СУММА?" EXPLANATIONS */}
          {activeTab === 'why' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-xs text-zinc-300 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Здесь простым языком без сложной бухгалтерской терминологии объясняется назначение каждого налога, кто его оплачивает и на основании какой статьи закона РК он рассчитывается.
                </span>
              </div>

              <div className="space-y-3">
                {explanations.map((exp) => {
                  const isEmployee = exp.payer === 'employee';

                  return (
                    <div
                      key={exp.shortName}
                      className="bg-[#121215] border border-zinc-800 rounded-2xl p-4.5 space-y-2 hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border ${
                            isEmployee 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          }`}>
                            {exp.shortName} ({exp.rate})
                          </span>
                          <h5 className="text-sm font-bold text-zinc-100">{exp.name}</h5>
                        </div>

                        <div className="text-sm font-extrabold font-mono-num text-zinc-100">
                          {formatKZT(exp.amount)}
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {exp.simpleExplanation}
                      </p>

                      <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between text-[11px] text-zinc-400 gap-2">
                        <span>База: <span className="font-mono-num text-zinc-300">{exp.basisDescription}</span></span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {exp.lawReference}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#121215] flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Расчёт по профилю ставок выбранного периода</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-xl font-medium transition-colors border border-zinc-800"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
