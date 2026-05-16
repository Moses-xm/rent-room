import { NextRequest, NextResponse } from 'next/server';
import { serializeContract } from '@/lib/contract';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

const INCLUDE = {
  user:     { select: { id: true, username: true, nickname: true, avatar: true } },
  room:     { select: { id: true, name: true, roomCode: true, cover: true, price: true, pledge: true, pay: true, minTenancy: true } },
  landlord: { select: { id: true, username: true, nickname: true, avatar: true } },
} as const;

type Params = { params: Promise<{ id: string }> };

// legal=true 合法退房（退押金），legal=false 非法退房（不退押金）
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const body = await req.json();
    const isLegal = body.legal === true;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: true, user: true, landlord: true },
    });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
    if (contract.isCheckout) return NextResponse.json({ success: false, message: '合同已退房' }, { status: 400 });
    if (contract.status === 2) return NextResponse.json({ success: false, message: '合同已完成' }, { status: 400 });

    const checkoutTime = new Date();
    const tenantName   = contract.user?.nickname   || contract.user?.username   || '';
    const roomName     = contract.room?.name ?? '';

    const updated = await prisma.$transaction(async (tx) => {
      // 更新房源为可租
      await tx.room.update({ where: { id: contract.roomId }, data: { isRented: 1 } });

      if (isLegal) {
        // 合法退房：退押金
        const refundOrder = await tx.order.create({
          data: {
            contractId, payerId: contract.landlordId, payeeId: contract.userId, roomId: contract.roomId,
            type: 3, pledge: contract.pledge,
          },
        });
        const refundedLandlord = await tx.user.update({ where: { id: contract.landlordId }, data: { wallet: { decrement: contract.pledge } }, select: { wallet: true } });
        const refundedTenant   = await tx.user.update({ where: { id: contract.userId     }, data: { wallet: { increment: contract.pledge } }, select: { wallet: true } });
        await tx.walletRecord.createMany({
          data: [
            { userId: contract.userId,     amount:  contract.pledge, type: 4, remark: `房源「${roomName}」押金退款`, orderId: refundOrder.id, balanceAfter: refundedTenant.wallet },
            { userId: contract.landlordId, amount: -contract.pledge, type: 2, remark: `退还房源「${roomName}」押金给租客`, orderId: refundOrder.id, balanceAfter: refundedLandlord.wallet },
          ],
        });
        await tx.notification.createMany({
          data: [
            { userId: contract.userId,     type: 8,  title: '退房成功，押金已退回', content: `您已合法退房，房源「${roomName}」押金 ¥${contract.pledge.toFixed(2)} 已退回至您的钱包。`, relatedType: 'contract', relatedId: contractId },
            { userId: contract.landlordId, type: 11, title: `租客 ${tenantName} 已退房`, content: `租客 ${tenantName} 已合法退房，押金 ¥${contract.pledge.toFixed(2)} 已从您的钱包扣除退还给租客。`, relatedType: 'contract', relatedId: contractId },
          ],
        });
      } else {
        // 非法退房：押金不退
        await tx.notification.createMany({
          data: [
            { userId: contract.userId,     type: 10, title: '提前退房确认，押金不予退还', content: `您已提前退出房源「${roomName}」，按合同规定押金 ¥${contract.pledge.toFixed(2)} 不予退还。`, relatedType: 'contract', relatedId: contractId },
            { userId: contract.landlordId, type: 11, title: `租客 ${tenantName} 已提前退房`, content: `租客 ${tenantName} 已提前退出您的房源「${roomName}」，押金无需退还。`, relatedType: 'contract', relatedId: contractId },
          ],
        });
      }

      return tx.contract.update({
        where: { id: contractId },
        data: { status: 2, isCheckout: true, checkoutTime, refund: isLegal },
        include: INCLUDE,
      });
    });

    return NextResponse.json({ success: true, data: serializeContract(updated) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
