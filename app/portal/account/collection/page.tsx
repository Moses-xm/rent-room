"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { fmtDateTime } from "@/utils/format";
import { MINE_SKELETON_ROWS } from "@/utils/constants";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/ConfirmDialog";

type CollectionItem = {
  id: number;
  createdAt: string;
  room: {
    id: number;
    name: string;
    price: number;
    cover: string;
    rentType: number;
    area: number;
    communityName: string;
    landlordName: string;
  };
};

export default function CollectionPage() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const load = useCallback(async (p: number, l: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean;
        data: CollectionItem[];
        total: number;
        totalPages: number;
      }>(`/portal/account/collections?page=${p}&limit=${l}`);
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

  async function handleDelete() {
    if (confirmId === null) return;
    setDeleting(confirmId);
    try {
      await portalRequest(`/portal/account/collections?id=${confirmId}`, { method: "DELETE" });
      setConfirmId(null);
      toast.success("已取消收藏");
      load(page, limit);
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  return (
    <MineShell title="我的收藏">
      {/* 桌面端表头 */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_80px] gap-3 text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface">
        <span>房源</span>
        <span>房东</span>
        <span>收藏时间</span>
        <span>操作</span>
      </div>

      {/* 骨架屏 */}
      {loading && !hasLoaded && (
        <>
          {/* 桌面骨架 */}
          <div className="hidden lg:block">
            {Array.from({ length: MINE_SKELETON_ROWS }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 px-5 py-4 border-b border-[#eee] items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="skeleton-shimmer w-16 h-12 rounded shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="skeleton-shimmer h-4 rounded" />
                    <div className="skeleton-shimmer h-3 w-16 rounded" />
                  </div>
                </div>
                <div className="skeleton-shimmer h-4 w-20 rounded" />
                <div className="skeleton-shimmer h-4 w-32 rounded" />
                <div className="skeleton-shimmer h-4 w-12 rounded" />
              </div>
            ))}
          </div>
          {/* 移动端骨架 */}
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

      {/* 空态 */}
      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">暂无收藏记录</div>
      )}

      {/* 桌面端列表 */}
      {hasLoaded && items.length > 0 && (
        <>
          <div className="hidden lg:block">
            {items.map((item) => {
              const coverUrl = resolveUploadedFileUrl(item.room.cover);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1fr_1fr_80px] gap-3 px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface"
                >
                  <Link
                    href={`/portal/room/${item.room.id}`}
                    className="flex items-center gap-3 group min-w-0"
                  >
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={item.room.name}
                        className="w-16 h-12 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-surface-2 rounded shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-text group-hover:text-(--color-accent) group-hover:underline">
                        {item.room.name}
                      </div>
                      <div className="text-xs text-(--color-accent-dark) font-medium mt-0.5">¥{item.room.price}/月</div>
                    </div>
                  </Link>
                  <span className="text-text-2 truncate">{item.room.landlordName}</span>
                  <span className="text-text-muted">{fmtDateTime(item.createdAt)}</span>
                  <button
                    onClick={() => setConfirmId(item.id)}
                    disabled={deleting === item.id}
                    className="text-xs text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    取消收藏
                  </button>
                </div>
              );
            })}
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3 p-4">
            {items.map((item) => {
              const coverUrl = resolveUploadedFileUrl(item.room.cover);
              return (
                <div key={item.id} className="border border-[#eee] rounded p-3">
                  <div className="flex gap-3">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverUrl}
                        alt={item.room.name}
                        className="w-20 h-15 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-15 bg-surface-2 rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/portal/room/${item.room.id}`}
                        className="font-medium text-sm text-text truncate block hover:text-(--color-accent)"
                      >
                        {item.room.name}
                      </Link>
                      <div className="text-xs text-text-muted mt-0.5">房东：{item.room.landlordName}</div>
                      <div className="text-sm text-(--color-accent-dark) font-medium mt-0.5">
                        ¥{item.room.price}/月
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f5f5f5]">
                    <span className="text-xs text-text-muted">
                      收藏于 {fmtDateTime(item.createdAt)}
                    </span>
                    <button
                      onClick={() => setConfirmId(item.id)}
                      disabled={deleting === item.id}
                      className="text-xs text-red-400 hover:text-red-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmId !== null}
        title="取消收藏"
        description="确认取消收藏该房源吗？"
        confirmText="取消收藏"
        danger
        loading={deleting !== null}
        onConfirm={handleDelete}
        onClose={() => setConfirmId(null)}
      />

      {/* 分页 */}
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
    </MineShell>
  );
}
