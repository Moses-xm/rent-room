import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// GET /api/portal/notification/unread-count
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const count = await prisma.notification.count({
      where: { userId: auth.user.id, isRead: false },
    });
    return NextResponse.json({ success: true, count });
  } catch {
    return NextResponse.json({ success: false, message: '获取未读数失败' }, { status: 500 });
  }
}
