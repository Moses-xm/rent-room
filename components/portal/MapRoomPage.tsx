'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlobalHeader } from '@/components/portal/GlobalHeader';
import { TopMenu } from '@/components/portal/TopMenu';
import { MobileNav } from '@/components/portal/MobileNav';
import { RoomImage } from '@/components/portal/RoomImage';
import { RoomTags } from '@/components/portal/RoomTags';
import FilterSelect from '@/components/FilterSelect';
import { getPortalCity, PORTAL_CITY_CHANGED_EVENT } from '@/utils/portal-city';
import {
  PORTAL_PRICE_RANGES,
  LEVEL_OPTIONS,
  RENT_TYPE_OPTIONS,
  PORTAL_ROOM_BED_OPTIONS,
} from '@/utils/constants';
import { buildRoomTags, type RoomItem } from '@/utils/portal-room';
import type { DistrictItem, CommunityItem } from '@/components/portal/MapRoomMap';

const MapRoomMap = dynamic(() => import('@/components/portal/MapRoomMap'), { ssr: false });

const MDPreview = dynamic(
  () => import('@uiw/react-markdown-preview').then((m) => m.default),
  { ssr: false, loading: () => <div className="h-16 skeleton-shimmer rounded" /> },
);

// ── Types ──────────────────────────────────────────────────────────────────────

interface MapData {
  districts: DistrictItem[];
  communities: CommunityItem[];
}

interface PreviewDetail {
  id: number;
  name: string;
  price: number;
  rentType: number;
  bedroom: number;
  parlour: number;
  area: number;
  floor: number;
  floors: number;
  level: number;
  direction: string;
  roomType: string;
  lift: number;
  description: string | null;
  coverUrl: string;
  imageUrls: string[];
  community: {
    id: number;
    name: string;
    district: string;
    street: string | null;
  } | null;
}

const COMMUNITY_ZOOM = 14;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3 border-b border-[#f0f0f0]">
          <div className="w-20 h-16 skeleton-shimmer shrink-0 rounded" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-4 w-4/5 skeleton-shimmer rounded" />
            <div className="h-3 w-3/5 skeleton-shimmer rounded" />
            <div className="h-3 w-2/5 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Room row (compact, map-style) ─────────────────────────────────────────────

function MapRoomRow({
  room,
  isActive,
  onClick,
}: {
  room: RoomItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const rentLabel = RENT_TYPE_OPTIONS.find((o) => o.value === room.rentType)?.label ?? '';
  const sub = [
    room.bedroom ? `${room.bedroom}室${room.parlour}厅` : '',
    rentLabel,
    room.direction,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex gap-3 px-4 py-3 border-b border-[#f0f0f0] cursor-pointer hover:bg-[#f9f9f9] transition-colors border-l-[3px] ${isActive ? 'bg-[#f2f6ed] border-l-[#62ab00]' : 'border-l-transparent'}`}
    >
      {/* Thumbnail */}
      <div className="w-[90px] h-20 shrink-0 overflow-hidden">
        <RoomImage src={room.coverUrl} alt={room.name} className="w-full h-full object-cover" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center h-20">
        <div className="text-sm font-medium text-[#333] truncate leading-5">{room.name}</div>
        <div className="text-xs text-[#666] truncate">{sub}</div>
        <div className="text-xs text-[#999] truncate">
          {[room.community?.district, room.community?.street].filter(Boolean).join(' ')}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#999] truncate">{room.community?.name}</span>
          <span className="text-[#eb5f00] font-bold text-sm shrink-0">
            {room.price.toLocaleString()}元/月
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Room preview panel ─────────────────────────────────────────────────────────

function PreviewPanel({
  detail,
  loading,
  hasNext,
  onNext,
  roomId,
}: {
  detail: PreviewDetail | null;
  loading: boolean;
  hasNext: boolean;
  onNext: () => void;
  roomId: number;
}) {
  const router = useRouter();
  const [imgIdx, setImgIdx] = useState(0);
  const [prevRoomId, setPrevRoomId] = useState(roomId);

  // Derived state: reset carousel index when room changes (avoids setState-in-effect)
  if (prevRoomId !== roomId) {
    setPrevRoomId(roomId);
    setImgIdx(0);
  }

  const images = detail?.imageUrls ?? (detail?.coverUrl ? [detail.coverUrl] : []);
  const levelLabel = LEVEL_OPTIONS.find((o) => o.value === detail?.level)?.label ?? '';
  const tags = detail
    ? buildRoomTags({
        id: detail.id,
        name: detail.name,
        cover: '',
        price: detail.price,
        rentType: detail.rentType,
        bedroom: detail.bedroom,
        parlour: detail.parlour,
        area: detail.area,
        floor: detail.floor,
        floors: detail.floors,
        direction: detail.direction,
        lift: detail.lift,
        community: detail.community
          ? { name: detail.community.name, district: detail.community.district }
          : undefined,
      })
    : [];

  return (
    <>
      {loading || !detail ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#62ab00] border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* 滚动区 */}
            <div className="flex-1 overflow-y-auto">
              {/* 图片轮播 — 滑动轨道，与房源详情页一致 */}
              <div className="px-4 pt-4">
                <div className="relative w-full aspect-video bg-[#f0f0f0] rounded overflow-hidden group">
                  {/* 滑动轨道：所有图片横排，用 translateX 切换 */}
                  <div
                    className="flex h-full transition-transform duration-500 ease-in-out"
                    style={{
                      width: `${images.length * 100}%`,
                      transform: `translateX(-${(imgIdx * 100) / images.length}%)`,
                    }}
                  >
                    {images.map((src, i) => (
                      <div key={i} className="h-full shrink-0" style={{ width: `${100 / images.length}%` }}>
                        <RoomImage src={src} alt={detail.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                        disabled={imgIdx === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-sm bg-black/40 text-white flex items-center justify-center cursor-pointer disabled:opacity-25 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setImgIdx((i) => Math.min(images.length - 1, i + 1))}
                        disabled={imgIdx === images.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-sm bg-black/40 text-white flex items-center justify-center cursor-pointer disabled:opacity-25 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIdx(i)}
                            className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/60'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 基本信息 */}
              <div className="px-4 pt-4 pb-3">
                <h3 className="text-[15px] font-bold text-[#333] leading-snug">{detail.name}</h3>
                {tags.length > 0 && <RoomTags tags={tags} className="mt-2.5" />}
                <div className="mt-2.5 text-[#eb5f00] font-bold text-[22px] leading-none">
                  {detail.price.toLocaleString()}
                  <span className="text-[#999] text-sm font-normal ml-1">元/月</span>
                </div>
              </div>

              {/* 详细参数 */}
              <div className="mx-4 border-t border-[#f0f0f0] pt-3 pb-3 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <div>
                  <span className="text-[#999]">装修：</span>
                  <span className="text-[#333]">{detail.roomType || '—'}</span>
                </div>
                <div>
                  <span className="text-[#999]">面积：</span>
                  <span className="text-[#333]">{detail.area ? `${detail.area}平方米` : '—'}</span>
                </div>
                <div>
                  <span className="text-[#999]">楼层：</span>
                  <span className="text-[#333]">
                    {levelLabel || (detail.floor > 0 ? `${detail.floor}层` : '—')}
                    {detail.floors ? `（共${detail.floors}层）` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[#999]">朝向：</span>
                  <span className="text-[#333]">{detail.direction || '—'}</span>
                </div>
                {detail.community && (
                  <div className="col-span-2">
                    <span className="text-[#999]">小区：</span>
                    <Link
                      href={`/portal/cmyRoom/${detail.community.id}`}
                      className="text-[#62ab00] hover:underline"
                    >
                      {detail.community.name}
                    </Link>
                  </div>
                )}
              </div>

              {/* 房屋简介 — 富文本渲染 */}
              {detail.description && (
                <div className="mx-4 border-t border-[#f0f0f0] pt-3 pb-4">
                  <h4 className="text-[15px] font-bold text-[#333] mb-2">房屋简介</h4>
                  <div className="text-sm text-[#666] leading-relaxed">
                    <MDPreview
                      source={detail.description}
                      style={{ background: 'transparent', color: 'inherit', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 — 固定不随滚动 */}
            <div className="shrink-0 px-4 py-3 border-t border-[#f0f0f0] flex gap-3">
              <button
                onClick={() => router.push(`/portal/room/${detail.id}`)}
                className="flex-1 h-11 bg-[#62ab00] text-white text-sm font-medium rounded cursor-pointer hover:bg-[#4a8101] transition-colors"
              >
                查看更多
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="flex-1 h-11 bg-[#ff6600] text-white text-sm font-medium rounded cursor-pointer hover:bg-[#e55a00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一套
              </button>
            </div>
          </>
        )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MapRoomPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  // City
  const [city, setCity] = useState(() => getPortalCity());

  // Map data
  const [mapData, setMapData] = useState<MapData>({ districts: [], communities: [] });

  // Map zoom (controlled)
  const [zoom, setZoom] = useState(12);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCmyId, setSelectedCmyId] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState('');
  const [rentType, setRentType] = useState('');
  const [bedrooms, setBedrooms] = useState('');

  // Rooms
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [total, setTotal] = useState(0);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Preview
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [previewDetail, setPreviewDetail] = useState<PreviewDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Listen for city changes
  useEffect(() => {
    const sync = () => {
      setCity(getPortalCity());
      setSelectedDistrict('');
      setSelectedCmyId(null);
      setZoom(12);
    };
    window.addEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
  }, []);

  // Fetch map data (districts + communities) when city changes
  useEffect(() => {
    if (!city) return;
    fetch(`/api/portal/mapRoom?city=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMapData({ districts: data.districts, communities: data.communities });
        }
      })
      .catch(() => {});
  }, [city]);

  // Fetch rooms
  const fetchRooms = useCallback(
    async (params: {
      city: string;
      district?: string;
      cmyId?: number | null;
      priceLabel?: string;
      rentType?: string;
      bedrooms?: string;
    }) => {
      setRoomsLoading(true);
      try {
        const p = new URLSearchParams();
        p.set('limit', '200');
        if (params.city) p.set('city', params.city);
        if (params.district) p.set('district', params.district);
        if (params.cmyId) p.set('cmyId', String(params.cmyId));
        if (params.rentType) p.set('rentType', params.rentType);
        if (params.bedrooms) p.set('bedrooms', params.bedrooms);
        const range = PORTAL_PRICE_RANGES.find((r) => r.label === params.priceLabel);
        if (range?.min !== undefined) p.set('minPrice', String(range.min));
        if (range?.max !== undefined) p.set('maxPrice', String(range.max));

        const res = await fetch(`/api/portal/rooms?${p.toString()}`);
        const data = await res.json();
        if (data.success) {
          setRooms(data.data);
          setTotal(data.total);
        }
      } catch {
        setRooms([]);
        setTotal(0);
      } finally {
        setRoomsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchRooms({ city, district: selectedDistrict, cmyId: selectedCmyId, priceLabel: selectedPrice, rentType, bedrooms });
    setPreviewIdx(null);
    setPreviewDetail(null);
  }, [city, selectedDistrict, selectedCmyId, selectedPrice, rentType, bedrooms, fetchRooms]);

  // Fetch preview detail when previewIdx changes
  useEffect(() => {
    if (previewIdx === null) {
      setPreviewDetail(null);
      return;
    }
    const room = rooms[previewIdx];
    if (!room) return;
    setPreviewLoading(true);
    setPreviewDetail(null);
    fetch(`/api/portal/rooms/${room.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPreviewDetail(data.data as PreviewDetail);
      })
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
  }, [previewIdx, rooms]);

  // Map interaction callbacks
  const handleDistrictClick = useCallback((name: string) => {
    setSelectedDistrict(name);
    setSelectedCmyId(null);
    setPreviewIdx(null);
    setZoom(COMMUNITY_ZOOM);
  }, []);

  const handleCommunityClick = useCallback((id: number) => {
    setSelectedCmyId(id);
    setPreviewIdx(null);
  }, []);

  // Determine which overlays to show based on zoom
  const showCommunities = zoom >= COMMUNITY_ZOOM;
  const visibleCommunities = showCommunities
    ? selectedDistrict
      ? mapData.communities.filter((c) => c.district === selectedDistrict)
      : mapData.communities
    : [];
  const visibleDistricts = showCommunities ? [] : mapData.districts;

  // Price filter options
  const priceOptions = PORTAL_PRICE_RANGES.slice(1).map((r) => ({
    value: r.label,
    label: r.label,
  }));

  const previewRoom = previewIdx !== null ? rooms[previewIdx] : null;

  // Left panel collapse
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-white">
      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-70 bg-white shadow-xl transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <MobileNav onClose={() => setMobileOpen(false)} />
      </div>

      {/* Header */}
      <GlobalHeader onMenuToggle={() => setMobileOpen((v) => !v)} />
      <TopMenu />

      {/* Body：地图打底，列表和预览浮在上层 */}
      <div className="flex-1 relative overflow-hidden">

        {/* ── 地图：最底层，始终铺满整个 body ── */}
        <div className="absolute inset-0">
          <MapRoomMap
            city={city}
            zoom={zoom}
            districts={visibleDistricts}
            communities={visibleCommunities}
            selectedDistrict={selectedDistrict}
            selectedCmyId={selectedCmyId}
            onZoomChange={setZoom}
            onDistrictClick={handleDistrictClick}
            onCommunityClick={handleCommunityClick}
          />
        </div>

        {/* ── 左侧列表面板：z-10，浮在地图上 ── */}
        {/* 移动端：底部半屏；桌面端：左侧绝对定位，可折叠 */}
        <div
          className={`
            absolute bottom-0 left-0 right-0 h-[50vh] bg-white border-t border-[#e6e6e6]
            flex flex-col overflow-hidden transition-[width,height] duration-300 ease-in-out
            lg:top-0 lg:right-auto lg:h-auto lg:border-t-0 lg:border-r lg:shadow-[2px_0_8px_rgba(0,0,0,0.1)] lg:z-10
            ${collapsed ? 'lg:w-0' : 'lg:w-96'}
          `}
        >
          {/* Filter bar */}
          <div className="px-3 pt-2.5 pb-2 border-b border-[#e6e6e6] bg-white shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-[#999]">
                在地图内找到{' '}
                <span className="text-[#333] font-medium">{total}</span> 套在租房源
              </div>
              {(selectedDistrict || selectedPrice || rentType || bedrooms) && (
                <button
                  className="text-xs text-[#62ab00] cursor-pointer hover:text-[#4e8a00] transition-colors shrink-0"
                  onClick={() => {
                    setSelectedDistrict('');
                    setSelectedPrice('');
                    setRentType('');
                    setBedrooms('');
                  }}
                >
                  清除筛选 ×
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <FilterSelect
                value={selectedDistrict}
                onChange={(v: string) => {
                  setSelectedDistrict(v);
                  setSelectedCmyId(null);
                  if (v) setZoom(COMMUNITY_ZOOM);
                }}
                options={mapData.districts.map((d) => ({ value: d.name, label: d.name }))}
                placeholder="选择区域"
                clearable
                className="min-w-22"
              />
              <FilterSelect
                value={selectedPrice}
                onChange={setSelectedPrice}
                options={priceOptions}
                placeholder="租金"
                clearable
                className="min-w-22"
              />
              <FilterSelect
                value={rentType}
                onChange={setRentType}
                options={RENT_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
                placeholder="类型"
                clearable
                className="min-w-18"
              />
              <FilterSelect
                value={bedrooms}
                onChange={setBedrooms}
                options={PORTAL_ROOM_BED_OPTIONS.map((o) => ({ value: o, label: o }))}
                placeholder="房型"
                clearable
                className="min-w-18"
              />
            </div>
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <ListSkeleton />
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-[#999] text-sm">
                <span className="text-3xl">🏠</span>
                <span>暂无符合条件的房源</span>
              </div>
            ) : (
              <>
                {rooms.map((room, idx) => (
                  <MapRoomRow
                    key={room.id}
                    room={room}
                    isActive={previewIdx === idx}
                    onClick={() => setPreviewIdx(idx)}
                  />
                ))}
                <div className="flex items-center justify-center gap-1.5 py-4 text-[#999] text-sm">
                  <span>😊</span>
                  <span>已经是最后一条房源啦！</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 折叠 Tab：z-10，与列表同层，预览打开时被遮盖 ── */}
        <div
          className="hidden lg:block absolute top-1/2 -translate-y-1/2 z-10 transition-[left] duration-300 ease-in-out"
          style={{ left: collapsed ? 0 : 384 }}
        >
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center justify-center w-5 h-14 bg-white border border-[#e6e6e6] border-l-0 rounded-r shadow-md cursor-pointer hover:bg-[#f5f5f5] transition-colors"
            title={collapsed ? '展开列表' : '收起列表'}
          >
            <ChevronLeft
              size={13}
              className={`text-[#666] transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* ── 房源详情预览：z-20，从列表右边缘开始，盖住折叠 Tab ── */}
        {previewIdx !== null && previewRoom && (
          /* flex 行：白色面板（固定宽度）+ 关闭按钮（flex 兄弟，永远紧挨） */
          <div
            className={`absolute top-0 bottom-0 right-0 z-20 flex items-start pointer-events-none transition-[left] duration-300 ease-in-out ${
              collapsed ? 'left-0' : 'left-0 lg:left-96'
            }`}
          >
            {/* 白色面板：固定 560px，不依赖百分比 */}
            <div className="w-140 h-full shrink-0 pointer-events-auto bg-white shadow-[4px_0_20px_rgba(0,0,0,0.13)] flex flex-col overflow-hidden">
              <PreviewPanel
                detail={previewDetail}
                loading={previewLoading}
                hasNext={previewIdx < rooms.length - 1}
                roomId={previewRoom.id}
                onNext={() => {
                  if (previewIdx !== null && previewIdx < rooms.length - 1) {
                    setPreviewIdx(previewIdx + 1);
                  }
                }}
              />
            </div>

            {/* 关闭按钮：flex 兄弟，物理上紧贴面板右边缘 */}
            <button
              onClick={() => { setPreviewIdx(null); setPreviewDetail(null); }}
              className="shrink-0 pointer-events-auto flex flex-col items-center gap-1 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.12)] rounded-r rounded-bl px-3.5 py-4 cursor-pointer hover:bg-[#f8f8f8] transition-colors"
            >
              <X size={20} strokeWidth={2} className="text-[#222]" />
              <span className="text-sm font-semibold leading-none text-[#333]">关闭</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
