'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ShoppingCart, Trash2, User, Building2, FileText, CreditCard, Calendar,
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
      <span className={`text-body-sm text-text text-right flex-1 ${mono ? 'font-mono' : ''}`}>{value}</span>
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
      <div className="w-9 h-9 rounded-full grid place-items-center bg-primary-tint text-primary-dark text-sm font-semibold border border-border shrink-0">
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

  const [order, setOrder]         = useState<OrderItem | null>(null);
  const [loading, setLoading]     = useState(true);
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
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm skeleton-shimmer" />
          <div className="h-7 w-40 rounded skeleton-shimmer" />
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
          <div className="h-5 w-32 rounded skeleton-shimmer" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between py-2.5 border-b border-border">
              <div className="h-4 w-24 rounded skeleton-shimmer" />
              <div className="h-4 w-32 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-3">
          <div className="h-5 w-20 rounded skeleton-shimmer" />
          <div className="h-14 rounded-xl skeleton-shimmer" />
          <div className="h-14 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto py-20 flex flex-col items-center gap-4 opacity-50">
        <ShoppingCart size={48} className="text-text-disabled" />
        <p className="text-body text-text-muted">订单不存在</p>
        <Link href="/manage/order" className="text-body-sm text-primary hover:underline">返回订单列表</Link>
      </div>
    );
  }

  const totalAmount = (order.fee ?? 0) + (order.pledge ?? 0);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── 顶部导航 ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manage/order"
            className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <h1 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-none m-0">
            订单 <span className="font-mono text-primary">#{order.id}</span>
          </h1>
          <TypeBadge type={order.type} />
        </div>
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-1.5 h-8.5 px-3.5 rounded-sm text-body-sm text-danger
                     border border-danger/30 hover:bg-danger-bg transition-all active:scale-95 cursor-pointer"
        >
          <Trash2 size={13} />
          删除订单
        </button>
      </div>

      {/* ── 订单基本信息 ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={15} className="text-primary" />
          <h2 className="text-h4 font-heading text-text m-0">订单信息</h2>
        </div>
        <InfoRow label="订单 ID" value={`#${order.id}`} mono />
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
        <InfoRow label="创建时间" value={fmtDateTime(order.createdAt)} mono />
      </div>

      {/* ── 当事人信息 ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <User size={15} className="text-primary" />
          <h2 className="text-h4 font-heading text-text m-0">当事人</h2>
        </div>
        <div className="space-y-3">
          <UserCard user={order.payer} role="付款人" />
          <UserCard user={order.payee} role="收款人" />
        </div>
      </div>

      {/* ── 合同时间段 ── */}
      {order.contract && (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={15} className="text-primary" />
            <h2 className="text-h4 font-heading text-text m-0">所属合同租期</h2>
          </div>
          <InfoRow label="开始日期" value={fmtDate(order.contract.onlineTime)} mono />
          <InfoRow label="结束日期" value={fmtDate(order.contract.offlineTime)} mono />
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="确认删除订单？"
        description={
          <>
            订单 <span className="font-semibold text-text">#{order.id}</span> 将被永久删除，
            同时删除关联的钱包记录，此操作不可撤销。
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
