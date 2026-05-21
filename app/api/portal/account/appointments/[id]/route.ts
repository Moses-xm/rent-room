import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// PATCH /api/portal/account/appointments/[id]
// Body: { action: 'cancel' | 'complete' }
// cancel  → 租客取消（status 1→3）
// complete → 房东标记完成（status 1→2）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const apptId = parseInt(id);
  if (isNaN(apptId)) {
    return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });
  }

  let action: string;
  try {
    const body = await req.json();
    action = body.action;
  } catch {
    return NextResponse.json({ success: false, message: '请求体格式错误' }, { status: 400 });
  }

  if (action !== 'cancel' && action !== 'complete') {
    return NextResponse.json({ success: false, message: '不支持的操作' }, { status: 400 });
  }

  try {
    const record = await prisma.appointment.findUnique({
      where: { id: apptId },
      include: { room: { select: { name: true } } },
    });
    if (!record) {
      return NextResponse.json({ success: false, message: '预约不存在' }, { status: 404 });
    }
    if (record.status !== 1) {
      return NextResponse.json(
        { success: false, message: '仅待看房状态的预约可操作' },
        { status: 400 }
      );
    }

    const operatorUser = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { nickname: true, username: true },
    });
    const operatorName = operatorUser?.nickname || auth.user.username;
    const roomName = record.room.name;

    if (action === 'cancel') {
      if (record.userId !== auth.user.id) {
        return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
      }
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: apptId },
          data: { status: 3, cancelledBy: auth.user.id },
        }),
        // 通知房东：预约已取消（type=2）
        prisma.notification.create({
          data: {
            userId: record.landlordId,
            type: 2,
            title: '预约已被取消',
            content: `用户「${operatorName}」取消了对房源「${roomName}」的预约看房。`,
            relatedType: 'appointment',
            relatedId: apptId,
          },
        }),
      ]);
    } else {
      // complete：房东操作
      if (record.landlordId !== auth.user.id) {
        return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
      }
      await prisma.$transaction([
        prisma.appointment.update({
          where: { id: apptId },
          data: { status: 2, completedBy: auth.user.id },
        }),
        // 通知租客：看房已标记完成（type=3）
        prisma.notification.create({
          data: {
            userId: record.userId,
            type: 3,
            title: '看房已标记完成',
            content: `房东「${operatorName}」已将您对房源「${roomName}」的预约看房标记为完成。`,
            relatedType: 'appointment',
            relatedId: apptId,
          },
        }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '操作失败，请稍后重试' }, { status: 500 });
  }
}
