import type { Employee, TaxBreakdown } from '../types/payroll';
import type { PayrollTaxProfile } from '@shared/payrollEngine';
import { calculatePayroll } from '@shared/payrollEngine';

export type TaxProfileDeductionSource = {
  mci: number;
  standardDeductionMciCount: number;
};

/** Подписи стандартного вычета из профиля ставок периода. */
export function getStandardDeductionSummary(profile?: TaxProfileDeductionSource | null) {
  if (!profile || !profile.mci || !profile.standardDeductionMciCount) {
    return {
      mciCount: 0,
      mci: 0,
      amount: 0,
      shortLabel: 'базовый вычет',
      fullLabel: 'базовый вычет по профилю ставок',
    };
  }
  const amount = profile.mci * profile.standardDeductionMciCount;
  return {
    mciCount: profile.standardDeductionMciCount,
    mci: profile.mci,
    amount,
    shortLabel: `${profile.standardDeductionMciCount} МРП`,
    fullLabel: `${profile.standardDeductionMciCount} МРП (${formatNumber(amount)} ₸)`,
  };
}

export function formatKZT(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount || 0)) + ' ₸';
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount || 0));
}

/**
 * Предпросмотр расчёта по тому же движку, что и backend (`shared/payrollEngine`).
 * Без профиля ставок предпросмотр недоступен — это не симуляция на hardcoded-ставках.
 */
export function previewPayroll(
  gross: number,
  applyStandardDeduction: boolean,
  taxProfile: PayrollTaxProfile,
  opvrApplicable = true,
) {
  return calculatePayroll({
    baseSalary: gross,
    applyStandardDeduction,
    opvrApplicable,
    taxProfile,
  });
}

export type TaxExplanation = {
  name: string;
  shortName: string;
  rate: string;
  amount: number;
  payer: 'employee' | 'employer';
  basisDescription: string;
  simpleExplanation: string;
  lawReference: string;
};

/** Пояснения строятся только по фактическому расчёту и профилю периода. */
export function getDetailedExplanations(
  calc: TaxBreakdown,
  employee: Employee,
  taxProfile?: PayrollTaxProfile | null,
): TaxExplanation[] {
  const mzp = taxProfile?.minimumWage ?? 0;
  const opvRate = taxProfile ? `${(taxProfile.opvRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const vosmsRate = taxProfile ? `${(taxProfile.vosmsRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const ipnRate = taxProfile ? `${(taxProfile.ipnBaseRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const soRate = taxProfile ? `${(taxProfile.soRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const oosmsRate = taxProfile ? `${(taxProfile.oosmsRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const snRate = taxProfile ? `${(taxProfile.snRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const opvrRate = taxProfile ? `${(taxProfile.opvrRateBps / 100).toLocaleString('ru-RU')}%` : 'по профилю';
  const deduction = getStandardDeductionSummary(taxProfile);

  return [
    {
      name: 'Обязательные пенсионные взносы',
      shortName: 'ОПВ',
      rate: opvRate,
      amount: calc.opv,
      payer: 'employee',
      basisDescription: taxProfile
        ? `Начислено: ${formatKZT(calc.gross)} (предел ${taxProfile.opvMaxBaseMinimumWages} МЗП = ${formatKZT(mzp * taxProfile.opvMaxBaseMinimumWages)})`
        : `Начислено: ${formatKZT(calc.gross)}`,
      simpleExplanation: 'Взнос работника в ЕНПФ, удерживается из заработной платы.',
      lawReference: 'Закон РК «О пенсионном обеспечении»',
    },
    {
      name: 'Взносы на обязательное социальное медицинское страхование',
      shortName: 'ВОСМС',
      rate: vosmsRate,
      amount: calc.vosms,
      payer: 'employee',
      basisDescription: taxProfile
        ? `Начислено: ${formatKZT(calc.gross)} (предел ${taxProfile.vosmsMaxBaseMinimumWages} МЗП = ${formatKZT(mzp * taxProfile.vosmsMaxBaseMinimumWages)})`
        : `Начислено: ${formatKZT(calc.gross)}`,
      simpleExplanation: 'Платёж в ФСМС, удерживается из заработной платы.',
      lawReference: 'Закон РК «Об обязательном социальном медицинском страховании»',
    },
    {
      name: 'Стандартный налоговый вычет',
      shortName: `Вычет ${deduction.shortLabel}`,
      rate: 'Фиксированный',
      amount: calc.standardDeduction,
      payer: 'employee',
      basisDescription: employee.applyStandardDeduction
        ? `${deduction.fullLabel}`
        : 'Не применён (нет заявления сотрудника)',
      simpleExplanation: 'Льгота, уменьшающая налогооблагаемую базу ИПН. Не является удержанием денег.',
      lawReference: 'Налоговый кодекс РК, ст. 346',
    },
    {
      name: 'Индивидуальный подоходный налог',
      shortName: 'ИПН',
      rate: ipnRate,
      amount: calc.ipn,
      payer: 'employee',
      basisDescription: `База (${formatKZT(calc.ipnBase)}) = Оклад (${formatKZT(calc.gross)}) − ОПВ (${formatKZT(calc.opv)}) − ВОСМС (${formatKZT(calc.vosms)}) − Вычет (${formatKZT(calc.standardDeduction)})`,
      simpleExplanation: 'Налог на доходы физических лиц, удерживаемый с налогооблагаемой базы.',
      lawReference: 'Налоговый кодекс РК, ст. 320, ст. 353',
    },
    {
      name: 'Социальные отчисления',
      shortName: 'СО',
      rate: soRate,
      amount: calc.so,
      payer: 'employer',
      basisDescription: `База: ${formatKZT(calc.soBase)}`,
      simpleExplanation: 'Отчисления работодателя в Государственный фонд социального страхования.',
      lawReference: 'Закон РК «Об обязательном социальном страховании»',
    },
    {
      name: 'Отчисления на ОСМС работодателя',
      shortName: 'ООСМС',
      rate: oosmsRate,
      amount: calc.oosms,
      payer: 'employer',
      basisDescription: `Начислено: ${formatKZT(calc.gross)}`,
      simpleExplanation: 'Взнос работодателя в систему ОСМС.',
      lawReference: 'Закон РК «Об обязательном социальном медицинском страховании»',
    },
    {
      name: 'Социальный налог',
      shortName: 'СН',
      rate: snRate,
      amount: calc.sn,
      payer: 'employer',
      basisDescription: `База: ${formatKZT(calc.snBase)}; сумма уменьшается на СО`,
      simpleExplanation: 'Налог работодателя в местный бюджет, уменьшаемый на сумму СО.',
      lawReference: 'Налоговый кодекс РК, ст. 484, ст. 485',
    },
    {
      name: 'Обязательные пенсионные взносы работодателя',
      shortName: 'ОПВР',
      rate: opvrRate,
      amount: calc.opvr,
      payer: 'employer',
      basisDescription: `Начислено: ${formatKZT(calc.gross)}`,
      simpleExplanation: 'Взносы работодателя в ЕНПФ за счёт средств компании.',
      lawReference: 'Закон РК «О пенсионном обеспечении»',
    },
  ];
}
