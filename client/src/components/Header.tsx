import React from 'react';
import { 
  Building2, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  CreditCard,
  Sparkles,
  RefreshCw,
  History,
  Settings2,
  BookOpen,
  Database
} from 'lucide-react';
import { PayrollStage, SalaryViewType } from '../types/payroll';

interface HeaderProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  periods?: Array<{ key: string; label: string }>;
  regulatorySummary?: string;
  salaryViewType: SalaryViewType;
  onSalaryViewTypeChange: (type: SalaryViewType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  payrollStage: PayrollStage;
  onStageChange: (stage: PayrollStage) => void;
  onOpenNewEmployee: () => void;
  onExportExcel: () => void;
  onOpenPayslips: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenDatabase: () => void;
  onOpenHelp: () => void;
  isProcessing?: boolean;
  isExporting?: boolean;
  totalEmployees: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPeriod,
  onPeriodChange,
  periods = [],
  regulatorySummary = 'Профиль ставок для периода не выбран. Настройте его перед расчётом.',
  salaryViewType,
  onSalaryViewTypeChange,
  isDarkMode,
  onToggleDarkMode,
  payrollStage,
  onStageChange,
  onOpenNewEmployee,
  onExportExcel,
  onOpenPayslips,
  onOpenHistory,
  onOpenSettings,
  onOpenDatabase,
  onOpenHelp,
  isProcessing = false,
  isExporting = false,
}) => {
  const getStageInfo = (stage: PayrollStage) => {
    switch (stage) {
      case 'draft':
        return { label: 'Черновик', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Clock, next: 'verified', nextLabel: 'Отправить на проверку' };
      case 'verified':
        return { label: 'Проверено', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: ShieldCheck, next: 'approved', nextLabel: 'Утвердить ведомость' };
      case 'approved':
        return { label: 'Утверждено', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: CheckCircle2, next: 'paid', nextLabel: 'Провести выплату' };
      case 'paid':
        return { label: 'Выплачено', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CreditCard, next: 'draft', nextLabel: 'Вернуть в черновик' };
    }
  };

  const currentStage = getStageInfo(payrollStage);
  const StageIcon = currentStage.icon;

  return (
    <header className="border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200">
      {/* Top Banner / Rule Version */}
      <div className="bg-[#121215] border-b border-zinc-800/80 px-4 py-1.5 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">Казахстан · Параметры периода:</span>
          <span className="text-zinc-300">{regulatorySummary}</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-400 text-xs">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Автоматическая сверка налогов по ст. 353 НК РК
          </span>
          <button 
            onClick={onOpenHistory}
            className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-zinc-300"
          >
            <History className="w-3.5 h-3.5" />
            Журнал аудита
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-zinc-950 font-black text-xl">
            ₸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-[#fafafa] tracking-tight flex items-center gap-2">
                Smart Payroll РК
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                  2026
                </span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Умная зарплатная ведомость и расчет налогов
            </p>
          </div>
        </div>

        {/* Controls Center: Period + Gross/Net Switch + Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
          <div className="relative flex items-center bg-[#18181b] rounded-xl p-1 border border-zinc-800">
            <Calendar className="w-4 h-4 text-zinc-400 ml-2 mr-1" />
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none pr-3 py-1 cursor-pointer"
            >
              {periods.length === 0 && <option value="" className="bg-[#18181b] text-zinc-100">Нет созданных периодов</option>}
              {periods.map((p) => (
                <option key={p.key} value={p.key} className="bg-[#18181b] text-zinc-100">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Gross / Net Switcher */}
          <div className="bg-[#18181b] p-1 rounded-xl border border-zinc-800 flex items-center text-xs font-medium">
            <button
              onClick={() => onSalaryViewTypeChange('gross')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                salaryViewType === 'gross'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Начислено (Gross)
            </button>
            <button
              onClick={() => onSalaryViewTypeChange('net')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                salaryViewType === 'net'
                  ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              На руки (Net)
            </button>
          </div>

          {/* Stage Badge & Next Stage button */}
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${currentStage.color}`}>
              <StageIcon className="w-3.5 h-3.5" />
              <span>{currentStage.label}</span>
            </div>
            <button
              onClick={() => onStageChange(currentStage.next as PayrollStage)}
              disabled={isProcessing}
              className="text-xs bg-[#18181b] hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-wait text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-800 transition-colors flex items-center gap-1"
              title="Перейти к следующему этапу"
            >
              <RefreshCw className="w-3 h-3 text-zinc-400" />
              <span className="hidden md:inline">{currentStage.nextLabel}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Export Excel */}
          <button
            onClick={onExportExcel}
            disabled={isProcessing || isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-wait text-zinc-200 border border-zinc-800 text-xs font-medium transition-all shadow-sm"
            title="Экспорт ведомости в Excel (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{isExporting ? 'Подготовка…' : 'Excel'}</span>
          </button>

          {/* Payslips */}
          <button
            onClick={onOpenPayslips}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-all shadow-sm"
            title="Сформировать расчетные листки для всех сотрудников"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Листки</span>
          </button>

          {/* Add Employee */}
          <button
            onClick={onOpenNewEmployee}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-wait text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Сотрудник</span>
          </button>

          <button
            onClick={onOpenDatabase}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition-all shadow-sm"
            title="База данных"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">База данных</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
            title="Настройки payroll"
          >
            <Settings2 className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
            title="Справка"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs transition-colors"
            title={isDarkMode ? 'Включить светлую тему' : 'Включить темную тему'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
