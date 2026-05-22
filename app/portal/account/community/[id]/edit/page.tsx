"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import PortalCommunityForm, { type PortalCommunityFormData } from "../../portal-community-form";
import { portalRequest } from "@/utils/portal-request";

export default function EditCommunityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [initialData, setInitialData] = useState<Partial<PortalCommunityFormData> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    portalRequest<{ success: boolean; data: PortalCommunityFormData }>(
      `/portal/account/communities/${id}`,
      { silent: true }
    )
      .then((res) => setInitialData(res.data))
      .catch(() => setNotFound(true));
  }, [id]);

  async function handleSubmit(data: PortalCommunityFormData) {
    await portalRequest(`/portal/account/communities/${id}`, {
      method: "PUT",
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
    toast.success("小区信息已更新");
    router.push("/portal/account/community");
  }

  if (notFound) {
    return (
      <MineShell title="编辑小区">
        <div className="px-6 py-16 text-center text-sm text-[#aaa]">小区不存在或无权编辑</div>
      </MineShell>
    );
  }

  if (!initialData) {
    return (
      <MineShell title="编辑小区">
        <div className="px-5 py-5 space-y-4">
          <div className="h-4 w-40 skeleton-shimmer rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 skeleton-shimmer rounded" />
          ))}
        </div>
      </MineShell>
    );
  }

  return (
    <MineShell title="编辑小区">
      <PortalCommunityForm
        title="编辑小区信息"
        initialData={initialData}
        onSubmit={handleSubmit}
        submitLabel="保存修改"
      />
    </MineShell>
  );
}
