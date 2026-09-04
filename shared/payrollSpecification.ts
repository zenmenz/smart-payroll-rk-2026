export const payrollSpecification = {
  version: "1.0.0",
  scope: "Backend-first implementation without seeded records or new visual elements.",
  roles: [
    {
      id: "admin",
      title: "Владелец / администратор",
      access: "Полный доступ к кадровым данным, периодам, справочникам, расчётам, журналу, отчётам и аудиту.",
    },
    {
      id: "user",
      title: "Сотрудник",
      access: "Доступ только к собственным расчётным листкам после привязки учётной записи к карточке сотрудника.",
    },
  ],
  tables: [
    { id: "employees", title: "Сотрудники", purpose: "Кадровые и платёжные реквизиты, статус, вычеты и связь с учётной записью." },
    { id: "departments", title: "Подразделения", purpose: "Редактируемый справочник подразделений." },
    { id: "positions", title: "Должности", purpose: "Редактируемый справочник должностей с необязательной привязкой к подразделению." },
    { id: "accrualTypes", title: "Типы начислений и удержаний", purpose: "Справочник ручных строк расчёта с признаком налогообложения." },
    { id: "taxProfiles", title: "Профили ставок", purpose: "Версионируемые МРП, МЗП, ставки и пределы баз по датам действия." },
    { id: "payrollPeriods", title: "Расчётные периоды", purpose: "Месяц, статус открытия/закрытия и выбранный профиль ставок." },
    { id: "employeePayrollItems", title: "Строки начислений", purpose: "Дополнительные начисления и удержания сотрудника в периоде." },
    { id: "payrollCalculations", title: "Расчёты и листки", purpose: "Воспроизводимый снимок результата расчёта с сохранённым профилем ставок." },
    { id: "auditLogs", title: "Аудит", purpose: "Неизменяемая история ключевых операций пользователей." },
  ],
  actions: [
    { id: "employee.create", title: "Создать сотрудника", role: "admin" },
    { id: "employee.update", title: "Изменить сотрудника", role: "admin" },
    { id: "employee.archive", title: "Архивировать сотрудника", role: "admin" },
    { id: "employee.delete", title: "Удалить сотрудника без расчётной истории", role: "admin" },
    { id: "period.create", title: "Создать расчётный период", role: "admin" },
    { id: "period.close", title: "Закрыть период", role: "admin" },
    { id: "period.reopen", title: "Открыть закрытый период", role: "admin" },
    { id: "payroll.calculate", title: "Пересчитать открытый период", role: "admin" },
    { id: "report.export", title: "Экспортировать CSV/XLSX", role: "admin" },
    { id: "payslip.my", title: "Просмотреть собственные листки", role: "user" },
  ],
} as const;
