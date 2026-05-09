'use client';

import { useEffect, useMemo, useState } from 'react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminFormModal, {
  type ModalState,
  type AdminFormData,
} from './admin-form-modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { StatusPill } from '@/components/StatusPill';
import AppLoading from '@/components/AppLoading';
import LoadingDimmer from '@/components/LoadingDimmer';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Admin = {
  id: number;
  username: string;
  avatar?: string | null;
  isActive: boolean;
  created: string;
  modified: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}`;
}

function initials(name: string) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

function getEmptyStateText(search: string) {
  if (search.trim()) return '未找到符合条件的管理员账号';
  return '暂无管理员账号，请先创建';
}

/* ─── API types ──────────────────────────────────────────────────────────── */
type AdminsResponse = {
  success: boolean;
  data: Admin[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type FetchParams = { page: number; limit: number; search?: string };

const adminToast = {
  createSuccess: '管理员创建成功',
  updateSuccess: '管理员信息修改成功',
  deleteSuccess: '管理员删除成功',
} as const;

async function fetchAdmins(params: FetchParams): Promise<AdminsResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  return request<AdminsResponse>(`/manage/admin?${qs.toString()}`);
}

/* ─── Shared className fragments ─────────────────────────────────────────── */
const thCls =
  'text-left text-[11.5px] font-medium text-text-muted uppercase tracking-[.04em] ' +
  'px-4 py-[10px] bg-surface-2 border-t border-b border-border-subtle whitespace-nowrap';

const tdCls =
  'px-4 py-[14px] border-b border-border-subtle align-middle text-text-2 text-[13px]';

const navBtnCls =
  'min-w-[30px] h-[30px] rounded-sm grid place-items-center text-[12.5px] ' +
  'text-text-2 hover:bg-surface-2 disabled:text-text-disabled disabled:cursor-not-allowed transition-colors';

const pageSizeOptions = [5, 10, 20, 50];

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const refreshData = () => {
    setLoading(true);
    fetchAdmins({ page, limit: pageSize, search: debouncedQuery || undefined })
      .then((res) => {
        if (res.success) {
          setList(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setHasLoadedOnce(true);
      });
  };

  useEffect(() => {
    refreshData();
  }, [page, pageSize, debouncedQuery]);

  const safePage = Math.min(page, totalPages || 1);

  const pageNums = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 9) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 4) pages.push('...');
      for (
        let i = Math.max(2, safePage - 2);
        i <= Math.min(totalPages - 1, safePage + 2);
        i++
      )
        pages.push(i);
      if (safePage < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaved = async (data: AdminFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/admin/${editingId}`, { method: 'PUT', json: data });
      toast.success(adminToast.updateSuccess);
    } else {
      await request('/manage/admin', { method: 'POST', json: data });
      toast.success(adminToast.createSuccess);
    }
    refreshData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/admin/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      refreshData();
      toast.success(adminToast.deleteSuccess);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-[26px] font-medium tracking-tight text-text leading-[1.1] m-0">
            管理员账号
          </h1>
          <div className="text-[13px] text-text-muted mt-[6px]">
            统一维护管理员账号、启用状态与基础资料，相关操作将记录到审计日志。
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setModalState({ mode: 'add' })}
            className="h-[34px] px-[14px] text-[13px] rounded-sm font-medium
                       bg-primary text-white hover:bg-primary-dark transition-colors
                       flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={2.5} />
            新建管理员
          </button>
        </div>
      </div>

      {/* ── 卡片：工具栏 + 表格 + 分页 ── */}
      {!hasLoadedOnce ? (
        <AppLoading rows={5} columns={5} />
      ) : (
        <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
          <LoadingDimmer loading={loading}>
            {/* 工具栏 */}
            <div className="flex items-center gap-[10px] px-[18px] py-[14px] border-b border-border-subtle flex-wrap">
              <div className="relative w-60">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  size={13}
                />
                <input
                  type="text"
                  placeholder="搜索用户名"
                  aria-label="搜索管理员"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-[34px] pl-9 pr-3 border border-border rounded-sm
                             bg-card text-text text-[13px] outline-none
                             transition-[border-color,box-shadow]
                             hover:border-text-disabled
                             focus:border-primary
                             focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                             placeholder:text-text-subtle"
                />
              </div>
            </div>

            {/* 表格 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr>
                    <th className={thCls}>用户名</th>
                    <th className={`${thCls} text-center`}>状态</th>
                    <th className={thCls}>创建时间</th>
                    <th className={thCls}>最后修改</th>
                    <th className={`${thCls} text-right`}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        {loading ? (
                          <div className="h-32" />
                        ) : (
                          <div className="flex flex-col items-center gap-3 opacity-40">
                            <ShieldCheck size={36} className="text-text-disabled" />
                            <p className="text-[13px] text-text-muted">
                              {getEmptyStateText(debouncedQuery)}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    list.map((admin) => (
                      <tr key={admin.id} className="hover:bg-surface transition-colors">
                        {/* 用户名 */}
                        <td className={tdCls}>
                          <div className="flex items-center gap-3">
                            <div className="w-[30px] h-[30px] rounded-full grid place-items-center overflow-hidden shrink-0 bg-primary-tint text-primary-dark text-[12px] font-semibold border border-border">
                              {admin.avatar ? (
                                <img
                                  src={resolveUploadedFileUrl(admin.avatar)}
                                  alt={admin.username}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                initials(admin.username)
                              )}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-text leading-none">
                                {admin.username}
                              </p>
                              <p className="text-[11px] text-text-muted font-mono mt-0.5">
                                UID:{admin.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 状态 */}
                        <td className={`${tdCls} text-center`}>
                          <StatusPill variant={admin.isActive ? 'success' : 'muted'}>
                            {admin.isActive ? '正常' : '停用'}
                          </StatusPill>
                        </td>

                        {/* 时间 */}
                        <td className={`${tdCls} font-mono`}>
                          {fmtDateTime(admin.created)}
                        </td>
                        <td className={`${tdCls} font-mono`}>
                          {fmtDateTime(admin.modified)}
                        </td>

                        {/* 操作 */}
                        <td className={`${tdCls} text-right`}>
                          <div className="flex justify-end items-center gap-0.5">
                            <button
                              onClick={() => setModalState({ mode: 'edit', admin })}
                              title="编辑管理员"
                              className="w-[30px] h-[30px] rounded-sm grid place-items-center
                                         text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(admin)}
                              title="删除管理员"
                              className="w-[30px] h-[30px] rounded-sm grid place-items-center
                                         text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-[18px] py-[14px] border-t border-border-subtle">
                {/* 每页条数 */}
                <div className="flex items-center gap-2 text-[12.5px] text-text-muted">
                  <span>每页</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    aria-label="选择每页显示条数"
                    className="h-[28px] px-2 border border-border rounded-sm bg-card
                               text-text-2 text-[12.5px] outline-none
                               focus:border-primary transition-colors"
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <span>
                    条，共{' '}
                    <span className="font-semibold text-text tabular-nums">{total}</span>{' '}
                    项
                  </span>
                </div>

                {/* 页码 */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setPage(1)}
                    disabled={safePage === 1}
                    className={navBtnCls}
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className={navBtnCls}
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {pageNums.map((p, i) =>
                    p === '...' ? (
                      <span
                        key={`e${i}`}
                        className="min-w-[30px] h-[30px] grid place-items-center text-[12.5px] text-text-disabled"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[30px] h-[30px] rounded-sm text-[12.5px] transition-colors ${
                          p === safePage
                            ? 'font-semibold bg-primary text-white'
                            : 'text-text-2 hover:bg-surface-2'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className={navBtnCls}
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={safePage === totalPages}
                    className={navBtnCls}
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </LoadingDimmer>
        </div>
      )}

      <AdminFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除管理员？"
        description={
          deleteTarget ? (
            <>
              管理员账户{' '}
              <span className="font-semibold text-text">{deleteTarget.username}</span>{' '}
              将被删除，此操作不可撤销。
            </>
          ) : undefined
        }
        confirmText="确认删除"
        cancelText="取消"
        loading={isDeleting}
        danger
        icon={<Trash2 size={32} />}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
