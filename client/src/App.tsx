import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from './_core/hooks/useAuth';
import { useLocation } from 'wouter';
import {
  AuditIssue,
  DisplayMode,
  Employee,
  EmployeeStatus,
  PayrollHistoryEntry,
  PayrollStage,
  SalaryViewType,
  TaxBreakdown,
} from './types/payroll';
import { formatNumber, getStandardDeductionSummary } from './utils/kazakhstanTaxCalculator';
import { isEmployeeEligibleForPeriod, isHiredByPeriod } from '@shared/payrollPeriod';
import { Header } from './components/Header';
import { ViewSwitcher } from './components/ViewSwitcher';
import { DashboardStats } from './components/DashboardStats';
import { PayrollAuditBanner } from './components/PayrollAuditBanner';
import { DesktopPayrollTable } from './components/DesktopPayrollTable';
import { MobilePayrollCards } from './components/MobilePayrollCards';
import { SalaryDetailModal } from './components/SalaryDetailModal';
import { EmployeeModal } from './components/EmployeeModal';
import { PayslipsModal } from './components/PayslipsModal';
import { HistoryLogModal } from './components/HistoryLogModal';
import { PayrollSettingsModal } from './components/PayrollSettingsModal';
import { DatabaseModal } from './components/DatabaseModal';
import { PayrollHelpModal } from './components/PayrollHelpModal';
import { PersonalPayslipsPanel } from './components/PersonalPayslipsPanel';

const AVATAR_COLORS = ['from-teal-600 to-emerald-600', 'from-violet-600 to-indigo-600', 'from-amber-600 to-orange-600', 'from-cyan-600 to-blue-600'];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [salaryViewType, setSalaryViewType] = useState<SalaryViewType>('gross');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('desktop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | 'all'>('all');
  const [selectedPayrollStatus, setSelectedPayrollStatus] = useState<PayrollStage | 'all'>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [detailedEmployee, setDetailedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isPayslipsModalOpen, setIsPayslipsModalOpen] = useState(false);
  const [payslipTargetEmployee, setPayslipTargetEmployee] = useState<Employee | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const utils = trpc.useUtils();
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [location, navigate] = useLocation();
  const isAdmin = user?.role === 'admin';

  const referencesQuery = trpc.payroll.references.list.useQuery(undefined, { enabled: isAdmin });
  const periodsQuery = trpc.payroll.periods.list.useQuery(undefined, { enabled: isAdmin });
  const employeesQuery = trpc.payroll.employees.list.useQuery(undefined, { enabled: isAdmin });
  const selectedDepartmentId = useMemo(
    () => selectedDepartment === 'all' ? undefined : (referencesQuery.data?.departments ?? []).find((department) => department.name === selectedDepartment)?.id,
    [referencesQuery.data, selectedDepartment],
  );
  const journalQuery = trpc.payroll.payroll.journal.useQuery(
    selectedPeriodId ? { periodId: selectedPeriodId, ...(selectedDepartmentId ? { departmentId: selectedDepartmentId } : {}), ...(selectedEmployeeId !== 'all' ? { employeeId: Number(selectedEmployeeId) } : {}), ...(selectedPayrollStatus !== 'all' ? { status: selectedPayrollStatus } : {}) } : undefined,
    { enabled: isAdmin },
  );
  const dashboardQuery = trpc.payroll.dashboard.summary.useQuery(
    selectedPeriodId ? { periodId: selectedPeriodId, ...(selectedDepartmentId ? { departmentId: selectedDepartmentId } : {}), ...(selectedEmployeeId !== 'all' ? { employeeId: Number(selectedEmployeeId) } : {}), ...(selectedPayrollStatus !== 'all' ? { status: selectedPayrollStatus } : {}) } : {},
    { enabled: isAdmin },
  );
  const historyQuery = trpc.payroll.dashboard.history.useQuery(undefined, { enabled: isAdmin });
  const auditQuery = trpc.payroll.audit.useQuery({ limit: 100 }, { enabled: isAdmin });
  const myPayslipsQuery = trpc.payroll.payroll.myPayslips.useQuery({}, { enabled: Boolean(user && !isAdmin) });
  const createEmployeeMutation = trpc.payroll.employees.create.useMutation();
  const updateEmployeeMutation = trpc.payroll.employees.update.useMutation();
  const archiveEmployeeMutation = trpc.payroll.employees.archive.useMutation();
  const deleteEmployeeMutation = trpc.payroll.employees.delete.useMutation();
  const createDepartmentMutation = trpc.payroll.references.departments.create.useMutation();
  const createPositionMutation = trpc.payroll.references.positions.create.useMutation();
  const calculatePeriodMutation = trpc.payroll.payroll.calculatePeriod.useMutation();
  const calculationStatusMutation = trpc.payroll.payroll.updateCalculationStatus.useMutation();
  const isPayrollProcessing = createEmployeeMutation.isPending || updateEmployeeMutation.isPending || archiveEmployeeMutation.isPending || deleteEmployeeMutation.isPending || calculatePeriodMutation.isPending || calculationStatusMutation.isPending;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedPeriodId || !periodsQuery.data?.length) return;
    const latest = periodsQuery.data[0];
    setSelectedPeriodId(latest.id);
    setSelectedPeriod(latest.periodKey);
  }, [periodsQuery.data, selectedPeriodId]);

  const employees = useMemo<Employee[]>(() => (employeesQuery.data ?? []).map((row) => ({
    id: String(row.id),
    userId: row.userId,
    departmentId: row.departmentId,
    positionId: row.positionId,
    fullName: row.fullName,
    position: row.position || 'Не указана',
    department: row.department || 'Не указано',
    iin: row.iin,
    iban: row.iban || '',
    bankName: row.bankName || '',
    birthDate: row.birthDate || '',
    hireDate: row.hireDate,
    grossSalary: row.grossSalary,
    applyStandardDeduction: row.applyStandardDeduction,
    customDeductionAmount: row.customDeductionAmount,
    opvrApplicable: row.opvrApplicable,
    status: row.status,
    notes: row.notes || '',
    avatarColor: AVATAR_COLORS[row.id % AVATAR_COLORS.length],
    hasVerifiedDeductionDocs: row.applyStandardDeduction,
    hasVerifiedBank: Boolean(row.iban),
  })), [employeesQuery.data]);

  const calculations = useMemo(() => {
    const map = new Map<string, TaxBreakdown>();
    (journalQuery.data ?? []).forEach((row) => {
      const calculation = row.calculation;
      map.set(String(row.employee.id), {
        gross: calculation.gross,
        opv: calculation.opv,
        vosms: calculation.vosms,
        standardDeduction: calculation.standardDeduction,
        ipnBase: calculation.ipnBase,
        ipnCorrection: calculation.ipnCorrection,
        ipn: calculation.ipn,
        totalWithheld: calculation.totalWithheld,
        netSalary: calculation.netSalary,
        soBase: 0,
        so: calculation.so,
        oosms: calculation.oosms,
        snBase: 0,
        sn: calculation.sn,
        opvr: calculation.opvr,
        totalEmployerContributions: calculation.totalEmployerContributions,
        totalCompanyCost: calculation.totalCompanyCost,
      });
    });
    return map;
  }, [journalQuery.data]);

  const currentPeriod = useMemo(
    () => (periodsQuery.data ?? []).find((period) => period.id === selectedPeriodId) ?? null,
    [periodsQuery.data, selectedPeriodId],
  );
  const periodLabel = currentPeriod
    ? new Date(currentPeriod.year, currentPeriod.month - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
    : 'Период не выбран';
  const taxProfile = useMemo(
    () => (referencesQuery.data?.taxProfiles ?? []).find((profile) => profile.id === currentPeriod?.taxProfileId) ?? null,
    [referencesQuery.data, currentPeriod],
  );
  const deductionSummary = useMemo(() => getStandardDeductionSummary(taxProfile), [taxProfile]);
  const regulatorySummary = taxProfile
    ? `МРП = ${formatNumber(taxProfile.mci)} ₸ · МЗП = ${formatNumber(taxProfile.minimumWage)} ₸ · Базовый вычет ${taxProfile.standardDeductionMciCount} МРП · ОПВР = ${(taxProfile.opvrRateBps / 100).toLocaleString('ru-RU')}%`
    : 'Профиль ставок не выбран. Настройте его перед расчётом.';
  const payrollStage: PayrollStage = (journalQuery.data?.[0]?.calculation.status ?? 'draft') as PayrollStage;
  const departments = useMemo(
    () => (referencesQuery.data?.departments ?? [])
      .filter((department) => department.isActive && !/^\d{12}$/.test(department.name.trim()))
      .map((department) => department.name),
    [referencesQuery.data],
  );
  const logs = useMemo<PayrollHistoryEntry[]>(() => (auditQuery.data ?? []).map((log) => ({
    id: String(log.id),
    timestamp: new Date(log.createdAt).toLocaleString('ru-RU'),
    action: log.action,
    user: log.userName || log.userEmail || 'Система',
    details: log.details || `${log.entityType} #${log.entityId ?? '—'}`,
  })), [auditQuery.data]);

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    if (currentPeriod && !isHiredByPeriod(employee.hireDate, currentPeriod.year, currentPeriod.month)) return false;
    const search = searchQuery.trim().toLowerCase();
    if (search && ![employee.fullName, employee.position, employee.iin, employee.department].some((value) => value.toLowerCase().includes(search))) return false;
    if (selectedDepartment !== 'all' && employee.department !== selectedDepartment) return false;
    if (selectedEmployeeId !== 'all' && employee.id !== selectedEmployeeId) return false;
    if (selectedPayrollStatus !== 'all' && !calculations.has(employee.id)) return false;
    return selectedStatus === 'all' || employee.status === selectedStatus;
  }), [employees, searchQuery, selectedDepartment, selectedStatus, selectedEmployeeId, selectedPayrollStatus, calculations, currentPeriod]);

  const periodEmployees = useMemo(
    () => currentPeriod
      ? employees.filter((employee) => isHiredByPeriod(employee.hireDate, currentPeriod.year, currentPeriod.month))
      : employees,
    [employees, currentPeriod],
  );

  const auditIssues = useMemo<AuditIssue[]>(() => employees.flatMap((employee) => {
    if (employee.status === 'archived') return [];
    const issues: AuditIssue[] = [];
    if (!employee.applyStandardDeduction) issues.push({
      id: `deduction-${employee.id}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      type: 'warning',
      title: 'Не применён стандартный налоговый вычет',
      description: 'Проверьте наличие заявления сотрудника и параметры применяемого профиля ставок.',
      actionText: 'Применить вычет',
      actionType: 'apply_deduction',
    });
    if (employee.status === 'sick') issues.push({
      id: `sick-${employee.id}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      type: 'warning',
      title: 'Сотрудник находится на больничном',
      description: 'Проверьте дополнительные начисления и подтверждающие документы.',
      actionText: 'Открыть карточку',
      actionType: 'edit_employee',
    });
    return issues;
  }), [employees]);

  const invalidatePayroll = async () => {
    await Promise.all([
      utils.payroll.employees.list.invalidate(),
      utils.payroll.payroll.journal.invalidate(),
      utils.payroll.dashboard.summary.invalidate(),
      utils.payroll.dashboard.history.invalidate(),
      utils.payroll.periods.list.invalidate(),
      utils.payroll.audit.invalidate(),
      utils.payroll.references.list.invalidate(),
      utils.payroll.database.tables.invalidate(),
    ]);
  };

  const backfillKeyRef = useRef('');
  useEffect(() => {
    if (!isAdmin || calculatePeriodMutation.isPending) return;
    if (periodsQuery.isLoading || employeesQuery.isLoading || historyQuery.isLoading) return;
    const periods = periodsQuery.data ?? [];
    const history = historyQuery.data ?? [];
    if (!periods.length || !employeesQuery.data) return;

    const targets = periods.filter((period) => {
      if (period.status !== 'open' || !period.taxProfileId) return false;
      const eligible = employees.filter((employee) =>
        isEmployeeEligibleForPeriod(employee.hireDate, employee.status, period.year, period.month),
      );
      if (!eligible.length) return false;
      const row = history.find((item) => item.periodId === period.id);
      const missing = !row || row.calcCount < eligible.length;
      const allZero = Boolean(row && row.gross === 0 && eligible.some((employee) => employee.grossSalary > 0));
      return missing || allZero;
    });
    if (!targets.length) return;
    const key = targets.map((period) => period.id).join(',');
    if (backfillKeyRef.current === key) return;
    backfillKeyRef.current = key;

    void (async () => {
      try {
        for (const period of targets) {
          await calculatePeriodMutation.mutateAsync({ id: period.id });
        }
        await invalidatePayroll();
      } catch {
        backfillKeyRef.current = '';
      }
    })();
  }, [isAdmin, periodsQuery.data, periodsQuery.isLoading, employeesQuery.data, employeesQuery.isLoading, employees, historyQuery.data, historyQuery.isLoading, calculatePeriodMutation.isPending]);

  const selectPeriodByKey = (periodKey: string) => {
    setSelectedPeriod(periodKey);
    setSelectedPeriodId((periodsQuery.data ?? []).find((period) => period.periodKey === periodKey)?.id ?? null);
  };

  const handleStageChange = async (newStage: PayrollStage) => {
    if (!selectedPeriodId) return toast.error('Сначала создайте и выберите расчётный период.');
    try {
      // Always recalculate so salary/reference edits are reflected before status change.
      const result = await calculatePeriodMutation.mutateAsync({ id: selectedPeriodId });
      if (!result.length) return toast.error('В периоде нет сотрудников для расчёта.');
      const rows = await utils.payroll.payroll.journal.fetch({ periodId: selectedPeriodId });
      await Promise.all(rows.map((row) => calculationStatusMutation.mutateAsync({ id: row.calculation.id, status: newStage })));
      await invalidatePayroll();
      toast.success(`Ведомость за ${periodLabel} обновлена.`);
      if (newStage === 'paid') confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#10b981', '#34d399', '#059669', '#a1a1aa'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось изменить статус ведомости.');
    }
  };

  const handleSaveEmployee = async (data: Partial<Employee>) => {
    try {
      const existingEmployee = (employeesQuery.data ?? []).find((employee) => String(employee.id) === data.id);
      let departmentId = existingEmployee?.departmentId ?? null;
      if (data.department?.trim()) {
        const current = (referencesQuery.data?.departments ?? []).find((department) => department.name === data.department?.trim());
        departmentId = current?.id ?? await createDepartmentMutation.mutateAsync({ code: `dep-${Date.now()}`, name: data.department.trim() });
      }
      let positionId = existingEmployee?.positionId ?? null;
      if (data.position?.trim()) {
        const current = (referencesQuery.data?.positions ?? []).find((position) => position.name === data.position?.trim() && position.departmentId === departmentId);
        positionId = current?.id ?? await createPositionMutation.mutateAsync({ code: `pos-${Date.now()}`, name: data.position.trim(), departmentId });
      }
      const payload = {
        userId: existingEmployee?.userId ?? null,
        fullName: data.fullName?.trim() ?? '',
        iin: data.iin ?? '',
        departmentId,
        positionId,
        grossSalary: data.grossSalary ?? 0,
        hireDate: data.hireDate || existingEmployee?.hireDate || new Date().toISOString().slice(0, 10),
        birthDate: data.birthDate || existingEmployee?.birthDate || null,
        iban: data.iban || null,
        bankName: data.bankName || null,
        applyStandardDeduction: data.applyStandardDeduction ?? false,
        customDeductionAmount: data.customDeductionAmount ?? 0,
        opvrApplicable: data.opvrApplicable ?? true,
        status: data.status ?? 'new' as EmployeeStatus,
        notes: data.notes || null,
      };
      if (existingEmployee) await updateEmployeeMutation.mutateAsync({ id: existingEmployee.id, ...payload });
      else await createEmployeeMutation.mutateAsync(payload);
      await invalidatePayroll();
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
      toast.success(existingEmployee ? 'Карточка сотрудника обновлена.' : 'Сотрудник добавлен.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить сотрудника.');
    }
  };

  const handleToggleArchive = async (employee: Employee) => {
    const existingEmployee = (employeesQuery.data ?? []).find((row) => String(row.id) === employee.id);
    if (!existingEmployee) return;
    try {
      if (existingEmployee.status !== 'archived') await archiveEmployeeMutation.mutateAsync({ id: existingEmployee.id });
      else await updateEmployeeMutation.mutateAsync({
        id: existingEmployee.id,
        userId: existingEmployee.userId,
        fullName: existingEmployee.fullName,
        iin: existingEmployee.iin,
        departmentId: existingEmployee.departmentId,
        positionId: existingEmployee.positionId,
        grossSalary: existingEmployee.grossSalary,
        hireDate: existingEmployee.hireDate,
        birthDate: existingEmployee.birthDate,
        iban: existingEmployee.iban,
        bankName: existingEmployee.bankName,
        applyStandardDeduction: existingEmployee.applyStandardDeduction,
        customDeductionAmount: existingEmployee.customDeductionAmount,
        opvrApplicable: existingEmployee.opvrApplicable,
        status: 'active',
        notes: existingEmployee.notes,
      });
      await invalidatePayroll();
      toast.success(existingEmployee.status === 'archived' ? 'Сотрудник восстановлен.' : 'Сотрудник перемещён в архив.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось изменить статус сотрудника.');
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    const existingEmployee = (employeesQuery.data ?? []).find((row) => String(row.id) === employee.id);
    if (!existingEmployee) return;
    const confirmed = window.confirm(
      `Удалить сотрудника «${employee.fullName}»?\n\nУдаление возможно только если сотрудник ещё не участвует в расчётах. Иначе используйте архивацию.`,
    );
    if (!confirmed) return;
    try {
      await deleteEmployeeMutation.mutateAsync({ id: existingEmployee.id });
      await invalidatePayroll();
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
      setDetailedEmployee((current) => (current?.id === employee.id ? null : current));
      toast.success('Сотрудник удалён.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить сотрудника.');
    }
  };

  const handleFixAuditIssue = async (issue: AuditIssue) => {
    if (issue.actionType === 'apply_deduction' && issue.employeeId) {
      const employee = employees.find((item) => item.id === issue.employeeId);
      if (employee) await handleSaveEmployee({ ...employee, applyStandardDeduction: true });
    } else if (issue.actionType === 'review_salary' && issue.employeeId) {
      setDetailedEmployee(employees.find((item) => item.id === issue.employeeId) ?? null);
    } else if (issue.actionType === 'edit_employee' && issue.employeeId) {
      const employee = employees.find((item) => item.id === issue.employeeId) ?? null;
      setEditingEmployee(employee);
      setIsEmployeeModalOpen(Boolean(employee));
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const result = await utils.payroll.reports.exportJournal.fetch({ format: 'xlsx', ...(selectedPeriodId ? { periodId: selectedPeriodId } : {}) });
      const bytes = Uint8Array.from(atob(result.base64), (character) => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось подготовить экспорт.');
    } finally {
      setIsExporting(false);
    }
  };

  if (location === '/help') {
    return <PayrollHelpModal isOpen onClose={() => navigate('/')} />;
  }

  if (authLoading || !user) {
    return <div className="min-h-screen bg-[#09090b] text-zinc-300 flex items-center justify-center text-sm">Проверка доступа к Smart Payroll РК…</div>;
  }

  if (!isAdmin) {
    return <><Toaster theme="dark" richColors /><PersonalPayslipsPanel isLoading={myPayslipsQuery.isLoading} payslips={myPayslipsQuery.data ?? []} onOpenHelp={() => navigate('/help')} /></>;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#09090b] text-[#fafafa]' : 'bg-[#f4f4f5] text-zinc-900'} transition-colors duration-200`}>
      <Toaster theme={isDarkMode ? 'dark' : 'light'} richColors />
      <Header
        selectedPeriod={selectedPeriod}
        onPeriodChange={selectPeriodByKey}
        periods={(periodsQuery.data ?? []).map((period) => ({ key: period.periodKey, label: new Date(period.year, period.month - 1, 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) }))}
        regulatorySummary={regulatorySummary}
        salaryViewType={salaryViewType}
        onSalaryViewTypeChange={setSalaryViewType}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((value) => !value)}
        payrollStage={payrollStage}
        onStageChange={handleStageChange}
        onOpenNewEmployee={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}
        onExportExcel={handleExportExcel}
        onOpenPayslips={() => { setPayslipTargetEmployee(null); setIsPayslipsModalOpen(true); }}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenDatabase={() => setIsDatabaseModalOpen(true)}
        onOpenHelp={() => navigate('/help')}
        isProcessing={isPayrollProcessing}
        isExporting={isExporting}
        totalEmployees={dashboardQuery.data?.employeeCount ?? employees.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
        <DashboardStats employees={periodEmployees} calculations={calculations} selectedPeriod={periodLabel} selectedPeriodKey={currentPeriod?.periodKey ?? selectedPeriod} history={historyQuery.data ?? []} onSelectPeriod={selectPeriodByKey} onOpenAudit={() => setIsHistoryModalOpen(true)} auditIssuesCount={auditIssues.length} />
        <PayrollAuditBanner issues={auditIssues} onFixIssue={handleFixAuditIssue} onSelectEmployee={(id) => setDetailedEmployee(employees.find((employee) => employee.id === id) ?? null)} deductionLabel={deductionSummary.fullLabel} employeeCount={employees.length} />
        <ViewSwitcher currentMode={displayMode} onModeChange={setDisplayMode} searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedDepartment={selectedDepartment} onDepartmentChange={setSelectedDepartment} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} selectedPayrollStatus={selectedPayrollStatus} onPayrollStatusChange={setSelectedPayrollStatus} selectedEmployeeId={selectedEmployeeId} onEmployeeChange={setSelectedEmployeeId} employees={periodEmployees.map((employee) => ({ id: employee.id, fullName: employee.fullName }))} departments={departments} totalFiltered={filteredEmployees.length} totalAll={periodEmployees.length} />
        {displayMode === 'desktop' ? (
          <DesktopPayrollTable employees={filteredEmployees} calculations={calculations} salaryViewType={salaryViewType} deductionSummary={deductionSummary} onSelectEmployeeForDetails={setDetailedEmployee} onEditEmployee={(employee) => { setEditingEmployee(employee); setIsEmployeeModalOpen(true); }} onToggleArchive={handleToggleArchive} onDeleteEmployee={handleDeleteEmployee} onOpenSinglePayslip={(employee) => { setPayslipTargetEmployee(employee); setIsPayslipsModalOpen(true); }} />
        ) : (
          <MobilePayrollCards employees={filteredEmployees} calculations={calculations} salaryViewType={salaryViewType} deductionSummary={deductionSummary} onSelectEmployeeForDetails={setDetailedEmployee} onEditEmployee={(employee) => { setEditingEmployee(employee); setIsEmployeeModalOpen(true); }} onToggleArchive={handleToggleArchive} onDeleteEmployee={handleDeleteEmployee} onOpenSinglePayslip={(employee) => { setPayslipTargetEmployee(employee); setIsPayslipsModalOpen(true); }} />
        )}
      </main>

      {detailedEmployee && <SalaryDetailModal employee={detailedEmployee} calculation={calculations.get(detailedEmployee.id) ?? null} deductionSummary={deductionSummary} taxProfile={taxProfile} onClose={() => setDetailedEmployee(null)} onOpenPayslip={(employee) => { setDetailedEmployee(null); setPayslipTargetEmployee(employee); setIsPayslipsModalOpen(true); }} />}
      <EmployeeModal isOpen={isEmployeeModalOpen} employee={editingEmployee} departments={departments} deductionLabel={deductionSummary.fullLabel} taxProfile={taxProfile} isSaving={createEmployeeMutation.isPending || updateEmployeeMutation.isPending || createDepartmentMutation.isPending || createPositionMutation.isPending} isDeleting={deleteEmployeeMutation.isPending} onClose={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }} onSave={handleSaveEmployee} onDelete={handleDeleteEmployee} />
      <PayslipsModal isOpen={isPayslipsModalOpen} employees={periodEmployees.filter((employee) => employee.status !== 'archived')} calculations={calculations} selectedEmployee={payslipTargetEmployee} selectedPeriod={periodLabel} selectedPeriodId={selectedPeriodId} onClose={() => { setIsPayslipsModalOpen(false); setPayslipTargetEmployee(null); }} />
      <HistoryLogModal isOpen={isHistoryModalOpen} logs={logs} onClose={() => setIsHistoryModalOpen(false)} />
      <PayrollSettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
      <DatabaseModal isOpen={isDatabaseModalOpen} onClose={() => setIsDatabaseModalOpen(false)} />
    </div>
  );
}
