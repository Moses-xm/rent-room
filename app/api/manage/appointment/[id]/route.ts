import { NextResponse } from 'next/server';
import { serializeAppointment } from '@/lib/appointment';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

type RouteProps = { params: Promise<{ id: string }> };

const INCLUDE = {
  user:     { select: { id: true, username: true, nickname: true } },
  room:     { select: { id: true, name: true, roomCode: true } },
  landlord: { select: { id: true, username: true, nickname: true } },
} as const;

export async function PUT(req: Request, props: RouteProps) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const appointmentId = parseInt(id);
    const body = await req.json();

    const userId = parseInt(body.userId);
    const roomId = parseInt(body.roomId);
    const appointmentTime = body.appointmentTime ? new Date(body.appointmentTime) : null;
    const status = body.status !== undefined ? parseInt(body.status) : undefined;
    const remark = body.remark?.trim() ?? null;

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ success: false, message: '请选择租客' }, { status: 400 });
    }
    if (!roomId || isNaN(roomId)) {
      return NextResponse.json({ success: false, message: '请选择房源' }, { status: 400 });
    }
    if (!appointmentTime || isNaN(appointmentTime.getTime())) {
      return NextResponse.json({ success: false, message: '请填写预约时间' }, { status: 400 });
    }
    if (status !== undefined && ![1, 2, 3, 4].includes(status)) {
      return NextResponse.json({ success: false, message: '无效的状态值' }, { status: 400 });
    }

    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '预约记录不存在' }, { status: 404 });
    }

    const [userExists, room] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.room.findUnique({ where: { id: roomId }, select: { id: true, publisherId: true } }),
    ]);

    if (!userExists) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }
    if (!room) {
      return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });
    }

    const item = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        userId,
        roomId,
        landlordId: room.publisherId,
        appointmentTime,
        remark,
        ...(status !== undefined ? { status } : {}),
      },
      include: INCLUDE,
    });

    return NextResponse.json({ success: true, data: serializeAppointment(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// 快捷状态变更：仅接受 status=2（已完成）或 status=3（已取消）
export async function PATCH(req: Request, props: RouteProps) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const appointmentId = parseInt(id);
    const body = await req.json();
    const status = parseInt(body.status);

    if (![2, 3].includes(status)) {
      return NextResponse.json({ success: false, message: '无效的状态值' }, { status: 400 });
    }

    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '预约记录不存在' }, { status: 404 });
    }

    const item = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
      include: INCLUDE,
    });

    return NextResponse.json({ success: true, data: serializeAppointment(item) });
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
    const appointmentId = parseInt(id);

    const existing = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '预约记录不存在' }, { status: 404 });
    }

    await prisma.appointment.delete({ where: { id: appointmentId } });
    return NextResponse.json({ success: true, data: { id: appointmentId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
