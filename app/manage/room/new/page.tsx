'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { request } from '@/utils/request';
import RoomForm, { type RoomFormData } from '../room-form';

export default function NewRoomPage() {
  const router = useRouter();

  const handleSubmit = async (data: RoomFormData) => {
    const normalizedImages = data.images.map((p) => normalizeUploadPathForStorage(p));
    const res = await request<{ success: boolean; data?: { id: number } }>(
      '/manage/room',
      {
        method: 'POST',
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

    if (res.success && res.data?.id) {
      toast.success('房源创建成功');
      router.push(`/manage/room/${res.data.id}`);
    }
  };

  return (
    <RoomForm
      title="新建房源"
      subtitle="填写房源基本信息、租房条件及配套设施。"
      onSubmit={handleSubmit}
      backHref="/manage/room"
      submitLabel="创建房源"
    />
  );
}
