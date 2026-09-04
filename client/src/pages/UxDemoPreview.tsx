import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  Table2,
  LayoutGrid,
  User,
  AlertCircle,
  Database,
} from 'lucide-react';

type DemoScene = 'admin' | 'onboarding' | 'employee' | 'more-menu';

const DEMO_EMPLOYEES = [
  { name: 'Айгуль Нурланова', role: 'Бухгалтер', dept: 'Финансы', accrued: '450 000 ₸', hand: '382 140 ₸', opv: '45 000', ipn: '14 160' },
  { name: 'Ерлан Касымов', role: 'Менеджер', dept: 'Продажи', accrued: '520 000 ₸', hand: '441 520 ₸', opv: '52 000', ipn: '16 480' },
  { name: 'Сауле Ибраева', role: 'HR-специалист', dept: 'Кадры', accrued: '380 000 ₸', hand: '322 720 ₸', opv: '38 000', ipn: '11 280' },
];

function DemoBanner({ scene, onScene }: { scene: DemoScene; onScene: (s: DemoScene) => void }) {
  return (
    <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 text-amber-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-tight">Демо-версия нового интерфейса</p>
          <p className="text-xs text-amber-800/80">
            Макет будущего вида. Текущее приложение не изменено — сравнивайте сцены ниже.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['admin', 'Админ: ведомость'],
              ['onboarding', 'Админ: первый запуск'],
              ['employee', 'Сотрудник'],
              ['more-menu', 'Админ: меню «Ещё»'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onScene(id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                scene === id
                  ? 'bg-amber-900 text-amber-50'
                  : 'border border-amber-200 bg-white/80 text-amber-900 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatureHeader({
  showMoreOpen,
  onToggleMore,
  mode = 'full',
}: {
  showMoreOpen?: boolean;
  onToggleMore?: () => void;
  mode?: 'full' | 'minimal';
}) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white">₸</div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-stone-900">Smart Payroll РК</h1>
              <p className="text-sm text-stone-500">Зарплатная ведомость</p>
            </div>
          </div>

          {mode === 'full' && (
            <div className="relative flex flex-wrap items-center gap-2">
              <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                <Plus className="h-4 w-4" />
                Добавить сотрудника
              </button>
              <button
                type="button"
                onClick={onToggleMore}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
                aria-expanded={showMoreOpen}
              >
                <MoreHorizontal className="h-4 w-4" />
                Ещё
              </button>

              {showMoreOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-2 shadow-lg">
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Действия</p>
                  {[
                    { icon: FileText, label: 'Расчётные листки' },
                    { icon: Download, label: 'Скачать таблицу (Excel)' },
                    { icon: BookOpen, label: 'Справка' },
                    { icon: Settings2, label: 'Настройки зарплаты' },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-stone-800 hover:bg-stone-50"
                    >
                      <Icon className="h-4 w-4 text-stone-500" />
                      {label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-stone-100" />
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Для администратора</p>
                  <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-stone-600 hover:bg-stone-50">
                    <Database className="h-4 w-4 text-stone-400" />
                    Просмотр базы данных
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {mode === 'full' && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3">
            <label className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-700">
              <Calendar className="h-4 w-4 text-stone-500" />
              <select className="bg-transparent py-2 font-medium focus:outline-none" defaultValue="2026-03" aria-label="Расчётный период">
                <option value="2026-03">Март 2026</option>
                <option value="2026-02">Февраль 2026</option>
              </select>
            </label>

            <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm">
              <span className="text-stone-500">Ведомость:</span>
              <span className="font-medium text-stone-800">Черновик</span>
              <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 font-medium text-white hover:bg-teal-800">
                Отправить на проверку
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function AdminFilledScene({ moreOpen, onToggleMore }: { moreOpen: boolean; onToggleMore: () => void }) {
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [salaryMode, setSalaryMode] = useState<'accrued' | 'hand'>('hand');

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-stone-900">
      <MatureHeader showMoreOpen={moreOpen} onToggleMore={onToggleMore} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Ведомость за март 2026</h2>
              <p className="mt-1 text-sm text-stone-500">Три главных числа. Остальное — в деталях по сотруднику.</p>
            </div>
            <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 text-sm">
              <button
                type="button"
                onClick={() => setSalaryMode('accrued')}
                className={`min-h-10 rounded-lg px-3 font-medium ${salaryMode === 'accrued' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
              >
                Начислено
              </button>
              <button
                type="button"
                onClick={() => setSalaryMode('hand')}
                className={`min-h-10 rounded-lg px-3 font-medium ${salaryMode === 'hand' ? 'bg-stone-900 text-white' : 'text-stone-600'}`}
              >
                На руки
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Всего начислено', value: '1 350 000 ₸', hint: 'По трудовым договорам' },
              { label: 'К выплате на руки', value: '1 146 380 ₸', hint: 'После удержаний' },
              { label: 'Удержано с сотрудников', value: '203 620 ₸', hint: 'Пенсия, медстраховка, налог' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">{item.label}</p>
                <p className="mt-2 font-mono-num text-2xl font-semibold tracking-tight text-stone-900">{item.value}</p>
                <p className="mt-1 text-sm text-stone-400">{item.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 px-4 py-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
          <div>
            <p className="text-sm font-semibold text-teal-950">Проверка пройдена</p>
            <p className="mt-0.5 text-sm text-teal-900/70">Замечаний нет. Можно отправить ведомость на проверку.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
                <button
                  type="button"
                  onClick={() => setView('table')}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${
                    view === 'table' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  <Table2 className="h-4 w-4" />
                  Таблица
                </button>
                <button
                  type="button"
                  onClick={() => setView('cards')}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${
                    view === 'cards' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Крупные карточки
                </button>
              </div>
              <span className="text-sm text-stone-500">Показано 3 из 3</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  placeholder="Найти по ФИО или ИИН"
                  className="min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Фильтры
                <ChevronDown className={`h-4 w-4 transition ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className="mt-3 grid gap-2 border-t border-stone-100 pt-3 sm:grid-cols-3">
              <select className="min-h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm" defaultValue="all">
                <option value="all">Все отделы</option>
                <option>Финансы</option>
              </select>
              <select className="min-h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm" defaultValue="all">
                <option value="all">Статус сотрудника: все</option>
                <option>Активен</option>
              </select>
              <select className="min-h-11 rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm" defaultValue="all">
                <option value="all">Статус ведомости: все</option>
                <option>Черновик</option>
              </select>
            </div>
          )}
        </section>

        <p className="text-sm text-stone-500">
          ОПВ — пенсионные взносы · ВОСМС — медстраховка · ИПН — подоходный налог
        </p>

        {view === 'table' ? (
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Сотрудник</th>
                  <th className="px-4 py-3 text-right font-medium">{salaryMode === 'hand' ? 'На руки' : 'Начислено'}</th>
                  <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Удержания</th>
                  <th className="px-4 py-3 text-right font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_EMPLOYEES.map((row) => (
                  <tr key={row.name} className="border-t border-stone-100 hover:bg-stone-50/80">
                    <td className="px-4 py-4">
                      <p className="font-medium text-stone-900">{row.name}</p>
                      <p className="text-stone-500">
                        {row.role} · {row.dept}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right font-mono-num font-semibold text-stone-900">
                      {salaryMode === 'hand' ? row.hand : row.accrued}
                    </td>
                    <td className="hidden px-4 py-4 text-right font-mono-num text-stone-500 md:table-cell">
                      ОПВ {row.opv} · ИПН {row.ipn}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="min-h-10 rounded-lg border border-stone-200 px-3 font-medium text-stone-700 hover:bg-white">
                          Открыть
                        </button>
                        <button type="button" className="min-h-10 rounded-lg border border-stone-200 px-3 font-medium text-stone-700 hover:bg-white">
                          Изменить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            {DEMO_EMPLOYEES.map((row) => (
              <article key={row.name} className="rounded-2xl border border-stone-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-stone-900">{row.name}</h3>
                <p className="text-sm text-stone-500">
                  {row.role} · {row.dept}
                </p>
                <p className="mt-4 font-mono-num text-2xl font-semibold">{salaryMode === 'hand' ? row.hand : row.accrued}</p>
                <p className="text-sm text-stone-500">{salaryMode === 'hand' ? 'К выплате на руки' : 'Начислено по договору'}</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="min-h-11 flex-1 rounded-xl bg-stone-900 text-sm font-medium text-white">
                    Открыть подробно
                  </button>
                  <button type="button" className="min-h-11 rounded-xl border border-stone-200 px-4 text-sm font-medium">
                    Изменить
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function OnboardingScene() {
  const steps = [
    { n: 1, title: 'Укажите ставки налогов', active: true, hint: 'Один раз на год. Вводите проценты, например 10.' },
    { n: 2, title: 'Создайте расчётный период', active: false, hint: 'Например: март 2026' },
    { n: 3, title: 'Добавьте сотрудников', active: false, hint: 'ФИО, оклад, ИИН' },
    { n: 4, title: 'Рассчитайте ведомость', active: false, hint: 'Система посчитает налоги сама' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-stone-900">
      <MatureHeader mode="minimal" />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-teal-800">Первый запуск</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">Настроим зарплату за 4 шага</h2>
          <p className="mt-2 text-base text-stone-500">Сейчас нужен только первый шаг. Остальные откроются по очереди.</p>

          <ol className="mt-8 space-y-4">
            {steps.map((step) => (
              <li
                key={step.n}
                className={`rounded-2xl border px-4 py-4 ${
                  step.active ? 'border-teal-300 bg-teal-50/50' : 'border-stone-200 bg-stone-50/50 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      step.active ? 'bg-teal-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {step.n}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-stone-900">{step.title}</p>
                    <p className="mt-1 text-sm text-stone-500">{step.hint}</p>
                    {step.active && (
                      <button type="button" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white">
                        Открыть настройки ставок
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}

function EmployeeScene() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-stone-900">Мои расчётные листки</h1>
              <p className="text-sm text-stone-500">Только ваша зарплата. Без настроек и базы данных.</p>
            </div>
          </div>
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-medium text-stone-700">
            <BookOpen className="h-4 w-4" />
            Как читать листок
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <p className="text-sm text-stone-500">Март 2026</p>
          <p className="mt-2 font-mono-num text-3xl font-semibold text-stone-900">382 140 ₸</p>
          <p className="mt-1 text-sm text-stone-500">К выплате на руки</p>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 text-sm">
            <div>
              <p className="text-stone-500">Начислено</p>
              <p className="font-mono-num font-medium">450 000 ₸</p>
            </div>
            <div>
              <p className="text-stone-500">Статус</p>
              <p className="font-medium text-teal-800">Выплачено</p>
            </div>
          </div>
          <button type="button" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-stone-900 text-sm font-medium text-white sm:w-auto sm:px-5">
            Открыть подробности
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 text-sm text-stone-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
          База данных и настройки зарплаты здесь недоступны — ими пользуется только администратор.
        </div>
      </main>
    </div>
  );
}

export default function UxDemoPreview() {
  const [scene, setScene] = useState<DemoScene>('admin');
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <DemoBanner
        scene={scene}
        onScene={(next) => {
          setScene(next);
          setMoreOpen(next === 'more-menu');
        }}
      />
      {(scene === 'admin' || scene === 'more-menu') && (
        <AdminFilledScene moreOpen={moreOpen || scene === 'more-menu'} onToggleMore={() => setMoreOpen((v) => !v)} />
      )}
      {scene === 'onboarding' && <OnboardingScene />}
      {scene === 'employee' && <EmployeeScene />}
    </div>
  );
}
