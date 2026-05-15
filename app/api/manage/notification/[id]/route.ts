import { NextResponse } from 'next/server';
import { serializeNotification } from '@/lib/notification';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

type RouteProps = { params: Promise<{ id: string }> };

const INCLUDE = {
  user: { select: { id: true, username: true, nickname: true, avatar: true } },
} as const;

export async function PUT(req: Request, props: RouteProps) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const notificationId = parseInt(id);
    const body = await req.json();

    if (typeof body.isRead !== 'boolean') {
      return NextResponse.json({ success: false, message: '参数 isRead 必须为布尔值' }, { status: 400 });
    }

    const existing = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '通知记录不存在' }, { status: 404 });
    }

    const item = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: body.isRead },
      include: INCLUDE,
    });

    return NextResponse.json({ success: true, data: serializeNotification(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: RouteProps) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const notificationId = parseInt(id);

    const existing = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '通知记录不存在' }, { status: 404 });
    }

    await prisma.notification.delete({ where: { id: notificationId } });
    return NextResponse.json({ success: true, data: { id: notificationId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
