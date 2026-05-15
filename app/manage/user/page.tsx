'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import UserFormModal, { type ModalState, type UserFormData } from './user-form-modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { StatusPill } from '@/components/StatusPill';
import Pagination from '@/components/Pagination';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import { fmtDateTime } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type User = {
  id: number;
  username: string;
  avatar?: string | null;
  phone?: string | null;
  nickname?: string | null;
  realname?: string | null;
  gender: number;
  identity: number;
  isActive: boolean;
  email?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  wallet: number;
  payCode: string;
  createdAt: string;
  updatedAt: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function initials(name: string) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

function getIdentityLabel(identity: number) {
  return identity === 2 ? '房东' : '用户';
}

function getGenderLabel(gender: number) {
  if (gender === 1) return '男';
  if (gender === 2) return '女';
  return '—';
}

function getEmptyStateText(search: string) {
  if (search.trim()) return '未找到符合条件的用户';
  return '暂无用户数据';
}

/* ─── Action buttons ─────────────────────────────────────────────────────── */
function ActionButtons({
  size = 15,
  onEdit,
  onDelete,
}: {
  size?: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onEdit}
        title="编辑用户"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors active:scale-95 cursor-pointer"
      >
        <Pencil size={size} />
      </button>
      <button
        onClick={onDelete}
        title="删除用户"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-danger hover:bg-danger-bg transition-colors active:scale-95 cursor-pointer"
      >
        <Trash2 size={size} />
      </button>
    </div>
  );
}

/* ─── API types ──────────────────────────────────────────────────────────── */
type UsersResponse = {
  success: boolean;
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

async function fetchUsers(params: { page: number; limit: number; search?: string }): Promise<UsersResponse> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  return request<UsersResponse>(`/manage/user?${qs.toString()}`);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function UserPage() {
  const router = useRouter();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<User[]>([]);
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

    fetchUsers({ page, limit: pageSize, search: debouncedQuery || undefined })
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

  const handleSaved = async (data: UserFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/user/${editingId}`, { method: 'PUT', json: data });
      toast.success('用户信息修改成功');
    } else {
      await request('/manage/user', { method: 'POST', json: data });
      toast.success('用户创建成功');
      setPage(1);
    }
    setRefreshKey((k) => k + 1);
  };

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/user/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('用户删除成功');
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
  const columns = useMemo<Column<User>[]>(() => [
    {
      key: 'username',
      label: '用户',
      render: (user) => (
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push(`/manage/user/${user.id}`)}
        >
          <div className="w-7.5 h-7.5 rounded-full grid place-items-center overflow-hidden shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border">
            {user.avatar ? (
              <img
                src={resolveUploadedFileUrl(user.avatar)}
                alt={user.username}
                className="h-full w-full object-cover"
              />
            ) : (
              initials(user.nickname || user.username)
            )}
          </div>
          <div>
            <p className="text-body font-emphasis text-text leading-none group-hover:text-primary transition-colors">
              {user.nickname || user.username}
            </p>
            <p className="text-tiny text-text-muted font-mono mt-0.5">
              @{user.username} · UID:{user.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: '手机号',
      tdClassName: 'font-mono',
      render: (user) => user.phone || '—',
    },
    {
      key: 'identity',
      label: '身份',
      align: 'center',
      render: (user) => (
        <StatusPill variant={user.identity === 2 ? 'warning' : 'info'}>
          {getIdentityLabel(user.identity)}
        </StatusPill>
      ),
    },
    {
      key: 'gender',
      label: '性别',
      align: 'center',
      render: (user) => (
        <span className="text-body text-text-2">{getGenderLabel(user.gender)}</span>
      ),
    },
    {
      key: 'isActive',
      label: '状态',
      align: 'center',
      render: (user) => (
        <StatusPill variant={user.isActive ? 'success' : 'muted'}>
          {user.isActive ? '正常' : '停用'}
        </StatusPill>
      ),
    },
    {
      key: 'createdAt',
      label: '注册时间',
      tdClassName: 'font-mono',
      render: (user) => fmtDateTime(user.createdAt),
    },
    {
      key: 'updatedAt',
      label: '修改时间',
      tdClassName: 'font-mono',
      render: (user) => fmtDateTime(user.updatedAt),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (user) => (
        <div className="flex justify-end">
          <ActionButtons
            onEdit={() => setModalState({ mode: 'edit', user })}
            onDelete={() => setDeleteTarget(user)}
          />
        </div>
      ),
    },
  ], [setModalState, setDeleteTarget]);

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            用户管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            查看并管理平台注册用户，可编辑用户资料、身份与账号状态。
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
            新建用户
          </button>
        </div>
      </div>

      {/* ── 筛选区 ── */}
      <div className="py-3.5 flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            size={13}
          />
          <input
            type="text"
            placeholder="搜索用户名、手机号、昵称"
            aria-label="搜索用户"
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

        {debouncedQuery.trim() && (
          <button
            onClick={() => { setQuery(''); setPage(1); }}
            className="flex items-center gap-1.5 h-8.5 px-3 rounded-sm text-body-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <X size={13} />
            重置
          </button>
        )}
      </div>

      {/* ── 移动端卡片列表（< md）── */}
      <div className="md:hidden space-y-3">
        {!hasLoadedOnce ? (
          <AppLoading variant="card" rows={4} actionCount={2} />
        ) : list.length === 0 ? (
          <div className="bg-card border border-border rounded shadow-sm py-20 flex flex-col items-center gap-3 opacity-40">
            <Users size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">{getEmptyStateText(debouncedQuery)}</p>
          </div>
        ) : (
          list.map((user) => (
            <div
              key={user.id}
              className="bg-card border border-border rounded shadow-sm p-4 flex items-center gap-3"
            >
              <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/manage/user/${user.id}`)}
              >
                <div className="w-9.5 h-9.5 rounded-full grid place-items-center overflow-hidden shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border">
                  {user.avatar ? (
                    <img
                      src={resolveUploadedFileUrl(user.avatar)}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(user.nickname || user.username)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-body font-emphasis text-text">
                      {user.nickname || user.username}
                    </p>
                    <StatusPill variant={user.identity === 2 ? 'warning' : 'info'}>
                      {getIdentityLabel(user.identity)}
                    </StatusPill>
                    <StatusPill variant={user.isActive ? 'success' : 'muted'}>
                      {user.isActive ? '正常' : '停用'}
                    </StatusPill>
                  </div>
                  <p className="text-tiny text-text-muted font-mono mt-0.5">
                    @{user.username}{user.phone ? ` · ${user.phone}` : ''}
                  </p>
                  <p className="text-tiny text-text-muted font-mono mt-0.5">
                    注册 {fmtDateTime(user.createdAt)}
                  </p>
                </div>
              </div>

              <ActionButtons
                size={15}
                onEdit={() => setModalState({ mode: 'edit', user })}
                onDelete={() => setDeleteTarget(user)}
              />
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
          emptyIcon={<Users size={36} className="text-text-disabled" />}
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

      <UserFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除用户？"
        description={
          deleteTarget ? (
            <>
              用户{' '}
              <span className="font-semibold text-text">
                {deleteTarget.nickname || deleteTarget.username}
              </span>{' '}
              将被永久删除，此操作不可撤销。
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
