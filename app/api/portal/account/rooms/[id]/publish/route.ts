import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/portal/account/rooms/[id]/publish — 切换发布状态
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const existing = await prisma.room.findFirst({
      where: { id: roomId, publisherId: auth.user.id },
    });
    if (!existing) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    const newStatus = existing.isPublished === 2 ? 1 : 2;
    await prisma.room.update({
      where: { id: roomId },
      data: {
        isPublished: newStatus,
        publishTime: newStatus === 2 ? new Date() : existing.publishTime,
      },
    });

    return NextResponse.json({ success: true, data: { isPublished: newStatus } });
  } catch {
    return NextResponse.json({ success: false, message: '操作失败' }, { status: 500 });
  }
}
