"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { RoomImage } from "@/components/portal/RoomImage";
import { BrokerCard } from "@/components/portal/BrokerCard";
import { portalRequest } from "@/utils/portal-request";
import { fmtDate } from "@/utils/format";
import {
  BAIDU_MAP_AK,
  FONT_FAMILY,
  RENT_TYPE_OPTIONS,
  LEVEL_OPTIONS,
} from "@/utils/constants";

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

const BaiduMapReadonly = dynamic(
  () =>
    import("react-bmapgl").then(({ Map, Marker, MapApiLoaderHOC }) => {
      const B = () =>
        (window as Window & { BMapGL: typeof BMapGL }).BMapGL;
      const SafeMarker = Marker as unknown as React.ComponentType<{
        position: BMapGL.Point;
      }>;

      function ReadonlyMapInner({ lng, lat }: { lng: number; lat: number }) {
        const center = new (B()).Point(lng, lat);
        return (
          <Map
            center={center}
            zoom={15}
            style={{ width: "100%", height: "100%" }}
            enableScrollWheelZoom
          >
            <SafeMarker position={center} />
          </Map>
        );
      }

      return MapApiLoaderHOC({ ak: BAIDU_MAP_AK })(
        ReadonlyMapInner as unknown as React.ComponentType
      ) as unknown as React.ComponentType<{ lng: number; lat: number }>;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-surface">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    ),
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
function SectionTitle({
  title,
  extra,
}: {
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border mb-4">
      <span className="text-base font-semibold text-text">{title}</span>
      {extra && (
        <span className="text-xs text-text-muted hidden sm:block">{extra}</span>
      )}
    </div>
  );
}

/* ─── Info cell ──────────────────────────────────────────────────────────── */
function InfoCell({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
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
      <div className="h-7 w-2/3 skeleton-shimmer rounded mb-5" />
      <div className="flex flex-col lg:flex-row lg:gap-5">
        <div className="flex-1 space-y-5">
          <div className="w-full h-60 lg:h-112.5 skeleton-shimmer" />
          <div className="space-y-3">
            <div className="h-5 w-1/3 skeleton-shimmer rounded" />
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-5 skeleton-shimmer rounded" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full skeleton-shimmer" />
                <div className="h-3 w-10 skeleton-shimmer rounded" />
              </div>
            ))}
          </div>
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
      <RoomImage src={list[idx]} alt={name} className="w-full h-full object-cover" />
      {list.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + list.length) % list.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % list.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === idx ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
          <div className="absolute bottom-3 right-3 text-xs text-white bg-black/40 px-2 py-0.5">
            {idx + 1} / {list.length}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

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

  const brokerName = room.publisher
    ? room.publisher.nickname || room.publisher.realname || room.publisher.username
    : "经纪人";

  const subwayLabel = parseSubwayLines(room.community?.subwayLine);

  /* 房屋信息网格数据 */
  const infoItems: { label: string; value: React.ReactNode }[] = [
    { label: "户型", value: `${room.bedroom}室${room.parlour}厅${room.bathroom}卫` },
    { label: "面积", value: `${room.area}平方米` },
    { label: "朝向", value: room.direction || "—" },
    { label: "楼层", value: `${labelOf(LEVEL_OPTIONS, room.level)}（共${room.floors}层）` },
    { label: "类型", value: room.roomType || "—" },
    { label: "租赁", value: labelOf(RENT_TYPE_OPTIONS, room.rentType) },
    { label: "最短租期", value: `${room.minTenancy}个月` },
    ...(subwayLabel ? [{ label: "地铁", value: subwayLabel }] : []),
    ...(room.community
      ? [{
          label: "小区",
          value: (
            <Link
              href={`/portal/cmyRoom/${room.community.id}`}
              className="text-primary hover:underline"
            >
              {room.community.name}
            </Link>
          ),
        }]
      : []),
  ];

  const roomCodeExtra = [
    `房屋编码：${room.roomCode}`,
    room.publishTime ? `发布时间：${fmtDate(room.publishTime)}` : "",
  ]
    .filter(Boolean)
    .join("，");

  return (
    <PortalShell>
      <div className="max-w-295 mx-auto px-4 lg:px-0 py-5">

        {/* 面包屑 */}
        <nav className="text-xs text-text-muted mb-3 flex flex-wrap items-center gap-1">
          <Link href="/portal" className="hover:text-(--color-accent) transition-colors">雅阁租房</Link>
          <span>›</span>
          {room.community && (
            <>
              <Link href={`/portal/cmyRoom/${room.community.id}`} className="hover:text-(--color-accent) transition-colors">
                {room.community.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="truncate max-w-[200px]">{room.name}</span>
        </nav>

        {/* 房源标题 */}
        <h1 className="text-xl lg:text-[24px] font-semibold text-text leading-snug tracking-wide mb-5">
          {room.name}
          {room.isRented === 2 && (
            <span className="ml-3 text-xs font-normal text-white bg-text-muted px-2 py-0.5 rounded-full align-middle">
              已租出
            </span>
          )}
        </h1>

        {/* 主内容双栏 */}
        <div className="flex flex-col lg:flex-row lg:gap-5">

          {/* ── 左侧 ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* 图片轮播 */}
            <ImageCarousel
              images={room.imageUrls.length > 0 ? room.imageUrls : [room.coverUrl]}
              name={room.name}
            />

            {/* ── 房屋信息 ──────────────────────────────────────────────── */}
            <div className="mt-6">
              <SectionTitle title="房屋信息" extra={roomCodeExtra} />

              {/* 价格行 */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-5">
                <span className="text-[28px] font-bold text-(--color-accent-dark) leading-none">
                  {room.price.toLocaleString()}
                </span>
                <span className="text-base text-text-muted">元/月</span>
                <span className="text-sm text-text-2 ml-2">
                  押{room.pledge}付{room.pay}
                </span>
              </div>

              {/* 移动端显示编码 */}
              {roomCodeExtra && (
                <div className="text-xs text-text-muted mb-4 sm:hidden">{roomCodeExtra}</div>
              )}

              {/* 信息网格：移动端 2 列，桌面端 3 列 */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5">
                {infoItems.map((item, i) => (
                  <InfoCell key={i} label={item.label} value={item.value} />
                ))}
              </div>
            </div>

            {/* ── 房屋配套 ──────────────────────────────────────────────── */}
            {room.facilities.length > 0 && (
              <div className="mt-8">
                <SectionTitle title="房屋配套" />
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-6">
                  {room.facilities.map((f) => (
                    <div key={f.id} className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full border border-[#ddd] flex items-center justify-center text-text-muted">
                        <i className={`${FONT_FAMILY} ${f.icon} text-2xl`} />
                      </div>
                      <span className="text-xs text-text-2 text-center leading-tight">{f.name}</span>
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
          <aside className="mt-6 lg:mt-0 lg:w-65 shrink-0">
            <div className="lg:sticky lg:top-5">
              <BrokerCard
                name={brokerName}
                avatarUrl={room.publisher?.avatarUrl}
                info={[
                  ...(room.publisher?.phone ? [{ label: "电话", value: room.publisher.phone }] : []),
                  { label: "浏览", value: `${room.views} 次` },
                ]}
              />

              {/* 移动端地图（在经纪人卡片下方） */}
              {room.community?.lng && room.community?.lat && (
                <div className="mt-4 lg:hidden">
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
    </PortalShell>
  );
}
