import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { LoadingSpinner } from './LoadingSpinner';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  /** When set (and `onSort` is given) the header becomes a sort button. */
  sortKey?: string;
}

export interface SortState {
  key: string;
  order: 'asc' | 'desc';
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey?: keyof T & string;
  loading?: boolean;
  empty?: ReactNode;
  sort?: SortState;
  onSort?: (sortKey: string) => void;
}

export function Table<T extends object>({ columns, rows, rowKey = 'id' as keyof T & string, loading, empty = 'No results', sort, onSort }: TableProps<T>) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.sortKey;
              return (
                <th key={c.key} scope="col" className={cn('px-4 py-3 font-medium', c.className)} aria-sort={active && sort ? (sort.order === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortKey && onSort ? (
                    <button onClick={() => onSort(c.sortKey as string)} className="inline-flex items-center gap-1 uppercase hover:text-slate-900">
                      {c.header}
                      {active && sort && (sort.order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={cn('divide-y divide-slate-100', loading && rows.length > 0 && 'opacity-60')}>
          {rows.map((row) => (
            <tr key={String(row[rowKey])} className="hover:bg-slate-50">
              {columns.map((c) => (
                <td key={c.key} className={cn('px-4 py-3 text-slate-700', c.className)}>
                  {c.render ? c.render(row) : (row as Record<string, ReactNode>)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">{loading ? <LoadingSpinner /> : empty}</div>
      )}
    </div>
  );
}
