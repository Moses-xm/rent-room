import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { serializeRoom } from '@/lib/room';

type Params = { params: Promise<{ id: string }> };

// GET /api/portal/account/rooms/[id]/detail — 房源详情（含小区+设施，仅自己的房源）
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const room = await prisma.room.findFirst({
      where: { id: roomId, publisherId: auth.user.id },
      include: {
        community: {
          select: {
            id: true, name: true, province: true, city: true,
            district: true, street: true, streetNumber: true,
            subwayLine: true, lng: true, lat: true,
          },
        },
      },
    });
    if (!room) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    let facilities: { id: number; name: string; icon: string }[] = [];
    try {
      const ids: number[] = JSON.parse(room.facilityIds || '[]');
      if (ids.length > 0) {
        facilities = await prisma.facility.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, icon: true },
        });
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      data: { ...serializeRoom(room), facilities },
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取失败' }, { status: 500 });
  }
}
