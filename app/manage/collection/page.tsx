'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import CollectionFormModal, {
  type ModalState,
  type CollectionFormData,
} from './collection-form-modal';
import { fmtDateTime } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CollectionItem = {
  id: number;
  userId: number;
  roomId: number;
  createdAt: string;
  updatedAt: string;
  user: { id: number; username: string; nickname: string | null } | null;
  room: { id: number; name: string; roomCode: string } | null;
};

type CollectionsResponse = {
  success: boolean;
  data: CollectionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
async function fetchCollections(params: { page: number; limit: number; search?: string }) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  return request<CollectionsResponse>(`/manage/collection?${qs.toString()}`);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CollectionPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<CollectionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchCollections({ page, limit: pageSize, search: debouncedQuery || undefined })
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setList(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          if (res.totalPages > 0 && page > res.totalPages) setPage(res.totalPages);
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

  const handleSaved = async (data: CollectionFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/collection/${editingId}`, { method: 'PUT', json: data });
      toast.success('收藏记录修改成功');
    } else {
      await request('/manage/collection', { method: 'POST', json: data });
      toast.success('收藏记录创建成功');
      setPage(1);
    }
    setRefreshKey((k) => k + 1);
  };

  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/collection/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('收藏记录删除成功');
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
  const columns = useMemo<Column<CollectionItem>[]>(() => [
    {
      key: 'user',
      label: '用户',
      render: (item) => item.user ? (
        <div>
          <p className="text-body font-emphasis text-text leading-none">{item.user.username}</p>
          {item.user.nickname && (
            <p className="text-tiny text-text-muted mt-0.5">{item.user.nickname}</p>
          )}
          <p className="text-tiny text-text-muted font-mono mt-0.5">ID:{item.user.id}</p>
        </div>
      ) : (
        <span className="text-body-sm text-text-muted">—</span>
      ),
    },
    {
      key: 'room',
      label: '房源',
      render: (item) => item.room ? (
        <div>
          <p className="text-body font-emphasis text-text leading-none line-clamp-1">{item.room.name}</p>
          <p className="text-tiny text-text-muted font-mono mt-0.5">{item.room.roomCode}</p>
        </div>
      ) : (
        <span className="text-body-sm text-text-muted">—</span>
      ),
    },
    {
      key: 'createdAt',
      label: '收藏时间',
      tdClassName: 'font-mono',
      render: (item) => fmtDateTime(item.createdAt),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end items-center gap-0.5">
          <button
            onClick={() => setModalState({ mode: 'edit', collection: item })}
            title="编辑收藏"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            title="删除收藏"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], []);

  /* ─── Mobile card button ──────────────────────────────────────────────── */
  const cardActionBtnCls =
    'w-8 h-8 rounded-sm grid place-items-center text-text-muted transition-colors active:scale-95 cursor-pointer';

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            收藏管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            查看和管理用户的房源收藏记录。
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setModalState({ mode: 'add' })}
            className="h-8.5 px-3.5 text-body rounded-sm font-medium
                       bg-primary text-white hover:bg-primary-dark transition-colors
                       flex items-center justify-center gap-2"
          >
            <Plus size={14} strokeWidth={2.5} />
            新增收藏
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
            placeholder="搜索用户名、昵称、房源名或编号"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
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
            <Heart size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">
              {debouncedQuery.trim() ? '未找到符合条件的收藏记录' : '暂无收藏记录'}
            </p>
          </div>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded shadow-sm p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-sm grid place-items-center bg-surface border border-border shrink-0 mt-0.5">
                  <Heart size={15} className="text-text-muted" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-body font-emphasis text-text">
                      {item.user?.username ?? '—'}
                    </span>
                    {item.user?.nickname && (
                      <span className="text-body-sm text-text-muted">（{item.user.nickname}）</span>
                    )}
                  </div>
                  <p className="text-body-sm text-text-muted mt-0.5 line-clamp-1">
                    {item.room?.name ?? '—'}
                  </p>
                  <p className="text-tiny text-text-muted font-mono mt-0.5">
                    {item.room?.roomCode ?? ''} · 收藏于 {fmtDateTime(item.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setModalState({ mode: 'edit', collection: item })}
                    title="编辑收藏"
                    className={`${cardActionBtnCls} hover:bg-surface-2 hover:text-text`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    title="删除收藏"
                    className={`${cardActionBtnCls} hover:text-danger hover:bg-danger-bg`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
          emptyIcon={<Heart size={36} className="text-text-disabled" />}
          emptyText={debouncedQuery.trim() ? '未找到符合条件的收藏记录' : '暂无收藏记录'}
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

      <CollectionFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除收藏记录？"
        description={
          deleteTarget ? (
            <>
              用户{' '}
              <span className="font-semibold text-text">{deleteTarget.user?.username ?? `ID:${deleteTarget.userId}`}</span>{' '}
              对房源{' '}
              <span className="font-semibold text-text">{deleteTarget.room?.name ?? `ID:${deleteTarget.roomId}`}</span>{' '}
              的收藏将被删除，此操作不可撤销。
            </>
          ) : undefined
        }
        confirmText="确认删除"
        cancelText="取消"
        loading={isDeleting}
        danger
        icon={<Trash2 size={32} />}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
