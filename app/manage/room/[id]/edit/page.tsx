'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { request } from '@/utils/request';
import RoomForm, { type RoomFormData } from '../../room-form';

type RoomDetail = {
  id: number;
  name: string;
  cmyId: number;
  rentType: number;
  minTenancy: number;
  bedroom: number;
  parlour: number;
  bathroom: number;
  roomType: string;
  direction: string;
  price: number;
  area: number;
  pledge: number;
  pay: number;
  floor: number;
  floors: number;
  level: number;
  lift: number;
  description: string | null;
  cover: string;
  images: string;
  facilityIds: string;
  publisherId: number;
  isPublished: number;
  publishTime: string | null;
  isRented: number;
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = Number(params.id);

  const [initialData, setInitialData] = useState<Partial<RoomFormData> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await request<{ success: boolean; data: RoomDetail }>(`/manage/room/${roomId}`);
      if (res.success) {
        const d = res.data;
        let images: string[] = [];
        try { images = JSON.parse(d.images || '[]'); } catch { images = []; }
        let facilityIds: number[] = [];
        try { facilityIds = JSON.parse(d.facilityIds || '[]'); } catch { facilityIds = []; }

        setInitialData({
          name: d.name,
          cmyId: String(d.cmyId),
          rentType: String(d.rentType),
          minTenancy: String(d.minTenancy),
          bedroom: String(d.bedroom),
          parlour: String(d.parlour),
          bathroom: String(d.bathroom),
          roomType: d.roomType,
          direction: d.direction,
          price: String(d.price),
          area: String(d.area),
          pledge: String(d.pledge),
          pay: String(d.pay),
          floor: String(d.floor),
          floors: String(d.floors),
          level: String(d.level),
          lift: String(d.lift),
          description: d.description ?? '',
          cover: d.cover,
          images,
          facilityIds,
          publisherId: String(d.publisherId),
          isPublished: String(d.isPublished),
          publishTime: toDatetimeLocal(d.publishTime),
          isRented: String(d.isRented),
        });
      } else {
        toast.error('房源不存在');
        router.push('/manage/room');
      }
    } finally {
      setLoading(false);
    }
  }, [roomId, router]);

  useEffect(() => { fetchRoom(); }, [fetchRoom]);

  const handleSubmit = async (data: RoomFormData) => {
    const normalizedImages = data.images.map((p) => normalizeUploadPathForStorage(p));
    const res = await request<{ success: boolean; data?: { id: number } }>(
      `/manage/room/${roomId}`,
      {
        method: 'PUT',
        json: {
          name: data.name.trim(),
          cmyId: Number(data.cmyId),
          rentType: Number(data.rentType),
          minTenancy: Number(data.minTenancy) || 1,
          bedroom: Number(data.bedroom),
          parlour: Number(data.parlour),
          bathroom: Number(data.bathroom),
          roomType: data.roomType,
          direction: data.direction,
          price: Number(data.price),
          area: Number(data.area),
          pledge: Number(data.pledge),
          pay: Number(data.pay),
          floor: Number(data.floor),
          floors: Number(data.floors),
          level: Number(data.level),
          lift: Number(data.lift),
          description: data.description || null,
          cover: normalizeUploadPathForStorage(data.cover),
          images: normalizedImages,
          facilityIds: data.facilityIds,
          publisherId: Number(data.publisherId),
          isPublished: Number(data.isPublished),
          publishTime: data.publishTime ? new Date(data.publishTime).toISOString() : null,
          isRented: Number(data.isRented),
        },
      }
    );

    if (res.success) {
      toast.success('房源更新成功');
      router.push(`/manage/room/${roomId}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-sm skeleton-shimmer opacity-50" />
          <div className="h-4 w-48 rounded skeleton-shimmer opacity-50" />
        </div>
        <div className="space-y-2">
          <div className="h-7 w-40 rounded skeleton-shimmer" />
          <div className="h-4 w-64 rounded skeleton-shimmer opacity-50" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border-subtle bg-surface">
              <div className="h-4 w-20 rounded skeleton-shimmer" />
            </div>
            <div className="px-5 py-4 space-y-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <div className="h-3.5 w-16 rounded skeleton-shimmer opacity-50" />
                  <div className="h-9 w-full rounded-sm skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!initialData) return null;

  return (
    <RoomForm
      title="编辑房源"
      subtitle="修改房源信息，保存后立即生效。"
      initialData={initialData}
      onSubmit={handleSubmit}
      backHref={`/manage/room/${roomId}`}
      submitLabel="保存修改"
    />
  );
}
