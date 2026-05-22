import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

// GET /api/portal/account/orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const orderId = parseInt(id);
  if (isNaN(orderId)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        room:     { select: { id: true, name: true, cover: true, roomCode: true } },
        contract: { select: { id: true, onlineTime: true, offlineTime: true } },
        payer:    { select: { id: true, username: true, nickname: true } },
        payee:    { select: { id: true, username: true, nickname: true } },
      },
    });

    if (!order || order.payerId !== auth.user.id) {
      return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        contractId: order.contractId,
        roomId: order.roomId,
        roomName: order.room.name,
        roomCode: order.room.roomCode,
        roomCoverUrl: order.room.cover ? resolveUploadedFileUrl(order.room.cover) : null,
        type: order.type,
        fee: order.fee,
        pledge: order.pledge,
        paidPeriod: order.paidPeriod,
        createdAt: order.createdAt.toISOString(),
        contractOnlineTime: order.contract?.onlineTime?.toISOString() ?? null,
        contractOfflineTime: order.contract?.offlineTime?.toISOString() ?? null,
        payerName: order.payer?.username ?? null,
        payerNickname: order.payer?.nickname ?? null,
        payeeName: order.payee?.username ?? null,
        payeeNickname: order.payee?.nickname ?? null,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取订单详情失败' }, { status: 500 });
  }
}
