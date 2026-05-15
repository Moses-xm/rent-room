'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, X, FileText, Home, CheckCircle2,
  Pencil, Trash2, CreditCard, RefreshCw, LogOut, Clock,
} from 'lucide-react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';
import { fmtDate, fmtDateTime } from '@/utils/format';
import { CONTRACT_STATUS_OPTIONS, CHECKOUT_OPTIONS } from '@/utils/constants';
import PayModal from './pay-modal';
import RenewModal from './renew-modal';
import CheckoutModal from './checkout-modal';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type ContractItem = {
  id: number;
  userId: number;
  roomId: number;
  landlordId: number;
  tenancy: number;
  onlineTime: string;
  offlineTime: string;
  pledge: number;
  fee: number;
  paidPeriod: string;
  payingPeriod: string;
  renewTimes: number;
  renewMonths: number;
  status: number;
  isCheckout: boolean;
  checkoutTime: string | null;
  refund: boolean | null;
  landlordDeleted: boolean;
  userDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
  room: { id: number; name: string; roomCode: string; cover: string; price: number; pledge: number; pay: number; minTenancy: number } | null;
  landlord: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
};

type ContractsResponse = {
  success: boolean;
  data: ContractItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Status pills ─────────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<number, string> = {
  1: 'bg-sky-50 text-sky-600',
  2: 'bg-emerald-50 text-emerald-600',
};
const STATUS_LABEL: Record<number, string> = { 1: '进行中', 2: '已完成' };

function StatusPill({ status }: { status: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {STATUS_LABEL[status] ?? '未知'}
    </span>
  );
}

function CheckoutPill({ isCheckout, refund }: { isCheckout: boolean; refund: boolean | null }) {
  if (!isCheckout) return <span className="text-tiny text-text-muted">未退房</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium ${refund ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
      {refund ? '合法退房' : '提前退房'}
    </span>
  );
}

/* ─── Fetch ────────────────────────────────────────────────────────────────── */
async function fetchContracts(params: {
  page: number; limit: number; search?: string; status?: string; isCheckout?: string;
}) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search)     qs.set('search',     params.search);
  if (params.status)     qs.set('status',     params.status);
  if (params.isCheckout) qs.set('isCheckout', params.isCheckout);
  return request<ContractsResponse>(`/manage/contract?${qs.toString()}`);
}

/* ─── User avatar cell ─────────────────────────────────────────────────────── */
function UserCell({ user, label }: { user: ContractItem['user']; label: string }) {
  if (!user) return <span className="text-body-sm text-text-muted">—</span>;
  return (
    <Link href={`/manage/user/${user.id}`} className="flex items-center gap-2 group/u w-fit">
      <div className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border overflow-hidden">
        {user.avatar
          ? <img src={resolveUploadedFileUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
          : (user.nickname || user.username).charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-body-sm font-emphasis text-text group-hover/u:text-primary leading-none transition-colors">{user.username}</p>
        {user.nickname && <p className="text-tiny text-text-muted mt-0.5">{user.nickname}</p>}
      </div>
    </Link>
  );
  void label;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ContractPage() {
  const [list, setList] = useState<ContractItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [checkoutFilter, setCheckoutFilter] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<ContractItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [payTarget, setPayTarget]         = useState<ContractItem | null>(null);
  const [renewTarget, setRenewTarget]     = useState<ContractItem | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<ContractItem | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchContracts({ page, limit: pageSize, search: debouncedQuery || undefined, status: statusFilter || undefined, isCheckout: checkoutFilter || undefined })
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
      .finally(() => { if (!cancelled) { setLoading(false); setHasLoadedOnce(true); } });
    return () => { cancelled = true; };
  }, [page, pageSize, debouncedQuery, statusFilter, checkoutFilter, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);
  const handlePageChange = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); };

  const hasFilter = !!(debouncedQuery.trim() || statusFilter || checkoutFilter);
  const clearFilters = () => { setQuery(''); setStatusFilter(''); setCheckoutFilter(''); setPage(1); };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/contract/${deleteTarget.id}`, { method: 'DELETE', json: {} });
      setDeleteTarget(null);
      toast.success('合同删除成功');
      if (list.length === 1 && page > 1) setPage((p) => p - 1);
      else refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  /* ─── Columns ─────────────────────────────────────────────────────────── */
  const columns = useMemo<Column<ContractItem>[]>(() => [
    {
      key: 'id',
      label: '合同 ID',
      render: (item) => <span className="font-mono text-body-sm text-text-muted">#{item.id}</span>,
    },
    {
      key: 'room',
      label: '房源',
      render: (item) => item.room ? (
        <Link href={`/manage/room/${item.room.id}`} className="flex items-center gap-2 group/room w-fit max-w-44">
          <div className="w-8 h-8 rounded shrink-0 bg-surface border border-border overflow-hidden flex items-center justify-center">
            {item.room.cover
              ? <img src={resolveUploadedFileUrl(item.room.cover)} alt={item.room.name} className="w-full h-full object-cover" />
              : <Home size={13} className="text-text-muted" />}
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-emphasis text-text group-hover/room:text-primary leading-none truncate transition-colors">{item.room.name}</p>
            <p className="text-tiny text-text-muted font-mono mt-0.5">{item.room.roomCode}</p>
          </div>
        </Link>
      ) : <span className="text-body-sm text-text-muted">—</span>,
    },
    {
      key: 'user',
      label: '租客',
      render: (item) => <UserCell user={item.user} label="租客" />,
    },
    {
      key: 'landlord',
      label: '房东',
      render: (item) => <UserCell user={item.landlord} label="房东" />,
    },
    {
      key: 'time',
      label: '租期',
      render: (item) => (
        <div className="text-body-sm">
          <p className="font-mono text-text">{fmtDate(item.onlineTime)} ~ {fmtDate(item.offlineTime)}</p>
          <p className="text-text-muted mt-0.5">{item.tenancy} 个月</p>
        </div>
      ),
    },
    {
      key: 'pledge',
      label: '押金',
      render: (item) => <span className="text-body-sm font-mono text-text">¥{item.pledge.toFixed(0)}</span>,
    },
    {
      key: 'fee',
      label: '月租/期',
      render: (item) => (
        <div className="text-body-sm">
          <p className="font-mono text-text">¥{item.fee.toFixed(0)}</p>
          <p className="text-tiny text-text-muted">/{item.room?.pay ?? '?'}月</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center',
      render: (item) => (
        <div className="flex flex-col items-center gap-1">
          <StatusPill status={item.status} />
          <CheckoutPill isCheckout={item.isCheckout} refund={item.refund} />
        </div>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (item) => <ActionButtons item={item} />,
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [refreshKey]);

  function ActionButtons({ item }: { item: ContractItem }) {
    const canEdit     = item.status === 1 && !item.isCheckout;
    const canPay      = item.status === 1 && !item.isCheckout;
    const canRenew    = item.status === 1 && !item.isCheckout;
    const canCheckout = item.status === 1 && !item.isCheckout;
    const canDelete   = item.isCheckout;

    return (
      <div className="flex justify-end items-center gap-0.5">
        {canEdit && (
          <Link href={`/manage/contract/${item.id}/edit`} title="编辑合同" className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-primary hover:bg-primary-50 transition-colors">
            <Pencil size={14} />
          </Link>
        )}
        {canPay && (
          <button onClick={() => setPayTarget(item)} title="交房租" className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
            <CreditCard size={14} />
          </button>
        )}
        {canRenew && (
          <button onClick={() => setRenewTarget(item)} title="续租" className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer">
            <RefreshCw size={14} />
          </button>
        )}
        {canCheckout && (
          <button onClick={() => setCheckoutTarget(item)} title="退房" className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-orange-500 hover:bg-orange-50 transition-colors cursor-pointer">
            <LogOut size={14} />
          </button>
        )}
        <Link href={`/manage/contract/${item.id}`} title="查看详情" className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-text hover:bg-surface-2 transition-colors">
          <FileText size={14} />
        </Link>
        {canDelete && (
          <button onClick={() => setDeleteTarget(item)} title="删除合同" className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  }

  const cardBtnCls = 'w-8 h-8 rounded-sm grid place-items-center text-text-muted transition-colors active:scale-95 cursor-pointer';

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            合同管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            查看和管理租房合同，支持交房租、续租、退房等操作。
          </div>
        </div>
        <Link
          href="/manage/contract/new"
          className="h-8.5 px-3.5 text-body rounded-sm font-medium
                     bg-primary text-white hover:bg-primary-dark transition-colors
                     flex items-center justify-center gap-2 cursor-pointer shrink-0 w-fit"
        >
          <Plus size={14} strokeWidth={2.5} />
          新建合同
        </Link>
      </div>

      {/* ── 筛选区 ── */}
      <div className="py-3.5 flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
          <input
            type="text"
            placeholder="搜索租客/房东/房源名称或编号"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="w-full h-8.5 pl-9 pr-3 border border-border rounded-sm bg-card text-text text-body outline-none
                       transition-[border-color,box-shadow] hover:border-text-disabled focus:border-primary
                       focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                       placeholder:text-text-muted"
          />
        </div>
        <FilterSelect
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          placeholder="全部状态"
          className="w-full sm:w-36"
          options={CONTRACT_STATUS_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        />
        <FilterSelect
          value={checkoutFilter}
          onChange={(v) => { setCheckoutFilter(v); setPage(1); }}
          placeholder="全部退房状态"
          className="w-full sm:w-40"
          options={CHECKOUT_OPTIONS}
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

      {/* ── 移动端卡片 ── */}
      <div className="md:hidden space-y-3">
        {!hasLoadedOnce ? (
          <AppLoading variant="card" rows={4} actionCount={3} />
        ) : list.length === 0 ? (
          <div className="bg-card border border-border rounded shadow-sm py-20 flex flex-col items-center gap-3 opacity-40">
            <FileText size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">{hasFilter ? '未找到符合条件的合同' : '暂无合同记录'}</p>
          </div>
        ) : (
          list.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded shadow-sm overflow-hidden">
              {/* 房源行 */}
              <Link href={`/manage/contract/${item.id}`} className="flex items-center gap-3 px-4 pt-4 pb-3 group/room">
                <div className="w-10 h-10 rounded shrink-0 bg-surface border border-border overflow-hidden flex items-center justify-center">
                  {item.room?.cover
                    ? <img src={resolveUploadedFileUrl(item.room.cover)} alt={item.room.name} className="w-full h-full object-cover" />
                    : <Home size={15} className="text-text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-emphasis text-text group-hover/room:text-primary transition-colors leading-none truncate">{item.room?.name ?? '—'}</p>
                  <p className="text-tiny text-text-muted font-mono mt-0.5">{item.room?.roomCode ?? ''}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={item.status} />
                  <CheckoutPill isCheckout={item.isCheckout} refund={item.refund} />
                </div>
              </Link>
              <div className="mx-4 border-t border-border" />
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-tiny text-text-muted">租客</p>
                  <p className="text-body-sm font-emphasis text-text truncate">{item.user?.username ?? '—'}</p>
                </div>
                <div className="shrink-0 w-px h-5 bg-border" />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-tiny text-text-muted">房东</p>
                  <p className="text-body-sm font-emphasis text-text truncate">{item.landlord?.username ?? '—'}</p>
                </div>
              </div>
              <div className="mx-4 border-t border-border" />
              <div className="flex items-center gap-2 px-4 py-2.5">
                <div className="flex-1">
                  <p className="text-tiny text-text-muted font-mono">{fmtDate(item.onlineTime)} ~ {fmtDate(item.offlineTime)}</p>
                  <p className="text-tiny text-text-muted">押金 ¥{item.pledge.toFixed(0)} · {item.tenancy}个月</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {item.status === 1 && !item.isCheckout && (
                    <>
                      <button onClick={() => setPayTarget(item)}     title="交房租" className={`${cardBtnCls} hover:text-emerald-600 hover:bg-emerald-50`}><CreditCard size={15} /></button>
                      <button onClick={() => setRenewTarget(item)}   title="续租"   className={`${cardBtnCls} hover:text-sky-600 hover:bg-sky-50`}><RefreshCw size={15} /></button>
                      <button onClick={() => setCheckoutTarget(item)} title="退房"  className={`${cardBtnCls} hover:text-orange-500 hover:bg-orange-50`}><LogOut size={15} /></button>
                    </>
                  )}
                  <Link href={`/manage/contract/${item.id}`} title="查看详情" className={`${cardBtnCls} hover:bg-surface-2 hover:text-text`}><FileText size={15} /></Link>
                  {item.isCheckout && (
                    <button onClick={() => setDeleteTarget(item)} title="删除" className={`${cardBtnCls} hover:text-danger hover:bg-danger-bg`}><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {hasLoadedOnce && total > 0 && (
          <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
            <Pagination page={page} pageSize={pageSize} total={total} totalPages={totalPages} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
          </div>
        )}
      </div>

      {/* ── 桌面端表格 ── */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={list}
          rowKey={(r) => r.id}
          loading={loading}
          hasLoaded={hasLoadedOnce}
          skeletonRows={5}
          emptyIcon={<FileText size={36} className="text-text-disabled" />}
          emptyText={hasFilter ? '未找到符合条件的合同' : '暂无合同记录'}
          pagination={{ page, pageSize, total, totalPages, onPageChange: handlePageChange, onPageSizeChange: handlePageSizeChange }}
        />
      </div>

      {/* ── 弹窗 ── */}
      <PayModal      contract={payTarget}      onClose={() => setPayTarget(null)}      onSuccess={refresh} />
      <RenewModal    contract={renewTarget}    onClose={() => setRenewTarget(null)}    onSuccess={refresh} />
      <CheckoutModal contract={checkoutTarget} onClose={() => setCheckoutTarget(null)} onSuccess={refresh} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除合同？"
        description={deleteTarget ? (
          <>
            合同 <span className="font-semibold text-text">#{deleteTarget.id}</span> 将被永久删除，
            房东和租客均无法再查看此合同，相当于完全取消租约，此操作不可撤销。
          </>
        ) : undefined}
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

/* ─── Dummy exports for type usage ──────────────────────────────────────────── */
export { fmtDateTime, Clock, CheckCircle2 };
