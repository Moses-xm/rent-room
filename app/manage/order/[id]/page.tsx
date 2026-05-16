'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronRight, ShoppingCart, Trash2, User, Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import { fmtDate, fmtDateTime } from '@/utils/format';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { OrderItem } from '../page';

/* ─── Type helpers ───────────────────────────────────────────────────────── */
const ORDER_TYPE_STYLE: Record<number, string> = {
  1: 'bg-violet-100 text-violet-700',
  2: 'bg-sky-100 text-sky-700',
  3: 'bg-emerald-100 text-emerald-700',
};
const ORDER_TYPE_LABEL: Record<number, string> = {
  1: '首期款（押金+首期房租）',
  2: '续期房租',
  3: '押金退款',
};

function TypeBadge({ type }: { type: number }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-body-sm font-medium ${ORDER_TYPE_STYLE[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {ORDER_TYPE_LABEL[type] ?? '未知类型'}
    </span>
  );
}

/* ─── Info row ───────────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-body-sm text-text-muted shrink-0 w-28">{label}</span>
      <span className={`text-body-sm text-text text-right flex-1 ${mono ? 'font-mono' : 'font-emphasis'}`}>{value}</span>
    </div>
  );
}

/* ─── User mini card ─────────────────────────────────────────────────────── */
function UserCard({ user, role }: { user: OrderItem['payer']; role: string }) {
  if (!user) return null;
  return (
    <Link
      href={`/manage/user/${user.id}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary-tint/30 transition-all group"
    >
      <div className="w-10 h-10 rounded-full grid place-items-center bg-primary-tint text-primary-dark text-sm font-semibold border border-border shrink-0">
        {(user.nickname || user.username).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-emphasis text-text group-hover:text-primary truncate transition-colors">{user.username}</p>
        {user.nickname && <p className="text-tiny text-text-muted truncate">{user.nickname}</p>}
      </div>
      <span className="text-tiny bg-surface border border-border text-text-muted px-2 py-0.5 rounded-full shrink-0">{role}</span>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const [order, setOrder]           = useState<OrderItem | null>(null);
  const [loading, setLoading]       = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    request<{ success: boolean; data: OrderItem }>(`/manage/order/${id}`)
      .then((res) => { if (!cancelled && res.success) setOrder(res.data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const confirmDelete = async () => {
    if (!order || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/order/${order.id}`, { method: 'DELETE' });
      toast.success('订单删除成功');
      router.push('/manage/order');
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── 骨架屏 ── */
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 skeleton-shimmer rounded-sm" />
          <div className="w-44 h-4 skeleton-shimmer rounded" />
        </div>
        <div className="w-32 h-7 skeleton-shimmer rounded" />
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-32 h-5 skeleton-shimmer rounded mb-4" />
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between py-2.5 border-b border-border last:border-0">
                    <div className="w-24 h-4 skeleton-shimmer rounded" />
                    <div className="w-32 h-4 skeleton-shimmer rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="w-full h-10 skeleton-shimmer rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 flex flex-col items-center gap-4 opacity-50">
        <ShoppingCart size={48} className="text-text-disabled" />
        <p className="text-body text-text-muted">订单不存在</p>
        <Link href="/manage/order" className="text-body-sm text-primary hover:underline">返回订单列表</Link>
      </div>
    );
  }

  const totalAmount = (order.fee ?? 0) + (order.pledge ?? 0);

  return (
    <div className="space-y-5">

      {/* ── 面包屑 ── */}
      <div className="flex items-center gap-1.5 text-body-sm min-w-0">
        <button
          onClick={() => router.back()}
          title="返回"
          className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <span className="text-text-disabled shrink-0">/</span>
        <Link href="/manage/order" className="text-text-muted hover:text-text transition-colors shrink-0">
          订单管理
        </Link>
        <ChevronRight size={13} className="text-text-disabled shrink-0" />
        <span className="text-text font-emphasis truncate">订单详情</span>
      </div>

      {/* ── 标题 ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">订单详情</h1>
            <span className="text-body-sm text-text-muted font-mono">#{order.id}</span>
          </div>
          <p className="text-body text-text-muted mt-1">创建于 {fmtDateTime(order.createdAt)}</p>
        </div>
        <TypeBadge type={order.type} />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">

        {/* ── Left: detail cards ── */}
        <div className="space-y-4">

          {/* 订单基本信息 */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={16} className="text-text-muted" />
              <h2 className="text-body font-semibold text-text">订单信息</h2>
            </div>
            <InfoRow
              label="关联合同"
              value={
                <Link href={`/manage/contract/${order.contractId}`} className="text-primary hover:underline font-mono">
                  #{order.contractId}
                </Link>
              }
            />
            <InfoRow
              label="房源"
              value={
                order.room ? (
                  <Link href={`/manage/room/${order.room.id}`} className="text-primary hover:underline">
                    {order.room.name}
                    <span className="text-text-muted ml-1 font-mono text-tiny">{order.room.roomCode}</span>
                  </Link>
                ) : '—'
              }
            />
            {order.fee != null && (
              <InfoRow label="月租金额" value={`¥${order.fee.toFixed(2)}`} mono />
            )}
            {order.pledge != null && (
              <InfoRow label="押金金额" value={`¥${order.pledge.toFixed(2)}`} mono />
            )}
            {totalAmount > 0 && (
              <InfoRow
                label="合计金额"
                value={<span className="font-semibold text-primary">¥{totalAmount.toFixed(2)}</span>}
              />
            )}
            {order.paidPeriod && (
              <InfoRow label="覆盖时间段" value={order.paidPeriod} mono />
            )}
          </div>

          {/* 当事人信息 */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-text-muted" />
              <h2 className="text-body font-semibold text-text">当事人</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <UserCard user={order.payer} role="付款人" />
              <UserCard user={order.payee} role="收款人" />
            </div>
          </div>

          {/* 合同租期 */}
          {order.contract && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-text-muted" />
                <h2 className="text-body font-semibold text-text">所属合同租期</h2>
              </div>
              <InfoRow label="开始日期" value={fmtDate(order.contract.onlineTime)} mono />
              <InfoRow label="结束日期" value={fmtDate(order.contract.offlineTime)} mono />
            </div>
          )}
        </div>

        {/* ── Right: sidebar ── */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* 危险操作 */}
          <div className="bg-card border border-rose-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-rose-500" />
              <h2 className="text-body font-semibold text-rose-700">危险操作</h2>
            </div>
            <p className="text-caption text-text-muted mb-3">
              删除后该订单将被永久移除，相关钱包流水记录不受影响，操作不可撤销。
            </p>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl border border-rose-300 bg-rose-50 text-body text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              删除订单
            </button>
          </div>

          {/* 元信息 */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <h2 className="text-body font-semibold text-text mb-3">元信息</h2>
            <div className="space-y-2 text-body-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">订单 ID</span>
                <span className="font-mono text-text">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">订单类型</span>
                <span className="text-text">{ORDER_TYPE_LABEL[order.type] ?? '未知'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">创建时间</span>
                <span className="font-mono text-text">{fmtDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="确认删除订单？"
        description={
          <>
            订单 <span className="font-semibold text-text">#{order.id}</span> 将被永久移除，
            相关钱包流水记录不受影响，此操作不可撤销。
          </>
        }
        confirmText="确认删除"
        cancelText="取消"
        loading={isDeleting}
        danger
        icon={<Trash2 size={32} />}
        onClose={() => { if (!isDeleting) setDeleteOpen(false); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
