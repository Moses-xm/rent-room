import { NextRequest, NextResponse } from 'next/server';
import { serializeAppointment } from '@/lib/appointment';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

const INCLUDE = {
  user:     { select: { id: true, username: true, nickname: true } },
  room:     { select: { id: true, name: true, roomCode: true } },
  landlord: { select: { id: true, username: true, nickname: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get('page')   || '1');
    const limit  = parseInt(searchParams.get('limit')  || '10');
    const search = searchParams.get('search') || '';
    const statusParam = searchParams.get('status');
    const skip = (page - 1) * limit;

    // 懒过期：将已过预约时间的「待看房」记录自动标记为「已过期」
    await prisma.appointment.updateMany({
      where: { status: 1, appointmentTime: { lt: new Date() } },
      data:  { status: 4 },
    });

    const where: Record<string, unknown> = {};
    if (statusParam) where.status = parseInt(statusParam);
    if (search) {
      where.OR = [
        { user:     { username: { contains: search, mode: 'insensitive' as const } } },
        { user:     { nickname: { contains: search, mode: 'insensitive' as const } } },
        { room:     { name:     { contains: search, mode: 'insensitive' as const } } },
        { room:     { roomCode: { contains: search, mode: 'insensitive' as const } } },
        { landlord: { username: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeAppointment),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const userId = parseInt(body.userId);
    const roomId = parseInt(body.roomId);
    const appointmentTime = body.appointmentTime ? new Date(body.appointmentTime) : null;
    const remark = body.remark?.trim() || null;

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ success: false, message: '请选择租客' }, { status: 400 });
    }
    if (!roomId || isNaN(roomId)) {
      return NextResponse.json({ success: false, message: '请选择房源' }, { status: 400 });
    }
    if (!appointmentTime || isNaN(appointmentTime.getTime())) {
      return NextResponse.json({ success: false, message: '请填写预约时间' }, { status: 400 });
    }

    const [userExists, room] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.room.findUnique({ where: { id: roomId }, select: { id: true, name: true, publisherId: true } }),
    ]);

    if (!userExists) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }
    if (!room) {
      return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });
    }
    if (userId === room.publisherId) {
      return NextResponse.json({ success: false, message: '租客不能预约自己发布的房源' }, { status: 400 });
    }

    const item = await prisma.appointment.create({
      data: { userId, roomId, landlordId: room.publisherId, appointmentTime, remark, status: 1 },
      include: INCLUDE,
    });

    const userName = userExists.nickname || userExists.username;
    await prisma.notification.create({
      data: {
        userId: room.publisherId,
        type: 1,
        title: '您有新的看房预约',
        content: `用户 ${userName} 预约了您发布的房源「${room.name}」，预约时间为 ${appointmentTime.toLocaleString('zh-CN')}`,
        relatedType: 'appointment',
        relatedId: item.id,
      },
    });

    return NextResponse.json({ success: true, data: serializeAppointment(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
