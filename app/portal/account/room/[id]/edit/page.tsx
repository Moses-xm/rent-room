"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import PortalRoomForm, { type PortalRoomFormData } from "../../portal-room-form";
import { portalRequest } from "@/utils/portal-request";

export default function EditRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initialData, setInitialData] = useState<Partial<PortalRoomFormData> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    portalRequest<{ success: boolean; data: PortalRoomFormData }>(
      `/portal/account/rooms/${id}`,
      { silent: true }
    )
      .then((res) => setInitialData(res.data))
      .catch(() => setNotFound(true));
  }, [id]);

  async function handleSubmit(data: PortalRoomFormData) {
    await portalRequest(`/portal/account/rooms/${id}`, {
      method: "PUT",
      json: {
        name:       data.name,
        cmyId:      Number(data.cmyId),
        rentType:   Number(data.rentType),
        minTenancy: Number(data.minTenancy),
        bedroom:    Number(data.bedroom),
        parlour:    Number(data.parlour),
        bathroom:   Number(data.bathroom),
        roomType:   data.roomType,
        direction:  data.direction,
        price:      Number(data.price),
        area:       Number(data.area),
        pledge:     Number(data.pledge),
        pay:        Number(data.pay),
        floor:      Number(data.floor),
        floors:     Number(data.floors),
        level:      Number(data.level),
        lift:       Number(data.lift),
        description: data.description || undefined,
        cover:      data.cover,
        images:     data.images,
        facilityIds: data.facilityIds,
      },
    });
    toast.success("房源信息已更新");
    router.push("/portal/account/room");
  }

  if (notFound) {
    return (
      <MineShell title="编辑房源">
        <div className="px-6 py-16 text-center text-sm text-[#aaa]">房源不存在或无权编辑</div>
      </MineShell>
    );
  }

  if (!initialData) {
    return (
      <MineShell title="编辑房源">
        <div className="px-5 py-5 space-y-4">
          <div className="h-4 w-40 skeleton-shimmer rounded" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 skeleton-shimmer rounded" />
          ))}
        </div>
      </MineShell>
    );
  }

  return (
    <MineShell title="编辑房源">
      <PortalRoomForm
        title="编辑房源信息"
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="保存修改"
      />
    </MineShell>
  );
}
