import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// POST /api/portal/rooms/[id]/appointment
// Body: { appointmentTime: string (ISO), remark?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) {
    return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });
  }

  let appointmentTime: Date;
  let remark: string | undefined;
  try {
    const body = await req.json();
    appointmentTime = new Date(body.appointmentTime);
    if (isNaN(appointmentTime.getTime())) throw new Error();
    remark = typeof body.remark === 'string' ? body.remark.trim() : undefined;
  } catch {
    return NextResponse.json({ success: false, message: '预约时间格式错误' }, { status: 400 });
  }

  if (appointmentTime <= new Date()) {
    return NextResponse.json({ success: false, message: '预约时间必须晚于当前时间' }, { status: 400 });
  }

  const room = await prisma.room.findFirst({
    where: { id: roomId, isPublished: 2 },
    select: { id: true, publisherId: true, isRented: true },
  });
  if (!room) {
    return NextResponse.json({ success: false, message: '房源不存在或已下架' }, { status: 404 });
  }
  if (room.isRented === 2) {
    return NextResponse.json({ success: false, message: '该房源已租出，无法预约' }, { status: 400 });
  }

  // 检查是否已有待看房的预约
  const existing = await prisma.appointment.findFirst({
    where: { userId: auth.user.id, roomId, status: 1, userDeleted: false },
  });
  if (existing) {
    return NextResponse.json({ success: false, message: '您已有该房源的待看房预约，请勿重复提交' }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        userId: auth.user.id,
        roomId,
        landlordId: room.publisherId,
        appointmentTime,
        remark: remark || null,
        status: 1,
      },
    });
    return NextResponse.json({ success: true, data: { id: appointment.id } });
  } catch {
    return NextResponse.json({ success: false, message: '预约失败，请稍后重试' }, { status: 500 });
  }
}
