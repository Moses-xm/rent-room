"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/components/portal/PortalShell";
import { RoomRow } from "@/components/portal/RoomRow";
import { AdSidebar } from "@/components/portal/AdSidebar";
import { EmptyState } from "@/components/portal/EmptyState";
import Pagination from "@/components/Pagination";
import { portalRequest } from "@/utils/portal-request";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import {
  type RoomItem,
  buildRoomTags,
  buildSubTitle,
  buildAddress,
  getBroker,
} from "@/utils/portal-room";
import { RoomFilterBar, type RoomFilter } from "@/components/portal/RoomFilterBar";

interface CommunityDetail {
  id: number;
  name: string;
  district: string;
  street?: string | null;
  streetNumber?: string | null;
  subwayLine?: string | null;
  coverUrl?: string;
}

interface CommunityRoomsResponse {
  success: boolean;
  community: CommunityDetail;
  data: RoomItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function RoomListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col lg:flex-row gap-4 p-4 lg:p-5 border-b border-dashed border-border"
        >
          <div className="w-full lg:w-45 h-40 lg:h-33.75 skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-3/4 skeleton-shimmer rounded" />
            <div className="h-4 w-1/2 skeleton-shimmer rounded" />
            <div className="flex gap-2 mt-2">
              <div className="h-5 w-12 skeleton-shimmer rounded-full" />
              <div className="h-5 w-12 skeleton-shimmer rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunityInfoSkeleton() {
  return (
    <div className="border border-border p-4 mb-5 space-y-2">
      <div className="h-6 w-1/3 skeleton-shimmer rounded" />
      <div className="h-4 w-1/2 skeleton-shimmer rounded" />
    </div>
  );
}

export default function CommunityRoomsPage() {
  const { id } = useParams<{ id: string }>();

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RoomFilter>({});

  const fetchData = useCallback(async (p: number, ps: number, f: RoomFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(ps));
      if (f.minPrice !== undefined) params.set("minPrice", String(f.minPrice));
      if (f.maxPrice !== undefined) params.set("maxPrice", String(f.maxPrice));
      if (f.rentType !== undefined) params.set("rentType", String(f.rentType));
      if (f.bedrooms) params.set("bedrooms", f.bedrooms);
      if (f.roomType) params.set("roomType", f.roomType);
      if (f.direction) params.set("direction", f.direction);
      if (f.nearSubway) params.set("nearSubway", "true");
      if (f.hasElevator) params.set("hasElevator", "true");

      const res = await portalRequest<CommunityRoomsResponse>(
        `/portal/communities/${id}?${params.toString()}`,
        { silent: true }
      );
      setCommunity(res.community);
      setRooms(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setCommunity(null);
      setRooms([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData(page, pageSize, filter);
  }, [page, pageSize, filter, fetchData]);

  function handleFilterChange(f: RoomFilter) {
    setFilter(f);
    setPage(1);
  }

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePageSizeChange(ps: number) {
    setPageSize(ps);
    setPage(1);
  }

  return (
    <PortalShell>
      <div className="max-w-295 mx-auto px-4 py-5">
        <nav className="text-xs text-gray-400 mb-3">
          <Link href="/portal" className="hover:text-gray-600">雅阁租房</Link>
          <span className="mx-1">›</span>
          <Link href="/portal/cmyRoom" className="hover:text-gray-600">小区找房</Link>
          <span className="mx-1">›</span>
          <span>{community?.name ?? "小区详情"}</span>
        </nav>

        {/* 小区信息区 */}
        {loading && !community ? (
          <CommunityInfoSkeleton />
        ) : community ? (
          <div className="border border-border p-4 mb-5">
            <h1 className="text-lg font-bold text-text">{community.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-2">
              {community.district && <span>{community.district}</span>}
              {(community.street || community.streetNumber) && (
                <span>{[community.street, community.streetNumber].filter(Boolean).join(" ")}</span>
              )}
              {community.subwayLine && (() => {
                let label = community.subwayLine;
                try {
                  const parsed = JSON.parse(community.subwayLine);
                  if (Array.isArray(parsed)) label = parsed.join(" / ");
                } catch {}
                return (
                  <span className="text-[#6682ae] bg-[#f0f4f8] px-2 py-0.5 rounded-full text-xs">
                    {label}
                  </span>
                );
              })()}
            </div>
          </div>
        ) : null}

        <RoomFilterBar
          type="area"
          value={filter}
          onChange={handleFilterChange}
          hideLocation
        />

        <div className="flex flex-col lg:flex-row lg:gap-5 mt-5">
          <div className="flex-1 min-w-0">
            {loading ? (
              <RoomListSkeleton />
            ) : rooms.length === 0 ? (
              <EmptyState text="该小区暂无在售房源" />
            ) : (
              <>
                <div className="text-sm text-text-muted mb-2">
                  共 <span className="text-text font-medium">{total}</span> 套房源
                </div>
                {rooms.map((room) => (
                  <RoomRow
                    key={room.id}
                    href={`/portal/room/${room.id}`}
                    name={room.name}
                    imageUrl={room.coverUrl}
                    tags={buildRoomTags(room)}
                    subTitle={buildSubTitle(room)}
                    broker={getBroker(room)}
                    description={buildAddress(room)}
                    price={room.price}
                  />
                ))}
                {total > 0 && (
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                )}
              </>
            )}
          </div>

          <AdSidebar />
        </div>
      </div>
    </PortalShell>
  );
}
