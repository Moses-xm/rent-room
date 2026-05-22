"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import PortalRoomForm, { type PortalRoomFormData } from "../portal-room-form";
import { portalRequest } from "@/utils/portal-request";

export default function NewRoomPage() {
  const router = useRouter();

  async function handleSubmit(data: PortalRoomFormData) {
    await portalRequest("/portal/account/rooms", {
      method: "POST",
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
    toast.success("房源发布成功，默认为未发布状态，请手动发布");
    router.push("/portal/account/room");
  }

  return (
    <MineShell title="发布房源">
      <PortalRoomForm
        title="发布新房源"
        onSubmit={handleSubmit}
        submitLabel="提交房源"
      />
    </MineShell>
  );
}
