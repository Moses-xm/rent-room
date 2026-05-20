import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { serializeNotification } from '@/lib/notification';

// GET /api/portal/notification?page=&limit=
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip  = (page - 1) * limit;

  try {
    const [total, data] = await Promise.all([
      prisma.notification.count({ where: { userId: auth.user.id } }),
      prisma.notification.findMany({
        where:   { userId: auth.user.id },
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(serializeNotification),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取通知列表失败' }, { status: 500 });
  }
}

// PATCH /api/portal/notification  → 全部标记已读
export async function PATCH(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, isRead: false },
      data:  { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '操作失败' }, { status: 500 });
  }
}

// DELETE /api/portal/notification  → 清空全部
export async function DELETE(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    await prisma.notification.deleteMany({ where: { userId: auth.user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '清空失败' }, { status: 500 });
  }
}
