import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { createContract, ServiceError } from '@/lib/contract-service';
import { resolveUploadedFileUrl } from '@/lib/upload-path';


// GET /api/portal/account/contracts?page=&limit=&role=tenant|landlord
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip  = (page - 1) * limit;
  const role  = searchParams.get('role') === 'landlord' ? 'landlord' : 'tenant';

  try {
    if (role === 'landlord') {
      const where = { landlordId: auth.user.id, landlordDeleted: false };
      const [total, data] = await Promise.all([
        prisma.contract.count({ where }),
        prisma.contract.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            room: { select: { id: true, name: true, cover: true, price: true, pay: true, minTenancy: true } },
            user: { select: { id: true, username: true, nickname: true, avatar: true } },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: data.map(c => ({
          id: c.id,
          roomId: c.roomId,
          roomName: c.room.name,
          roomCover: resolveUploadedFileUrl(c.room.cover),
          roomPrice: c.room.price,
          tenantName: c.user.nickname || c.user.username,
          tenantAvatar: c.user.avatar ? resolveUploadedFileUrl(c.user.avatar) : null,
          tenancy: c.tenancy,
          onlineTime: c.onlineTime.toISOString(),
          offlineTime: c.offlineTime.toISOString(),
          fee: c.fee,
          pledge: c.pledge,
          payingPeriod: c.payingPeriod,
          renewTimes: c.renewTimes,
          roomPay: c.room.pay,
          roomMinTenancy: c.room.minTenancy,
          status: c.status,
          isCheckout: c.isCheckout,
          checkoutTime: c.checkoutTime?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
        })),
        total, page, limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    const where = { userId: auth.user.id, userDeleted: false };
    const [total, data] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          room: { select: { id: true, name: true, cover: true, price: true, pay: true, minTenancy: true } },
          landlord: { select: { id: true, username: true, nickname: true, avatar: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(c => ({
        id: c.id,
        roomId: c.roomId,
        roomName: c.room.name,
        roomCover: resolveUploadedFileUrl(c.room.cover),
        roomPrice: c.room.price,
        landlordName: c.landlord?.nickname || c.landlord?.username || '—',
        landlordAvatar: c.landlord?.avatar ? resolveUploadedFileUrl(c.landlord.avatar) : null,
        tenancy: c.tenancy,
        onlineTime: c.onlineTime.toISOString(),
        offlineTime: c.offlineTime.toISOString(),
        fee: c.fee,
        pledge: c.pledge,
        payingPeriod: c.payingPeriod,
        renewTimes: c.renewTimes,
        roomPay: c.room.pay,
        roomMinTenancy: c.room.minTenancy,
        status: c.status,
        isCheckout: c.isCheckout,
        checkoutTime: c.checkoutTime?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取合同失败' }, { status: 500 });
  }
}

// POST /api/portal/account/contracts — 租客（当前登录用户）创建合同
export async function POST(req: NextRequest) {
  try {
    const auth = await requirePortalAuth(req);
    if (!auth.ok) return auth.response;

    const body    = await req.json();
    const roomId  = parseInt(body.roomId);
    const tenancy = parseInt(body.tenancy);
    const payCode = String(body.payCode || '');
    const onlineTime = body.onlineTime;

    if (!roomId || isNaN(roomId))                   return NextResponse.json({ success: false, message: '请提供房源 ID' }, { status: 400 });
    if (!tenancy || isNaN(tenancy) || tenancy <= 0) return NextResponse.json({ success: false, message: '请输入有效租期' }, { status: 400 });
    if (!onlineTime)                                return NextResponse.json({ success: false, message: '请选择开始日期' }, { status: 400 });
    if (!payCode)                                   return NextResponse.json({ success: false, message: '请输入支付密码' }, { status: 400 });

    const data = await createContract({ userId: auth.user.id, roomId, tenancy, onlineTime, payCode });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ServiceError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
