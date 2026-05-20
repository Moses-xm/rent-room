import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// GET /api/portal/account/orders?page=&limit=
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip  = (page - 1) * limit;

  try {
    const where = { payerId: auth.user.id, payerDeleted: false };
    const [total, data] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          room:     { select: { id: true, name: true } },
          contract: { select: { id: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(o => ({
        id: o.id,
        roomId: o.roomId,
        roomName: o.room.name,
        contractId: o.contractId,
        type: o.type,
        fee: o.fee,
        pledge: o.pledge,
        paidPeriod: o.paidPeriod,
        createdAt: o.createdAt.toISOString(),
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取订单失败' }, { status: 500 });
  }
}

// DELETE /api/portal/account/orders?id=xxx （软删除）
export async function DELETE(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const id = parseInt(new URL(req.url).searchParams.get('id') || '');
  if (isNaN(id)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const record = await prisma.order.findUnique({ where: { id } });
    if (!record || record.payerId !== auth.user.id) {
      return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
    }
    await prisma.order.update({ where: { id }, data: { payerDeleted: true } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
