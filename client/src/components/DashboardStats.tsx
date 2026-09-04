import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  Building2, 
  Receipt, 
  CalendarClock, 
  ShieldAlert, 
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { Employee, TaxBreakdown } from '../types/payroll';
import { formatKZT, formatNumber } from '../utils/kazakhstanTaxCalculator';
import { monthOverMonthGrowthPercent } from '@shared/payrollPeriod';

export type DashboardHistoryPoint = {
  periodId: number;
  periodKey: string;
  year: number;
  month: number;
  gross: number;
  net: number;
  employerTaxes: number;
  calcCount: number;
};

interface DashboardStatsProps {
  employees: Employee[];
  calculations: Map<string, TaxBreakdown>;
  selectedPeriod: string;
  selectedPeriodKey: string;
  history: DashboardHistoryPoint[];
  onSelectPeriod: (periodKey: string) => void;
  onOpenAudit: () => void;
  auditIssuesCount: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  employees,
  calculations,
  selectedPeriod,
  selectedPeriodKey,
  history,
  onSelectPeriod,
  onOpenAudit,
  auditIssuesCount,
}) => {
  const [selectedChartMetric, setSelectedChartMetric] = useState<'gross' | 'net' | 'taxes'>('gross');

  // Calculate aggregations for active/non-archived employees
  const activeEmployees = employees.filter((e) => e.status !== 'archived');
  
  let totalGross = 0;
  let totalNet = 0;
  let totalEmployeeDeductions = 0; // ОПВ + ВОСМС + ИПН
  let totalOpv = 0;
  let totalVosms = 0;
  let totalIpn = 0;
  
  let totalEmployerContributions = 0; // СО + ООСМС + СН + ОПВР
  let totalSo = 0;
  let totalOosms = 0;
  let totalSn = 0;
  let totalOpvr = 0;
  let totalCompanyCost = 0;

  activeEmployees.forEach((emp) => {
    const calc = calculations.get(emp.id);
    if (calc) {
      totalGross += calc.gross;
      totalNet += calc.netSalary;
      totalEmployeeDeductions += calc.totalWithheld;
      totalOpv += calc.opv;
      totalVosms += calc.vosms;
      totalIpn += calc.ipn;
      
      totalEmployerContributions += calc.totalEmployerContributions;
      totalSo += calc.so;
      totalOosms += calc.oosms;
      totalSn += calc.sn;
      totalOpvr += calc.opvr;
      totalCompanyCost += calc.totalCompanyCost;
    }
  });

  const avgSalary = activeEmployees.length > 0 ? Math.round(totalGross / activeEmployees.length) : 0;
  const avgNetSalary = activeEmployees.length > 0 ? Math.round(totalNet / activeEmployees.length) : 0;

  const chartData = history.length
    ? history.map((item) => ({
        month: new Date(item.year, item.month - 1, 1).toLocaleDateString('ru-RU', { month: 'short' }),
        periodKey: item.periodKey,
        totalGross: item.gross,
        totalNet: item.net,
        totalEmployerTaxes: item.employerTaxes,
        employeeCount: item.calcCount,
      }))
    : [{
        month: selectedPeriod,
        periodKey: selectedPeriodKey,
        totalGross,
        totalNet,
        totalEmployerTaxes: totalEmployerContributions,
        employeeCount: activeEmployees.length,
      }];

  const metricValue = (item: (typeof chartData)[number]) => {
    if (selectedChartMetric === 'net') return item.totalNet;
    if (selectedChartMetric === 'taxes') return item.totalEmployerTaxes;
    return item.totalGross;
  };
  const maxVal = Math.max(...chartData.map(metricValue), 1);
  const growth = monthOverMonthGrowthPercent(history.map((item) => item.gross));

  return (
    <div className="space-y-4 mb-6">
      {/* Top 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: ФОТ (Фонд оплаты труда) */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4.5 relative overflow-hidden backdrop-blur-sm shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">ФОТ (Начислено)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-[#fafafa] mb-1">
            {formatKZT(totalGross)}
          </div>
          <div className="text-xs text-zinc-400">
            Текущий период: {selectedPeriod}
          </div>
        </div>

        {/* KPI 2: К выплате сотрудникам (На руки / Net) */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4.5 relative overflow-hidden backdrop-blur-sm shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">К выплате на руки</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-emerald-400 mb-1">
            {formatKZT(totalNet)}
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>В среднем: <span className="font-mono-num font-medium text-zinc-300">{formatKZT(avgNetSalary)}</span></span>
            <span className="text-zinc-500">({activeEmployees.length} сотр.)</span>
          </div>
        </div>

        {/* KPI 3: Удержания с сотрудников (ОПВ + ВОСМС + ИПН) */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4.5 relative overflow-hidden backdrop-blur-sm shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Всего удержано</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-amber-300 mb-1">
            {formatKZT(totalEmployeeDeductions)}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono-num">
            <span>ОПВ: {formatNumber(totalOpv)}</span>
            <span>·</span>
            <span>ИПН: {formatNumber(totalIpn)}</span>
            <span>·</span>
            <span>ВОСМС: {formatNumber(totalVosms)}</span>
          </div>
        </div>

        {/* KPI 4: Затраты компании (Gross + Налоги компании) */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4.5 relative overflow-hidden backdrop-blur-sm shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Полные затраты фирмы</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-purple-300 mb-1">
            {formatKZT(totalCompanyCost)}
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Налоги фирмы: <span className="font-mono-num text-purple-200 font-medium">{formatKZT(totalEmployerContributions)}</span></span>
            <span className="text-zinc-500">(СО+СН+ОСМС+ОПВР)</span>
          </div>
        </div>
      </div>

      {/* Middle Analytical Row: Summary breakdown + 6-month Dynamics chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Quick Operational Cards (4 cols) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {/* Next Payout & Schedule */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Следующая выплата зарплаты</p>
                <p className="text-sm font-bold text-zinc-100">10 сентября 2026</p>
                <p className="text-xs text-zinc-500">До срока уплаты налогов (25 число)</p>
              </div>
            </div>
          </div>

          {/* Average Salary & Headcount */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Штат и средний оклад</p>
                <p className="text-sm font-bold text-zinc-100 font-mono-num">{formatKZT(avgSalary)} / сотр.</p>
                <p className="text-xs text-zinc-500">{activeEmployees.length} активных специалистов</p>
              </div>
            </div>
          </div>

          {/* Smart Auditor Status */}
          <div 
            onClick={onOpenAudit}
            className={`border rounded-2xl p-4 cursor-pointer transition-all ${
              auditIssuesCount > 0 
                ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70' 
                : 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  auditIssuesCount > 0 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-300">Интеллектуальная проверка</p>
                  <p className="text-sm font-bold text-zinc-100">
                    {auditIssuesCount > 0 ? `${auditIssuesCount} замечаний требуют внимания` : 'Все расчеты проверены корректно'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Right: Dynamics Chart for 6 months (8 cols) */}
        <div className="lg:col-span-8 bg-[#18181b] border border-zinc-800 rounded-2xl p-4.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#fafafa] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Динамика зарплатного фонда
              </h3>
              <p className="text-xs text-zinc-400">Все расчётные периоды. Нажмите столбец, чтобы открыть месяц</p>
            </div>
            
            <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setSelectedChartMetric('gross')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedChartMetric === 'gross' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                ФОТ (Gross)
              </button>
              <button
                onClick={() => setSelectedChartMetric('net')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedChartMetric === 'net' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                На руки (Net)
              </button>
              <button
                onClick={() => setSelectedChartMetric('taxes')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedChartMetric === 'taxes' ? 'bg-purple-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Налоги фирмы
              </button>
            </div>
          </div>

          {/* Dynamic Visual Bars */}
          <div
            className="grid gap-2 sm:gap-3 items-end h-40 pt-4 pb-2 border-b border-zinc-800"
            style={{ gridTemplateColumns: `repeat(${Math.max(chartData.length, 1)}, minmax(0, 1fr))` }}
          >
            {chartData.map((item) => {
              const isCurrent = item.periodKey === selectedPeriodKey;
              const val = metricValue(item);
              let colorClass = isCurrent ? 'bg-emerald-400' : 'bg-emerald-500/30 hover:bg-emerald-500/50';
              if (selectedChartMetric === 'taxes') {
                colorClass = isCurrent ? 'bg-purple-400' : 'bg-purple-500/30 hover:bg-purple-500/50';
              }
              const heightPercent = Math.min(100, Math.max(val > 0 ? 12 : 4, Math.round((val / maxVal) * 100)));

              return (
                <button
                  type="button"
                  key={item.periodKey}
                  onClick={() => onSelectPeriod(item.periodKey)}
                  className="flex flex-col items-center gap-1 group relative"
                  title={`${item.month}: ${formatKZT(val)}`}
                >
                  <div className="absolute -top-10 bg-[#09090b] text-zinc-100 text-[10px] font-mono-num px-2 py-1 rounded-md border border-zinc-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                    {formatKZT(val)} ({item.employeeCount} чел.)
                  </div>

                  <div className="w-full bg-[#121215] rounded-lg h-32 flex items-end p-1">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-md transition-all duration-500 ${colorClass} ${
                        isCurrent ? 'shadow-lg shadow-emerald-500/20' : ''
                      }`}
                    ></div>
                  </div>

                  <span className={`text-[10px] sm:text-xs text-center truncate w-full ${isCurrent ? 'font-bold text-emerald-400' : 'text-zinc-400'}`}>
                    {item.month.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-3">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                Текущий расчет: {selectedPeriod} ({activeEmployees.length} специалистов)
                </span>
              </div>
              <div className="font-mono-num text-zinc-300">
              Среднемесячный рост фонда: {growth === null ? (
                <span className="text-zinc-500 font-semibold">—</span>
              ) : (
                <span className={`font-semibold ${growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {growth > 0 ? '+' : ''}{growth.toLocaleString('ru-RU')}%
                </span>
              )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};
