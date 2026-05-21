"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { fmtDateTime } from "@/utils/format";
import {
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_STATUS_STYLE,
  MINE_SKELETON_ROWS,
} from "@/utils/constants";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/ConfirmDialog";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type TenantItem = {
  id: number;
  roomId: number;
  roomName: string;
  roomCoverUrl: string;
  roomPrice: number;
  landlordName: string;
  appointmentTime: string;
  status: number;
  remark: string | null;
  createdAt: string;
};

type LandlordItem = {
  id: number;
  roomId: number;
  roomName: string;
  roomCoverUrl: string;
  roomPrice: number;
  tenantName: string;
  appointmentTime: string;
  status: number;
  remark: string | null;
  createdAt: string;
};

function statusLabel(s: number) {
  return APPOINTMENT_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? "—";
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function ListSkeleton({ cols }: { cols: string }) {
  return (
    <>
      <div className="hidden lg:block">
        {Array.from({ length: MINE_SKELETON_ROWS }).map((_, i) => (
          <div key={i} className={`grid ${cols} px-5 py-4 border-b border-[#eee] items-center gap-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="skeleton-shimmer w-16 h-12 rounded shrink-0" />
              <div className="skeleton-shimmer flex-1 h-4 rounded" />
            </div>
            <div className="skeleton-shimmer h-4 w-20 rounded" />
            <div className="skeleton-shimmer h-4 w-28 rounded" />
            <div className="skeleton-shimmer h-5 w-14 rounded-full" />
            <div className="skeleton-shimmer h-4 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="lg:hidden space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-[#eee] rounded p-3 space-y-2">
            <div className="skeleton-shimmer h-4 w-3/4 rounded" />
            <div className="skeleton-shimmer h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Tenant Tab ──────────────────────────────────────────────────────────── */
function TenantList() {
  const [items, setItems] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number, l: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{ success: boolean; data: TenantItem[]; total: number; totalPages: number }>(
        `/portal/account/appointments?page=${p}&limit=${l}&role=tenant`
      );
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
      setLimit(l);
    } catch {
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => { load(1, 10); }, [load]);

  async function handleCancel() {
    if (cancelConfirmId === null) return;
    setCancelling(cancelConfirmId);
    try {
      await portalRequest(`/portal/account/appointments/${cancelConfirmId}`, {
        method: "PATCH",
        json: { action: "cancel" },
      });
      setCancelConfirmId(null);
      toast.success("预约已取消");
      load(page, limit);
    } catch {
    } finally {
      setCancelling(null);
    }
  }

  async function handleDelete() {
    if (deleteConfirmId === null) return;
    setDeleting(deleteConfirmId);
    try {
      await portalRequest(`/portal/account/appointments?id=${deleteConfirmId}&role=tenant`, { method: "DELETE" });
      setDeleteConfirmId(null);
      toast.success("已删除");
      load(page, limit);
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  const COLS = "grid-cols-[2fr_1fr_1fr_1fr_120px]";

  return (
    <>
      <div className={`hidden lg:grid ${COLS} text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface`}>
        <span>预约房源</span>
        <span>房东</span>
        <span>预约看房时间</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      {loading && !hasLoaded && <ListSkeleton cols={COLS} />}

      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">暂无预约记录</div>
      )}

      {hasLoaded && items.length > 0 && (
        <>
          {/* 桌面端 */}
          <div className="hidden lg:block">
            {items.map((item) => (
              <div key={item.id} className={`grid ${COLS} px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface`}>
                <Link href={`/portal/room/${item.roomId}`} className="flex items-center gap-3 group min-w-0">
                  {item.roomCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.roomCoverUrl} alt={item.roomName} className="w-16 h-12 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-surface-2 rounded shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-text group-hover:text-(--color-accent) group-hover:underline">{item.roomName}</div>
                    <div className="text-xs text-(--color-accent-dark) font-medium mt-0.5">¥{item.roomPrice}/月</div>
                  </div>
                </Link>
                <span className="text-text-2 truncate">{item.landlordName}</span>
                <span className="text-text-2">{fmtDateTime(item.appointmentTime)}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${APPOINTMENT_STATUS_STYLE[item.status] ?? ""}`}>
                  {statusLabel(item.status)}
                </span>
                <div className="flex flex-col gap-1">
                  {item.status === 1 && (
                    <button
                      onClick={() => setCancelConfirmId(item.id)}
                      disabled={cancelling === item.id}
                      className="text-xs text-orange-400 hover:text-orange-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-left"
                    >
                      取消预约
                    </button>
                  )}
                  {item.status !== 1 && (
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-left"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3 p-4">
            {items.map((item) => (
              <div key={item.id} className="border border-[#eee] rounded p-3">
                <div className="flex gap-3">
                  {item.roomCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.roomCoverUrl} alt={item.roomName} className="w-20 h-15 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-20 h-15 bg-surface-2 rounded shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/portal/room/${item.roomId}`} className="font-medium text-sm text-text hover:text-(--color-accent) truncate">
                        {item.roomName}
                      </Link>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${APPOINTMENT_STATUS_STYLE[item.status] ?? ""}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">房东：{item.landlordName}</div>
                    <div className="text-sm text-(--color-accent-dark) font-medium mt-0.5">¥{item.roomPrice}/月</div>
                  </div>
                </div>
                {item.remark && (
                  <div className="text-xs text-text-muted mt-2 truncate">备注：{item.remark}</div>
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f5f5f5] text-xs">
                  <span className="text-text-muted">看房时间：{fmtDateTime(item.appointmentTime)}</span>
                  <div className="flex gap-3">
                    {item.status === 1 && (
                      <button
                        onClick={() => setCancelConfirmId(item.id)}
                        disabled={cancelling === item.id}
                        className="text-orange-400 hover:text-orange-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        取消预约
                      </button>
                    )}
                    {item.status !== 1 && (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        disabled={deleting === item.id}
                        className="text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={cancelConfirmId !== null}
        title="取消预约"
        description="确认取消该预约吗？取消后可重新预约。"
        confirmText="取消预约"
        danger
        loading={cancelling !== null}
        onConfirm={handleCancel}
        onClose={() => setCancelConfirmId(null)}
      />
      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="删除记录"
        description="确认删除该预约记录吗？仅对自己隐藏，不影响预约状态。"
        confirmText="删除"
        danger
        loading={deleting !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmId(null)}
      />

      {hasLoaded && total > 0 && (
        <Pagination
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={(p) => load(p, limit)}
          onPageSizeChange={(l) => load(1, l)}
        />
      )}
    </>
  );
}

/* ─── Landlord Tab ────────────────────────────────────────────────────────── */
function LandlordList() {
  const [items, setItems] = useState<LandlordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [completeConfirmId, setCompleteConfirmId] = useState<number | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number, l: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{ success: boolean; data: LandlordItem[]; total: number; totalPages: number }>(
        `/portal/account/appointments?page=${p}&limit=${l}&role=landlord`
      );
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
      setLimit(l);
    } catch {
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => { load(1, 10); }, [load]);

  async function handleComplete() {
    if (completeConfirmId === null) return;
    setCompleting(completeConfirmId);
    try {
      await portalRequest(`/portal/account/appointments/${completeConfirmId}`, {
        method: "PATCH",
        json: { action: "complete" },
      });
      setCompleteConfirmId(null);
      toast.success("已标记为完成");
      load(page, limit);
    } catch {
    } finally {
      setCompleting(null);
    }
  }

  async function handleDelete() {
    if (deleteConfirmId === null) return;
    setDeleting(deleteConfirmId);
    try {
      await portalRequest(`/portal/account/appointments?id=${deleteConfirmId}&role=landlord`, { method: "DELETE" });
      setDeleteConfirmId(null);
      toast.success("已删除");
      load(page, limit);
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  const COLS = "grid-cols-[2fr_1fr_1fr_1fr_120px]";

  return (
    <>
      <div className={`hidden lg:grid ${COLS} text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface`}>
        <span>预约房源</span>
        <span>预约用户</span>
        <span>预约看房时间</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      {loading && !hasLoaded && <ListSkeleton cols={COLS} />}

      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">暂无收到的预约</div>
      )}

      {hasLoaded && items.length > 0 && (
        <>
          {/* 桌面端 */}
          <div className="hidden lg:block">
            {items.map((item) => (
              <div key={item.id} className={`grid ${COLS} px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface`}>
                <Link href={`/portal/room/${item.roomId}`} className="flex items-center gap-3 group min-w-0">
                  {item.roomCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.roomCoverUrl} alt={item.roomName} className="w-16 h-12 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-surface-2 rounded shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-text group-hover:text-(--color-accent) group-hover:underline">{item.roomName}</div>
                    <div className="text-xs text-(--color-accent-dark) font-medium mt-0.5">¥{item.roomPrice}/月</div>
                  </div>
                </Link>
                <span className="text-text-2 truncate">{item.tenantName}</span>
                <span className="text-text-2">{fmtDateTime(item.appointmentTime)}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${APPOINTMENT_STATUS_STYLE[item.status] ?? ""}`}>
                  {statusLabel(item.status)}
                </span>
                <div className="flex flex-col gap-1">
                  {item.status === 1 && (
                    <button
                      onClick={() => setCompleteConfirmId(item.id)}
                      disabled={completing === item.id}
                      className="text-xs text-primary hover:opacity-70 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-left"
                    >
                      标记完成
                    </button>
                  )}
                  {item.status !== 1 && (
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-left"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3 p-4">
            {items.map((item) => (
              <div key={item.id} className="border border-[#eee] rounded p-3">
                <div className="flex gap-3">
                  {item.roomCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.roomCoverUrl} alt={item.roomName} className="w-20 h-15 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-20 h-15 bg-surface-2 rounded shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/portal/room/${item.roomId}`} className="font-medium text-sm text-text hover:text-(--color-accent) truncate">
                        {item.roomName}
                      </Link>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${APPOINTMENT_STATUS_STYLE[item.status] ?? ""}`}>
                        {statusLabel(item.status)}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">预约用户：{item.tenantName}</div>
                    <div className="text-sm text-(--color-accent-dark) font-medium mt-0.5">¥{item.roomPrice}/月</div>
                  </div>
                </div>
                {item.remark && (
                  <div className="text-xs text-text-muted mt-2 truncate">备注：{item.remark}</div>
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f5f5f5] text-xs">
                  <span className="text-text-muted">看房时间：{fmtDateTime(item.appointmentTime)}</span>
                  <div className="flex gap-3">
                    {item.status === 1 && (
                      <button
                        onClick={() => setCompleteConfirmId(item.id)}
                        disabled={completing === item.id}
                        className="text-primary hover:opacity-70 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        标记完成
                      </button>
                    )}
                    {item.status !== 1 && (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        disabled={deleting === item.id}
                        className="text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={completeConfirmId !== null}
        title="标记完成"
        description="确认将该预约标记为已完成吗？"
        confirmText="标记完成"
        loading={completing !== null}
        onConfirm={handleComplete}
        onClose={() => setCompleteConfirmId(null)}
      />
      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="删除记录"
        description="确认删除该预约记录吗？仅对自己隐藏，不影响预约状态。"
        confirmText="删除"
        danger
        loading={deleting !== null}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmId(null)}
      />

      {hasLoaded && total > 0 && (
        <Pagination
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={(p) => load(p, limit)}
          onPageSizeChange={(l) => load(1, l)}
        />
      )}
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AppointmentPage() {
  const [tab, setTab] = useState<"tenant" | "landlord">("tenant");

  return (
    <MineShell title="我的预约">
      {/* Tab 切换 */}
      <div className="flex border-b border-[#eee] px-5">
        {(["tenant", "landlord"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium cursor-pointer border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {t === "tenant" ? "我预约的" : "收到的预约"}
          </button>
        ))}
      </div>

      {tab === "tenant" ? <TenantList /> : <LandlordList />}
    </MineShell>
  );
}
