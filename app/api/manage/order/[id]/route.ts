import { NextRequest, NextResponse } from 'next/server';
import { serializeOrder } from '@/lib/order';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

const INCLUDE = {
  payer:    { select: { id: true, username: true, nickname: true } },
  payee:    { select: { id: true, username: true, nickname: true } },
  room:     { select: { id: true, name: true, roomCode: true } },
  contract: { select: { id: true, onlineTime: true, offlineTime: true } },
} as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, message: '无效的订单 ID' }, { status: 400 });
    }

    const item = await prisma.order.findUnique({ where: { id: orderId }, include: INCLUDE });
    if (!item) {
      return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeOrder(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, message: '无效的订单 ID' }, { status: 400 });
    }

    const item = await prisma.order.findUnique({ where: { id: orderId } });
    if (!item) {
      return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
    }

    // 删除关联钱包记录后再删除订单
    await prisma.$transaction([
      prisma.walletRecord.deleteMany({ where: { orderId } }),
      prisma.order.delete({ where: { id: orderId } }),
    ]);

    return NextResponse.json({ success: true, data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
