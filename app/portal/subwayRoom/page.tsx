"use client";

import { useEffect, useState, useCallback } from "react";
import { PortalShell } from "@/components/portal/PortalShell";
import { RoomFilterBar, type RoomFilter } from "@/components/portal/RoomFilterBar";
import { RoomRow } from "@/components/portal/RoomRow";
import { AdSidebar } from "@/components/portal/AdSidebar";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import { portalRequest } from "@/utils/portal-request";
import { RENT_TYPE_OPTIONS } from "@/utils/constants";

interface RoomItem {
  id: number;
  name: string;
  cover: string;
  coverUrl?: string;
  price: number;
  rentType: number;
  bedroom: number;
  parlour: number;
  area: number;
  direction: string;
  community?: { name: string; district: string };
}

interface RoomsResponse {
  success: boolean;
  data: RoomItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

function buildRoomTags(room: RoomItem) {
  const tags: { color: "red" | "green" | "blue" | "yellow"; label: string }[] = [];
  const typeOpt = RENT_TYPE_OPTIONS.find((o) => o.value === room.rentType);
  if (typeOpt) tags.push({ color: "green", label: typeOpt.label });
  if (room.bedroom) tags.push({ color: "blue", label: `${room.bedroom}室${room.parlour}厅` });
  if (room.area) tags.push({ color: "yellow", label: `${room.area}㎡` });
  return tags;
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

export default function SubwayRoomPage() {
  const [filter, setFilter] = useState<RoomFilter>({});
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(
    async (f: RoomFilter, p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        params.set("limit", String(PAGE_SIZE));
        if (f.subwayLine) params.set("subwayLine", f.subwayLine);
        if (f.minPrice !== undefined) params.set("minPrice", String(f.minPrice));
        if (f.maxPrice !== undefined) params.set("maxPrice", String(f.maxPrice));
        if (f.rentType !== undefined) params.set("rentType", String(f.rentType));

        const res = await portalRequest<RoomsResponse>(
          `/portal/rooms?${params.toString()}`,
          { silent: true }
        );
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
    },
    []
  );

  useEffect(() => {
    fetchRooms(filter, page);
  }, [filter, page, fetchRooms]);

  function handleFilterChange(f: RoomFilter) {
    setFilter(f);
    setPage(1);
  }

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PortalShell>
      <div className="max-w-295 mx-auto px-4 py-5">
        <nav className="text-xs text-gray-400 mb-3">
          <Link href="/portal" className="hover:text-gray-600">雅阁租房</Link>
          <span className="mx-1">›</span>
          <span>地铁找房</span>
        </nav>

        <RoomFilterBar type="subway" value={filter} onChange={handleFilterChange} />

        <div className="flex flex-col lg:flex-row lg:gap-5 mt-5">
          {/* 左：房源列表 */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <RoomListSkeleton />
            ) : rooms.length === 0 ? (
              <div className="py-20 text-center text-text-muted text-sm">
                暂无符合条件的房源
              </div>
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
                    subTitle={room.community?.name}
                    description={`${room.direction} · ${room.community?.district ?? ""}`}
                    price={room.price}
                  />
                ))}
                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    onPageSizeChange={() => {}}
                    pageSizeOptions={[PAGE_SIZE]}
                  />
                )}
              </>
            )}
          </div>

          {/* 右：广告（移动端隐藏） */}
          <AdSidebar />
        </div>
      </div>
    </PortalShell>
  );
}
