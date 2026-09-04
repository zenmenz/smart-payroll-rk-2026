import React from 'react';
import { formatKZT } from '../utils/kazakhstanTaxCalculator';

export type PersonalPayslipCard = {
  period: { periodKey: string };
  calculation: { id: number; gross: number; netSalary: number; status: string };
};

interface PersonalPayslipsPanelProps {
  isLoading: boolean;
  payslips: PersonalPayslipCard[];
  onOpenHelp: () => void;
}

export function PersonalPayslipsPanel({ isLoading, payslips, onOpenHelp }: PersonalPayslipsPanelProps) {
  return <div className="min-h-screen bg-[#09090b] text-[#fafafa] p-4 sm:p-8">
    <main className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-6"><div><p className="text-emerald-400 text-xs font-semibold">ЛИЧНЫЙ КАБИНЕТ</p><h1 className="text-2xl font-bold">Мои расчётные листки</h1><p className="text-sm text-zinc-400 mt-1">Доступны только листки, привязанные к вашей учётной записи.</p></div><button onClick={onOpenHelp} className="p-2.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 border border-zinc-800 text-blue-400" title="Справка">?</button></div>
      {isLoading ? <p className="text-zinc-400">Загружаются листки…</p> : payslips.length ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{payslips.map((entry) => <div key={entry.calculation.id} className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5"><p className="text-xs text-zinc-400">{entry.period.periodKey}</p><p className="text-xl font-extrabold text-emerald-400 font-mono-num mt-2">{formatKZT(entry.calculation.netSalary)}</p><p className="text-xs text-zinc-400 mt-1">К выплате на руки</p><div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between text-xs"><span className="text-zinc-400">Начислено</span><span className="font-mono">{formatKZT(entry.calculation.gross)}</span></div><div className="mt-2 flex justify-between text-xs"><span className="text-zinc-400">Статус</span><span className="text-emerald-400">{entry.calculation.status}</span></div></div>)}</div> : <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">Расчётные листки пока отсутствуют. Если вы ожидаете данные, обратитесь к администратору для привязки вашей учётной записи к карточке сотрудника.</div>}
    </main>
  </div>;
}
