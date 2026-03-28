'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { toast, Toaster } from 'sonner';
import AdminFormModal, {
  type ModalState,
  type AdminFormData,
} from './admin-form-modal';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  if (!name) return '??';
  return name.trim().charAt(0).toUpperCase();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}

function getEmptyStateText(search: string, loading: boolean) {
  if (loading) return '正在加载管理员列表...';
  if (search.trim()) return '未找到符合条件的管理员账号';
  return '暂无管理员账号，请先创建账号';
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
  loadError: '管理员列表加载失败',
  createSuccess: '管理员创建成功',
  createError: '管理员创建失败',
  updateSuccess: '管理员信息修改成功',
  updateError: '管理员信息修改失败',
  deleteSuccess: '管理员删除成功',
  deleteError: '管理员删除失败',
} as const;

async function fetchAdmins(params: FetchParams): Promise<AdminsResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  return request<AdminsResponse>(`/admin?${qs.toString()}`);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<Admin[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

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
      .catch((err) => {
        console.error(err);
        toast.error(adminToast.loadError);
      })
      .finally(() => setLoading(false));
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
    try {
      if (editingId) {
        await request(`/admin/${editingId}`, { method: 'PUT', json: data });
        toast.success(adminToast.updateSuccess);
      } else {
        await request('/admin', { method: 'POST', json: data });
        toast.success(adminToast.createSuccess);
      }
      refreshData();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(err) ||
          (editingId ? adminToast.updateError : adminToast.createError),
      );
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    try {
      setIsDeleting(true);
      await request(`/admin/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      refreshData();
      toast.success(adminToast.deleteSuccess);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || adminToast.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const navBtn =
    'flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 cursor-pointer hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 border border-transparent';
  const tableHeadCell =
    'px-6 py-4 text-[15px] font-semibold text-slate-600 tracking-wide';
  const pageSizeOptions = [5, 10, 20, 50];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Toaster position="top-right" richColors />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">管理员账号</h1>
          <p className="text-sm text-slate-500 mt-1">
            统一维护管理员账号、启用状态与基础资料，相关操作将记录到审计日志。
          </p>
        </div>
        <button
          onClick={() => setModalState({ mode: 'add' })}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-50 hover:bg-primary-600 transition-all active:scale-95"
        >
          <Plus size={18} /> 新建管理员
        </button>
      </div>

      <div className="relative w-full sm:w-80">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          placeholder="搜索用户名或 UID"
          aria-label="搜索管理员"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-100/80 border-b border-slate-200">
              <tr>
                <th className={tableHeadCell}>
                  账号信息
                </th>
                <th className={`${tableHeadCell} text-center`}>
                  状态
                </th>
                <th className={tableHeadCell}>
                  创建时间
                </th>
                <th className={tableHeadCell}>
                  最后修改
                </th>
                <th className={`${tableHeadCell} text-right`}>
                  管理操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                        <ShieldCheck size={48} className="text-slate-300" />
                      <p className="text-sm font-bold text-slate-500">
                        {getEmptyStateText(debouncedQuery, loading)}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((admin) => (
                  <tr
                    key={admin.id}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-50 text-primary font-bold overflow-hidden border-2 border-white shadow-sm ring-1 ring-primary-100">
                          {admin.avatar ? (
                            <img
                              src={admin.avatar}
                              alt={admin.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials(admin.username)
                          )}
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-slate-900">
                            {admin.username}
                          </p>
                          <p className="text-xs text-slate-400 font-mono tracking-tight opacity-80">
                            UID:{admin.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${admin.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}
                        />
                        {admin.isActive ? '正常工作' : '暂停服务'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium font-mono">
                      {fmtDateTime(admin.created)}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-medium font-mono">
                      {fmtDateTime(admin.modified)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          onClick={() => setModalState({ mode: 'edit', admin })}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-all active:scale-95"
                          title="编辑管理员"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(admin)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                          title="删除管理员"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 bg-slate-50/30 border-t border-slate-100">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="whitespace-nowrap">每页显示</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="选择每页显示条数"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-50"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="whitespace-nowrap">
                条，共 <span className="font-semibold text-slate-900">{total}</span>{' '}
                项
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                className={navBtn}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={navBtn}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 text-sm text-slate-500 whitespace-nowrap">
                第 <span className="font-semibold text-slate-900">{safePage}</span> /{' '}
                {totalPages} 页
              </span>
              <div className="flex items-center gap-1 mx-2">
                {pageNums.map((p, i) =>
                  p === '...' ? (
                    <span
                      key={`e${i}`}
                      className="text-slate-300 px-1 font-bold"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                        p === safePage
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary-50'
                          : 'text-slate-500 bg-white border-slate-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className={navBtn}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={safePage === totalPages}
                className={navBtn}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

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
              <span className="font-bold text-slate-900">
                {deleteTarget.username}
              </span>{' '}
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
