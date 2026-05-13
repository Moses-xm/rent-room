'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import CommunityForm, { type CommunityFormData } from '../community-form';

export default function NewCommunityPage() {
  const router = useRouter();

  const handleSubmit = async (data: CommunityFormData) => {
    await request('/manage/community', {
      method: 'POST',
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
    toast.success('小区创建成功');
    router.push('/manage/community');
  };

  return (
    <CommunityForm
      title="新建小区"
      subtitle="填写小区信息并在地图上定位，点击地图可自动解析地址。"
      onSubmit={handleSubmit}
      backHref="/manage/community"
      submitLabel="创建小区"
    />
  );
}
