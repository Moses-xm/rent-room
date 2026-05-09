import { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const navBtnCls =
  'min-w-[30px] h-[30px] rounded-sm grid place-items-center text-body-sm ' +
  'text-text-2 hover:bg-surface-2 disabled:text-text-disabled disabled:cursor-not-allowed transition-colors';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps) {
  const pageButtons = useMemo(() => {
    const items: (number | '...')[] = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (page > 4) items.push('...');
      for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) {
        items.push(i);
      }
      if (page < totalPages - 3) items.push('...');
      items.push(totalPages);
    }
    return items;
  }, [totalPages, page]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-[18px] py-[14px] border-t border-border-subtle">
      {/* 每页条数 */}
      <div className="flex items-center gap-2 text-body-sm text-text-muted">
        <span>每页</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="选择每页显示条数"
          className="h-[28px] px-2 border border-border rounded-sm bg-card
                     text-text-2 text-body-sm outline-none focus:border-primary transition-colors"
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span>
          条，共{' '}
          <span className="font-semibold text-text tabular-nums">{total}</span> 项
        </span>
      </div>

      {/* 页码 */}
      <div className="flex items-center gap-0.5">
        <button onClick={() => onPageChange(1)} disabled={page <= 1} className={navBtnCls}>
          <ChevronsLeft size={14} />
        </button>
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={navBtnCls}>
          <ChevronLeft size={14} />
        </button>

        {pageButtons.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="min-w-[30px] h-[30px] grid place-items-center text-body-sm text-text-disabled"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[30px] h-[30px] rounded-sm text-body-sm transition-colors ${
                p === page
                  ? 'font-semibold bg-primary text-white'
                  : 'text-text-2 hover:bg-surface-2'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={navBtnCls}>
          <ChevronRight size={14} />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} className={navBtnCls}>
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
