import React from 'react';
import { Monitor, Smartphone, Search } from 'lucide-react';
import { DisplayMode, EmployeeStatus, PayrollStage } from '../types/payroll';

interface ViewSwitcherProps {
  currentMode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  selectedStatus: EmployeeStatus | 'all';
  onStatusChange: (status: EmployeeStatus | 'all') => void;
  selectedPayrollStatus: PayrollStage | 'all';
  onPayrollStatusChange: (status: PayrollStage | 'all') => void;
  selectedEmployeeId: string;
  onEmployeeChange: (employeeId: string) => void;
  employees: Array<{ id: string; fullName: string }>;
  departments: string[];
  totalFiltered: number;
  totalAll: number;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentMode, onModeChange, searchQuery, onSearchChange, selectedDepartment, onDepartmentChange, selectedStatus, onStatusChange,
  selectedPayrollStatus, onPayrollStatusChange, selectedEmployeeId, onEmployeeChange, employees, departments, totalFiltered, totalAll,
}) => {
  const employeeStatuses: { value: EmployeeStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Все статусы сотрудников' }, { value: 'active', label: 'Активен' }, { value: 'new', label: 'Новый' }, { value: 'vacation', label: 'В отпуске' }, { value: 'sick', label: 'Больничный' }, { value: 'quitting', label: 'Увольняется' }, { value: 'archived', label: 'Архив' },
  ];
  const payrollStatuses: { value: PayrollStage | 'all'; label: string }[] = [
    { value: 'all', label: 'Все выплаты' }, { value: 'draft', label: 'Черновик' }, { value: 'verified', label: 'Проверено' }, { value: 'approved', label: 'Утверждено' }, { value: 'paid', label: 'Выплачено' },
  ];
  const selectClass = 'bg-[#121215] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/60 cursor-pointer';

  return <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-3 sm:p-4 mb-6 backdrop-blur-sm shadow-sm">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-2"><div className="inline-flex p-1 bg-[#121215] rounded-xl border border-zinc-800 shadow-inner"><button onClick={() => onModeChange('desktop')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${currentMode === 'desktop' ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}><Monitor className="w-4 h-4" /><span>Компьютер (Таблица)</span></button><button onClick={() => onModeChange('mobile')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${currentMode === 'mobile' ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}><Smartphone className="w-4 h-4" /><span>Мобильная версия (Карточки)</span></button></div><span className="text-xs text-zinc-400 hidden sm:inline ml-2">Показано: <span className="font-semibold text-zinc-200">{totalFiltered}</span> из {totalAll} сотрудников</span></div>
      <div className="flex flex-wrap items-center gap-2.5"><div className="relative flex-1 sm:w-56"><Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Поиск по ФИО, должности, ИИН..." className="w-full bg-[#121215] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors" /></div><select value={selectedDepartment} onChange={(event) => onDepartmentChange(event.target.value)} className={selectClass}><option value="all" className="bg-[#18181b]">Все отделы</option>{departments.map((department) => <option key={department} value={department} className="bg-[#18181b]">{department}</option>)}</select><select value={selectedEmployeeId} onChange={(event) => onEmployeeChange(event.target.value)} className={selectClass}><option value="all" className="bg-[#18181b]">Все сотрудники</option>{employees.map((employee) => <option key={employee.id} value={employee.id} className="bg-[#18181b]">{employee.fullName}</option>)}</select><select value={selectedStatus} onChange={(event) => onStatusChange(event.target.value as EmployeeStatus | 'all')} className={selectClass}>{employeeStatuses.map((option) => <option key={option.value} value={option.value} className="bg-[#18181b]">{option.label}</option>)}</select><select value={selectedPayrollStatus} onChange={(event) => onPayrollStatusChange(event.target.value as PayrollStage | 'all')} className={selectClass}>{payrollStatuses.map((option) => <option key={option.value} value={option.value} className="bg-[#18181b]">{option.label}</option>)}</select></div>
    </div>
  </div>;
};
