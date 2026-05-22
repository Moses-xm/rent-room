"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, ExternalLink, Building2, Home, MapPin, Star } from "lucide-react";
import { MineShell } from "@/components/portal/MineShell";
import { LandlordGate } from "@/components/portal/LandlordGate";
import { portalRequest } from "@/utils/portal-request";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { fmtDate } from "@/utils/format";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import { getPortalProfile } from "@/utils/portal-auth";

const PAGE_SIZE = 10;

type CommunityItem = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string | null;
  cover: string;
  roomCount: number;
  createdAt: string;
};

const COMMUNITY_GATE_FEATURES = [
  { icon: Building2, label: "创建小区" },
  { icon: Home,      label: "关联多套房源" },
  { icon: MapPin,    label: "地图定位管理" },
  { icon: Edit2,     label: "随时编辑信息" },
  { icon: Trash2,    label: "灵活删除小区" },
  { icon: Star,      label: "房东专属权益" },
];

export default function MyCommunityPage() {
  const router = useRouter();
  const isLandlord = getPortalProfile()?.identity === 2;
  const [items, setItems]           = useState<CommunityItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [hasLoaded, setHasLoaded]   = useState(false);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean; data: CommunityItem[]; total: number; totalPages: number;
      }>(`/portal/account/communities?page=${p}&limit=${PAGE_SIZE}`);
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
    try {
      await portalRequest(`/portal/account/communities/${id}`, { method: "DELETE" });
      toast.success("小区已删除");
      load(page);
    } catch {}
    setDeletingId(null);
  }

  return (
    <MineShell title="我的小区">
      {!isLandlord && <LandlordGate features={COMMUNITY_GATE_FEATURES} />}
      {isLandlord && <>
      {/* 操作栏 */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#eee]">
        <Link
          href="/portal/account/community/new"
          className="flex items-center gap-1.5 h-8 px-4 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          创建小区
        </Link>
      </div>

      {/* 桌面端表头 */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_100px] text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface">
        <span>小区</span>
        <span>位置</span>
        <span>房源数</span>
        <span>创建时间</span>
        <span>操作</span>
      </div>

      {/* 骨架屏 */}
      {loading && !hasLoaded && (
        <div className="hidden lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] px-5 py-4 border-b border-[#eee] items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="skeleton-shimmer w-14 h-10 rounded shrink-0" />
                <div className="skeleton-shimmer flex-1 h-4 rounded" />
              </div>
              <div className="skeleton-shimmer h-4 w-20 rounded" />
              <div className="skeleton-shimmer h-4 w-10 rounded" />
              <div className="skeleton-shimmer h-4 w-20 rounded" />
              <div className="skeleton-shimmer h-7 w-16 rounded" />
            </div>
          ))}
        </div>
      )}

      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-text-muted text-sm mb-4">暂无创建的小区</p>
          <Link
            href="/portal/account/community/new"
            className="inline-flex items-center gap-1.5 h-9 px-5 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            立即创建小区
          </Link>
        </div>
      )}

      {hasLoaded && items.length > 0 && (
        <>
          {/* 桌面端 */}
          <div className="hidden lg:block">
            {items.map((item) => {
              const coverUrl = resolveUploadedFileUrl(item.cover);
              const inUse = item.roomCount > 0;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt={item.name} className="w-14 h-10 object-cover rounded shrink-0" />
                    ) : (
                      <div className="w-14 h-10 bg-surface-2 rounded shrink-0" />
                    )}
                    <Link
                      href={`/portal/account/community/${item.id}`}
                      className="truncate min-w-0 text-text hover:text-primary hover:underline"
                    >
                      {item.name}
                    </Link>
                  </div>
                  <span className="text-text-muted truncate">
                    {item.district}
                  </span>
                  <span className="text-text">{item.roomCount} 套</span>
                  <span className="text-text-muted">{fmtDate(item.createdAt)}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/portal/cmyRoom/${item.id}`}
                      target="_blank"
                      title="查看公开页"
                      className="w-7 h-7 flex items-center justify-center rounded border border-[#ddd] text-[#666] hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => router.push(`/portal/account/community/${item.id}/edit`)}
                      title="编辑"
                      className="w-7 h-7 flex items-center justify-center rounded border border-[#ddd] text-[#666] hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      disabled={inUse}
                      title={inUse ? "已有房源，不可删除" : "删除"}
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
              const inUse = item.roomCount > 0;
              return (
                <div key={item.id} className="border border-[#eee] rounded p-3">
                  <div className="flex gap-3">
                    {coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={coverUrl} alt={item.name} className="w-16 h-12 object-cover rounded shrink-0" />
                    ) : (
                      <div className="w-16 h-12 bg-surface-2 rounded shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/portal/account/community/${item.id}`} className="font-medium text-sm text-text truncate block hover:text-primary">
                        {item.name}
                      </Link>
                      <div className="text-xs text-text-muted mt-1">{item.district} · {item.roomCount} 套房源</div>
                      <div className="text-xs text-text-muted mt-0.5">{fmtDate(item.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-[#f5f5f5]">
                    <Link
                      href={`/portal/cmyRoom/${item.id}`}
                      target="_blank"
                      className="text-xs px-2 h-6 border border-[#ddd] rounded text-[#666] hover:border-primary hover:text-primary cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      公开页
                    </Link>
                    <button
                      onClick={() => router.push(`/portal/account/community/${item.id}/edit`)}
                      className="text-xs px-2 h-6 border border-[#ddd] rounded text-[#666] hover:border-primary hover:text-primary cursor-pointer transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      disabled={inUse}
                      className="text-xs px-2 h-6 border border-[#ddd] rounded text-[#666] hover:border-red-400 hover:text-red-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {total > PAGE_SIZE && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              totalPages={totalPages}
              onPageChange={(p) => load(p)}
              onPageSizeChange={() => {}}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="删除小区"
        description="删除后不可恢复，确认删除该小区吗？"
        confirmText="删除"
        onConfirm={() => { if (deletingId !== null) handleDelete(deletingId); }}
        onClose={() => setDeletingId(null)}
      />
      </>}
    </MineShell>
  );
}
