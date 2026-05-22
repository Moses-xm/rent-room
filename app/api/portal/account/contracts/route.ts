import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

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
            room: { select: { id: true, name: true, cover: true, price: true } },
            user: { select: { id: true, username: true, nickname: true } },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: data.map(c => ({
          id: c.id,
          roomId: c.roomId,
          roomName: c.room.name,
          roomCover: c.room.cover,
          roomPrice: c.room.price,
          tenantName: c.user.nickname || c.user.username,
          tenancy: c.tenancy,
          onlineTime: c.onlineTime.toISOString(),
          offlineTime: c.offlineTime.toISOString(),
          fee: c.fee,
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
          room: { select: { id: true, name: true, cover: true, price: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(c => ({
        id: c.id,
        roomId: c.roomId,
        roomName: c.room.name,
        roomCover: c.room.cover,
        roomPrice: c.room.price,
        tenancy: c.tenancy,
        onlineTime: c.onlineTime.toISOString(),
        offlineTime: c.offlineTime.toISOString(),
        fee: c.fee,
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
