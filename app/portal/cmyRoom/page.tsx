"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal/PortalShell";
import { CommunityRow } from "@/components/portal/CommunityRow";
import { AdSidebar } from "@/components/portal/AdSidebar";
import { EmptyState } from "@/components/portal/EmptyState";
import { RoomFilterBar, type RoomFilter } from "@/components/portal/RoomFilterBar";
import Pagination from "@/components/Pagination";
import { portalRequest } from "@/utils/portal-request";
import { getPortalCity, PORTAL_CITY_CHANGED_EVENT } from "@/utils/portal-city";

interface CommunityItem {
  id: number;
  name: string;
  district: string;
  street?: string | null;
  streetNumber?: string | null;
  subwayLine?: string | null;
  coverUrl?: string;
  roomCount?: number;
}

interface CommunitiesResponse {
  success: boolean;
  data: CommunityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function CommunityListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col lg:flex-row gap-4 p-4 lg:p-5 border-b border-dashed border-border"
        >
          <div className="w-full lg:w-36 h-32 lg:h-27 skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-5 w-2/3 skeleton-shimmer rounded" />
            <div className="h-4 w-1/3 skeleton-shimmer rounded" />
            <div className="h-4 w-1/2 skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CmyRoomPage() {
  const [city, setCity] = useState(() => getPortalCity());
  const [filter, setFilter] = useState<RoomFilter>({});
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const fetchCommunities = useCallback(async (p: number, ps: number, c: string, d: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(ps));
      if (c) params.set("city", c);
      if (d) params.set("district", d);

      const res = await portalRequest<CommunitiesResponse>(
        `/portal/communities?${params.toString()}`,
        { silent: true }
      );
      setCommunities(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setCommunities([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities(page, pageSize, city, filter.district ?? "");
  }, [page, pageSize, city, filter, fetchCommunities]);

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
          <span>小区找房</span>
        </nav>

        <RoomFilterBar
          type="area"
          value={filter}
          onChange={handleFilterChange}
          locationOnly
        />

        <div className="flex flex-col lg:flex-row lg:gap-5 mt-5">
          <div className="flex-1 min-w-0">
            {loading ? (
              <CommunityListSkeleton />
            ) : communities.length === 0 ? (
              <EmptyState text="暂无小区数据" />
            ) : (
              <>
                <div className="text-sm text-text-muted mb-2">
                  共 <span className="text-text font-medium">{total}</span> 个小区
                </div>
                {communities.map((cmy) => (
                  <CommunityRow
                    key={cmy.id}
                    href={`/portal/cmyRoom/${cmy.id}`}
                    name={cmy.name}
                    imageUrl={cmy.coverUrl}
                    district={cmy.district}
                    address={[cmy.street, cmy.streetNumber].filter(Boolean).join(" ")}
                    subwayLine={cmy.subwayLine}
                    roomCount={cmy.roomCount}
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
