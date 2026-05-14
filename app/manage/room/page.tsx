'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { Plus, Search, Pencil, Trash2, Eye, Home } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import { fmtDate } from '@/utils/format';
import { RENT_TYPE_OPTIONS } from '@/utils/constants';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CommunitySnap = { id: number; name: string; city: string; district: string };
type PublisherSnap = { id: number; username: string; nickname: string | null; realname: string | null };

type Room = {
  id: number;
  name: string;
  cmyId: number;
  rentType: number;
  roomType: string;
  price: number;
  area: number;
  bedroom: number;
  parlour: number;
  bathroom: number;
  cover: string;
  roomCode: string;
  isPublished: number;
  isRented: number;
  publishTime: string | null;
  publisherId: number;
  createdAt: string;
  community: CommunitySnap | null;
  publisher: PublisherSnap | null;
};

type ListResponse = {
  success: boolean;
  data: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function publishedPill(v: number) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-success-bg text-success font-medium">已发布</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-surface-2 text-text-muted font-medium">未发布</span>;
}

function rentedPill(v: number) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-warning-bg text-warning font-medium">已租出</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-primary-tint text-primary font-medium">待出租</span>;
}

function rentTypeLabel(v: number) {
  return RENT_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? '—';
}

function publisherLabel(p: PublisherSnap | null) {
  if (!p) return '—';
  const parts = [p.username];
  if (p.nickname) parts.push(p.nickname);
  if (p.realname) parts.push(`(${p.realname})`);
  return parts.join(' ');
}

/* ─── Action buttons ─────────────────────────────────────────────────────── */
function ActionButtons({ onDetail, onEdit, onDelete }: {
  onDetail: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5 justify-end">
      <button onClick={onDetail} title="查看详情"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer">
        <Eye size={15} />
      </button>
      <button onClick={onEdit} title="编辑房源"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-primary transition-colors cursor-pointer">
        <Pencil size={15} />
      </button>
      <button onClick={onDelete} title="删除房源"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

/* ─── Mobile card ─────────────────────────────────────────────────────────── */
function MobileCard({ room, onDetail, onEdit, onDelete }: {
  room: Room; onDetail: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const coverUrl = resolveUploadedFileUrl(room.cover);
  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden flex gap-3 p-3">
      <div className="w-20 h-16 rounded-md shrink-0 overflow-hidden bg-surface">
        {coverUrl
          ? <img src={coverUrl} alt={room.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Home size={18} className="text-text-disabled" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body font-emphasis text-text truncate">{room.name}</p>
        <p className="text-caption text-text-muted mt-0.5">{room.community?.name ?? '—'} · {rentTypeLabel(room.rentType)}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {publishedPill(room.isPublished)}
          {room.isPublished === 2 && rentedPill(room.isRented)}
          <span className="text-caption text-text-muted ml-auto">¥{room.price.toLocaleString()}/月</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 shrink-0">
        <button onClick={onDetail} className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"><Eye size={13} /></button>
        <button onClick={onEdit} className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-primary transition-colors cursor-pointer"><Pencil size={13} /></button>
        <button onClick={onDelete} className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function RoomPage() {
  const router = useRouter();
  const [list, setList] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isPublishedFilter, setIsPublishedFilter] = useState('');
  const [isRentedFilter, setIsRentedFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedQuery,
        ...(isPublishedFilter ? { isPublished: isPublishedFilter } : {}),
        ...(isRentedFilter ? { isRented: isRentedFilter } : {}),
      });
      const res = await request<ListResponse>(`/manage/room?${params}`);
      if (res.success) {
        setList(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => { fetchList(); }, [page, pageSize, debouncedQuery, isPublishedFilter, isRentedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await request(`/manage/room/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success(`已删除房源「${deleteTarget.name}」`);
      setDeleteTarget(null);
      fetchList();
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<Column<Room>[]>(() => [
    {
      key: 'cover',
      label: '封面',
      render: (r) => {
        const url = resolveUploadedFileUrl(r.cover);
        return (
          <div className="w-16 h-11 rounded-md overflow-hidden bg-surface shrink-0">
            {url
              ? <img src={url} alt={r.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Home size={14} className="text-text-disabled" /></div>
            }
          </div>
        );
      },
    },
    {
      key: 'name',
      label: '房源',
      render: (r) => (
        <div>
          <p className="text-body font-emphasis text-text">{r.name}</p>
          <p className="text-caption text-text-muted mt-0.5 font-mono">{r.roomCode}</p>
        </div>
      ),
    },
    {
      key: 'community',
      label: '小区',
      render: (r) => (
        <div>
          <p className="text-body text-text">{r.community?.name ?? '—'}</p>
          <p className="text-caption text-text-muted">{r.community ? `${r.community.city} ${r.community.district}` : ''}</p>
        </div>
      ),
    },
    {
      key: 'publisher',
      label: '发布人',
      render: (r) => <span className="text-body text-text-2">{publisherLabel(r.publisher)}</span>,
    },
    {
      key: 'price',
      label: '价格',
      align: 'right',
      render: (r) => (
        <div className="text-right">
          <p className="text-body font-emphasis text-text">¥{r.price.toLocaleString()}</p>
          <p className="text-caption text-text-muted">{r.area}㎡ · {r.bedroom}室{r.parlour}厅</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center',
      render: (r) => (
        <div className="flex flex-col items-center gap-1">
          {publishedPill(r.isPublished)}
          {r.isPublished === 2 && rentedPill(r.isRented)}
        </div>
      ),
    },
    {
      key: 'publishTime',
      label: '发布时间',
      render: (r) => (
        <span className="text-body-sm text-text-muted font-mono">
          {r.publishTime ? fmtDate(r.publishTime) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (r) => (
        <ActionButtons
          onDetail={() => router.push(`/manage/room/${r.id}`)}
          onEdit={() => router.push(`/manage/room/${r.id}/edit`)}
          onDelete={() => setDeleteTarget(r)}
        />
      ),
    },
  ], [router]);

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            房源管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            管理所有租赁房源，跟踪发布与出租状态。
          </div>
        </div>
        <button
          onClick={() => router.push('/manage/room/new')}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-1.5 shrink-0 sm:self-end"
        >
          <Plus size={15} strokeWidth={2.5} />
          新建房源
        </button>
      </div>

      {/* ── 筛选区 ── */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="搜索房源名称或编号…"
            className="w-full h-8.5 pl-9 pr-3 border border-border rounded-sm bg-card text-text text-body outline-none
                       transition-[border-color,box-shadow] hover:border-text-disabled
                       focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                       placeholder:text-text-muted"
          />
        </div>
        <select
          value={isPublishedFilter}
          onChange={(e) => { setIsPublishedFilter(e.target.value); setPage(1); }}
          className="h-8.5 px-3 border border-border rounded-sm bg-card text-text-2 text-body outline-none focus:border-primary transition-colors min-w-28"
        >
          <option value="">全部状态</option>
          <option value="1">未发布</option>
          <option value="2">已发布</option>
        </select>
        <select
          value={isRentedFilter}
          onChange={(e) => { setIsRentedFilter(e.target.value); setPage(1); }}
          className="h-8.5 px-3 border border-border rounded-sm bg-card text-text-2 text-body outline-none focus:border-primary transition-colors min-w-28"
        >
          <option value="">全部租出</option>
          <option value="1">待出租</option>
          <option value="2">已租出</option>
        </select>
        <span className="ml-auto text-body-sm text-text-muted tabular-nums">
          共 <span className="font-semibold text-text">{total}</span> 套房源
        </span>
      </div>

      {/* ── 桌面表格 ── */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={list}
          rowKey={(r) => r.id}
          loading={loading}
          hasLoaded={hasLoadedOnce}
          skeletonRows={6}
          emptyIcon={<Home size={36} />}
          emptyText={debouncedQuery ? '未找到符合条件的房源' : '暂无房源数据'}
          pagination={{
            page, pageSize, total, totalPages,
            onPageChange: setPage,
            onPageSizeChange: (s) => { setPageSize(s); setPage(1); },
          }}
        />
      </div>

      {/* ── 移动端卡片 ── */}
      <div className="md:hidden space-y-3">
        {!hasLoadedOnce ? (
          <AppLoading variant="card" rows={4} actionCount={3} />
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-text-muted">
            <Home size={36} className="opacity-25" />
            <p className="text-body">{debouncedQuery ? '未找到符合条件的房源' : '暂无房源数据'}</p>
          </div>
        ) : (
          list.map((room) => (
            <MobileCard
              key={room.id}
              room={room}
              onDetail={() => router.push(`/manage/room/${room.id}`)}
              onEdit={() => router.push(`/manage/room/${room.id}/edit`)}
              onDelete={() => setDeleteTarget(room)}
            />
          ))
        )}
      </div>

      {/* ── 删除确认 ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除房源"
        description={deleteTarget ? `确定要删除房源「${deleteTarget.name}」吗？此操作不可撤销。` : ''}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
