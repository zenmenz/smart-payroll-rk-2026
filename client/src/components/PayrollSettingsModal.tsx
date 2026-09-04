import React, { useEffect, useState } from 'react';
import { AlertTriangle, Building2, CalendarDays, ClipboardList, Landmark, Plus, Save, Settings2, SlidersHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

type SettingsTab = 'company' | 'rates' | 'references' | 'period' | 'system';
const RESET_CONFIRMATION = 'СБРОС';

const rateFields = [
  ['mci', 'МРП, ₸'], ['minimumWage', 'МЗП, ₸'], ['standardDeductionMciCount', 'Стандартный вычет, МРП'],
  ['opvRateBps', 'ОПВ, б.п.'], ['opvMaxBaseMinimumWages', 'Лимит ОПВ, МЗП'], ['vosmsRateBps', 'ВОСМС, б.п.'],
  ['vosmsMaxBaseMinimumWages', 'Лимит ВОСМС, МЗП'], ['ipnBaseRateBps', 'Базовый ИПН, б.п.'], ['ipnHighRateBps', 'Повышенный ИПН, б.п.'],
  ['ipnHighRateAnnualMciLimit', 'Порог повышенного ИПН, МРП/год'], ['lowIncomeMonthlyMciLimit', 'Порог низкого дохода, МРП/мес'],
  ['lowIncomeCorrectionBps', 'Корректировка низкого дохода, б.п.'], ['soRateBps', 'СО, б.п.'], ['soMinBaseMinimumWages', 'Мин. база СО, МЗП'],
  ['soMaxBaseMinimumWages', 'Макс. база СО, МЗП'], ['oosmsRateBps', 'ООСМС, б.п.'], ['oosmsMaxBaseMinimumWages', 'Лимит ООСМС, МЗП'],
  ['snRateBps', 'СН, б.п.'], ['opvrRateBps', 'ОПВР, б.п.'], ['opvrMaxBaseMinimumWages', 'Лимит ОПВР, МЗП'],
] as const;

const emptyProfile = Object.fromEntries(rateFields.map(([key]) => [key, ''])) as Record<(typeof rateFields)[number][0], string>;

interface PayrollSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PayrollSettingsModal({ isOpen, onClose }: PayrollSettingsModalProps) {
  const [tab, setTab] = useState<SettingsTab>('company');
  const [company, setCompany] = useState({ legalName: '', bin: '', address: '' });
  const [profile, setProfile] = useState({ name: '', effectiveFrom: '', effectiveTo: '', ...emptyProfile });
  const [department, setDepartment] = useState({ code: '', name: '' });
  const [position, setPosition] = useState({ code: '', name: '', departmentId: '' });
  const [accrual, setAccrual] = useState({ code: '', name: '', kind: 'accrual' as 'accrual' | 'deduction', isTaxable: true });
  const [period, setPeriod] = useState({ year: String(new Date().getFullYear()), month: String(new Date().getMonth() + 1), taxProfileId: '' });
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetAcknowledged, setResetAcknowledged] = useState(false);
  const utils = trpc.useUtils();
  const companyQuery = trpc.payroll.company.get.useQuery(undefined, { enabled: isOpen });
  const referencesQuery = trpc.payroll.references.list.useQuery(undefined, { enabled: isOpen });
  const periodsQuery = trpc.payroll.periods.list.useQuery(undefined, { enabled: isOpen });
  const companyMutation = trpc.payroll.company.save.useMutation();
  const profileMutation = trpc.payroll.references.taxProfiles.create.useMutation();
  const departmentMutation = trpc.payroll.references.departments.create.useMutation();
  const positionMutation = trpc.payroll.references.positions.create.useMutation();
  const accrualMutation = trpc.payroll.references.accrualTypes.create.useMutation();
  const periodMutation = trpc.payroll.periods.create.useMutation();
  const resetMutation = trpc.payroll.system.reset.useMutation();

  useEffect(() => {
    if (!companyQuery.data) return;
    setCompany({ legalName: companyQuery.data.legalName, bin: companyQuery.data.bin, address: companyQuery.data.address });
  }, [companyQuery.data]);

  if (!isOpen) return null;

  const refresh = () => Promise.all([
    utils.payroll.company.get.invalidate(),
    utils.payroll.references.list.invalidate(),
    utils.payroll.periods.list.invalidate(),
    utils.payroll.employees.list.invalidate(),
    utils.payroll.payroll.journal.invalidate(),
    utils.payroll.dashboard.summary.invalidate(),
    utils.payroll.dashboard.history.invalidate(),
    utils.payroll.audit.invalidate(),
    utils.payroll.database.tables.invalidate(),
  ]);

  const inputClass = 'w-full bg-[#121215] border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500';

  const saveCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await companyMutation.mutateAsync(company);
      await refresh();
      toast.success('Реквизиты работодателя сохранены.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось сохранить реквизиты.'); }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await profileMutation.mutateAsync({
        name: profile.name,
        effectiveFrom: profile.effectiveFrom,
        effectiveTo: profile.effectiveTo || null,
        mci: Number(profile.mci), minimumWage: Number(profile.minimumWage), standardDeductionMciCount: Number(profile.standardDeductionMciCount),
        opvRateBps: Number(profile.opvRateBps), opvMaxBaseMinimumWages: Number(profile.opvMaxBaseMinimumWages),
        vosmsRateBps: Number(profile.vosmsRateBps), vosmsMaxBaseMinimumWages: Number(profile.vosmsMaxBaseMinimumWages),
        ipnBaseRateBps: Number(profile.ipnBaseRateBps), ipnHighRateBps: Number(profile.ipnHighRateBps), ipnHighRateAnnualMciLimit: Number(profile.ipnHighRateAnnualMciLimit),
        lowIncomeMonthlyMciLimit: Number(profile.lowIncomeMonthlyMciLimit), lowIncomeCorrectionBps: Number(profile.lowIncomeCorrectionBps),
        soRateBps: Number(profile.soRateBps), soMinBaseMinimumWages: Number(profile.soMinBaseMinimumWages), soMaxBaseMinimumWages: Number(profile.soMaxBaseMinimumWages),
        oosmsRateBps: Number(profile.oosmsRateBps), oosmsMaxBaseMinimumWages: Number(profile.oosmsMaxBaseMinimumWages), snRateBps: Number(profile.snRateBps),
        opvrRateBps: Number(profile.opvrRateBps), opvrMaxBaseMinimumWages: Number(profile.opvrMaxBaseMinimumWages),
      });
      setProfile({ name: '', effectiveFrom: '', effectiveTo: '', ...emptyProfile });
      await refresh();
      toast.success('Профиль ставок сохранён.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Проверьте все параметры профиля ставок.'); }
  };

  const saveReference = async (kind: 'department' | 'position' | 'accrual') => {
    try {
      if (kind === 'department') {
        await departmentMutation.mutateAsync(department);
        setDepartment({ code: '', name: '' });
      } else if (kind === 'position') {
        await positionMutation.mutateAsync({ code: position.code, name: position.name, departmentId: position.departmentId ? Number(position.departmentId) : null });
        setPosition({ code: '', name: '', departmentId: '' });
      } else {
        await accrualMutation.mutateAsync(accrual);
        setAccrual({ code: '', name: '', kind: 'accrual', isTaxable: true });
      }
      await refresh();
      toast.success('Справочник обновлён.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось сохранить запись справочника.'); }
  };

  const savePeriod = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await periodMutation.mutateAsync({ year: Number(period.year), month: Number(period.month), taxProfileId: period.taxProfileId ? Number(period.taxProfileId) : null });
      await refresh();
      toast.success('Расчётный период создан.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось создать период.'); }
  };

  const resetSystem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetAcknowledged) {
      toast.error('Подтвердите, что понимаете последствия сброса.');
      return;
    }
    if (resetConfirmation !== RESET_CONFIRMATION) {
      toast.error(`Для подтверждения введите слово ${RESET_CONFIRMATION}.`);
      return;
    }
    try {
      await resetMutation.mutateAsync({ confirmation: RESET_CONFIRMATION });
      setCompany({ legalName: '', bin: '', address: '' });
      setResetConfirmation('');
      setResetAcknowledged(false);
      await refresh();
      toast.success('Система сброшена: все данные удалены.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сбросить систему.');
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
    { id: 'company', label: 'Компания', icon: Building2 }, { id: 'rates', label: 'Ставки', icon: SlidersHorizontal },
    { id: 'references', label: 'Справочники', icon: ClipboardList }, { id: 'period', label: 'Периоды', icon: CalendarDays },
    { id: 'system', label: 'Система', icon: AlertTriangle },
  ];

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
    <div className="relative w-full max-w-5xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
      <div className="px-6 py-5 border-b border-zinc-800 bg-[#121215] flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30"><Settings2 className="w-5 h-5" /></div><div><h3 className="text-base font-bold text-[#fafafa]">Настройка payroll</h3><p className="text-xs text-zinc-400">Реквизиты, ставки, справочники, периоды и сброс системы</p></div></div>
        <button onClick={onClose} className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex gap-1 p-3 border-b border-zinc-800 bg-[#18181b] overflow-x-auto">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap ${tab === id ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div>
      <div className="p-6 overflow-y-auto text-xs flex-1 bg-[#18181b]">
        {tab === 'company' && <form onSubmit={saveCompany} className="max-w-xl space-y-4"><p className="text-zinc-400">Эти реквизиты выводятся в детализированных расчётных листках и экспортных файлах.</p><label className="block text-zinc-300 font-semibold">Юридическое название<input required value={company.legalName} onChange={(event) => setCompany({ ...company, legalName: event.target.value })} className={`${inputClass} mt-1.5`} /></label><label className="block text-zinc-300 font-semibold">БИН<input required pattern="\d{12}" value={company.bin} onChange={(event) => setCompany({ ...company, bin: event.target.value.replace(/\D/g, '') })} className={`${inputClass} mt-1.5 font-mono-num`} /></label><label className="block text-zinc-300 font-semibold">Адрес<textarea required value={company.address} onChange={(event) => setCompany({ ...company, address: event.target.value })} className={`${inputClass} mt-1.5 min-h-20`} /></label><button disabled={companyMutation.isPending} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl flex items-center gap-2"><Save className="w-4 h-4" />Сохранить реквизиты</button></form>}
        {tab === 'rates' && <form onSubmit={saveProfile} className="space-y-4"><p className="text-zinc-400">Введите утверждённые бухгалтером параметры. Ставки хранятся в базисных пунктах: 10% = 1 000 б.п.</p><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="text-zinc-300 font-semibold">Название профиля<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className={`${inputClass} mt-1.5`} /></label><label className="text-zinc-300 font-semibold">Действует с<input required type="date" value={profile.effectiveFrom} onChange={(event) => setProfile({ ...profile, effectiveFrom: event.target.value })} className={`${inputClass} mt-1.5`} /></label><label className="text-zinc-300 font-semibold">Действует по<input type="date" value={profile.effectiveTo} onChange={(event) => setProfile({ ...profile, effectiveTo: event.target.value })} className={`${inputClass} mt-1.5`} /></label></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{rateFields.map(([key, label]) => <label key={key} className="text-zinc-300 font-semibold">{label}<input required type="number" min="0" value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} className={`${inputClass} mt-1.5 font-mono-num`} /></label>)}</div><button disabled={profileMutation.isPending} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl flex items-center gap-2"><Save className="w-4 h-4" />Сохранить профиль ставок</button><div className="border-t border-zinc-800 pt-4 text-zinc-400">Созданные профили: {(referencesQuery.data?.taxProfiles ?? []).map((item) => item.name).join(' · ') || 'нет записей'}</div></form>}
        {tab === 'references' && <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><section className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 space-y-3"><h4 className="font-bold text-zinc-100 flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-400" />Подразделение</h4><input placeholder="Код" value={department.code} onChange={(event) => setDepartment({ ...department, code: event.target.value })} className={inputClass} /><input placeholder="Название" value={department.name} onChange={(event) => setDepartment({ ...department, name: event.target.value })} className={inputClass} /><button onClick={() => saveReference('department')} className="w-full px-3 py-2 bg-emerald-500 text-zinc-950 rounded-xl font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Добавить</button><p className="text-zinc-500">{(referencesQuery.data?.departments ?? []).map((item) => item.name).join(' · ') || 'Нет записей'}</p></section><section className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 space-y-3"><h4 className="font-bold text-zinc-100 flex items-center gap-2"><Landmark className="w-4 h-4 text-blue-400" />Должность</h4><input placeholder="Код" value={position.code} onChange={(event) => setPosition({ ...position, code: event.target.value })} className={inputClass} /><input placeholder="Название" value={position.name} onChange={(event) => setPosition({ ...position, name: event.target.value })} className={inputClass} /><select value={position.departmentId} onChange={(event) => setPosition({ ...position, departmentId: event.target.value })} className={inputClass}><option value="">Без подразделения</option>{(referencesQuery.data?.departments ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => saveReference('position')} className="w-full px-3 py-2 bg-emerald-500 text-zinc-950 rounded-xl font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Добавить</button><p className="text-zinc-500">{(referencesQuery.data?.positions ?? []).map((item) => item.name).join(' · ') || 'Нет записей'}</p></section><section className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 space-y-3"><h4 className="font-bold text-zinc-100 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-purple-400" />Начисление / удержание</h4><input placeholder="Код" value={accrual.code} onChange={(event) => setAccrual({ ...accrual, code: event.target.value })} className={inputClass} /><input placeholder="Название" value={accrual.name} onChange={(event) => setAccrual({ ...accrual, name: event.target.value })} className={inputClass} /><select value={accrual.kind} onChange={(event) => setAccrual({ ...accrual, kind: event.target.value as 'accrual' | 'deduction' })} className={inputClass}><option value="accrual">Начисление</option><option value="deduction">Удержание</option></select><label className="flex gap-2 text-zinc-300"><input type="checkbox" checked={accrual.isTaxable} onChange={(event) => setAccrual({ ...accrual, isTaxable: event.target.checked })} />Облагается</label><button onClick={() => saveReference('accrual')} className="w-full px-3 py-2 bg-emerald-500 text-zinc-950 rounded-xl font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Добавить</button><p className="text-zinc-500">{(referencesQuery.data?.accrualTypes ?? []).map((item) => item.name).join(' · ') || 'Нет записей'}</p></section></div>}
        {tab === 'period' && <form onSubmit={savePeriod} className="max-w-xl space-y-4"><p className="text-zinc-400">Создайте расчётный период после подготовки профиля ставок. Пустой профиль оставить нельзя для расчёта.</p><div className="grid grid-cols-2 gap-3"><label className="text-zinc-300 font-semibold">Год<input required type="number" value={period.year} onChange={(event) => setPeriod({ ...period, year: event.target.value })} className={`${inputClass} mt-1.5`} /></label><label className="text-zinc-300 font-semibold">Месяц<input required type="number" min="1" max="12" value={period.month} onChange={(event) => setPeriod({ ...period, month: event.target.value })} className={`${inputClass} mt-1.5`} /></label></div><label className="block text-zinc-300 font-semibold">Профиль ставок<select required value={period.taxProfileId} onChange={(event) => setPeriod({ ...period, taxProfileId: event.target.value })} className={`${inputClass} mt-1.5`}><option value="">Выберите профиль</option>{(referencesQuery.data?.taxProfiles ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button disabled={periodMutation.isPending} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl flex items-center gap-2"><CalendarDays className="w-4 h-4" />Создать период</button><div className="border-t border-zinc-800 pt-4 text-zinc-400">Созданные периоды: {(periodsQuery.data ?? []).map((item) => item.periodKey).join(' · ') || 'нет записей'}</div></form>}
        {tab === 'system' && (
          <form onSubmit={resetSystem} className="max-w-xl space-y-4">
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-2">
              <h4 className="font-bold text-rose-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Опасная зона</h4>
              <p className="text-zinc-300 leading-relaxed">
                Полный сброс безвозвратно удаляет компанию, ставки, справочники, сотрудников, периоды, расчёты и журнал аудита.
                Сессия текущего администратора сохранится.
              </p>
            </div>
            <label className="flex items-start gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={resetAcknowledged}
                onChange={(event) => setResetAcknowledged(event.target.checked)}
                className="mt-0.5"
              />
              <span>Я понимаю, что все данные будут удалены без возможности восстановления.</span>
            </label>
            <label className="block text-zinc-300 font-semibold">
              Введите {RESET_CONFIRMATION} для подтверждения
              <input
                value={resetConfirmation}
                onChange={(event) => setResetConfirmation(event.target.value)}
                placeholder={RESET_CONFIRMATION}
                autoComplete="off"
                className={`${inputClass} mt-1.5 font-mono-num`}
              />
            </label>
            <button
              type="submit"
              disabled={resetMutation.isPending || !resetAcknowledged || resetConfirmation !== RESET_CONFIRMATION}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 text-white font-bold rounded-xl flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {resetMutation.isPending ? 'Сброс…' : 'Сбросить систему'}
            </button>
          </form>
        )}
      </div>
    </div>
  </div>;
}
