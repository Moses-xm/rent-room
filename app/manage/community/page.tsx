'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { Plus, Search, Pencil, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import { fmtDateTime } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Community = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string | null;
  streetNumber: string | null;
  subwayLine: string | null;
  lng: number;
  lat: number;
  cover: string;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  success: boolean;
  data: Community[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function parseSubwayLines(raw: string | null): string {
  if (!raw) return '—';
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length > 0 ? arr.join('、') : '—';
  } catch {
    return raw || '—';
  }
}

function getEmptyText(search: string) {
  return search.trim() ? '未找到符合条件的小区' : '暂无小区数据';
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
        title="编辑小区"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors active:scale-95 cursor-pointer"
      >
        <Pencil size={size} />
      </button>
      <button
        onClick={onDelete}
        title="删除小区"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-danger hover:bg-danger-bg transition-colors active:scale-95 cursor-pointer"
      >
        <Trash2 size={size} />
      </button>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CommunityPage() {
  const router = useRouter();
  const [list, setList] = useState<Community[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Community | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('limit', String(pageSize));
    if (debouncedQuery) qs.set('search', debouncedQuery);

    request<ListResponse>(`/manage/community?${qs}`)
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
        if (!cancelled) { setLoading(false); setHasLoadedOnce(true); }
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedQuery, refreshKey]);

  const handlePageChange = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/community/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('小区删除成功');
      if (list.length === 1 && page > 1) setPage((p) => p - 1);
      else setRefreshKey((k) => k + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ─── Column definitions ─────────────────────────────────────────────── */
  const columns = useMemo<Column<Community>[]>(() => [
    {
      key: 'name',
      label: '小区',
      render: (c) => (
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push(`/manage/community/${c.id}`)}
        >
          <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-surface border border-border">
            {c.cover ? (
              <img
                src={resolveUploadedFileUrl(c.cover)}
                alt={c.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center">
                <MapPin size={14} className="text-text-disabled" />
              </div>
            )}
          </div>
          <div>
            <p className="text-body font-emphasis text-text leading-none group-hover:text-primary transition-colors">{c.name}</p>
            <p className="text-tiny text-text-muted font-mono mt-0.5">ID: {c.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      label: '位置',
      render: (c) => (
        <span className="text-body text-text-2">
          {[c.province, c.city, c.district].filter(Boolean).join(' ')}
          {c.street ? ` ${c.street}` : ''}
          {c.streetNumber ? c.streetNumber : ''}
        </span>
      ),
    },
    {
      key: 'subway',
      label: '地铁',
      render: (c) => (
        <span className="text-body text-text-2">{parseSubwayLines(c.subwayLine)}</span>
      ),
    },
    {
      key: 'coords',
      label: '经纬度',
      tdClassName: 'font-mono',
      render: (c) => (
        <span className="text-body-sm text-text-muted">
          {c.lng.toFixed(5)}, {c.lat.toFixed(5)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: '创建时间',
      tdClassName: 'font-mono',
      render: (c) => fmtDateTime(c.createdAt),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end">
          <ActionButtons
            onEdit={() => router.push(`/manage/community/${c.id}/edit`)}
            onDelete={() => setDeleteTarget(c)}
          />
        </div>
      ),
    },
  ], [router]);

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            小区管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            管理平台录入的所有小区信息，支持地图定位与地址解析。
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => router.push('/manage/community/new')}
            className="h-8.5 px-3.5 text-body rounded-sm font-medium
                       bg-primary text-white hover:bg-primary-dark transition-colors
                       flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            新建小区
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
            placeholder="搜索小区名、城市、区"
            aria-label="搜索小区"
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
            <MapPin size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">{getEmptyText(debouncedQuery)}</p>
          </div>
        ) : (
          list.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded shadow-sm p-4 flex items-start gap-3"
            >
              <div
                className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/manage/community/${c.id}`)}
              >
                <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-surface border border-border">
                  {c.cover ? (
                    <img
                      src={resolveUploadedFileUrl(c.cover)}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <MapPin size={16} className="text-text-disabled" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-emphasis text-text">{c.name}</p>
                  <p className="text-tiny text-text-muted mt-0.5">
                    {[c.province, c.city, c.district, c.street].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-tiny text-text-muted font-mono mt-0.5">
                    {c.lng.toFixed(5)}, {c.lat.toFixed(5)}
                  </p>
                </div>
              </div>
              <ActionButtons
                size={15}
                onEdit={() => router.push(`/manage/community/${c.id}/edit`)}
                onDelete={() => setDeleteTarget(c)}
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
          emptyIcon={<MapPin size={36} className="text-text-disabled" />}
          emptyText={getEmptyText(debouncedQuery)}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除小区？"
        description={
          deleteTarget ? (
            <>
              小区{' '}
              <span className="font-semibold text-text">{deleteTarget.name}</span>{' '}
              将被永久删除，此操作不可撤销。
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
