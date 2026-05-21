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
    const record = await prisma.appointment.findUnique({ where: { id: apptId } });
    if (!record) {
      return NextResponse.json({ success: false, message: '预约不存在' }, { status: 404 });
    }
    if (record.status !== 1) {
      return NextResponse.json(
        { success: false, message: '仅待看房状态的预约可操作' },
        { status: 400 }
      );
    }

    if (action === 'cancel') {
      if (record.userId !== auth.user.id) {
        return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
      }
      await prisma.appointment.update({
        where: { id: apptId },
        data: { status: 3, cancelledBy: auth.user.id },
      });
    } else {
      // complete：房东操作
      if (record.landlordId !== auth.user.id) {
        return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
      }
      await prisma.appointment.update({
        where: { id: apptId },
        data: { status: 2, completedBy: auth.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '操作失败，请稍后重试' }, { status: 500 });
  }
}
