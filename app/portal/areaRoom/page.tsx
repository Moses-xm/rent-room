"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RoomListPage } from "@/components/portal/RoomListPage";

function AreaRoomContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  return <RoomListPage filterType="area" breadcrumb="区域找房" initialQ={q} />;
}

export default function AreaRoomPage() {
  return (
    <Suspense fallback={null}>
      <AreaRoomContent />
    </Suspense>
  );
}
