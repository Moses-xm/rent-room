"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { fmtDate } from "@/utils/format";
import { ROOM_PUBLISHED_STYLE, ROOM_RENTED_STYLE } from "@/utils/constants";

type RoomItem = {
  id: number;
  name: string;
  price: number;
  cover: string;
  isPublished: number;
  isRented: number;
  rentType: number;
  communityName: string;
  publishTime: string | null;
  createdAt: string;
};

export default function MyRoomPage() {
  const [items, setItems] = useState<RoomItem[]>([]);
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
        data: RoomItem[];
        total: number;
        totalPages: number;
      }>(`/portal/account/rooms?page=${p}&limit=10`);
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
    <MineShell title="我的房源">
      {/* 桌面端表头 */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface">
        <span>房源</span>
        <span>租金</span>
        <span>发布状态</span>
        <span>出租状态</span>
        <span>发布时间</span>
      </div>

      {/* 骨架屏 */}
      {loading && !hasLoaded && (
        <>
          <div className="hidden lg:block">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-5 py-4 border-b border-[#eee] items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton-shimmer w-16 h-12 rounded shrink-0" />
                  <div className="skeleton-shimmer flex-1 h-4 rounded" />
                </div>
                <div className="skeleton-shimmer h-4 w-16 rounded" />
                <div className="skeleton-shimmer h-5 w-14 rounded-full" />
                <div className="skeleton-shimmer h-5 w-14 rounded-full" />
                <div className="skeleton-shimmer h-4 w-20 rounded" />
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
        <div className="py-16 text-center text-text-muted text-sm">暂无发布的房源</div>
      )}

      {hasLoaded && items.length > 0 && (
        <>
          {/* 桌面端 */}
          <div className="hidden lg:block">
            {items.map((item) => {
              const coverUrl = resolveUploadedFileUrl(item.cover);
              const pub = ROOM_PUBLISHED_STYLE[item.isPublished];
              const rent = ROOM_RENTED_STYLE[item.isRented];
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface"
                >
                  <Link
                    href={`/portal/room/${item.id}`}
                    className="flex items-center gap-3 group"
                  >
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={item.name}
                        className="w-16 h-12 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-surface-2 rounded shrink-0" />
                    )}
                    <span className="truncate text-text group-hover:text-(--color-accent) group-hover:underline">
                      {item.name}
                    </span>
                  </Link>
                  <span className="text-(--color-accent-dark) font-medium">¥{item.price}/月</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${pub?.cls}`}>
                    {pub?.label}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${rent?.cls}`}>
                    {rent?.label}
                  </span>
                  <span className="text-text-muted">
                    {item.publishTime ? fmtDate(item.publishTime) : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3 p-4">
            {items.map((item) => {
              const coverUrl = resolveUploadedFileUrl(item.cover);
              const pub = ROOM_PUBLISHED_STYLE[item.isPublished];
              const rent = ROOM_RENTED_STYLE[item.isRented];
              return (
                <div key={item.id} className="border border-[#eee] rounded p-3">
                  <div className="flex gap-3">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={item.name}
                        className="w-20 h-15 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-15 bg-surface-2 rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/portal/room/${item.id}`}
                        className="font-medium text-sm text-text truncate block hover:text-(--color-accent)"
                      >
                        {item.name}
                      </Link>
                      <div className="text-xs text-text-muted mt-1">{item.communityName}</div>
                      <div className="text-sm text-(--color-accent-dark) font-medium mt-1">
                        ¥{item.price}/月
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#f5f5f5]">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${pub?.cls}`}>
                      {pub?.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${rent?.cls}`}>
                      {rent?.label}
                    </span>
                    {item.publishTime && (
                      <span className="ml-auto text-xs text-text-muted">
                        {fmtDate(item.publishTime)}
                      </span>
                    )}
                  </div>
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
