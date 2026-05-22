"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Globe, GlobeLock, Home, Star, BarChart2, Building2 } from "lucide-react";
import { MineShell } from "@/components/portal/MineShell";
import { LandlordGate } from "@/components/portal/LandlordGate";
import { portalRequest } from "@/utils/portal-request";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { fmtDate } from "@/utils/format";
import { ROOM_PUBLISHED_STYLE, ROOM_RENTED_STYLE, MINE_SKELETON_ROWS } from "@/utils/constants";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { getPortalProfile } from "@/utils/portal-auth";

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

const ROOM_GATE_FEATURES = [
  { icon: Home,      label: "发布房源" },
  { icon: Globe,     label: "上下架管理" },
  { icon: Building2, label: "关联小区" },
  { icon: BarChart2, label: "出租状态跟踪" },
  { icon: Edit2,     label: "随时编辑信息" },
  { icon: Star,      label: "房东专属权益" },
];

const COLS = "grid-cols-[2fr_1fr_1fr_1fr_1fr_100px]";

function ListSkeleton() {
  return (
    <>
      <div className="hidden lg:block">
        {Array.from({ length: MINE_SKELETON_ROWS }).map((_, i) => (
          <div key={i} className={`grid ${COLS} px-5 py-4 border-b border-[#eee] items-center gap-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="skeleton-shimmer w-16 h-12 rounded shrink-0" />
              <div className="skeleton-shimmer flex-1 h-4 rounded" />
            </div>
            <div className="skeleton-shimmer h-4 w-20 rounded" />
            <div className="skeleton-shimmer h-5 w-14 rounded-full" />
            <div className="skeleton-shimmer h-5 w-14 rounded-full" />
            <div className="skeleton-shimmer h-4 w-16 rounded" />
            <div className="skeleton-shimmer h-7 w-22 rounded" />
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

export default function MyRoomPage() {
  const router = useRouter();
  const isLandlord = getPortalProfile()?.identity === 2;
  const [items, setItems]         = useState<RoomItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(10);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingId, setDeletingId]   = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const load = useCallback(async (p: number, l: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean; data: RoomItem[]; total: number; totalPages: number;
      }>(`/portal/account/rooms?page=${p}&limit=${l}`);
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

  async function handleTogglePublish(item: RoomItem) {
    setPublishingId(item.id);
    try {
      const res = await portalRequest<{ success: boolean; data: { isPublished: number } }>(
        `/portal/account/rooms/${item.id}/publish`,
        { method: "PATCH" }
      );
      toast.success(`房源${res.data.isPublished === 2 ? "已发布" : "已撤回"}`);
      setItems(prev => prev.map(r => r.id === item.id ? { ...r, isPublished: res.data.isPublished } : r));
    } catch {
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(id: number) {
    try {
      await portalRequest(`/portal/account/rooms/${id}`, { method: "DELETE" });
      toast.success("房源已删除");
      load(page, limit);
    } catch {}
    setDeletingId(null);
  }

  return (
    <MineShell title="我的房源">
      {!isLandlord && <LandlordGate features={ROOM_GATE_FEATURES} />}
      {isLandlord && (
        <>
          {/* 操作栏 */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[#eee]">
            <Link
              href="/portal/account/room/new"
              className="flex items-center gap-1.5 h-8 px-4 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              发布房源
            </Link>
            <Link
              href="/portal/account/community/new"
              className="flex items-center gap-1.5 h-8 px-4 border border-primary text-primary text-sm rounded cursor-pointer hover:bg-primary-tint transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              创建小区
            </Link>
          </div>

          {/* 桌面端表头 */}
          <div className={`hidden lg:grid ${COLS} text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface gap-3`}>
            <span>房源</span>
            <span>小区</span>
            <span>发布状态</span>
            <span>出租状态</span>
            <span>发布时间</span>
            <span>操作</span>
          </div>

          {loading && !hasLoaded && <ListSkeleton />}

          {hasLoaded && items.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-text-muted text-sm mb-4">暂无发布的房源</p>
              <Link
                href="/portal/account/room/new"
                className="inline-flex items-center gap-1.5 h-9 px-5 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                立即发布房源
              </Link>
            </div>
          )}

          {hasLoaded && items.length > 0 && (
            <>
              {/* 桌面端列表 */}
              <div className="hidden lg:block">
                {items.map((item) => {
                  const coverUrl = resolveUploadedFileUrl(item.cover);
                  const pub  = ROOM_PUBLISHED_STYLE[item.isPublished];
                  const rent = ROOM_RENTED_STYLE[item.isRented];
                  const isPublishing = publishingId === item.id;
                  return (
                    <div key={item.id} className={`grid ${COLS} px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface gap-3`}>
                      <Link href={`/portal/account/room/${item.id}`} className="flex items-center gap-3 group min-w-0">
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coverUrl} alt={item.name} className="w-16 h-12 object-cover rounded shrink-0" />
                        ) : (
                          <div className="w-16 h-12 bg-surface-2 rounded shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-text group-hover:text-(--color-accent) group-hover:underline">{item.name}</div>
                          <div className="text-xs text-(--color-accent-dark) font-medium mt-0.5">¥{item.price}/月</div>
                        </div>
                      </Link>
                      <div className="min-w-0 truncate text-text-2">{item.communityName || "—"}</div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${pub?.cls}`}>
                        {pub?.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${rent?.cls}`}>
                        {rent?.label}
                      </span>
                      <span className="text-text-2">
                        {item.publishTime ? fmtDate(item.publishTime) : "—"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleTogglePublish(item)}
                          disabled={isPublishing || item.isRented === 2}
                          title={item.isPublished === 2 ? "撤回发布" : "发布"}
                          className="w-7 h-7 flex items-center justify-center rounded border border-[#ddd] text-[#666] hover:border-primary hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {item.isPublished === 2
                            ? <GlobeLock className="w-3.5 h-3.5" />
                            : <Globe className="w-3.5 h-3.5" />
                          }
                        </button>
                        <button
                          onClick={() => router.push(`/portal/account/room/${item.id}/edit`)}
                          title="编辑"
                          className="w-7 h-7 flex items-center justify-center rounded border border-[#ddd] text-[#666] hover:border-primary hover:text-primary transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          disabled={item.isRented === 2}
                          title="删除"
                          className="w-7 h-7 flex items-center justify-center rounded border border-[#ddd] text-[#666] hover:border-red-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 移动端卡片 */}
              <div className="lg:hidden space-y-3 p-4">
                {items.map((item) => {
                  const coverUrl = resolveUploadedFileUrl(item.cover);
                  const pub  = ROOM_PUBLISHED_STYLE[item.isPublished];
                  const rent = ROOM_RENTED_STYLE[item.isRented];
                  return (
                    <div key={item.id} className="border border-[#eee] rounded p-3">
                      <div className="flex gap-3">
                        {coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={coverUrl} alt={item.name} className="w-20 h-15 object-cover rounded shrink-0" />
                        ) : (
                          <div className="w-20 h-15 bg-surface-2 rounded shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <Link href={`/portal/account/room/${item.id}`} className="font-medium text-sm text-text truncate block hover:text-(--color-accent)">
                            {item.name}
                          </Link>
                          <div className="text-xs text-text-muted mt-0.5">{item.communityName || "—"}</div>
                          <div className="text-sm text-(--color-accent-dark) font-medium mt-0.5">¥{item.price}/月</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#f5f5f5] flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${pub?.cls}`}>{pub?.label}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${rent?.cls}`}>{rent?.label}</span>
                        <div className="ml-auto flex items-center gap-1.5">
                          <button
                            onClick={() => handleTogglePublish(item)}
                            disabled={publishingId === item.id || item.isRented === 2}
                            className="text-xs px-2 h-6 border border-[#ddd] rounded text-[#666] hover:border-primary hover:text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {item.isPublished === 2 ? "撤回" : "发布"}
                          </button>
                          <button
                            onClick={() => router.push(`/portal/account/room/${item.id}/edit`)}
                            className="text-xs px-2 h-6 border border-[#ddd] rounded text-[#666] hover:border-primary hover:text-primary cursor-pointer transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            disabled={item.isRented === 2}
                            className="text-xs px-2 h-6 border border-[#ddd] rounded text-[#666] hover:border-red-400 hover:text-red-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <ConfirmDialog
            open={deletingId !== null}
            title="删除房源"
            description="删除后不可恢复，确认删除该房源吗？"
            confirmText="删除"
            danger
            onConfirm={() => { if (deletingId !== null) handleDelete(deletingId); }}
            onClose={() => setDeletingId(null)}
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
      )}
    </MineShell>
  );
}
