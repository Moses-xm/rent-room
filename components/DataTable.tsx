'use client';

import React from 'react';
import AppLoading from './AppLoading';
import LoadingDimmer from './LoadingDimmer';
import Pagination from './Pagination';

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const thBase =
  'text-caption font-emphasis text-text-muted uppercase tracking-[.04em] ' +
  'px-4 py-[10px] bg-surface-2 border-t border-b border-border-subtle whitespace-nowrap';

const tdBase =
  'px-4 py-[14px] border-b border-border-subtle align-middle text-text-2 text-body';

const alignCls = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type Column<T> = {
  key: string;
  label: string;
  align?: keyof typeof alignCls;
  thClassName?: string;
  tdClassName?: string;
  render: (row: T) => React.ReactNode;
};

type PaginationConfig = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  hasLoaded?: boolean;
  skeletonRows?: number;
  emptyIcon?: React.ReactNode;
  emptyText?: string;
  pagination?: PaginationConfig;
  className?: string;
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  hasLoaded = true,
  skeletonRows = 5,
  emptyIcon,
  emptyText = '暂无数据',
  pagination,
  className,
}: DataTableProps<T>) {
  if (!hasLoaded) {
    return <AppLoading variant="table" rows={skeletonRows} columns={columns.length} />;
  }

  return (
    <div className={`bg-card border border-border rounded shadow-sm overflow-hidden${className ? ` ${className}` : ''}`}>
      <LoadingDimmer loading={loading}>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      thBase,
                      alignCls[col.align ?? 'left'],
                      col.thClassName ?? '',
                    ].join(' ')}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-24 text-center">
                    {loading ? (
                      <div className="h-32" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        {emptyIcon}
                        <p className="text-body text-text-muted">{emptyText}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-surface transition-colors">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={[
                          tdBase,
                          alignCls[col.align ?? 'left'],
                          col.tdClassName ?? '',
                        ].join(' ')}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > 0 && (
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
            onPageSizeChange={pagination.onPageSizeChange}
          />
        )}
      </LoadingDimmer>
    </div>
  );
}
