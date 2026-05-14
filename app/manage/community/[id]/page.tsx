'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { BAIDU_MAP_AK } from '@/utils/constants';
import {
  ArrowLeft, ChevronRight, Pencil, MapPin, Train, Calendar, RefreshCw, Loader2,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CommunityDetail = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string | null;
  streetNumber: string | null;
  subwayLine: string | null;
  lng: number;
  lat: number;
  cover: string;
  createdAt: string;
  updatedAt: string;
};

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
function fmtDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return [
    [d.getFullYear(), d.getMonth() + 1, d.getDate()].map((v, i) => String(v).padStart(i ? 2 : 4, '0')).join('-'),
    [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':'),
  ].join(' ');
}

function parseSubwayLines(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 border-b border-border-subtle last:border-0">
      <span className="text-body-sm text-text-muted pt-px">{label}</span>
      <span className="text-body text-text">{children}</span>
    </div>
  );
}

function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
        <span className="text-text-disabled">{icon}</span>
        <span className="text-body-sm font-emphasis text-text-2">{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = Number(params.id);

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request<{ success: boolean; data: CommunityDetail }>(`/manage/community/${communityId}`);
      if (res.success) setCommunity(res.data);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-4">
        {/* breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-sm skeleton-shimmer opacity-50 shrink-0" />
            <div className="h-4 w-44 rounded skeleton-shimmer opacity-50" />
          </div>
          <div className="h-8 w-20 rounded-sm skeleton-shimmer shrink-0" />
        </div>
        {/* cover card */}
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="w-full aspect-video lg:w-72 lg:aspect-auto shrink-0 skeleton-shimmer" />
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div className="space-y-2">
                <div className="h-5 w-36 rounded skeleton-shimmer" />
                <div className="h-3.5 w-52 rounded skeleton-shimmer opacity-50" />
              </div>
              <div className="border-t border-border-subtle" />
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-8 rounded skeleton-shimmer opacity-50" />
                    <div className="h-4 w-12 rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <div className="h-5 w-18 rounded-full skeleton-shimmer opacity-50" />
                <div className="h-5 w-18 rounded-full skeleton-shimmer opacity-50" />
              </div>
              <div className="mt-auto h-3.5 w-48 rounded skeleton-shimmer opacity-40" />
            </div>
          </div>
        </div>
        {/* two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            {[4, 2].map((fieldCount, i) => (
              <div key={i} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                  <div className="h-4 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="px-5 divide-y divide-border-subtle">
                  {Array.from({ length: fieldCount }).map((_, j) => (
                    <div key={j} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                      <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                      <div className={`h-3.5 rounded skeleton-shimmer ${j % 2 === 0 ? 'w-28' : 'w-40'}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="h-101.5 skeleton-shimmer" />
            </div>
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <div className="h-4 w-20 rounded skeleton-shimmer" />
              </div>
              <div className="px-5 divide-y divide-border-subtle">
                {[0, 1].map((j) => (
                  <div key={j} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                    <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                    <div className="h-3.5 w-28 rounded skeleton-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!community) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <MapPin size={40} className="opacity-25" />
        <p className="text-body">小区不存在或已被删除</p>
        <button
          onClick={() => router.push('/manage/community')}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors"
        >
          返回小区管理
        </button>
      </div>
    );
  }

  const coverUrl = resolveUploadedFileUrl(community.cover);
  const subwayLines = parseSubwayLines(community.subwayLine);
  const addressParts = [community.province, community.city, community.district, community.street, community.streetNumber].filter(Boolean);

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
          <Link href="/manage/community" className="text-text-muted hover:text-text transition-colors shrink-0">
            小区管理
          </Link>
          <ChevronRight size={13} className="text-text-disabled shrink-0" />
          <span className="text-text font-emphasis truncate">{community.name}</span>
        </nav>
        <button
          onClick={() => router.push(`/manage/community/${community.id}/edit`)}
          className="h-8 px-3 text-body-sm rounded-sm font-medium
                     bg-primary text-white hover:bg-primary-dark transition-colors
                     flex items-center gap-1.5 shrink-0"
        >
          <Pencil size={12} strokeWidth={2.5} />
          编辑信息
        </button>
      </div>

      {/* ── 封面大图 + 名称 ── */}
      <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* 封面图：移动端全宽 16:9，PC 端固定宽度侧栏 */}
          {coverUrl ? (
            <div className="w-full aspect-video lg:w-72 lg:aspect-auto shrink-0 overflow-hidden">
              <img src={coverUrl} alt={community.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-video lg:w-72 lg:aspect-auto shrink-0 bg-surface flex items-center justify-center">
              <MapPin size={36} className="text-text-disabled opacity-40" />
            </div>
          )}
          <div className="p-5 flex-1 flex flex-col gap-4 min-h-30">
            {/* 名称 + 完整地址 */}
            <div>
              <h2 className="text-[17px] font-semibold text-text leading-tight">{community.name}</h2>
              <p className="text-body-sm text-text-muted mt-1 flex items-center gap-1">
                <MapPin size={11} className="text-text-disabled shrink-0" />
                {addressParts.join(' ')}
              </p>
            </div>

            <div className="border-t border-border-subtle" />

            {/* 省 / 市 / 区 快览 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '省份', value: community.province },
                { label: '城市', value: community.city },
                { label: '区/县', value: community.district },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-body-sm text-text-muted mb-0.5">{label}</p>
                  <p className="text-body font-medium text-text">{value}</p>
                </div>
              ))}
            </div>

            {/* 地铁线路 */}
            {subwayLines.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {subwayLines.map((line) => (
                  <span
                    key={line}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-tint text-primary-dark text-body-sm"
                  >
                    <Train size={10} />
                    {line}
                  </span>
                ))}
              </div>
            )}

            {/* GPS + ID 脚注 */}
            <p className="mt-auto text-body-sm text-text-muted font-mono">
              <span>{community.lng.toFixed(6)}, {community.lat.toFixed(6)}</span>
              <span className="mx-2 text-text-disabled">·</span>
              <span>ID {community.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 两栏布局 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 左栏 */}
        <div className="space-y-4">

          {/* 地址信息 */}
          <Section title="地址信息" icon={<MapPin size={14} />}>
            <Field label="省份">{community.province}</Field>
            <Field label="城市">{community.city}</Field>
            <Field label="区/县">{community.district}</Field>
            <Field label="街道">{community.street || '—'}</Field>
            <Field label="门牌号">{community.streetNumber || '—'}</Field>
          </Section>

          {/* 交通信息 */}
          <Section title="交通信息" icon={<Train size={14} />}>
            <Field label="地铁线路">
              {subwayLines.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {subwayLines.map((line) => (
                    <span
                      key={line}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-tint text-primary-dark text-body-sm"
                    >
                      <Train size={10} />
                      {line}
                    </span>
                  ))}
                </div>
              ) : '—'}
            </Field>
            <Field label="GPS 坐标">
              <span className="font-mono text-body-sm">
                {community.lng.toFixed(6)}, {community.lat.toFixed(6)}
              </span>
            </Field>
          </Section>

        </div>

        {/* 右栏 */}
        <div className="space-y-4">

          {/* 地图 */}
          <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
              <span className="text-text-disabled"><MapPin size={14} /></span>
              <span className="text-body-sm font-emphasis text-text-2">地图位置</span>
            </div>
            <div style={{ height: '360px' }}>
              <BaiduMapReadonly lng={community.lng} lat={community.lat} />
            </div>
          </div>

          {/* 时间记录 */}
          <Section title="时间记录" icon={<Calendar size={14} />}>
            <Field label="创建时间">
              <span className="font-mono text-body-sm">{fmtDateTime(community.createdAt)}</span>
            </Field>
            <Field label="最后修改">
              <span className="flex items-center gap-1.5 font-mono text-body-sm">
                <RefreshCw size={11} className="text-text-muted shrink-0" />
                {fmtDateTime(community.updatedAt)}
              </span>
            </Field>
          </Section>

        </div>
      </div>
    </div>
  );
}
