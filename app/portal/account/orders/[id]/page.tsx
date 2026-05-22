"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, ShoppingCart, Trash2, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { fmtDate, fmtDateTime } from "@/utils/format";
import { ORDER_TYPE_OPTIONS, ORDER_TYPE_STYLE } from "@/utils/constants";
import ConfirmDialog from "@/components/ConfirmDialog";

type OrderDetail = {
  id: number;
  contractId: number;
  roomId: number;
  roomName: string;
  roomCode: string;
  roomCoverUrl: string | null;
  type: number;
  fee: number | null;
  pledge: number | null;
  paidPeriod: string | null;
  createdAt: string;
  contractOnlineTime: string | null;
  contractOfflineTime: string | null;
  payerName: string | null;
  payerNickname: string | null;
  payeeName: string | null;
  payeeNickname: string | null;
};

function orderTypeLabel(t: number) {
  return ORDER_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "未知类型";
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-text-muted shrink-0 w-24">{label}</span>
      <span className={`text-sm text-text text-right flex-1 ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function PartyCard({ name, nickname, role }: { name: string | null; nickname: string | null; role: string }) {
  if (!name) return null;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface">
      <div className="w-10 h-10 rounded-full grid place-items-center bg-(--color-primary-tint,#e6f4ea) text-primary text-sm font-semibold border border-border shrink-0">
        {(nickname || name).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{name}</p>
        {nickname && <p className="text-xs text-text-muted truncate">{nickname}</p>}
      </div>
      <span className="text-xs bg-white border border-border text-text-muted px-2 py-0.5 rounded-full shrink-0">
        {role}
      </span>
    </div>
  );
}

/* ── 骨架屏 ── */
function DetailSkeleton() {
  return (
    <MineShell title="订单详情">
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 skeleton-shimmer rounded" />
          <div className="w-40 h-4 skeleton-shimmer rounded" />
        </div>
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-0">
            <div className="w-28 h-4 skeleton-shimmer rounded mb-4" />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex justify-between py-2.5 border-b border-[#eee]">
                <div className="w-20 h-4 skeleton-shimmer rounded" />
                <div className="w-28 h-4 skeleton-shimmer rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="bg-white border border-[#eee] rounded-xl p-5 space-y-3">
              <div className="w-20 h-4 skeleton-shimmer rounded mb-2" />
              <div className="w-full h-14 skeleton-shimmer rounded-xl" />
              <div className="w-full h-14 skeleton-shimmer rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </MineShell>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    portalRequest<{ success: boolean; data: OrderDetail }>(`/portal/account/orders/${id}`)
      .then((res) => { if (!cancelled && res.success) setOrder(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    if (deleting || !order) return;
    setDeleting(true);
    try {
      await portalRequest(`/portal/account/orders?id=${order.id}`, { method: "DELETE" });
      toast.success("已删除");
      router.push("/portal/account/orders");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <DetailSkeleton />;

  if (!order) {
    return (
      <MineShell title="订单详情">
        <div className="py-20 flex flex-col items-center gap-4 opacity-50">
          <ShoppingCart size={48} className="text-text-muted" />
          <p className="text-sm text-text-muted">订单不存在</p>
          <Link href="/portal/account/orders" className="text-sm text-primary hover:underline">
            返回订单列表
          </Link>
        </div>
      </MineShell>
    );
  }

  const totalAmount = (order.fee ?? 0) + (order.pledge ?? 0);
  const typeCls = ORDER_TYPE_STYLE[order.type] ?? "";

  return (
    <MineShell title="订单详情">
      <div className="p-4 lg:p-6 space-y-4">

        {/* 面包屑 */}
        <nav className="flex items-center gap-1.5 text-sm min-w-0">
          <button
            onClick={() => router.back()}
            className="w-7 h-7 rounded grid place-items-center text-text-muted hover:bg-[var(--color-surface)] hover:text-text transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-text-muted">/</span>
          <Link href="/portal/account/orders" className="text-text-muted hover:text-text transition-colors shrink-0">
            我的订单
          </Link>
          <ChevronRight size={13} className="text-text-muted shrink-0" />
          <span className="text-text font-medium font-mono truncate">#{order.id}</span>
          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${typeCls}`}>
            {orderTypeLabel(order.type)}
          </span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">

          {/* 左：订单信息 */}
          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={15} className="text-text-muted" />
              <h2 className="text-sm font-semibold text-text">订单信息</h2>
            </div>

            <InfoRow
              label="关联合同"
              value={
                <Link href={`/portal/account/contract/${order.contractId}`} className="text-primary hover:underline font-mono">
                  #{order.contractId}
                </Link>
              }
            />
            <InfoRow
              label="房源"
              value={
                <Link href={`/portal/room/${order.roomId}`} className="text-primary hover:underline">
                  {order.roomName}
                  <span className="text-text-muted ml-1 font-mono text-xs">{order.roomCode}</span>
                </Link>
              }
            />
            <InfoRow
              label="付款人"
              value={
                order.payerName ? (
                  <>
                    {order.payerName}
                    {order.payerNickname && <span className="text-text-muted ml-1">（{order.payerNickname}）</span>}
                  </>
                ) : "—"
              }
            />
            <InfoRow
              label="收款人"
              value={
                order.payeeName ? (
                  <>
                    {order.payeeName}
                    {order.payeeNickname && <span className="text-text-muted ml-1">（{order.payeeNickname}）</span>}
                  </>
                ) : "—"
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
                label="付款金额"
                value={
                  <span className="font-semibold text-(--color-accent-dark)">
                    ¥{totalAmount.toFixed(2)}
                  </span>
                }
              />
            )}
            <InfoRow label="付款时间" value={fmtDateTime(order.createdAt)} mono />
            {order.paidPeriod && (
              <InfoRow label="覆盖时间段" value={order.paidPeriod} mono />
            )}
          </div>

          {/* 右：当事人 + 合同租期 + 删除操作 */}
          <div className="space-y-3">

            {/* 当事人 */}
            <div className="bg-white border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-text-muted" />
                <h2 className="text-sm font-semibold text-text">当事人</h2>
              </div>
              <div className="space-y-2">
                <PartyCard name={order.payerName} nickname={order.payerNickname} role="付款人" />
                <PartyCard name={order.payeeName} nickname={order.payeeNickname} role="收款人" />
              </div>
            </div>

            {/* 合同租期 */}
            {(order.contractOnlineTime || order.contractOfflineTime) && (
              <div className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-text-muted" />
                  <h2 className="text-sm font-semibold text-text">合同租期</h2>
                </div>
                {order.contractOnlineTime && (
                  <div className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                    <span className="text-text-muted">开始日期</span>
                    <span className="font-mono text-text">{fmtDate(order.contractOnlineTime)}</span>
                  </div>
                )}
                {order.contractOfflineTime && (
                  <div className="flex justify-between text-sm py-1.5">
                    <span className="text-text-muted">结束日期</span>
                    <span className="font-mono text-text">{fmtDate(order.contractOfflineTime)}</span>
                  </div>
                )}
              </div>
            )}

            {/* 删除操作 */}
            <div className="bg-white border border-rose-200 rounded-xl p-4">
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg border border-rose-300 bg-rose-50 text-sm text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                删除订单记录
              </button>
              <p className="text-xs text-text-muted mt-2">删除后仅对您隐藏，不影响实际交易。</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="删除订单记录"
        description={
          <>
            订单 <span className="font-semibold">#{order.id}</span> 将对您隐藏，不影响实际交易，此操作不可撤销。
          </>
        }
        confirmText="确认删除"
        cancelText="取消"
        loading={deleting}
        danger
        icon={<Trash2 size={32} />}
        onClose={() => { if (!deleting) setDeleteOpen(false); }}
        onConfirm={handleDelete}
      />
    </MineShell>
  );
}
