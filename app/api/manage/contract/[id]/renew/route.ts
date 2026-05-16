import { NextRequest, NextResponse } from 'next/server';
import { serializeContract, generatePeriods, addMonths } from '@/lib/contract';
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
    const renewMonths = parseInt(body.renewMonths);
    const payCode = String(body.payCode || '');

    if (!renewMonths || isNaN(renewMonths) || renewMonths <= 0) {
      return NextResponse.json({ success: false, message: '请输入有效的续租月数' }, { status: 400 });
    }
    if (!payCode) return NextResponse.json({ success: false, message: '请输入支付密码' }, { status: 400 });

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: true, user: true, landlord: true },
    });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
    if (contract.status === 2) return NextResponse.json({ success: false, message: '合同已完成，无法续租' }, { status: 400 });
    if (contract.isCheckout) return NextResponse.json({ success: false, message: '已退房，无法续租' }, { status: 400 });

    const payMonths = contract.room?.pay ?? 1;
    if (renewMonths % payMonths !== 0) {
      return NextResponse.json({ success: false, message: `续租月数必须是 ${payMonths} 的整数倍` }, { status: 400 });
    }

    const tenant = contract.user;
    if (!tenant) return NextResponse.json({ success: false, message: '租客不存在' }, { status: 404 });
    if (tenant.payCode !== payCode) return NextResponse.json({ success: false, message: '支付密码错误' }, { status: 400 });

    const renewFee = contract.fee * (renewMonths / payMonths);
    if (tenant.wallet < renewFee) {
      return NextResponse.json({ success: false, message: `租客余额不足，续租首期需 ¥${contract.fee.toFixed(2)}` }, { status: 400 });
    }

    const newOfflineTime = addMonths(new Date(contract.offlineTime), renewMonths);
    const newPeriods = generatePeriods(new Date(contract.offlineTime), newOfflineTime, payMonths);
    const existingPayingPeriod = JSON.parse(contract.payingPeriod) as { start: string; end: string }[];
    const newPayingPeriod = JSON.stringify([...existingPayingPeriod, ...newPeriods]);

    const updated = await prisma.$transaction(async (tx) => {
      const orderRecord = await tx.order.create({
        data: {
          contractId, payerId: contract.userId, payeeId: contract.landlordId, roomId: contract.roomId,
          type: 2, fee: contract.fee,
          paidPeriod: `${newPeriods[0].start.substring(0, 10)}~${newPeriods[0].end.substring(0, 10)}`,
        },
      });

      const updatedTenant   = await tx.user.update({ where: { id: contract.userId     }, data: { wallet: { decrement: contract.fee } }, select: { wallet: true } });
      const updatedLandlord = await tx.user.update({ where: { id: contract.landlordId }, data: { wallet: { increment: contract.fee } }, select: { wallet: true } });

      await tx.walletRecord.createMany({
        data: [
          { userId: contract.userId,     amount: -contract.fee, type: 2, remark: `支付房源「${contract.room?.name ?? ''}」续租首期房租`, orderId: orderRecord.id, balanceAfter: updatedTenant.wallet },
          { userId: contract.landlordId, amount:  contract.fee, type: 3, remark: `收到房源「${contract.room?.name ?? ''}」续租首期房租`, orderId: orderRecord.id, balanceAfter: updatedLandlord.wallet },
        ],
      });

      const tenantName = tenant.nickname || tenant.username;
      await tx.notification.create({
        data: {
          userId: contract.landlordId, type: 4,
          title: '租客续租通知',
          content: `租客 ${tenantName} 对房源「${contract.room?.name ?? ''}」进行了续租，续租 ${renewMonths} 个月，新合同截止日期为 ${newOfflineTime.toLocaleDateString('zh-CN')}，请查看最新合同。`,
          relatedType: 'contract', relatedId: contractId,
        },
      });

      return tx.contract.update({
        where: { id: contractId },
        data: {
          offlineTime: newOfflineTime,
          tenancy: contract.tenancy + renewMonths,
          payingPeriod: newPayingPeriod,
          renewTimes: { increment: 1 },
          renewMonths: { increment: renewMonths },
        },
        include: INCLUDE,
      });
    });

    return NextResponse.json({ success: true, data: serializeContract(updated) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
