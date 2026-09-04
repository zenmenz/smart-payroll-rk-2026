import React from 'react';
import { X, History, Clock, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PayrollHistoryEntry } from '../types/payroll';

interface HistoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: PayrollHistoryEntry[];
}

export const HistoryLogModal: React.FC<HistoryLogModalProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-[#121215] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#fafafa]">
                Журнал аудита и изменений ведомости
              </h3>
              <p className="text-xs text-zinc-400">
                История корректировок окладов, статусов и налоговых вычетов
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 divide-y divide-zinc-800/80 flex-1 text-xs bg-[#18181b]">
          {logs.map((log) => (
            <div key={log.id} className="pt-3 first:pt-0 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-emerald-400">{log.action}</span>
                <span className="font-mono-num text-[11px] text-zinc-500">{log.timestamp}</span>
              </div>
              <p className="text-zinc-200 text-xs leading-relaxed">{log.details}</p>
              <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-0.5">
                <User className="w-3 h-3 text-zinc-400" />
                <span>Оператор: {log.user}</span>
                {log.employeeName && <span>· Сотрудник: <strong className="text-zinc-300">{log.employeeName}</strong></span>}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#121215] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-xl text-xs font-medium transition-colors border border-zinc-800"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
