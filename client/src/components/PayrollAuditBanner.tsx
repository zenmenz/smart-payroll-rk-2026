import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  UserCheck, 
  FileCheck,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { AuditIssue, Employee } from '../types/payroll';

interface PayrollAuditBannerProps {
  issues: AuditIssue[];
  onFixIssue: (issue: AuditIssue) => void;
  onSelectEmployee: (empId: string) => void;
  deductionLabel?: string;
  employeeCount?: number;
}

export const PayrollAuditBanner: React.FC<PayrollAuditBannerProps> = ({
  issues,
  onFixIssue,
  onSelectEmployee,
  deductionLabel = 'базовый вычет по профилю ставок',
  employeeCount = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (issues.length === 0) {
    const emptyStaff = employeeCount === 0;
    return (
      <div className="mb-6 bg-[#18181b] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#fafafa] flex items-center gap-2">
              {emptyStaff
                ? 'Проверка расчетов: данных для проверки пока нет'
                : 'Проверка расчетов: Ошибок и замечаний не обнаружено'}
              {!emptyStaff && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                  100% готовность к выплате
                </span>
              )}
            </h4>
            <p className="text-xs text-zinc-400">
              {emptyStaff
                ? 'Создайте период, профиль ставок и сотрудников, затем выполните расчёт ведомости.'
                : `Все ИИН, банковские счета IBAN, лимиты ОПВ/ВОСМС и налоговые вычеты ${deductionLabel} проверены на соответствие законодательству РК.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const warningCount = issues.filter((i) => i.type === 'warning').length;
  const errorCount = issues.filter((i) => i.type === 'error').length;
  const infoCount = issues.filter((i) => i.type === 'info').length;

  return (
    <div className="mb-6 bg-[#18181b] border border-amber-500/30 rounded-2xl overflow-hidden shadow-sm">
      {/* Banner Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3.5 bg-[#121215] flex items-center justify-between cursor-pointer select-none hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#fafafa]">
                Интеллектуальная проверка расчетов ведомости
              </h4>
              <div className="flex items-center gap-1.5 text-xs">
                {errorCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 font-semibold">
                    {errorCount} ошибки
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                    {warningCount} замечания
                  </span>
                )}
                {infoCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                    {infoCount} уведомления
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Автоматический аудит выявил ситуации, требующие проверки перед проведением выплат.
            </p>
          </div>
        </div>

        <button className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Issues List */}
      {isExpanded && (
        <div className="p-4 divide-y divide-zinc-800 bg-[#09090b]/40">
          <div className="space-y-2.5 pb-1">
            {issues.map((issue) => {
              return (
                <div
                  key={issue.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#18181b] border border-zinc-800 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {issue.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                      {issue.type === 'warning' && <ShieldAlert className="w-4 h-4 text-amber-400" />}
                      {issue.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200">{issue.title}</span>
                        {issue.employeeName && (
                          <button
                            onClick={() => issue.employeeId && onSelectEmployee(issue.employeeId)}
                            className="text-xs font-semibold text-emerald-400 hover:underline"
                          >
                            · {issue.employeeName}
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{issue.description}</p>
                    </div>
                  </div>

                  {issue.actionText && (
                    <button
                      onClick={() => onFixIssue(issue)}
                      className="self-end sm:self-center shrink-0 px-3 py-1.5 bg-[#121215] hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      <span>{issue.actionText}</span>
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
