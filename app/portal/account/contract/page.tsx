"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, RefreshCw, LogOut, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { RoomImage } from "@/components/portal/RoomImage";
import ConfirmDialog from "@/components/ConfirmDialog";
import PayModal from "@/components/contract/PayModal";
import RenewModal from "@/components/contract/RenewModal";
import CheckoutModal from "@/components/contract/CheckoutModal";
import { portalRequest } from "@/utils/portal-request";
import { fmtDate } from "@/utils/format";
import { CONTRACT_STATUS_STYLE } from "@/utils/constants";
import { getPortalProfile } from "@/utils/portal-auth";
import Pagination from "@/components/Pagination";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type ContractCard = {
  id: number;
  roomId: number;
  roomName: string;
  roomCover: string;
  roomPrice: number;
  roomPay: number;
  roomMinTenancy: number;
  tenancy: number;
  onlineTime: string;
  offlineTime: string;
  fee: number;
  pledge: number;
  payingPeriod: string;
  renewTimes: number;
  status: number;
  isCheckout: boolean;
  checkoutTime: string | null;
  createdAt: string;
  landlordName?: string;
  landlordAvatar?: string | null;
  tenantName?: string;
  tenantAvatar?: string | null;
};

/* 将列表项适配为弹窗所需的嵌套结构 */
function toModalContract(item: ContractCard, isTenantView: boolean) {
  return {
    id: item.id,
    onlineTime: item.onlineTime,
    offlineTime: item.offlineTime,
    fee: item.fee,
    pledge: item.pledge,
    payingPeriod: item.payingPeriod,
    renewTimes: item.renewTimes,
    room: { name: item.roomName, pay: item.roomPay, minTenancy: item.roomMinTenancy },
    user: isTenantView ? null : (item.tenantName ? { username: item.tenantName } : null),
  };
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white">
          {/* 主体：60×60 封面 + 两行信息 */}
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-[60px] h-[60px] shrink-0 skeleton-shimmer rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="skeleton-shimmer h-3.5 w-2/5 rounded" />
                <div className="skeleton-shimmer h-5 w-12 rounded-full" />
              </div>
              <div className="skeleton-shimmer h-3 w-3/5 rounded" />
            </div>
          </div>
          {/* 底栏：左侧对方姓名 + 右侧按钮组 */}
          <div className="border-t border-[var(--color-border)] px-3 py-2 flex items-center justify-between gap-2">
            <div className="skeleton-shimmer h-3 w-24 rounded" />
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="skeleton-shimmer h-7 w-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Action Button ──────────────────────────────────────────────────────── */
function ActionBtn({
  icon,
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "emerald" | "sky" | "orange" | "rose";
}) {
  const colors = {
    default:  "text-text-muted border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:text-text",
    emerald:  "text-emerald-600 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    sky:      "text-sky-600 border-sky-200 hover:border-sky-400 hover:bg-sky-50",
    orange:   "text-orange-500 border-orange-200 hover:border-orange-400 hover:bg-orange-50",
    rose:     "text-rose-500 border-rose-200 hover:border-rose-400 hover:bg-rose-50",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-lg border text-xs font-medium transition-colors cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${colors[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── Contract Card ─────────────────────────────────────────────────────── */
function ContractCard({
  item,
  isTenantView,
  onAction,
  onDelete,
}: {
  item: ContractCard;
  isTenantView: boolean;
  onAction: (item: ContractCard, action: "pay" | "renew" | "checkout") => void;
  onDelete: (id: number, roomName: string) => void;
}) {
  const st = CONTRACT_STATUS_STYLE[item.status];
  const payingPeriods = JSON.parse(item.payingPeriod) as unknown[];
  const canPay      = isTenantView && item.status === 1 && !item.isCheckout && payingPeriods.length > 0;
  const canRenew    = item.status === 1 && !item.isCheckout;
  const canCheckout = item.status === 1 && !item.isCheckout;
  const canDelete   = item.isCheckout;

  const otherName = isTenantView ? item.landlordName : item.tenantName;
  const otherRole = isTenantView ? "房东" : "租客";

  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white hover:shadow-sm transition-shadow">
      {/* 主体：封面 + 信息 */}
      <div className="flex items-center gap-3 px-3 py-3">
        {/* 封面 — 固定正方形缩略图 */}
        <div className="w-[60px] h-[60px] shrink-0 rounded-lg overflow-hidden bg-[var(--color-surface)]">
          <RoomImage src={item.roomCover} alt={item.roomName} className="w-full h-full object-cover" />
        </div>

        {/* 信息区 */}
        <div className="flex-1 min-w-0">
          {/* 第一行：房源名 + 状态 */}
          <div className="flex items-center gap-2">
            <Link
              href={`/portal/room/${item.roomId}`}
              className="text-sm font-semibold text-text hover:text-[var(--color-accent)] truncate transition-colors min-w-0 flex-1"
            >
              {item.roomName}
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${st?.cls}`}>
                {st?.label}
              </span>
              {item.isCheckout && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs text-[#999] bg-[#f5f5f5]">
                  已退房
                </span>
              )}
            </div>
          </div>

          {/* 第二行：价格 + 租期 */}
          <p className="text-xs text-text-muted mt-0.5 truncate">
            <span className="text-[var(--color-accent-dark)] font-semibold text-sm">¥{item.fee}</span>
            <span className="ml-0.5 text-xs font-normal">/期</span>
            <span className="mx-1.5 text-[var(--color-border-subtle)]">·</span>
            {fmtDate(item.onlineTime)} ~ {fmtDate(item.offlineTime)}
          </p>
        </div>
      </div>

      {/* 底栏：对方姓名（左） + 操作按钮（右） */}
      <div className="border-t border-[var(--color-border)] px-3 py-2 flex items-center justify-between gap-2">
        {otherName ? (
          <span className="text-xs text-text-muted truncate">
            {otherRole}：<span className="text-text">{otherName}</span>
          </span>
        ) : (
          <div />
        )}

        {/* 右：操作按钮组 */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/portal/account/contract/${item.id}`}
            className="inline-flex items-center gap-1 px-2.5 h-7 rounded-lg border text-xs font-medium transition-colors
              text-text-muted border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:text-text"
          >
            <FileText size={11} />
            查看
          </Link>
          {isTenantView && (
            <ActionBtn
              icon={<CreditCard size={11} />}
              label="交房租"
              disabled={!canPay}
              variant="emerald"
              onClick={() => onAction(item, "pay")}
            />
          )}
          <ActionBtn
            icon={<RefreshCw size={11} />}
            label="续租"
            disabled={!canRenew}
            variant="sky"
            onClick={() => onAction(item, "renew")}
          />
          <ActionBtn
            icon={<LogOut size={11} />}
            label="退房"
            disabled={!canCheckout}
            variant="orange"
            onClick={() => onAction(item, "checkout")}
          />
          <ActionBtn
            icon={<Trash2 size={11} />}
            label="删除"
            disabled={!canDelete}
            variant="rose"
            onClick={() => onDelete(item.id, item.roomName)}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Contract List ──────────────────────────────────────────────────────── */
function ContractList({ role }: { role: "tenant" | "landlord" }) {
  const isTenantView = role === "tenant";

  const [items, setItems]         = useState<ContractCard[]>([]);
  const [loading, setLoading]     = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [activeModal, setActiveModal] = useState<{
    contract: ReturnType<typeof toModalContract>;
    action: "pay" | "renew" | "checkout";
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; roomName: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean;
        data: ContractCard[];
        total: number;
        totalPages: number;
      }>(`/portal/account/contracts?page=${p}&limit=10&role=${role}`);
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [role]);

  useEffect(() => { load(1); }, [load]);

  function handleAction(item: ContractCard, action: "pay" | "renew" | "checkout") {
    setActiveModal({ contract: toModalContract(item, isTenantView), action });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await portalRequest(`/portal/account/contracts/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("合同已删除");
      setDeleteTarget(null);
      load(page);
    } finally {
      setDeleting(false);
    }
  }

  function handleSuccess() {
    setActiveModal(null);
    load(page);
  }

  return (
    <>
      {loading && !hasLoaded && <CardSkeleton />}

      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">
          {isTenantView ? "暂无合同记录" : "暂无租客合同记录"}
        </div>
      )}

      {hasLoaded && items.length > 0 && (
        <div className="p-4 space-y-3">
          {items.map((item) => (
            <ContractCard
              key={item.id}
              item={item}
              isTenantView={isTenantView}
              onAction={handleAction}
              onDelete={(id, roomName) => setDeleteTarget({ id, roomName })}
            />
          ))}
        </div>
      )}

      {hasLoaded && total > 0 && (
        <Pagination
          page={page}
          pageSize={10}
          total={total}
          totalPages={totalPages}
          onPageChange={(p) => load(p)}
          onPageSizeChange={() => load(1)}
        />
      )}

      <PayModal
        contract={activeModal?.action === "pay" ? activeModal.contract : null}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
        onPay={(id, payCode) =>
          portalRequest(`/portal/account/contracts/${id}/pay`, { method: "POST", json: { payCode } })
        }
      />
      <RenewModal
        contract={activeModal?.action === "renew" ? activeModal.contract : null}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
        onRenew={(id, renewMonths) =>
          portalRequest(`/portal/account/contracts/${id}/renew`, { method: "POST", json: { renewMonths } })
        }
      />
      <CheckoutModal
        contract={activeModal?.action === "checkout" ? activeModal.contract : null}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
        onCheckout={(id) =>
          portalRequest(`/portal/account/contracts/${id}/checkout`, { method: "POST", json: {} })
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除合同"
        description={`确定要删除房源「${deleteTarget?.roomName ?? ""}」的合同记录吗？此操作不可撤销。`}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
function ContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLandlord = getPortalProfile()?.identity === 2;

  const rawTab = searchParams.get("tab");
  const tab: "tenant" | "landlord" =
    isLandlord && rawTab === "landlord" ? "landlord" : "tenant";

  function switchTab(t: "tenant" | "landlord") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`/portal/account/contract?${params.toString()}`);
  }

  const tabs = isLandlord
    ? [
        { key: "tenant" as const, label: "我的合同" },
        { key: "landlord" as const, label: "租客合同" },
      ]
    : [{ key: "tenant" as const, label: "我的合同" }];

  return (
    <MineShell title="我的合同">
      <div className="flex border-b border-[var(--color-border)] px-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ContractList key={tab} role={tab} />
    </MineShell>
  );
}

export default function ContractPage() {
  return (
    <Suspense>
      <ContractContent />
    </Suspense>
  );
}
