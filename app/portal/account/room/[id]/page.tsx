"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil, Home, MapPin, Building2, Calendar } from "lucide-react";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { portalRequest } from "@/utils/portal-request";
import { FONT_FAMILY, RENT_TYPE_OPTIONS, LEVEL_OPTIONS, LIFT_OPTIONS } from "@/utils/constants";
import { fmtDate, fmtDateTime } from "@/utils/format";
import { MineShell } from "@/components/portal/MineShell";
import RoomImageCarousel from "@/components/RoomImageCarousel";
import BaiduMapReadonly from "@/components/BaiduMapReadonly";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CommunitySnap = {
  id: number; name: string; province: string; city: string;
  district: string; street: string | null; streetNumber: string | null;
  lng: number; lat: number;
};
type FacilityItem = { id: number; name: string; icon: string };

type RoomDetail = {
  id: number; name: string; cmyId: number; rentType: number;
  minTenancy: number; bedroom: number; parlour: number; bathroom: number;
  roomType: string; direction: string; price: number; area: number;
  pledge: number; pay: number; floor: number; floors: number;
  level: number; lift: number; description: string | null;
  cover: string; images: string; facilityIds: string;
  isPublished: number; isRented: number; publishTime: string | null;
  roomCode: string; views: number;
  createdAt: string; updatedAt: string;
  community: CommunitySnap | null;
  facilities: FacilityItem[];
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function parseImages(raw: string): string[] {
  try { const a = JSON.parse(raw || "[]"); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
const rentTypeLabel = (v: number) => RENT_TYPE_OPTIONS.find(o => o.value === v)?.label ?? "—";
const levelLabel    = (v: number) => LEVEL_OPTIONS.find(o => o.value === v)?.label ?? "—";
const liftLabel     = (v: number) => LIFT_OPTIONS.find(o => o.value === v)?.label ?? "—";

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 border-b border-[#f0f0f0] last:border-0">
      <span className="text-sm text-[#888]">{label}</span>
      <span className="text-sm text-[#333]">{children}</span>
    </div>
  );
}

function Card({ title, icon, action, children }: {
  title: string; icon?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
        <div className="flex items-center gap-2 text-[#888]">
          {icon}
          <span className="text-sm font-medium text-[#444]">{title}</span>
        </div>
        {action}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}


function PublishedBadge({ v }: { v: number }) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-600 font-medium">已发布</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 font-medium">未发布</span>;
}
function RentedBadge({ v }: { v: number }) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-500 font-medium">已租出</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--color-primary-tint,#e6f7ee)] text-[var(--color-primary)] font-medium">待出租</span>;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function PortalRoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom]     = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portalRequest<{ success: boolean; data: RoomDetail }>(
        `/portal/account/rooms/${id}/detail`, { silent: true }
      );
      if (res.success) setRoom(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  /* ── 骨架屏 ── */
  if (loading) {
    return (
      <MineShell title="房源详情">
        <div className="px-5 py-5 space-y-4">
          <div className="h-5 w-24 rounded skeleton-shimmer" />
          <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
            <div className="h-64 skeleton-shimmer" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-48 rounded skeleton-shimmer" />
              <div className="h-4 w-64 rounded skeleton-shimmer opacity-60" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1].map(i => (
              <div key={i} className="bg-white border border-[#eee] rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <div className="h-4 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="px-5 divide-y divide-[#f0f0f0]">
                  {Array.from({ length: 4 }).map((_, k) => (
                    <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                      <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                      <div className="h-3.5 w-28 rounded skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </MineShell>
    );
  }

  if (!room) {
    return (
      <MineShell title="房源详情">
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-[#aaa]">
          <Home size={40} className="opacity-30" />
          <p className="text-sm">房源不存在或已被删除</p>
          <button onClick={() => router.push("/portal/account/room")}
            className="h-8 px-4 text-sm border border-[#ddd] rounded text-[#666] hover:bg-[#f5f5f5] transition-colors cursor-pointer">
            返回我的房源
          </button>
        </div>
      </MineShell>
    );
  }

  const coverUrl = resolveUploadedFileUrl(room.cover);
  const extraImages = parseImages(room.images);
  const allImages = coverUrl ? [room.cover, ...extraImages.filter(x => x !== room.cover)] : extraImages;
  const displayImages = allImages.map(p => resolveUploadedFileUrl(p)).filter(Boolean) as string[];

  const addressParts = room.community
    ? [room.community.province, room.community.city, room.community.district, room.community.street, room.community.streetNumber].filter(Boolean)
    : [];

  return (
    <MineShell title="房源详情">
      <div className="px-5 py-5 space-y-4">

        {/* 面包屑 + 操作 */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-[#888] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            返回
          </button>
          <button
            onClick={() => router.push(`/portal/account/room/${room.id}/edit`)}
            className="h-8 px-3 text-sm rounded flex items-center gap-1.5 bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Pencil size={12} strokeWidth={2.5} />
            编辑
          </button>
        </div>

        {/* 图片轮播 + 基础信息 */}
        <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
          <RoomImageCarousel images={displayImages} name={room.name} />
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-semibold text-[#222] leading-tight">{room.name}</h2>
                <p className="text-xs text-[#aaa] font-mono mt-1">{room.roomCode}</p>
                {room.community && (
                  <p className="text-sm text-[#888] mt-1 flex items-center gap-1">
                    <MapPin size={11} className="text-[#bbb] shrink-0" />
                    {addressParts.join(" ")}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="text-[22px] font-bold text-[var(--color-accent-dark,#e07b00)] leading-none">
                  ¥{room.price.toLocaleString()}
                  <span className="text-sm font-normal text-[#888]">/月</span>
                </p>
                <div className="flex gap-1.5">
                  <PublishedBadge v={room.isPublished} />
                  {room.isPublished === 2 && <RentedBadge v={room.isRented} />}
                </div>
              </div>
            </div>
            {/* 快览 */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-[#f0f0f0]">
              {[
                { label: "户型", value: `${room.bedroom}室${room.parlour}厅${room.bathroom}卫` },
                { label: "面积", value: `${room.area} ㎡` },
                { label: "朝向", value: room.direction },
                { label: "楼层", value: `${room.floor}/${room.floors}F · ${levelLabel(room.level)}` },
                { label: "类型", value: rentTypeLabel(room.rentType) },
                { label: "电梯", value: liftLabel(room.lift) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-[#aaa] mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-[#333]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 两栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* 左栏 */}
          <div className="space-y-4">
            <Card title="租房信息" icon={<Home size={14} />}>
              <Field label="租赁类型">{rentTypeLabel(room.rentType)}</Field>
              <Field label="房屋类型">{room.roomType}</Field>
              <Field label="户型">{room.bedroom}室{room.parlour}厅{room.bathroom}卫</Field>
              <Field label="建筑面积">{room.area} ㎡</Field>
              <Field label="朝向">{room.direction}</Field>
              <Field label="楼层">{room.floor} / {room.floors} 层（{levelLabel(room.level)}）</Field>
              <Field label="电梯">{liftLabel(room.lift)}</Field>
              <Field label="最短租期">{room.minTenancy} 个月</Field>
              <Field label="押付方式">押 {room.pledge} 付 {room.pay}</Field>
            </Card>

            <Card title="发布信息" icon={<Calendar size={14} />}>
              <Field label="发布状态"><PublishedBadge v={room.isPublished} /></Field>
              <Field label="出租状态"><RentedBadge v={room.isRented} /></Field>
              <Field label="发布时间">{room.publishTime ? fmtDate(room.publishTime) : "—"}</Field>
              <Field label="房源编号"><span className="font-mono text-xs">{room.roomCode}</span></Field>
              <Field label="浏览量">{room.views} 次</Field>
              <Field label="创建时间"><span className="font-mono text-xs">{fmtDateTime(room.createdAt)}</span></Field>
            </Card>

            {room.facilities.length > 0 && (
              <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <span className="text-sm font-medium text-[#444]">房屋设施</span>
                </div>
                <div className="px-5 py-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {room.facilities.map(f => (
                    <div key={f.id}
                      className="flex flex-col items-center gap-1.5 px-2 py-3 rounded border border-[#eee] bg-[#fafafa] text-[#555]">
                      <i className={`${FONT_FAMILY} ${f.icon} text-[22px] text-[var(--color-primary)]`} />
                      <span className="text-xs leading-tight text-center">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右栏 */}
          <div className="space-y-4">
            {room.community && (
              <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <Building2 size={14} className="text-[#aaa]" />
                  <span className="text-sm font-medium text-[#444]">所属小区</span>
                </div>
                <div className="px-5 py-3 border-b border-[#f0f0f0]">
                  <p className="text-sm font-medium text-[#222]">{room.community.name}</p>
                  <p className="text-xs text-[#888] mt-1">{addressParts.join(" ")}</p>
                </div>
                <div style={{ height: "300px" }}>
                  <BaiduMapReadonly lng={room.community.lng} lat={room.community.lat} />
                </div>
              </div>
            )}

            {room.description && (
              <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                  <span className="text-sm font-medium text-[#444]">房源描述</span>
                </div>
                <div
                  className="px-5 py-4 rich-content"
                  dangerouslySetInnerHTML={{ __html: room.description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MineShell>
  );
}
