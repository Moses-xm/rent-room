'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, ShoppingCart, X, Eye, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';

import { ORDER_TYPE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/utils/constants';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type OrderItem = {
  id: number;
  contractId: number;
  payerId: number;
  payeeId: number;
  roomId: number;
  type: number;
  fee: number | null;
  pledge: number | null;
  paidPeriod: string | null;
  payerDeleted: boolean;
  payeeDeleted: boolean;
  createdAt: string;
  payer: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
  payee: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
  room: { id: number; name: string; roomCode: string; cover: string } | null;
  contract: { id: number; onlineTime: string; offlineTime: string } | null;
};

type OrdersResponse = {
  success: boolean;
  data: OrderItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Type pill ───────────────────────────────────────────────────────────── */
const ORDER_TYPE_STYLE: Record<number, string> = {
  1: 'bg-violet-50 text-violet-600',
  2: 'bg-sky-50 text-sky-600',
  3: 'bg-emerald-50 text-emerald-600',
};
const ORDER_TYPE_LABEL: Record<number, string> = {
  1: '首期款',
  2: '续期房租',
  3: '押金退款',
};

function TypePill({ type }: { type: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium whitespace-nowrap ${ORDER_TYPE_STYLE[type] ?? 'bg-slate-100 text-slate-500'}`}>
      {ORDER_TYPE_LABEL[type] ?? '未知'}
    </span>
  );
}

/* ─── User avatar ─────────────────────────────────────────────────────────── */
function UserAvatar({ user }: { user: { username: string; nickname: string | null; avatar: string | null } }) {
  return (
    <div className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border overflow-hidden">
      {user.avatar
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={resolveUploadedFileUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
        : (user.nickname || user.username).charAt(0).toUpperCase()}
    </div>
  );
}

/* ─── Room thumbnail ──────────────────────────────────────────────────────── */
function RoomThumb({ room }: { room: OrderItem['room'] }) {
  if (!room) return null;
  const url = resolveUploadedFileUrl(room.cover);
  return (
    <div className="w-10 h-10 rounded overflow-hidden border border-border bg-surface-2 shrink-0">
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt={room.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full grid place-items-center text-text-disabled"><Building2 size={14} /></div>
      }
    </div>
  );
}

/* ─── Fetch helpers ───────────────────────────────────────────────────────── */
async function fetchOrders(params: {
  page: number; limit: number; search?: string; type?: string;
  payerId?: string; payeeId?: string; roomId?: string;
}) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search)  qs.set('search',  params.search);
  if (params.type)    qs.set('type',    params.type);
  if (params.payerId) qs.set('payerId', params.payerId);
  if (params.payeeId) qs.set('payeeId', params.payeeId);
  if (params.roomId)  qs.set('roomId',  params.roomId);
  return request<OrdersResponse>(`/manage/order?${qs.toString()}`);
}

type UserOption = { value: string; label: string };
type RoomOption = { value: string; label: string };

async function fetchUserOptions(): Promise<UserOption[]> {
  const res = await request<{ success: boolean; data: { id: number; username: string; nickname: string | null }[] }>(
    '/manage/user?page=1&limit=1000',
    { silent: true },
  );
  if (!res.success) return [];
  return res.data.map((u) => ({
    value: String(u.id),
    label: u.nickname ? `${u.username}（${u.nickname}）` : u.username,
  }));
}

async function fetchRoomOptions(): Promise<RoomOption[]> {
  const res = await request<{ success: boolean; data: { id: number; name: string; roomCode: string }[] }>(
    '/manage/room?page=1&limit=1000',
    { silent: true },
  );
  if (!res.success) return [];
  return res.data.map((r) => ({
    value: String(r.id),
    label: `${r.name}（${r.roomCode}）`,
  }));
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function OrderPage() {
  const [list, setList]               = useState<OrderItem[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [query, setQuery]             = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageSize, setPageSize]       = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage]               = useState(1);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [typeFilter, setTypeFilter]     = useState('');
  const [payerIdFilter, setPayerIdFilter] = useState('');
  const [payeeIdFilter, setPayeeIdFilter] = useState('');
  const [roomIdFilter, setRoomIdFilter]   = useState('');

  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [roomOptions, setRoomOptions] = useState<RoomOption[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<OrderItem | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  useEffect(() => {
    Promise.all([fetchUserOptions(), fetchRoomOptions()]).then(([users, rooms]) => {
      setUserOptions(users);
      setRoomOptions(rooms);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchOrders({
      page, limit: pageSize,
      search:  debouncedQuery || undefined,
      type:    typeFilter     || undefined,
      payerId: payerIdFilter  || undefined,
      payeeId: payeeIdFilter  || undefined,
      roomId:  roomIdFilter   || undefined,
    })
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
  }, [page, pageSize, debouncedQuery, typeFilter, payerIdFilter, payeeIdFilter, roomIdFilter, refreshKey]);

  const handlePageChange     = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/order/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('订单删除成功');
      if (list.length === 1 && page > 1) setPage((p) => p - 1);
      else setRefreshKey((k) => k + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasFilter = !!(debouncedQuery.trim() || typeFilter || payerIdFilter || payeeIdFilter || roomIdFilter);
  const clearFilters = () => {
    setQuery(''); setTypeFilter('');
    setPayerIdFilter(''); setPayeeIdFilter(''); setRoomIdFilter('');
    setPage(1);
  };

  /* ─── Column definitions ──────────────────────────────────────────────── */
  const columns = useMemo<Column<OrderItem>[]>(() => [
    {
      key: 'room',
      label: '房源',
      render: (item) => item.room ? (
        <Link href={`/manage/room/${item.room.id}`} className="flex items-center gap-2 group/room">
          <RoomThumb room={item.room} />
          <div className="min-w-0">
            <p className="text-body-sm font-emphasis text-text group-hover/room:text-primary transition-colors leading-none truncate max-w-64">
              {item.room.name}
            </p>
            <p className="text-tiny text-text-muted mt-0.5 font-mono">{item.room.roomCode}</p>
          </div>
        </Link>
      ) : <span className="text-body-sm text-text-muted">—</span>,
    },
    {
      key: 'payer',
      label: '付款人',
      render: (item) => item.payer ? (
        <Link href={`/manage/user/${item.payer.id}`} className="flex items-center gap-2 group/u w-fit">
          <UserAvatar user={item.payer} />
          <div className="min-w-0">
            <p className="text-body-sm font-emphasis text-text group-hover/u:text-primary transition-colors leading-none">{item.payer.username}</p>
            {item.payer.nickname && <p className="text-tiny text-text-muted mt-0.5 truncate">{item.payer.nickname}</p>}
          </div>
        </Link>
      ) : <span className="text-body-sm text-text-muted">—</span>,
    },
    {
      key: 'payee',
      label: '收款人',
      render: (item) => item.payee ? (
        <Link href={`/manage/user/${item.payee.id}`} className="flex items-center gap-2 group/u w-fit">
          <UserAvatar user={item.payee} />
          <div className="min-w-0">
            <p className="text-body-sm font-emphasis text-text group-hover/u:text-primary transition-colors leading-none">{item.payee.username}</p>
            {item.payee.nickname && <p className="text-tiny text-text-muted mt-0.5 truncate">{item.payee.nickname}</p>}
          </div>
        </Link>
      ) : <span className="text-body-sm text-text-muted">—</span>,
    },
    {
      key: 'fee',
      label: '付款金额',
      align: 'right',
      tdClassName: 'font-mono',
      render: (item) => {
        const displayAmount = item.type === 3 ? item.pledge : item.fee;
        return (
          <div className="text-right">
            {displayAmount != null
              ? <p className="text-body-sm text-text font-medium">¥{displayAmount.toFixed(2)}</p>
              : <p className="text-text-muted">—</p>}
            {item.type === 1 && item.pledge != null && (
              <p className="text-tiny text-text-muted mt-0.5">押金 ¥{item.pledge.toFixed(2)}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'type',
      label: '类型',
      align: 'center',
      render: (item) => (
        <div className="flex flex-col items-center gap-1">
          <TypePill type={item.type} />
          <Link
            href={`/manage/contract/${item.contractId}`}
            className="text-tiny text-primary hover:underline font-mono"
          >
            合同#{item.contractId}
          </Link>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end items-center gap-0.5">
          <Link
            href={`/manage/order/${item.id}`}
            title="查看详情"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:text-primary hover:bg-primary-tint transition-colors"
          >
            <Eye size={15} />
          </Link>
          <button
            onClick={() => setDeleteTarget(item)}
            title="删除订单"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], []);

  const cardBtnCls = 'w-8 h-8 rounded-sm grid place-items-center text-text-muted transition-colors active:scale-95 cursor-pointer';

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            订单管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            查看系统生成的所有交易订单记录。
          </div>
        </div>
      </div>

      {/* ── 筛选区 ── */}
      <div className="py-3.5 flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
          <input
            type="text"
            placeholder="搜索付款人用户名/房源名/编号"
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
        <FilterSelect
          value={payerIdFilter}
          onChange={(v) => { setPayerIdFilter(v); setPage(1); }}
          placeholder="全部付款人"
          className="w-full sm:w-36"
          options={userOptions}
        />
        <FilterSelect
          value={payeeIdFilter}
          onChange={(v) => { setPayeeIdFilter(v); setPage(1); }}
          placeholder="全部收款人"
          className="w-full sm:w-36"
          options={userOptions}
        />
        <FilterSelect
          value={roomIdFilter}
          onChange={(v) => { setRoomIdFilter(v); setPage(1); }}
          placeholder="全部房源"
          className="w-full sm:w-48"
          options={roomOptions}
        />
        <FilterSelect
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
          placeholder="全部类型"
          className="w-full sm:w-36"
          options={ORDER_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        />
        {hasFilter && (
          <button
            onClick={clearFilters}
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
            <ShoppingCart size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">
              {hasFilter ? '未找到符合条件的订单记录' : '暂无订单记录'}
            </p>
          </div>
        ) : (
          list.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded shadow-sm overflow-hidden">

              {/* 头部：类型 + 合同 + 金额 */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <TypePill type={item.type} />
                  <Link
                    href={`/manage/contract/${item.contractId}`}
                    className="text-tiny text-primary hover:underline font-mono shrink-0"
                  >
                    合同#{item.contractId}
                  </Link>
                </div>
                <div className="text-right shrink-0">
                  {(() => {
                    const displayAmount = item.type === 3 ? item.pledge : item.fee;
                    return displayAmount != null
                      ? <p className="text-body-sm font-mono font-medium text-text">¥{displayAmount.toFixed(2)}</p>
                      : null;
                  })()}
                  {item.type === 1 && item.pledge != null && (
                    <p className="text-tiny text-text-muted font-mono">押金 ¥{item.pledge.toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div className="mx-4 border-t border-border" />

              {/* 房源 + 当事人 */}
              <div className="px-4 py-3 space-y-2">
                {item.room && (
                  <Link href={`/manage/room/${item.room.id}`} className="flex items-center gap-2 group/room">
                    <RoomThumb room={item.room} />
                    <div className="min-w-0">
                      <p className="text-body-sm text-text group-hover/room:text-primary transition-colors truncate">{item.room.name}</p>
                      <p className="text-tiny text-text-muted font-mono">{item.room.roomCode}</p>
                    </div>
                  </Link>
                )}
                <div className="flex items-center gap-3">
                  {item.payer && (
                    <Link href={`/manage/user/${item.payer.id}`} className="flex items-center gap-1.5 group/u min-w-0">
                      <UserAvatar user={item.payer} />
                      <div className="min-w-0">
                        <p className="text-body-sm text-text group-hover/u:text-primary transition-colors truncate">{item.payer.username}</p>
                        <p className="text-tiny text-text-muted">付款人</p>
                      </div>
                    </Link>
                  )}
                  {item.payer && item.payee && (
                    <span className="text-text-muted text-tiny shrink-0">→</span>
                  )}
                  {item.payee && (
                    <Link href={`/manage/user/${item.payee.id}`} className="flex items-center gap-1.5 group/u min-w-0">
                      <UserAvatar user={item.payee} />
                      <div className="min-w-0">
                        <p className="text-body-sm text-text group-hover/u:text-primary transition-colors truncate">{item.payee.username}</p>
                        <p className="text-tiny text-text-muted">收款人</p>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              <div className="mx-4 border-t border-border" />

              {/* 操作 */}
              <div className="flex items-center justify-end gap-0.5 px-4 py-2">
                <Link
                  href={`/manage/order/${item.id}`}
                  title="查看详情"
                  className={`${cardBtnCls} hover:text-primary hover:bg-primary-tint`}
                >
                  <Eye size={16} />
                </Link>
                <button
                  onClick={() => setDeleteTarget(item)}
                  title="删除"
                  className={`${cardBtnCls} hover:text-danger hover:bg-danger-bg`}
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
          emptyIcon={<ShoppingCart size={36} className="text-text-disabled" />}
          emptyText={hasFilter ? '未找到符合条件的订单记录' : '暂无订单记录'}
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
        title="确认删除订单？"
        description={
          deleteTarget ? (
            <>
              订单{' '}
              <span className="font-semibold text-text">#{deleteTarget.id}</span>{' '}
              将被永久移除，相关钱包流水记录不受影响，此操作不可撤销。
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
