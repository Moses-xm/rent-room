'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Wrench, X } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import FacilityFormModal, {
  type ModalState,
  type FacilityFormData,
} from './facility-form-modal';
import { fmtDateTime } from '@/utils/format';
import { FONT_FAMILY } from '@/utils/constants';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Facility = {
  id: number;
  name: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
};

type FacilitiesResponse = {
  success: boolean;
  data: Facility[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
async function fetchFacilities(params: { page: number; limit: number; search?: string }) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  return request<FacilitiesResponse>(`/manage/facility?${qs.toString()}`);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function FacilityPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<Facility[]>([]);
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

    fetchFacilities({ page, limit: pageSize, search: debouncedQuery || undefined })
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

  const handleSaved = async (data: FacilityFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/facility/${editingId}`, { method: 'PUT', json: data });
      toast.success('设施信息修改成功');
    } else {
      await request('/manage/facility', { method: 'POST', json: data });
      toast.success('设施创建成功');
      setPage(1);
    }
    setRefreshKey((k) => k + 1);
  };

  const [deleteTarget, setDeleteTarget] = useState<Facility | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/facility/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('设施删除成功');
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
  const columns = useMemo<Column<Facility>[]>(() => [
    {
      key: 'name',
      label: '设施名称',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm grid place-items-center bg-surface border border-border shrink-0">
            <i className={`${FONT_FAMILY} ${item.icon} text-base text-text-2`} />
          </div>
          <div>
            <p className="text-body font-emphasis text-text leading-none">{item.name}</p>
            <p className="text-tiny text-text-muted font-mono mt-0.5">ID:{item.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'icon',
      label: '图标类名',
      render: (item) => (
        <code className="text-body-sm text-text-muted bg-surface px-2 py-0.5 rounded font-mono">
          {item.icon}
        </code>
      ),
    },
    {
      key: 'createdAt',
      label: '创建时间',
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
            onClick={() => setModalState({ mode: 'edit', facility: item })}
            title="编辑设施"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            title="删除设施"
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
            房屋设施
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            管理房源配套设施选项，设施将在发布房源时供房东勾选。
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
            新建设施
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
            placeholder="搜索设施名称"
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
            <Wrench size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">
              {debouncedQuery.trim() ? '未找到符合条件的设施' : '暂无设施，请先创建'}
            </p>
          </div>
        ) : (
          list.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-border rounded shadow-sm p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-sm grid place-items-center bg-surface border border-border shrink-0">
                <i className={`${FONT_FAMILY} ${item.icon} text-xl text-text-2`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-body font-emphasis text-text">{item.name}</p>
                <p className="text-tiny text-text-muted font-mono mt-0.5">{item.icon}</p>
                <p className="text-tiny text-text-muted font-mono mt-0.5">
                  创建 {fmtDateTime(item.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setModalState({ mode: 'edit', facility: item })}
                  title="编辑设施"
                  className={`${cardActionBtnCls} hover:bg-surface-2 hover:text-text`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  title="删除设施"
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
          emptyIcon={<Wrench size={36} className="text-text-disabled" />}
          emptyText={debouncedQuery.trim() ? '未找到符合条件的设施' : '暂无设施，请先创建'}
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

      <FacilityFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除设施？"
        description={
          deleteTarget ? (
            <>
              设施{' '}
              <span className="font-semibold text-text">{deleteTarget.name}</span>{' '}
              将被删除，此操作不可撤销。
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
