"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import PortalCommunityForm, { type PortalCommunityFormData } from "../portal-community-form";
import { portalRequest } from "@/utils/portal-request";

export default function NewCommunityPage() {
  const router = useRouter();

  async function handleSubmit(data: PortalCommunityFormData) {
    await portalRequest("/portal/account/communities", {
      method: "POST",
      json: {
        name:        data.name,
        province:    data.province,
        city:        data.city,
        district:    data.district,
        street:      data.street || undefined,
        streetNumber: data.streetNumber || undefined,
        subwayLine:  data.subwayLine || undefined,
        lng:         data.lng,
        lat:         data.lat,
        cover:       data.cover,
      },
    });
    toast.success("小区创建成功");
    router.push("/portal/account/community");
  }

  return (
    <MineShell title="创建小区">
      <PortalCommunityForm
        title="创建新小区"
        onSubmit={handleSubmit}
        submitLabel="创建小区"
      />
    </MineShell>
  );
}
