'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import { MapPin } from 'lucide-react';
import CommunityForm, { type CommunityFormData } from '../../community-form';

type CommunityDetail = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string | null;
  streetNumber: string | null;
  subwayLine: string | null;
  lng: number;
  lat: number;
  cover: string;
};

export default function EditCommunityPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = Number(params.id);

  const [initialData, setInitialData] = useState<Partial<CommunityFormData> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommunity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request<{ success: boolean; data: CommunityDetail }>(`/manage/community/${communityId}`);
      if (res.success && res.data) {
        const c = res.data;
        setInitialData({
          name: c.name,
          province: c.province,
          city: c.city,
          district: c.district,
          street: c.street ?? '',
          streetNumber: c.streetNumber ?? '',
          subwayLine: c.subwayLine ?? '',
          lng: String(c.lng),
          lat: String(c.lat),
          cover: c.cover,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => { fetchCommunity(); }, [fetchCommunity]);

  const handleSubmit = async (data: CommunityFormData) => {
    await request(`/manage/community/${communityId}`, {
      method: 'PUT',
      json: {
        name: data.name.trim(),
        province: data.province,
        city: data.city,
        district: data.district,
        street: data.street || null,
        streetNumber: data.streetNumber || null,
        subwayLine: data.subwayLine || null,
        lng: Number(data.lng),
        lat: Number(data.lat),
        cover: data.cover,
      },
    });
    toast.success('小区信息修改成功');
    router.push(`/manage/community/${communityId}`);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm skeleton-shimmer opacity-50 shrink-0" />
          <div className="h-4 w-52 rounded skeleton-shimmer opacity-50" />
        </div>
        <div className="h-8 w-40 rounded skeleton-shimmer opacity-60" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="space-y-4">
            {[3, 5, 4].map((rows, i) => (
              <div key={i} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border-subtle bg-surface">
                  <div className="h-4 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="px-5 py-4 space-y-4">
                  {Array.from({ length: rows }).map((_, j) => (
                    <div key={j} className="space-y-1.5">
                      <div className="h-3.5 w-16 rounded skeleton-shimmer opacity-50" />
                      <div className="h-9 rounded-sm skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden" style={{ height: '560px' }}>
            <div className="h-full skeleton-shimmer opacity-40" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!initialData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <MapPin size={40} className="opacity-25" />
        <p className="text-body">小区不存在或已被删除</p>
        <button
          onClick={() => router.push('/manage/community')}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors"
        >
          返回小区管理
        </button>
      </div>
    );
  }

  return (
    <CommunityForm
      title="编辑小区信息"
      subtitle="修改小区的基础信息与地图定位，修改地址后地图将自动更新。"
      initialData={initialData}
      onSubmit={handleSubmit}
      backHref={`/manage/community/${communityId}`}
      submitLabel="保存修改"
    />
  );
}
