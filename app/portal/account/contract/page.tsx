"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { fmtDate } from "@/utils/format";
import { CONTRACT_STATUS_STYLE } from "@/utils/constants";

type ContractItem = {
  id: number;
  roomId: number;
  roomName: string;
  roomCover: string;
  roomPrice: number;
  tenancy: number;
  onlineTime: string;
  offlineTime: string;
  fee: number;
  status: number;
  isCheckout: boolean;
  checkoutTime: string | null;
  createdAt: string;
};

export default function ContractPage() {
  const [items, setItems] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean;
        data: ContractItem[];
        total: number;
        totalPages: number;
      }>(`/portal/account/contracts?page=${p}&limit=10`);
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

  return (
    <MineShell title="我的合同">
      {/* 桌面端表头 */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_1.5fr_1fr_80px] text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface">
        <span>合同房源</span>
        <span>签约时间</span>
        <span>租期</span>
        <span>状态</span>
        <span>每期房租</span>
      </div>

      {/* 骨架屏 */}
      {loading && !hasLoaded && (
        <>
          <div className="hidden lg:block">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px] px-5 py-4 border-b border-[#eee] items-center gap-3">
                <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                <div className="skeleton-shimmer h-4 w-20 rounded" />
                <div className="skeleton-shimmer h-4 w-36 rounded" />
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
      )}

      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">暂无合同记录</div>
      )}

      {hasLoaded && items.length > 0 && (
        <>
          {/* 桌面端 */}
          <div className="hidden lg:block">
            {items.map((item) => {
              const st = CONTRACT_STATUS_STYLE[item.status];
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1fr_1.5fr_1fr_80px] px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface"
                >
                  <Link
                    href={`/portal/room/${item.roomId}`}
                    className="text-text truncate hover:text-(--color-accent) hover:underline"
                  >
                    {item.roomName}
                  </Link>
                  <span className="text-text-2">{fmtDate(item.createdAt)}</span>
                  <span className="text-text-2">
                    {fmtDate(item.onlineTime)} 至 {fmtDate(item.offlineTime)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${st?.cls}`}>
                      {st?.label}
                    </span>
                    {item.isCheckout && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-[#999] bg-[#f5f5f5]">
                        已退房
                      </span>
                    )}
                  </div>
                  <span className="text-(--color-accent-dark) font-medium">¥{item.fee}</span>
                </div>
              );
            })}
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3 p-4">
            {items.map((item) => {
              const st = CONTRACT_STATUS_STYLE[item.status];
              return (
                <div key={item.id} className="border border-[#eee] rounded p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/portal/room/${item.roomId}`}
                      className="font-medium text-sm text-text hover:text-(--color-accent) flex-1 min-w-0 truncate"
                    >
                      {item.roomName}
                    </Link>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${st?.cls}`}>
                      {st?.label}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-1.5 space-y-0.5">
                    <div>签约：{fmtDate(item.createdAt)}</div>
                    <div>租期：{fmtDate(item.onlineTime)} 至 {fmtDate(item.offlineTime)}</div>
                    <div>
                      每期房租：
                      <span className="text-(--color-accent-dark) font-medium">¥{item.fee}</span>
                    </div>
                  </div>
                  {item.isCheckout && (
                    <div className="mt-1.5 text-xs text-[#999]">
                      已退房{item.checkoutTime ? `（${fmtDate(item.checkoutTime)}）` : ""}
                    </div>
                  )}
                </div>
              );
            })}
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
