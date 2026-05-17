import { NextRequest, NextResponse } from 'next/server';
import { serializeOrder } from '@/lib/order';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

const INCLUDE = {
  payer:    { select: { id: true, username: true, nickname: true, avatar: true } },
  payee:    { select: { id: true, username: true, nickname: true, avatar: true } },
  room:     { select: { id: true, name: true, roomCode: true, cover: true } },
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

// 管理员为付款人或收款人执行软删除（或恢复）
export async function PATCH(
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

    const body = await req.json() as { payerDeleted?: boolean; payeeDeleted?: boolean };
    const data: { payerDeleted?: boolean; payeeDeleted?: boolean } = {};
    if (typeof body.payerDeleted === 'boolean') data.payerDeleted = body.payerDeleted;
    if (typeof body.payeeDeleted === 'boolean') data.payeeDeleted = body.payeeDeleted;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, message: '无有效更新字段' }, { status: 400 });
    }

    const item = await prisma.order.findUnique({ where: { id: orderId } });
    if (!item) {
      return NextResponse.json({ success: false, message: '订单不存在' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
      include: INCLUDE,
    });

    return NextResponse.json({ success: true, data: serializeOrder(updated) });
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

    // 先将关联钱包记录的 orderId 置空，再删除订单（保留用户的钱包流水）
    await prisma.$transaction([
      prisma.walletRecord.updateMany({ where: { orderId }, data: { orderId: null } }),
      prisma.order.delete({ where: { id: orderId } }),
    ]);

    return NextResponse.json({ success: true, data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
