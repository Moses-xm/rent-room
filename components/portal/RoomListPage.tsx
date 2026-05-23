"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/PortalShell";
import { RoomFilterBar, type RoomFilter } from "@/components/portal/RoomFilterBar";
import { RoomRow } from "@/components/portal/RoomRow";
import { AdSidebar } from "@/components/portal/AdSidebar";
import Pagination from "@/components/Pagination";
import { portalRequest } from "@/utils/portal-request";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import {
  type RoomItem,
  type RoomsResponse,
  buildRoomTags,
  buildSubTitle,
  buildAddress,
  getBroker,
} from "@/utils/portal-room";
import { getPortalCity, PORTAL_CITY_CHANGED_EVENT } from "@/utils/portal-city";
import { EmptyState } from "@/components/portal/EmptyState";

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

interface RoomListPageProps {
  filterType: "area" | "subway";
  breadcrumb: string;
  initialQ?: string;
}

export function RoomListPage({ filterType, breadcrumb, initialQ = "" }: RoomListPageProps) {
  const [filter, setFilter] = useState<RoomFilter>({});
  const [city, setCity] = useState(() => getPortalCity());
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setCity(getPortalCity());
      setFilter({});
      setPage(1);
    };
    window.addEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(PORTAL_CITY_CHANGED_EVENT, sync);
  }, []);

  const fetchRooms = useCallback(async (f: RoomFilter, p: number, ps: number, c: string, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(ps));
      if (c) params.set("city", c);
      if (q) params.set("q", q);
      if (filterType === "area") {
        if (f.district) params.set("district", f.district);
      } else {
        if (f.subwayLine) params.set("subwayLine", f.subwayLine);
      }
      if (f.minPrice !== undefined) params.set("minPrice", String(f.minPrice));
      if (f.maxPrice !== undefined) params.set("maxPrice", String(f.maxPrice));
      if (f.rentType !== undefined) params.set("rentType", String(f.rentType));
      if (f.bedrooms) params.set("bedrooms", f.bedrooms);
      if (f.roomType) params.set("roomType", f.roomType);
      if (f.direction) params.set("direction", f.direction);
      if (f.nearSubway) params.set("nearSubway", "true");
      if (f.hasElevator) params.set("hasElevator", "true");

      const res = await portalRequest<RoomsResponse>(`/portal/rooms?${params.toString()}`, { silent: true });
      setRooms(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setRooms([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    fetchRooms(filter, page, pageSize, city, initialQ);
  }, [filter, page, pageSize, city, initialQ, fetchRooms]);

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
          <span>{breadcrumb}</span>
        </nav>

        <RoomFilterBar type={filterType} value={filter} onChange={handleFilterChange} />

        <div className="flex flex-col lg:flex-row lg:gap-5 mt-5">
          <div className="flex-1 min-w-0">
            {loading ? (
              <RoomListSkeleton />
            ) : rooms.length === 0 ? (
              <EmptyState text="暂无符合条件的房源" />
            ) : (
              <>
                <div className="text-sm text-text-muted mb-2">
                  {initialQ && (
                    <>关键词 <span className="text-(--color-accent) font-medium">"{initialQ}"</span>，</>
                  )}
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
