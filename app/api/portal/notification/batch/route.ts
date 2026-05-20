import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// POST /api/portal/notification/batch
// Body: { action: 'markRead' | 'delete', ids: number[] }
export async function POST(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json() as { action: string; ids: number[] };
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: '请选择通知' }, { status: 400 });
    }

    const where = { id: { in: ids }, userId: auth.user.id };

    if (action === 'markRead') {
      await prisma.notification.updateMany({ where, data: { isRead: true } });
    } else if (action === 'delete') {
      await prisma.notification.deleteMany({ where });
    } else {
      return NextResponse.json({ success: false, message: '无效操作' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '批量操作失败' }, { status: 500 });
  }
}
