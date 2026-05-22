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
          {/* 面包屑 */}
          <div className="h-4 w-32 skeleton-shimmer rounded" />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            {/* 左侧表单 */}
            <div className="space-y-4">
              {/* 基础信息 */}
              <div className="border border-[#eee] rounded-lg overflow-hidden">
                <div className="h-11 skeleton-shimmer-warm" />
                <div className="px-5 py-5 space-y-4">
                  <div className="h-10 skeleton-shimmer rounded" />
                  <div className="h-20 skeleton-shimmer rounded" />
                  <div className="h-10 skeleton-shimmer rounded" />
                </div>
              </div>

              {/* 地址信息 */}
              <div className="border border-[#eee] rounded-lg overflow-hidden">
                <div className="h-11 skeleton-shimmer-warm" />
                <div className="px-5 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 skeleton-shimmer rounded" />
                    <div className="h-10 skeleton-shimmer rounded" />
                  </div>
                  <div className="h-10 skeleton-shimmer rounded" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 skeleton-shimmer rounded" />
                    <div className="h-10 skeleton-shimmer rounded" />
                  </div>
                </div>
              </div>

              {/* 坐标与交通 */}
              <div className="border border-[#eee] rounded-lg overflow-hidden">
                <div className="h-11 skeleton-shimmer-warm" />
                <div className="px-5 py-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 skeleton-shimmer rounded" />
                    <div className="h-10 skeleton-shimmer rounded" />
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3 pb-6">
                <div className="h-10 w-16 skeleton-shimmer rounded" />
                <div className="h-10 w-24 skeleton-shimmer rounded" />
              </div>
            </div>

            {/* 右侧地图占位 */}
            <div className="border border-[#eee] rounded-lg overflow-hidden">
              <div className="h-11 skeleton-shimmer-warm" />
              <div className="p-3">
                <div className="h-120 skeleton-shimmer rounded" />
              </div>
            </div>
          </div>
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
