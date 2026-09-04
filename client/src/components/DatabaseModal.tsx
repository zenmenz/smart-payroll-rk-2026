import React, { useMemo, useState } from 'react';
import { Database, RefreshCw, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatCell(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  return String(value);
}

export function DatabaseModal({ isOpen, onClose }: DatabaseModalProps) {
  const [selectedTableId, setSelectedTableId] = useState('employees');
  const tablesQuery = trpc.payroll.database.tables.useQuery(undefined, { enabled: isOpen });
  const tables = tablesQuery.data ?? [];
  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? tables[0] ?? null,
    [tables, selectedTableId],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#09090b]/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-[#18181b] border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 border-b border-zinc-800 bg-[#121215] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#fafafa]">База данных</h3>
              <p className="text-xs text-zinc-400">Живые таблицы MySQL. Новые сотрудники и записи появляются сразу после сохранения.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => tablesQuery.refetch()}
              disabled={tablesQuery.isFetching}
              className="px-3 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tablesQuery.isFetching ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside className="w-56 shrink-0 border-r border-zinc-800 bg-[#121215] overflow-y-auto p-3 space-y-1">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTableId(table.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  selectedTable?.id === table.id
                    ? 'bg-emerald-500 text-zinc-950'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <span className="block truncate">{table.label}</span>
                <span className={selectedTable?.id === table.id ? 'text-zinc-800' : 'text-zinc-500'}>
                  {table.rowCount} запис.
                </span>
              </button>
            ))}
          </aside>

          <div className="flex-1 overflow-auto p-4">
            {tablesQuery.isLoading && <p className="text-sm text-zinc-400">Загрузка таблиц…</p>}
            {tablesQuery.error && <p className="text-sm text-rose-400">Не удалось загрузить базу данных.</p>}
            {!tablesQuery.isLoading && selectedTable && selectedTable.rows.length === 0 && (
              <div className="h-full min-h-48 flex items-center justify-center text-sm text-zinc-500">
                Записей пока нет
              </div>
            )}
            {selectedTable && selectedTable.rows.length > 0 && (
              <table className="min-w-full text-left text-[11px] border-collapse">
                <thead className="sticky top-0 bg-[#18181b]">
                  <tr>
                    {selectedTable.columns.map((column) => (
                      <th key={column} className="px-2 py-2 border-b border-zinc-800 text-zinc-400 font-semibold whitespace-nowrap">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedTable.rows.map((row, index) => (
                    <tr key={String(row.id ?? index)} className="odd:bg-[#121215]/60">
                      {selectedTable.columns.map((column) => (
                        <td key={column} className="px-2 py-2 border-b border-zinc-800/80 text-zinc-200 whitespace-nowrap max-w-[280px] truncate" title={formatCell(row[column])}>
                          {formatCell(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
