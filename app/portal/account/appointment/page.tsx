"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { fmtDate, fmtDateTime } from "@/utils/format";
import { APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_STATUS_STYLE } from "@/utils/constants";

type AppointmentItem = {
  id: number;
  roomId: number;
  roomName: string;
  roomCover: string;
  appointmentTime: string;
  status: number;
  remark: string | null;
  createdAt: string;
};

function statusLabel(s: number) {
  return APPOINTMENT_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? "—";
}

export default function AppointmentPage() {
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean;
        data: AppointmentItem[];
        total: number;
        totalPages: number;
      }>(`/portal/account/appointments?page=${p}&limit=10`);
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      await portalRequest(`/portal/account/appointments?id=${id}`, { method: "DELETE" });
      toast.success("已删除");
      load(page);
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  return (
    <MineShell title="我的预约">
      {/* 桌面端表头 */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_80px] text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface">
        <span>预约房源</span>
        <span>看房时间</span>
        <span>预约时间</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      {/* 骨架屏 */}
      {loading && !hasLoaded && (
        <>
          <div className="hidden lg:block">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-5 py-4 border-b border-[#eee] items-center gap-3">
                <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                <div className="skeleton-shimmer h-4 w-24 rounded" />
                <div className="skeleton-shimmer h-4 w-24 rounded" />
                <div className="skeleton-shimmer h-5 w-14 rounded-full" />
                <div className="skeleton-shimmer h-4 w-10 rounded" />
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
      )}

      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">暂无预约记录</div>
      )}

      {hasLoaded && items.length > 0 && (
        <>
          {/* 桌面端 */}
          <div className="hidden lg:block">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface"
              >
                <Link
                  href={`/portal/room/${item.roomId}`}
                  className="text-text truncate hover:text-(--color-accent) hover:underline"
                >
                  {item.roomName}
                </Link>
                <span className="text-text-2">{fmtDate(item.appointmentTime)}</span>
                <span className="text-text-muted">{fmtDate(item.createdAt)}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${APPOINTMENT_STATUS_STYLE[item.status] ?? ""}`}
                >
                  {statusLabel(item.status)}
                </span>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="text-xs text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            ))}
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3 p-4">
            {items.map((item) => (
              <div key={item.id} className="border border-[#eee] rounded p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/portal/room/${item.roomId}`}
                    className="font-medium text-sm text-text hover:text-(--color-accent) flex-1 min-w-0 truncate"
                  >
                    {item.roomName}
                  </Link>
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${APPOINTMENT_STATUS_STYLE[item.status] ?? ""}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>
                {item.remark && (
                  <div className="text-xs text-text-muted mt-1 truncate">备注：{item.remark}</div>
                )}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f5f5f5] text-xs text-text-muted">
                  <span>看房时间：{fmtDateTime(item.appointmentTime)}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 分页 */}
      {hasLoaded && total > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 border-t border-[#eee]">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1}
            className="px-3 h-8 border border-border text-sm rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary hover:text-primary"
          >
            上一页
          </button>
          <span className="text-sm text-text-muted">{page} / {totalPages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= totalPages}
            className="px-3 h-8 border border-border text-sm rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary hover:text-primary"
          >
            下一页
          </button>
        </div>
      )}
    </MineShell>
  );
}
