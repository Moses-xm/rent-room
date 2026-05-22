"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import { PortalShell } from "@/components/portal/PortalShell";
import { RoomImage } from "@/components/portal/RoomImage";
import { RoomTags } from "@/components/portal/RoomTags";
import { BrokerCard } from "@/components/portal/BrokerCard";
import { AppointmentModal } from "@/components/portal/AppointmentModal";
import { portalRequest } from "@/utils/portal-request";
import { getPortalToken } from "@/utils/portal-auth";
import { fmtDate } from "@/utils/format";
import { buildRoomTags } from "@/utils/portal-room";
import {
  FONT_FAMILY,
  RENT_TYPE_OPTIONS,
  LEVEL_OPTIONS,
} from "@/utils/constants";
import BaiduMapReadonly from "@/components/BaiduMapReadonly";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface FacilityItem {
  id: number;
  name: string;
  icon: string;
}

interface RoomDetail {
  id: number;
  name: string;
  rentType: number;
  minTenancy: number;
  bedroom: number;
  parlour: number;
  bathroom: number;
  roomType: string;
  direction: string;
  price: number;
  area: number;
  pledge: number;
  pay: number;
  floor: number;
  floors: number;
  level: number;
  lift: number;
  description: string | null;
  coverUrl: string;
  imageUrls: string[];
  roomCode: string;
  isRented: number;
  views: number;
  publishTime: string | null;
  community: {
    id: number;
    name: string;
    district: string;
    street: string | null;
    streetNumber: string | null;
    subwayLine: string | null;
    lng: number;
    lat: number;
  } | null;
  publisher: {
    id: number;
    nickname: string | null;
    realname: string | null;
    username: string;
    avatarUrl: string;
    phone: string | null;
    email: string | null;
  } | null;
  facilities: FacilityItem[];
}

/* ─── Dynamic imports ────────────────────────────────────────────────────── */
const MDPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((m) => m.default),
  {
    ssr: false,
    loading: () => <div className="h-24 skeleton-shimmer rounded-sm" />,
  }
);

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function labelOf(options: { value: number; label: string }[], val: number) {
  return options.find((o) => o.value === val)?.label ?? "—";
}

function parseSubwayLines(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.join(" / ");
  } catch {}
  return raw;
}

/* ─── Section title ──────────────────────────────────────────────────────── */
function SectionTitle({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border mb-4">
      <span className="text-base font-semibold text-text">{title}</span>
      {extra && <span className="text-xs text-text-muted hidden sm:block">{extra}</span>}
    </div>
  );
}

/* ─── Info cell ──────────────────────────────────────────────────────────── */
function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-sm text-text-muted shrink-0">{label}：</span>
      <span className="text-sm text-text font-medium truncate">{value}</span>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <div className="max-w-295 mx-auto px-4 lg:px-0 py-5">
      <div className="h-4 w-48 skeleton-shimmer rounded mb-4" />
      <div className="h-7 w-2/3 skeleton-shimmer rounded mb-4" />
      <div className="flex gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-5 w-20 skeleton-shimmer rounded" />
        ))}
      </div>
      <div className="flex flex-col lg:flex-row lg:gap-5">
        <div className="flex-1 space-y-5">
          <div className="w-full h-60 lg:h-112.5 skeleton-shimmer" />
        </div>
        <div className="mt-5 lg:mt-0 lg:w-65 shrink-0">
          <div className="h-80 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

/* ─── Image carousel ─────────────────────────────────────────────────────── */
function ImageCarousel({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const list = images.length > 0 ? images : [""];

  return (
    <div className="relative w-full h-60 lg:h-112.5 overflow-hidden bg-surface group">
      {/* 滑动轨道 */}
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{
          width: `${list.length * 100}%`,
          transform: `translateX(-${(idx * 100) / list.length}%)`,
        }}
      >
        {list.map((src, i) => (
          <div key={i} className="h-full shrink-0" style={{ width: `${100 / list.length}%` }}>
            <RoomImage src={src} alt={name} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {list.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + list.length) % list.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % list.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-sm"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === idx ? "bg-primary" : "bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [collected, setCollected] = useState(false);
  const [collectLoading, setCollectLoading] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const lastCountedId = useRef<string | null>(null);

  const fetchRoom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portalRequest<{ success: boolean; data: RoomDetail }>(
        `/portal/rooms/${id}`,
        { silent: true }
      );
      setRoom(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCollectionStatus = useCallback(async () => {
    if (!getPortalToken()) return;
    try {
      const res = await portalRequest<{ success: boolean; data: { collected: boolean } }>(
        `/portal/rooms/${id}/collection`,
        { silent: true }
      );
      setCollected(res.data.collected);
    } catch {}
  }, [id]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    fetchCollectionStatus();
  }, [fetchCollectionStatus]);

  useEffect(() => {
    if (lastCountedId.current === id) return;
    lastCountedId.current = id;
    portalRequest(`/portal/rooms/${id}`, { method: "POST", silent: true }).catch(() => {});
  }, [id]);

  function handleOpenAppointment() {
    if (!getPortalToken()) {
      toast.error("请先登录后再预约看房");
      return;
    }
    setAppointmentOpen(true);
  }

  function handleContact() {
    if (!getPortalToken()) {
      toast.error("请先登录后再租赁");
      return;
    }
  }

  async function handleAppointmentSubmit(appointmentTime: string, remark: string) {
    await portalRequest(`/portal/rooms/${id}/appointment`, {
      method: "POST",
      json: { appointmentTime, remark: remark || undefined },
    });
    toast.success("预约成功，请等待房东确认");
    setAppointmentOpen(false);
  }

  async function handleToggleCollect() {
    if (!getPortalToken()) {
      toast.error("请先登录后再收藏");
      return;
    }
    setCollectLoading(true);
    try {
      if (collected) {
        await portalRequest(`/portal/rooms/${id}/collection`, { method: "DELETE" });
        setCollected(false);
        toast.success("已取消收藏");
      } else {
        await portalRequest(`/portal/rooms/${id}/collection`, { method: "POST" });
        setCollected(true);
        toast.success("收藏成功");
      }
    } catch {
    } finally {
      setCollectLoading(false);
    }
  }

  if (loading) return <PortalShell><DetailSkeleton /></PortalShell>;

  if (notFound || !room) {
    return (
      <PortalShell>
        <div className="max-w-295 mx-auto px-4 py-20 text-center text-text-muted">
          房源不存在或已下架
        </div>
      </PortalShell>
    );
  }

  const tags = buildRoomTags({
    id: room.id,
    name: room.name,
    cover: "",
    price: room.price,
    rentType: room.rentType,
    bedroom: room.bedroom,
    parlour: room.parlour,
    area: room.area,
    floor: room.floor,
    floors: room.floors,
    direction: room.direction,
    lift: room.lift,
    community: room.community ?? undefined,
  });

  const brokerName = room.publisher
    ? room.publisher.nickname || room.publisher.realname || room.publisher.username
    : "经纪人";

  const subwayLabel = parseSubwayLines(room.community?.subwayLine);

  const roomCodeExtra = [
    `房屋编码：${room.roomCode}`,
    room.publishTime ? `发布时间：${fmtDate(room.publishTime)}` : "",
  ].filter(Boolean).join("，");

  /* 房屋信息网格 */
  const infoItems: { label: string; value: React.ReactNode }[] = [
    { label: "户型", value: `${room.bedroom}室${room.parlour}厅${room.bathroom}卫` },
    { label: "面积", value: `${room.area}平方米` },
    { label: "朝向", value: room.direction || "—" },
    { label: "楼层", value: `${labelOf(LEVEL_OPTIONS, room.level)}（共${room.floors}层）` },
    { label: "类型", value: room.roomType || "—" },
    { label: "租赁", value: labelOf(RENT_TYPE_OPTIONS, room.rentType) },
    { label: "最短租期", value: `${room.minTenancy}个月` },
    { label: "押付", value: `押${room.pledge}付${room.pay}` },
    ...(subwayLabel ? [{ label: "地铁", value: subwayLabel }] : []),
    ...(room.community
      ? [{
          label: "小区",
          value: (
            <Link href={`/portal/cmyRoom/${room.community.id}`} className="text-primary hover:underline">
              {room.community.name}
            </Link>
          ),
        }]
      : []),
  ];

  /* 经纪人信息行 */
  const brokerInfo = [
    { label: "用户名", value: room.publisher?.username ?? "—" },
    ...(room.publisher?.phone ? [{ label: "电话", value: room.publisher.phone }] : []),
    ...(room.publisher?.email ? [{ label: "邮箱", value: room.publisher.email }] : []),
  ];

  return (
    <PortalShell>
      <div className="max-w-295 mx-auto px-4 lg:px-0 py-5">

        {/* 面包屑 */}
        <nav className="text-xs text-text-muted mb-3 flex flex-wrap items-center gap-1">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-0.5 hover:text-(--color-accent) transition-colors cursor-pointer"
          >
            <ChevronLeft size={12} />
            返回
          </button>
          <span className="mx-1">|</span>
          <Link href="/portal" className="hover:text-(--color-accent) transition-colors">雅阁租房</Link>
          <span>›</span>
          <span className="truncate max-w-60">{room.name}</span>
        </nav>

        {/* 标题 */}
        <h1 className="text-xl lg:text-[24px] font-semibold text-text leading-snug tracking-wide mb-3">
          {room.name}
        </h1>

        {/* 信息栏：价格 + 户型摘要 + 标签 + 浏览量 + 收藏 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 pb-4 border-b border-border">
          {/* 价格 */}
          <span className="text-[22px] font-bold text-(--color-accent-dark) leading-none">
            {room.price.toLocaleString()}
            <span className="text-sm font-normal text-text-muted ml-1">元/月</span>
          </span>

          <span className="text-text-muted text-sm hidden sm:inline">|</span>

          {/* 户型摘要 */}
          <span className="text-sm text-text-2">
            {room.bedroom}室{room.parlour}厅
          </span>

          <span className="text-text-muted text-sm hidden sm:inline">|</span>

          <span className="text-sm text-text-2">{room.area}平方米</span>

          {/* 标签 */}
          <RoomTags tags={tags.slice(0, 3)} />

          {/* 右侧：浏览量 + 收藏 */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-text-muted">{room.views} 次浏览</span>
            <button
              onClick={handleToggleCollect}
              disabled={collectLoading}
              className={`flex items-center gap-1 text-sm cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${collected ? "text-(--color-accent)" : "text-text-2 hover:text-(--color-accent)"}`}
            >
              <Star size={14} fill={collected ? "currentColor" : "none"} />
              {collected ? "已收藏" : "收藏"}
            </button>
          </div>
        </div>

        {/* 主内容双栏：图片 + 经纪人并排 */}
        <div className="flex flex-col lg:flex-row lg:gap-5">

          {/* ── 左侧 ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* 图片轮播 */}
            <ImageCarousel
              images={room.imageUrls.length > 0 ? room.imageUrls : [room.coverUrl]}
              name={room.name}
            />

            {/* ── 房屋信息 ──────────────────────────────────────────────── */}
            <div className="mt-7">
              <SectionTitle title="房屋信息" extra={roomCodeExtra} />

              {/* 移动端显示编码 */}
              {roomCodeExtra && (
                <div className="text-xs text-text-muted mb-3 sm:hidden">{roomCodeExtra}</div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {infoItems.map((item, i) => (
                  <InfoCell key={i} label={item.label} value={item.value} />
                ))}
              </div>
            </div>

            {/* ── 房屋配套 ──────────────────────────────────────────────── */}
            {room.facilities.length > 0 && (
              <div className="mt-8">
                <SectionTitle title="房屋配套" />
                <div className="flex flex-wrap">
                  {room.facilities.map((f) => (
                    <div key={f.id} className="flex items-end justify-center w-25 h-27.5">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-full border-2 border-[#666] flex items-center justify-center">
                          <i className={`${FONT_FAMILY} ${f.icon} leading-none text-[#444]`} style={{ fontSize: 30 }} />
                        </div>
                        <div className="flex items-center justify-center w-25 h-8.5 text-sm text-text-2">
                          {f.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 房源概况 ──────────────────────────────────────────────── */}
            {room.description && (
              <div className="mt-8">
                <SectionTitle title="房源概况" />
                <div className="text-sm text-text-2 leading-relaxed">
                  <MDPreview
                    source={room.description}
                    style={{ background: "transparent", color: "inherit" }}
                  />
                </div>
              </div>
            )}

            {/* ── 房源位置 ──────────────────────────────────────────────── */}
            {room.community?.lng && room.community?.lat && (
              <div className="mt-8">
                <SectionTitle title="房源位置" />
                <div className="w-full h-60 lg:h-90 overflow-hidden">
                  <BaiduMapReadonly lng={room.community.lng} lat={room.community.lat} />
                </div>
              </div>
            )}

          </div>

          {/* ── 右侧经纪人卡片 ────────────────────────────────────────── */}
          <aside className="mt-5 lg:mt-0 lg:w-65 shrink-0">
            <div className="lg:sticky lg:top-5">
              <BrokerCard
                name={brokerName}
                avatarUrl={room.publisher?.avatarUrl}
                info={brokerInfo}
                isRented={room.isRented === 2}
                onAppointment={handleOpenAppointment}
                onContact={handleContact}
              />

              {/* 移动端地图 */}
              {room.community?.lng && room.community?.lat && (
                <div className="mt-5 lg:hidden">
                  <SectionTitle title="房源位置" />
                  <div className="w-full h-56 overflow-hidden">
                    <BaiduMapReadonly lng={room.community.lng} lat={room.community.lat} />
                  </div>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
      <AppointmentModal
        open={appointmentOpen}
        onClose={() => setAppointmentOpen(false)}
        onSubmit={handleAppointmentSubmit}
      />
    </PortalShell>
  );
}
