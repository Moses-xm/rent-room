import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// GET /api/portal/account/appointments?page=&limit=
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip  = (page - 1) * limit;

  try {
    const where = { userId: auth.user.id, userDeleted: false };
    const [total, data] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          room: { select: { id: true, name: true, cover: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(a => ({
        id: a.id,
        roomId: a.roomId,
        roomName: a.room.name,
        roomCover: a.room.cover,
        appointmentTime: a.appointmentTime.toISOString(),
        status: a.status,
        remark: a.remark,
        createdAt: a.createdAt.toISOString(),
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取预约失败' }, { status: 500 });
  }
}

// DELETE /api/portal/account/appointments?id=xxx  （软删除）
export async function DELETE(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const id = parseInt(new URL(req.url).searchParams.get('id') || '');
  if (isNaN(id)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const record = await prisma.appointment.findUnique({ where: { id } });
    if (!record || record.userId !== auth.user.id) {
      return NextResponse.json({ success: false, message: '预约不存在' }, { status: 404 });
    }
    await prisma.appointment.update({ where: { id }, data: { userDeleted: true } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
