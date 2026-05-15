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

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const body = await req.json();
    const payCode = String(body.payCode || '');
    if (!payCode) return NextResponse.json({ success: false, message: '请输入支付密码' }, { status: 400 });

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: true, user: true, landlord: true },
    });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
    if (contract.status === 2) return NextResponse.json({ success: false, message: '合同已完成，无需缴纳房租' }, { status: 400 });
    if (contract.isCheckout) return NextResponse.json({ success: false, message: '已退房，无需缴纳房租' }, { status: 400 });

    const payingPeriods = JSON.parse(contract.payingPeriod) as { start: string; end: string }[];
    if (payingPeriods.length === 0) return NextResponse.json({ success: false, message: '所有租期均已缴清' }, { status: 400 });

    const tenant = contract.user;
    if (!tenant) return NextResponse.json({ success: false, message: '租客不存在' }, { status: 404 });
    if (tenant.payCode !== payCode) return NextResponse.json({ success: false, message: '支付密码错误' }, { status: 400 });
    if (tenant.wallet < contract.fee) {
      return NextResponse.json({ success: false, message: `租客余额不足，需要 ¥${contract.fee.toFixed(2)}，当前余额 ¥${tenant.wallet.toFixed(2)}` }, { status: 400 });
    }

    const nextPeriod = payingPeriods[0];
    const paidPeriods = JSON.parse(contract.paidPeriod) as { start: string; end: string }[];
    const newPaidPeriod   = JSON.stringify([...paidPeriods, nextPeriod]);
    const newPayingPeriod = JSON.stringify(payingPeriods.slice(1));

    const updated = await prisma.$transaction(async (tx) => {
      const orderRecord = await tx.order.create({
        data: {
          contractId,
          payerId: contract.userId,
          payeeId: contract.landlordId,
          roomId: contract.roomId,
          type: 2,
          fee: contract.fee,
          paidPeriod: `${nextPeriod.start.substring(0, 10)}~${nextPeriod.end.substring(0, 10)}`,
        },
      });

      await tx.user.update({ where: { id: contract.userId     }, data: { wallet: { decrement: contract.fee } } });
      await tx.user.update({ where: { id: contract.landlordId }, data: { wallet: { increment: contract.fee } } });

      await tx.walletRecord.createMany({
        data: [
          { userId: contract.userId, amount: -contract.fee, type: 2, remark: `支付房源「${contract.room?.name ?? ''}」续期房租`, orderId: orderRecord.id },
          { userId: contract.landlordId, amount: contract.fee, type: 3, remark: `收到房源「${contract.room?.name ?? ''}」续期房租`, orderId: orderRecord.id },
        ],
      });

      // 判断是否为最后一期，且结束时间已到 → 合法退房
      const isLastPeriod = payingPeriods.length === 1;
      const isExpired    = new Date() >= new Date(contract.offlineTime);
      let finalStatus    = 1;
      let isCheckout     = false;
      let checkoutTime: Date | null = null;
      let refund: boolean | null = null;

      if (isLastPeriod && isExpired) {
        finalStatus  = 2;
        isCheckout   = true;
        checkoutTime = new Date();
        refund       = true;

        await tx.room.update({ where: { id: contract.roomId }, data: { isRented: 1 } });
        await tx.user.update({ where: { id: contract.landlordId }, data: { wallet: { decrement: contract.pledge } } });
        await tx.user.update({ where: { id: contract.userId },     data: { wallet: { increment: contract.pledge } } });

        const refundOrder = await tx.order.create({
          data: {
            contractId, payerId: contract.landlordId, payeeId: contract.userId, roomId: contract.roomId,
            type: 3, pledge: contract.pledge,
          },
        });
        await tx.walletRecord.createMany({
          data: [
            { userId: contract.userId,     amount:  contract.pledge, type: 4, remark: '押金退款', orderId: refundOrder.id },
            { userId: contract.landlordId, amount: -contract.pledge, type: 2, remark: '退还押金给租客', orderId: refundOrder.id },
          ],
        });

        await tx.notification.createMany({
          data: [
            { userId: contract.userId,     type: 8,  title: '租约已到期，押金已退回', content: `您在房源「${contract.room?.name ?? ''}」的租约已到期，押金 ¥${contract.pledge.toFixed(2)} 已退回至您的钱包。`, relatedType: 'contract', relatedId: contractId },
            { userId: contract.landlordId, type: 11, title: '租客租约到期已退房', content: `租客的租约已到期，押金 ¥${contract.pledge.toFixed(2)} 已从您的钱包扣除退还给租客。`, relatedType: 'contract', relatedId: contractId },
          ],
        });
      }

      const tenantName   = tenant.nickname || tenant.username;
      const landlordName = contract.landlord?.nickname || contract.landlord?.username || '';

      await tx.notification.createMany({
        data: [
          { userId: contract.userId,     type: 5, title: '缴租成功', content: `您已成功缴纳房源「${contract.room?.name ?? ''}」${nextPeriod.start.substring(0, 10)} 至 ${nextPeriod.end.substring(0, 10)} 的租金 ¥${contract.fee.toFixed(2)}。`, relatedType: 'contract', relatedId: contractId },
          { userId: contract.landlordId, type: 6, title: '收租成功', content: `租客 ${tenantName} 已缴纳房源「${contract.room?.name ?? ''}」${nextPeriod.start.substring(0, 10)} 至 ${nextPeriod.end.substring(0, 10)} 的租金 ¥${contract.fee.toFixed(2)}。`, relatedType: 'contract', relatedId: contractId },
        ],
      });

      void landlordName;

      return tx.contract.update({
        where: { id: contractId },
        data: { paidPeriod: newPaidPeriod, payingPeriod: newPayingPeriod, status: finalStatus, isCheckout, checkoutTime, refund },
        include: INCLUDE,
      });
    });

    return NextResponse.json({ success: true, data: serializeContract(updated) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
