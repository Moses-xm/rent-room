'use client';

import { useEffect, useMemo, useState } from 'react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminFormModal, {
  type ModalState,
  type AdminFormData,
} from './admin-form-modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { StatusPill } from '@/components/StatusPill';
import Pagination from '@/components/Pagination';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import { fmtDateTime } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Admin = {
  id: number;
  username: string;
  avatar?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
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

async function fetchAdmins(params: {
  page: number;
  limit: number;
  search?: string;
}): Promise<AdminsResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  return request<AdminsResponse>(`/manage/admin?${qs.toString()}`);
}

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
  const [refreshKey, setRefreshKey] = useState(0);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchAdmins({ page, limit: pageSize, search: debouncedQuery || undefined })
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setList(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          if (res.totalPages > 0 && page > res.totalPages) {
            setPage(res.totalPages);
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedQuery, refreshKey]);

  const handlePageChange = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); };

  const handleSaved = async (data: AdminFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/admin/${editingId}`, { method: 'PUT', json: data });
      toast.success('管理员信息修改成功');
    } else {
      await request('/manage/admin', { method: 'POST', json: data });
      toast.success('管理员创建成功');
      setPage(1);
    }
    setRefreshKey((k) => k + 1);
  };

  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/admin/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('管理员删除成功');
      if (list.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        setRefreshKey((k) => k + 1);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  /* ─── Column definitions ──────────────────────────────────────────────── */
  const columns = useMemo<Column<Admin>[]>(() => [
    {
      key: 'username',
      label: '用户名',
      render: (admin) => (
        <div className="flex items-center gap-3">
          <div className="w-7.5 h-7.5 rounded-full grid place-items-center overflow-hidden shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border">
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
            <p className="text-body font-emphasis text-text leading-none">{admin.username}</p>
            <p className="text-tiny text-text-muted font-mono mt-0.5">UID:{admin.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      label: '状态',
      align: 'center',
      render: (admin) => (
        <StatusPill variant={admin.isActive ? 'success' : 'muted'}>
          {admin.isActive ? '正常' : '停用'}
        </StatusPill>
      ),
    },
    {
      key: 'createdAt',
      label: '创建时间',
      tdClassName: 'font-mono',
      render: (admin) => fmtDateTime(admin.createdAt),
    },
    {
      key: 'updatedAt',
      label: '最后修改',
      tdClassName: 'font-mono',
      render: (admin) => fmtDateTime(admin.updatedAt),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (admin) => (
        <div className="flex justify-end items-center gap-0.5">
          <button
            onClick={() => setModalState({ mode: 'edit', admin })}
            title="编辑管理员"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(admin)}
            title="删除管理员"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], []);

  /* ─── Mobile card action button ───────────────────────────────────────── */
  const cardActionBtnCls =
    'w-8 h-8 rounded-sm grid place-items-center text-text-muted transition-colors active:scale-95 cursor-pointer';

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            管理员账号
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            统一维护管理员账号、启用状态与基础资料，相关操作将记录到审计日志。
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setModalState({ mode: 'add' })}
            className="h-8.5 px-3.5 text-body rounded-sm font-medium
                       bg-primary text-white hover:bg-primary-dark transition-colors
                       flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            新建管理员
          </button>
        </div>
      </div>

      {/* ── 筛选区 ── */}
      <div className="py-3.5 flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-60">
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
            className="w-full h-8.5 pl-9 pr-3 border border-border rounded-sm
                       bg-card text-text text-body outline-none
                       transition-[border-color,box-shadow]
                       hover:border-text-disabled
                       focus:border-primary
                       focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                       placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* ── 移动端卡片列表（< md）── */}
      <div className="md:hidden space-y-3">
        {!hasLoadedOnce ? (
          <AppLoading variant="card" rows={4} actionCount={2} />
        ) : list.length === 0 ? (
          <div className="bg-card border border-border rounded shadow-sm py-20 flex flex-col items-center gap-3 opacity-40">
            <ShieldCheck size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">{getEmptyStateText(debouncedQuery)}</p>
          </div>
        ) : (
          list.map((admin) => (
            <div
              key={admin.id}
              className="bg-card border border-border rounded shadow-sm p-4 flex items-center gap-3"
            >
              <div className="w-9.5 h-9.5 rounded-full grid place-items-center overflow-hidden shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border">
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

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-body font-emphasis text-text">{admin.username}</p>
                  <StatusPill variant={admin.isActive ? 'success' : 'muted'}>
                    {admin.isActive ? '正常' : '停用'}
                  </StatusPill>
                </div>
                <p className="text-tiny text-text-muted font-mono mt-0.5">
                  创建 {fmtDateTime(admin.createdAt)}
                </p>
                <p className="text-tiny text-text-muted font-mono mt-0.5">
                  修改 {fmtDateTime(admin.updatedAt)}
                </p>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setModalState({ mode: 'edit', admin })}
                  title="编辑管理员"
                  className={`${cardActionBtnCls} hover:bg-surface-2 hover:text-text`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(admin)}
                  title="删除管理员"
                  className={`${cardActionBtnCls} hover:text-danger hover:bg-danger-bg`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}

        {hasLoadedOnce && total > 0 && (
          <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* ── 桌面端表格（≥ md）── */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={list}
          rowKey={(r) => r.id}
          loading={loading}
          hasLoaded={hasLoadedOnce}
          skeletonRows={5}
          emptyIcon={<ShieldCheck size={36} className="text-text-disabled" />}
          emptyText={getEmptyStateText(debouncedQuery)}
          pagination={{
            page,
            pageSize,
            total,
            totalPages,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
        />
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
