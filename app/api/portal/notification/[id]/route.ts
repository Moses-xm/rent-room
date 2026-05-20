import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// PATCH /api/portal/notification/[id]  → 标记单条已读
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const id = parseInt((await params).id);
  if (isNaN(id)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const record = await prisma.notification.findUnique({ where: { id } });
    if (!record || record.userId !== auth.user.id) {
      return NextResponse.json({ success: false, message: '通知不存在' }, { status: 404 });
    }
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '操作失败' }, { status: 500 });
  }
}

// DELETE /api/portal/notification/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const id = parseInt((await params).id);
  if (isNaN(id)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const record = await prisma.notification.findUnique({ where: { id } });
    if (!record || record.userId !== auth.user.id) {
      return NextResponse.json({ success: false, message: '通知不存在' }, { status: 404 });
    }
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
