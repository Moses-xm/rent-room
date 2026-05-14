'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { BAIDU_MAP_AK, FONT_FAMILY, RENT_TYPE_OPTIONS, LEVEL_OPTIONS, LIFT_OPTIONS } from '@/utils/constants';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Pencil, Home, MapPin, User, Calendar,
  RefreshCw, Loader2, Building2,
} from 'lucide-react';
import { fmtDate, fmtDateTime } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CommunitySnap = {
  id: number; name: string; province: string; city: string;
  district: string; street: string | null; streetNumber: string | null;
  lng: number; lat: number;
};
type PublisherSnap = {
  id: number; username: string; nickname: string | null;
  realname: string | null; avatar: string | null; phone: string | null;
};
type FacilityItem = { id: number; name: string; icon: string };

type RoomDetail = {
  id: number;
  name: string;
  cmyId: number;
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
  cover: string;
  images: string;
  facilityIds: string;
  publisherId: number;
  isPublished: number;
  publishTime: string | null;
  roomCode: string;
  isRented: number;
  views: number;
  times: number;
  income: number;
  createdAt: string;
  updatedAt: string;
  community: CommunitySnap | null;
  publisher: PublisherSnap | null;
  facilities: FacilityItem[];
};

/* ─── Dynamic Markdown preview (SSR disabled) ────────────────────────────── */
const MDPreview = dynamic(() => import('@uiw/react-markdown-preview').then((m) => m.default), {
  ssr: false,
  loading: () => <div className="h-24 skeleton-shimmer rounded-sm" />,
});

/* ─── Dynamic map (read-only, SSR disabled) ───────────────────────────────── */
const BaiduMapReadonly = dynamic(
  () =>
    import('react-bmapgl').then(({ Map, Marker, MapApiLoaderHOC }) => {
      const B = () => (window as Window & { BMapGL: typeof BMapGL }).BMapGL;
      const SafeMarker = Marker as unknown as React.ComponentType<{ position: BMapGL.Point }>;

      function ReadonlyMapInner({ lng, lat }: { lng: number; lat: number }) {
        const center = new (B()).Point(lng, lat);
        return (
          <Map center={center} zoom={15} style={{ width: '100%', height: '100%' }} enableScrollWheelZoom>
            <SafeMarker position={center} />
          </Map>
        );
      }

      return (MapApiLoaderHOC({ ak: BAIDU_MAP_AK })(
        ReadonlyMapInner as unknown as React.ComponentType
      ) as unknown) as React.ComponentType<{ lng: number; lat: number }>;
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
function parseImages(raw: string): string[] {
  try { const arr = JSON.parse(raw || '[]'); return Array.isArray(arr) ? arr : []; }
  catch { return []; }
}

function rentTypeLabel(v: number) {
  return RENT_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? '—';
}
function levelLabel(v: number) {
  return LEVEL_OPTIONS.find((o) => o.value === v)?.label ?? '—';
}
function liftLabel(v: number) {
  return LIFT_OPTIONS.find((o) => o.value === v)?.label ?? '—';
}
function publishedLabel(v: number) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-success-bg text-success font-medium">已发布</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-surface-2 text-text-muted font-medium">未发布</span>;
}
function rentedLabel(v: number) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-warning-bg text-warning font-medium">已租出</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-primary-tint text-primary font-medium">待出租</span>;
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-3 border-b border-border-subtle last:border-0">
      <span className="text-body-sm text-text-muted pt-0.5">{label}</span>
      <span className="text-body text-text">{children}</span>
    </div>
  );
}

function Section({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
        <div className="flex items-center gap-2">
          <span className="text-text-disabled">{icon}</span>
          <span className="text-body-sm font-emphasis text-text-2">{title}</span>
        </div>
        {action}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Number(params.id);

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const fetchRoom = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request<{ success: boolean; data: RoomDetail }>(`/manage/room/${roomId}`);
      if (res.success) setRoom(res.data);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm skeleton-shimmer opacity-50" />
          <div className="h-4 w-52 rounded skeleton-shimmer opacity-50" />
        </div>
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="h-60 skeleton-shimmer" />
          <div className="p-5 space-y-3">
            <div className="h-5 w-48 rounded skeleton-shimmer" />
            <div className="h-4 w-72 rounded skeleton-shimmer opacity-50" />
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-16 rounded-full skeleton-shimmer opacity-50" />
              <div className="h-6 w-16 rounded-full skeleton-shimmer opacity-50" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-4">
              {[3, 4].map((rows, j) => (
                <div key={j} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-border-subtle bg-surface">
                    <div className="h-4 w-20 rounded skeleton-shimmer" />
                  </div>
                  <div className="px-5 divide-y divide-border-subtle">
                    {Array.from({ length: rows }).map((_, k) => (
                      <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 py-3">
                        <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                        <div className="h-3.5 w-32 rounded skeleton-shimmer" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <Home size={40} className="opacity-25" />
        <p className="text-body">房源不存在或已被删除</p>
        <button
          onClick={() => router.push('/manage/room')}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors"
        >
          返回房源管理
        </button>
      </div>
    );
  }

  const coverUrl = resolveUploadedFileUrl(room.cover);
  const images = parseImages(room.images);
  const allImages = coverUrl ? [room.cover, ...images.filter((x) => x !== room.cover)] : images;
  const displayImages = allImages.map((p) => resolveUploadedFileUrl(p)).filter(Boolean);
  const total = displayImages.length;

  const goPrev = () => setActiveImage(i => (i - 1 + total) % total);
  const goNext = () => setActiveImage(i => (i + 1) % total);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
    touchStartX.current = null;
  };

  const addressParts = room.community
    ? [room.community.province, room.community.city, room.community.district, room.community.street, room.community.streetNumber].filter(Boolean)
    : [];

  return (
    <div className="space-y-4">

      {/* ── 面包屑 + 操作 ── */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1.5 text-body-sm min-w-0">
          <button
            onClick={() => router.back()}
            title="返回"
            className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={17} />
          </button>
          <span className="text-text-disabled shrink-0">/</span>
          <Link href="/manage/room" className="text-text-muted hover:text-text transition-colors shrink-0">
            房源管理
          </Link>
          <ChevronRight size={13} className="text-text-disabled shrink-0" />
          <span className="text-text font-emphasis truncate">{room.name}</span>
        </nav>
        <button
          onClick={() => router.push(`/manage/room/${room.id}/edit`)}
          className="h-8 px-3 text-body-sm rounded-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Pencil size={12} strokeWidth={2.5} />
          编辑
        </button>
      </div>

      {/* ── 封面 + 图片轮播 ── */}
      <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
        {displayImages.length > 0 ? (
          <div>
            <div
              className="relative overflow-hidden"
              style={{ height: '320px', touchAction: 'pan-y', userSelect: 'none' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* 模糊背景条带 */}
              <div
                className="absolute inset-0 flex"
                style={{ transform: `translateX(-${activeImage * 100}%)`, transition: 'transform 0.35s ease' }}
              >
                {displayImages.map((url, i) => (
                  <div key={i} className="relative w-full h-full shrink-0 overflow-hidden">
                    <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(8px)', transform: 'scale(1.08)', opacity: 0.65 }} />
                  </div>
                ))}
              </div>
              {/* 图片条带 */}
              <div
                className="relative flex h-full"
                style={{ transform: `translateX(-${activeImage * 100}%)`, transition: 'transform 0.35s ease' }}
              >
                {displayImages.map((url, i) => (
                  <div key={i} className="w-full h-full shrink-0 flex items-center justify-center">
                    <img src={url} alt={i === 0 ? room.name : ''} draggable={false} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
              {/* 左箭头 */}
              {total > 1 && (
                <button
                  onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {/* 右箭头 */}
              {total > 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              {/* 圆点指示器 */}
              {total > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {displayImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeImage ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            {total > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {displayImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-colors ${i === activeImage ? 'border-primary' : 'border-transparent'}`}
                  >
                    <img src={url} alt="" draggable={false} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center bg-surface">
            <Home size={40} className="text-text-disabled opacity-40" />
          </div>
        )}
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold text-text leading-tight">{room.name}</h2>
              <p className="text-body-sm text-text-muted mt-1 font-mono">{room.roomCode}</p>
              {room.community && (
                <p className="text-body-sm text-text-muted mt-1 flex items-center gap-1">
                  <MapPin size={11} className="text-text-disabled shrink-0" />
                  {addressParts.join(' ')}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <p className="text-[22px] font-bold text-primary leading-none">
                ¥{room.price.toLocaleString()}<span className="text-body font-normal text-text-muted">/月</span>
              </p>
              <div className="flex gap-1.5">
                {publishedLabel(room.isPublished)}
                {room.isPublished === 2 && rentedLabel(room.isRented)}
              </div>
            </div>
          </div>
          {/* 快览 */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-border-subtle">
            {[
              { label: '户型', value: `${room.bedroom}室${room.parlour}厅${room.bathroom}卫` },
              { label: '面积', value: `${room.area} ㎡` },
              { label: '朝向', value: room.direction },
              { label: '楼层', value: `${room.floor}/${room.floors}F · ${levelLabel(room.level)}` },
              { label: '类型', value: rentTypeLabel(room.rentType) },
              { label: '电梯', value: liftLabel(room.lift) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-caption text-text-muted mb-0.5">{label}</p>
                <p className="text-body-sm font-medium text-text">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 两栏布局 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 左栏 */}
        <div className="space-y-4">

          {/* 租房信息 */}
          <Section title="租房信息" icon={<Home size={14} />}>
            <Field label="租房类型">{rentTypeLabel(room.rentType)}</Field>
            <Field label="房屋类型">{room.roomType}</Field>
            <Field label="户型">{room.bedroom}室{room.parlour}厅{room.bathroom}卫</Field>
            <Field label="建筑面积">{room.area} ㎡</Field>
            <Field label="朝向">{room.direction}</Field>
            <Field label="楼层">{room.floor} / {room.floors} 层（{levelLabel(room.level)}）</Field>
            <Field label="电梯">{liftLabel(room.lift)}</Field>
            <Field label="最短租期">{room.minTenancy} 个月</Field>
            <Field label="押付方式">押 {room.pledge} 付 {room.pay}</Field>
          </Section>

          {/* 发布信息 */}
          <Section title="发布信息" icon={<Calendar size={14} />}>
            <Field label="发布状态">{publishedLabel(room.isPublished)}</Field>
            <Field label="租出状态">{rentedLabel(room.isRented)}</Field>
            <Field label="发布时间">{room.publishTime ? fmtDateTime(room.publishTime) : '—'}</Field>
            <Field label="房源编号"><span className="font-mono text-body-sm">{room.roomCode}</span></Field>
            <Field label="浏览量">{room.views} 次</Field>
            <Field label="创建时间"><span className="font-mono text-body-sm">{fmtDateTime(room.createdAt)}</span></Field>
            <Field label="更新时间">
              <span className="flex items-center gap-1.5 font-mono text-body-sm">
                <RefreshCw size={11} className="text-text-muted shrink-0" />
                {fmtDateTime(room.updatedAt)}
              </span>
            </Field>
          </Section>

          {/* 发布人 */}
          {room.publisher && (
            <Section
              title="发布人信息"
              icon={<User size={14} />}
              action={
                <Link href={`/manage/user/${room.publisher.id}`} className="text-body-sm text-primary hover:underline">
                  查看详情
                </Link>
              }
            >
              <Field label="用户名">{room.publisher.username}</Field>
              {room.publisher.nickname && <Field label="昵称">{room.publisher.nickname}</Field>}
              {room.publisher.realname && <Field label="姓名">{room.publisher.realname}</Field>}
              {room.publisher.phone && <Field label="手机">{room.publisher.phone}</Field>}
            </Section>
          )}

          {/* 设施 */}
          {room.facilities.length > 0 && (
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <span className="text-body-sm font-emphasis text-text-2">房屋设施</span>
              </div>
              <div className="px-5 py-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {room.facilities.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-md border border-border bg-surface text-text-2"
                  >
                    <i className={`${FONT_FAMILY} ${f.icon} text-[22px] text-primary`} />
                    <span className="text-caption leading-tight text-center">{f.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏 */}
        <div className="space-y-4">

          {/* 小区 + 地图 */}
          {room.community && (
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <div className="flex items-center gap-2">
                  <span className="text-text-disabled"><Building2 size={14} /></span>
                  <span className="text-body-sm font-emphasis text-text-2">所属小区</span>
                </div>
                <Link
                  href={`/manage/community/${room.community.id}`}
                  className="text-body-sm text-primary hover:underline"
                >
                  查看详情
                </Link>
              </div>
              <div className="px-5 py-3 border-b border-border-subtle">
                <p className="text-body font-emphasis text-text">{room.community.name}</p>
                <p className="text-body-sm text-text-muted mt-1">{addressParts.join(' ')}</p>
              </div>
              <div style={{ height: '300px' }}>
                <BaiduMapReadonly lng={room.community.lng} lat={room.community.lat} />
              </div>
            </div>
          )}

          {/* 描述 */}
          {room.description && (
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <span className="text-body-sm font-emphasis text-text-2">房源描述</span>
              </div>
              <div className="px-5 py-4" data-color-mode="light">
                <MDPreview source={room.description} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
