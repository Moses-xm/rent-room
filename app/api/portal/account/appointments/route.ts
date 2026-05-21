import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

// GET /api/portal/account/appointments?page=&limit=&role=tenant|landlord
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const role  = searchParams.get('role') === 'landlord' ? 'landlord' : 'tenant';
  const skip  = (page - 1) * limit;

  try {
    if (role === 'tenant') {
      const where = { userId: auth.user.id, userDeleted: false };
      const [total, data] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            room: { select: { id: true, name: true, cover: true, price: true, area: true } },
            landlord: { select: { id: true, username: true, nickname: true, realname: true, avatar: true } },
          },
        }),
      ]);
      return NextResponse.json({
        success: true,
        data: data.map(a => ({
          id: a.id,
          roomId: a.roomId,
          roomName: a.room.name,
          roomCoverUrl: resolveUploadedFileUrl(a.room.cover),
          roomPrice: a.room.price,
          roomArea: a.room.area,
          landlordName: a.landlord.nickname || a.landlord.realname || a.landlord.username,
          landlordAvatarUrl: resolveUploadedFileUrl(a.landlord.avatar),
          appointmentTime: a.appointmentTime.toISOString(),
          status: a.status,
          remark: a.remark,
          createdAt: a.createdAt.toISOString(),
        })),
        total, page, limit,
        totalPages: Math.ceil(total / limit),
      });
    } else {
      // landlord 视角：收到的预约
      const where = { landlordId: auth.user.id, landlordDeleted: false };
      const [total, data] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            room: { select: { id: true, name: true, cover: true, price: true } },
            user: { select: { id: true, username: true, nickname: true, realname: true, avatar: true } },
          },
        }),
      ]);
      return NextResponse.json({
        success: true,
        data: data.map(a => ({
          id: a.id,
          roomId: a.roomId,
          roomName: a.room.name,
          roomCoverUrl: resolveUploadedFileUrl(a.room.cover),
          roomPrice: a.room.price,
          tenantName: a.user.nickname || a.user.realname || a.user.username,
          tenantAvatarUrl: resolveUploadedFileUrl(a.user.avatar),
          appointmentTime: a.appointmentTime.toISOString(),
          status: a.status,
          remark: a.remark,
          createdAt: a.createdAt.toISOString(),
        })),
        total, page, limit,
        totalPages: Math.ceil(total / limit),
      });
    }
  } catch {
    return NextResponse.json({ success: false, message: '获取预约失败' }, { status: 500 });
  }
}

// DELETE /api/portal/account/appointments?id=&role=tenant|landlord（软删除，仅对自己隐藏）
export async function DELETE(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const id   = parseInt(searchParams.get('id') || '');
  const role = searchParams.get('role') === 'landlord' ? 'landlord' : 'tenant';
  if (isNaN(id)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const record = await prisma.appointment.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json({ success: false, message: '预约不存在' }, { status: 404 });
    }

    if (role === 'tenant') {
      if (record.userId !== auth.user.id) {
        return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
      }
      if (record.status === 1) {
        return NextResponse.json({ success: false, message: '待看房状态的预约请先取消再删除' }, { status: 400 });
      }
      await prisma.appointment.update({ where: { id }, data: { userDeleted: true } });
    } else {
      if (record.landlordId !== auth.user.id) {
        return NextResponse.json({ success: false, message: '无权操作' }, { status: 403 });
      }
      if (record.status === 1) {
        return NextResponse.json({ success: false, message: '待看房状态的预约请先标记完成或等待取消' }, { status: 400 });
      }
      await prisma.appointment.update({ where: { id }, data: { landlordDeleted: true } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
