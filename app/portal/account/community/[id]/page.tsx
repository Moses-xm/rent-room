"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Train, Calendar, RefreshCw, Pencil, ExternalLink } from "lucide-react";
import { MineShell } from "@/components/portal/MineShell";
import BaiduMapReadonly from "@/components/BaiduMapReadonly";
import { portalRequest } from "@/utils/portal-request";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { fmtDateTime } from "@/utils/format";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CommunityDetail = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string;
  streetNumber: string;
  subwayLine: string;
  lng: string;
  lat: string;
  cover: string;
  roomCount: number;
  createdAt: string;
  updatedAt: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function parseSubwayLines(raw: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 py-3 border-b border-[#f5f5f5] last:border-0 text-sm">
      <span className="text-[#999]">{label}</span>
      <span className="text-[#333]">{children}</span>
    </div>
  );
}

function Card({ title, icon, children }: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center gap-2">
        {icon && <span className="text-[#bbb]">{icon}</span>}
        <span className="text-sm font-medium text-[#444]">{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="px-5 py-5 space-y-4">
      <div className="h-4 w-32 skeleton-shimmer rounded" />
      <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full aspect-video lg:w-60 lg:aspect-auto shrink-0 skeleton-shimmer" />
          <div className="p-5 flex-1 space-y-3">
            <div className="h-5 w-40 skeleton-shimmer rounded" />
            <div className="h-4 w-56 skeleton-shimmer rounded" />
            <div className="h-px bg-[#f0f0f0]" />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-8 skeleton-shimmer rounded" />
                  <div className="h-4 w-14 skeleton-shimmer rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          {[5, 2].map((rows, i) => (
            <div key={i} className="bg-white border border-[#eee] rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                <div className="h-4 w-20 skeleton-shimmer rounded" />
              </div>
              <div className="px-5">
                {Array.from({ length: rows }).map((_, j) => (
                  <div key={j} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3 border-b border-[#f5f5f5] last:border-0">
                    <div className="h-3.5 w-12 skeleton-shimmer rounded" />
                    <div className="h-3.5 w-28 skeleton-shimmer rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white border border-[#eee] rounded-lg overflow-hidden" style={{ height: "300px" }}>
            <div className="h-full skeleton-shimmer" />
          </div>
          <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
              <div className="h-4 w-20 skeleton-shimmer rounded" />
            </div>
            <div className="px-5">
              {[0, 1].map((j) => (
                <div key={j} className="grid grid-cols-[5.5rem_1fr] gap-3 py-3 border-b border-[#f5f5f5] last:border-0">
                  <div className="h-3.5 w-12 skeleton-shimmer rounded" />
                  <div className="h-3.5 w-36 skeleton-shimmer rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    portalRequest<{ success: boolean; data: CommunityDetail }>(
      `/portal/account/communities/${id}`,
      { silent: true }
    )
      .then((res) => setCommunity(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <MineShell title="小区详情"><Skeleton /></MineShell>;
  }

  if (notFound || !community) {
    return (
      <MineShell title="小区详情">
        <div className="px-5 py-16 text-center space-y-4">
          <MapPin className="w-10 h-10 text-[#ddd] mx-auto" />
          <p className="text-sm text-[#aaa]">小区不存在或无权查看</p>
          <button
            onClick={() => router.push("/portal/account/community")}
            className="h-9 px-5 border border-[#ddd] text-sm text-[#666] rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors"
          >
            返回我的小区
          </button>
        </div>
      </MineShell>
    );
  }

  const coverUrl = resolveUploadedFileUrl(community.cover);
  const subwayLines = parseSubwayLines(community.subwayLine);
  const lng = Number(community.lng);
  const lat = Number(community.lat);
  const addressParts = [community.province, community.city, community.district, community.street, community.streetNumber].filter(Boolean);

  return (
    <MineShell title="小区详情">
      <div className="px-5 py-5 space-y-4">

        {/* 面包屑 + 操作按钮 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-[#888]">
            <button
              onClick={() => router.push("/portal/account/community")}
              className="flex items-center gap-1 hover:text-[var(--color-primary)] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              我的小区
            </button>
            <span>/</span>
            <span className="text-[#333] font-medium truncate max-w-[160px]">{community.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/portal/cmyRoom/${community.id}`}
              target="_blank"
              className="h-8 px-3 border border-[#ddd] text-xs text-[#666] rounded flex items-center gap-1.5 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              查看公开页
            </Link>
            <button
              onClick={() => router.push(`/portal/account/community/${community.id}/edit`)}
              className="h-8 px-3 bg-[var(--color-primary)] text-white text-xs rounded flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              编辑信息
            </button>
          </div>
        </div>

        {/* 封面 + 名称概览卡 */}
        <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {coverUrl ? (
              <div className="w-full aspect-video lg:w-60 lg:aspect-auto shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt={community.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full aspect-video lg:w-60 lg:aspect-auto shrink-0 bg-[#f5f5f5] flex items-center justify-center">
                <MapPin className="w-9 h-9 text-[#ddd]" />
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col gap-4 min-h-28">
              <div>
                <h2 className="text-base font-semibold text-[#222] leading-tight">{community.name}</h2>
                <p className="text-xs text-[#999] mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#ccc] shrink-0" />
                  {addressParts.join(" ")}
                </p>
              </div>

              <div className="border-t border-[#f5f5f5]" />

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "省份", value: community.province },
                  { label: "城市", value: community.city },
                  { label: "区/县", value: community.district },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-[#999] mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-[#333]">{value}</p>
                  </div>
                ))}
              </div>

              {subwayLines.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {subwayLines.map((line) => (
                    <span
                      key={line}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0f4f8] text-[#6682ae] text-xs"
                    >
                      <Train className="w-2.5 h-2.5" />
                      {line}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-auto text-xs text-[#bbb] font-mono">
                {lng.toFixed(6)}, {lat.toFixed(6)}
                <span className="mx-1.5">·</span>
                {community.roomCount} 套房源
                <span className="mx-1.5">·</span>
                ID {community.id}
              </p>
            </div>
          </div>
        </div>

        {/* 两栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* 左栏 */}
          <div className="space-y-4">
            <Card title="地址信息" icon={<MapPin className="w-3.5 h-3.5" />}>
              <InfoRow label="省份">{community.province}</InfoRow>
              <InfoRow label="城市">{community.city}</InfoRow>
              <InfoRow label="区/县">{community.district}</InfoRow>
              <InfoRow label="街道">{community.street || "—"}</InfoRow>
              <InfoRow label="门牌号">{community.streetNumber || "—"}</InfoRow>
            </Card>

            <Card title="交通信息" icon={<Train className="w-3.5 h-3.5" />}>
              <InfoRow label="地铁线路">
                {subwayLines.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {subwayLines.map((line) => (
                      <span
                        key={line}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0f4f8] text-[#6682ae] text-xs"
                      >
                        <Train className="w-2.5 h-2.5" />
                        {line}
                      </span>
                    ))}
                  </div>
                ) : "—"}
              </InfoRow>
              <InfoRow label="GPS 坐标">
                <span className="font-mono text-xs">{lng.toFixed(6)}, {lat.toFixed(6)}</span>
              </InfoRow>
            </Card>
          </div>

          {/* 右栏 */}
          <div className="space-y-4">
            {/* 地图 */}
            <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center gap-2">
                <span className="text-[#bbb]"><MapPin className="w-3.5 h-3.5" /></span>
                <span className="text-sm font-medium text-[#444]">地图位置</span>
              </div>
              <div style={{ height: "300px" }}>
                <BaiduMapReadonly lng={lng} lat={lat} />
              </div>
            </div>

            {/* 时间记录 */}
            <Card title="时间记录" icon={<Calendar className="w-3.5 h-3.5" />}>
              <InfoRow label="创建时间">
                <span className="font-mono text-xs">{fmtDateTime(community.createdAt)}</span>
              </InfoRow>
              <InfoRow label="最后修改">
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <RefreshCw className="w-2.5 h-2.5 text-[#bbb] shrink-0" />
                  {fmtDateTime(community.updatedAt)}
                </span>
              </InfoRow>
            </Card>
          </div>
        </div>

      </div>
    </MineShell>
  );
}
