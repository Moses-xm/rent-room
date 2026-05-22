/**
 * 合同业务服务层
 * manage 和 portal 的路由均调用此处，路由只负责：鉴权 + 参数解析 + 调用 service + HTTP 响应
 */
import { prisma } from '@/lib/prisma';
import { serializeContract, generatePeriods, addMonths } from '@/lib/contract';

/* ─── 带状态码的业务异常 ──────────────────────────────────────────────────── */
export class ServiceError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = 'ServiceError';
  }
}

/* ─── include 预设（manage / portal 路由都需要 user/room/landlord 关联） ── */
const INCLUDE = {
  user:     { select: { id: true, username: true, nickname: true, avatar: true } },
  room:     { select: { id: true, name: true, roomCode: true, cover: true, price: true, pledge: true, pay: true, minTenancy: true } },
  landlord: { select: { id: true, username: true, nickname: true, avatar: true } },
} as const;

/* ─── createContract ──────────────────────────────────────────────────────── */
export async function createContract(params: {
  userId: number;   // 租客
  roomId: number;
  tenancy: number;
  onlineTime: string;  // YYYY-MM-DD
  payCode: string;
}) {
  const { userId, roomId, tenancy, onlineTime: onlineTimeStr, payCode } = params;

  const onlineTime = new Date(onlineTimeStr);
  if (isNaN(onlineTime.getTime())) throw new ServiceError('开始日期格式错误');

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { publisher: { select: { id: true, username: true, nickname: true, wallet: true } } },
  });
  if (!room)                     throw new ServiceError('房源不存在', 404);
  if (room.isPublished !== 2)    throw new ServiceError('该房源尚未发布');
  if (room.isRented === 2)       throw new ServiceError('该房源已被租出');
  if (tenancy < room.minTenancy) throw new ServiceError(`租期不能少于最短租期 ${room.minTenancy} 个月`);
  if (tenancy % room.pay !== 0)  throw new ServiceError(`租期必须是 ${room.pay} 的整数倍`);
  if (userId === room.publisherId) throw new ServiceError('租客不能租用自己发布的房源');

  const landlordId = room.publisherId;
  const tenant = await prisma.user.findUnique({ where: { id: userId } });
  if (!tenant)                   throw new ServiceError('租客不存在', 404);
  if (tenant.payCode !== payCode) throw new ServiceError('支付密码错误');

  const pledgeAmount = room.price * room.pledge;
  const fee          = room.price * room.pay;
  const totalAmount  = pledgeAmount + fee;

  if (tenant.wallet < totalAmount) {
    throw new ServiceError(`余额不足，需要 ¥${totalAmount.toFixed(2)}，当前余额 ¥${tenant.wallet.toFixed(2)}`);
  }

  const offlineTime  = addMonths(onlineTime, tenancy);
  const allPeriods   = generatePeriods(onlineTime, offlineTime, room.pay);
  const paidPeriod   = JSON.stringify([allPeriods[0]]);
  const payingPeriod = JSON.stringify(allPeriods.slice(1));

  const contract = await prisma.$transaction(async (tx) => {
    const lockedRoom = await tx.room.findFirst({ where: { id: roomId, isRented: 1 } });
    if (!lockedRoom) throw new ServiceError('该房源已被租出');

    const c = await tx.contract.create({
      data: { userId, roomId, landlordId, tenancy, onlineTime, offlineTime, pledge: pledgeAmount, fee, paidPeriod, payingPeriod, status: 1 },
      include: INCLUDE,
    });

    await tx.room.update({
      where: { id: roomId },
      data: { isRented: 2, times: { increment: 1 }, income: { increment: totalAmount } },
    });

    const updatedTenant   = await tx.user.update({ where: { id: userId     }, data: { wallet: { decrement: totalAmount } }, select: { wallet: true } });
    const updatedLandlord = await tx.user.update({ where: { id: landlordId }, data: { wallet: { increment: totalAmount } }, select: { wallet: true } });

    const orderRecord = await tx.order.create({
      data: {
        contractId: c.id, payerId: userId, payeeId: landlordId, roomId,
        type: 1, fee, pledge: pledgeAmount,
        paidPeriod: `${allPeriods[0].start.substring(0, 10)}~${allPeriods[0].end.substring(0, 10)}`,
      },
    });

    await tx.walletRecord.createMany({
      data: [
        { userId,      amount: -totalAmount, type: 2, remark: `支付房源「${room.name}」首期押金+房租`, orderId: orderRecord.id, balanceAfter: updatedTenant.wallet },
        { userId: landlordId, amount: totalAmount,  type: 3, remark: `收到房源「${room.name}」首期押金+房租`, orderId: orderRecord.id, balanceAfter: updatedLandlord.wallet },
      ],
    });

    const tenantName   = tenant.nickname || tenant.username;
    const landlordUser = await tx.user.findUnique({ where: { id: landlordId }, select: { nickname: true, username: true } });
    const landlordName = landlordUser?.nickname || landlordUser?.username || '';

    await tx.notification.createMany({
      data: [
        { userId: landlordId, type: 4, title: '有新租客签约入住',  content: `租客 ${tenantName} 已签订房源「${room.name}」的租赁合同，租期 ${tenancy} 个月，开始时间 ${onlineTime.toLocaleDateString('zh-CN')}，请查看合同详情。`, relatedType: 'contract', relatedId: c.id },
        { userId,             type: 5, title: '付款成功',          content: `您已成功支付房源「${room.name}」首期押金 ¥${pledgeAmount.toFixed(2)} + 首期房租 ¥${fee.toFixed(2)}，共 ¥${totalAmount.toFixed(2)}。`, relatedType: 'contract', relatedId: c.id },
        { userId: landlordId, type: 6, title: '收款成功',          content: `您已收到租客 ${tenantName} 支付的房源「${room.name}」首期押金+房租共 ¥${totalAmount.toFixed(2)}。`, relatedType: 'contract', relatedId: c.id },
        { userId,             type: 5, title: '合同创建成功',      content: `您与房东 ${landlordName} 的租赁合同已创建成功，租期 ${tenancy} 个月（${onlineTime.toLocaleDateString('zh-CN')} 至 ${offlineTime.toLocaleDateString('zh-CN')}）。`, relatedType: 'contract', relatedId: c.id },
      ],
    });

    return c;
  });

  return serializeContract(contract);
}

/* ─── payContract ─────────────────────────────────────────────────────────── */
export async function payContract(params: {
  contractId: number;
  payCode: string;
}) {
  const { contractId, payCode } = params;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { room: true, user: true, landlord: true },
  });
  if (!contract)        throw new ServiceError('合同不存在', 404);
  if (contract.status === 2) throw new ServiceError('合同已完成，无需缴纳房租');
  if (contract.isCheckout)   throw new ServiceError('已退房，无需缴纳房租');

  const payingPeriods = JSON.parse(contract.payingPeriod) as { start: string; end: string }[];
  if (payingPeriods.length === 0) throw new ServiceError('所有租期均已缴清');

  const tenant = contract.user;
  if (!tenant)                    throw new ServiceError('租客不存在', 404);
  if (tenant.payCode !== payCode) throw new ServiceError('支付密码错误');
  if (tenant.wallet < contract.fee) {
    throw new ServiceError(`余额不足，需要 ¥${contract.fee.toFixed(2)}，当前余额 ¥${tenant.wallet.toFixed(2)}`);
  }

  const nextPeriod    = payingPeriods[0];
  const paidPeriods   = JSON.parse(contract.paidPeriod) as { start: string; end: string }[];
  const newPaidPeriod   = JSON.stringify([...paidPeriods, nextPeriod]);
  const newPayingPeriod = JSON.stringify(payingPeriods.slice(1));

  const updated = await prisma.$transaction(async (tx) => {
    const orderRecord = await tx.order.create({
      data: {
        contractId, payerId: contract.userId, payeeId: contract.landlordId, roomId: contract.roomId,
        type: 2, fee: contract.fee,
        paidPeriod: `${nextPeriod.start.substring(0, 10)}~${nextPeriod.end.substring(0, 10)}`,
      },
    });

    const updatedTenant   = await tx.user.update({ where: { id: contract.userId     }, data: { wallet: { decrement: contract.fee } }, select: { wallet: true } });
    const updatedLandlord = await tx.user.update({ where: { id: contract.landlordId }, data: { wallet: { increment: contract.fee } }, select: { wallet: true } });

    await tx.walletRecord.createMany({
      data: [
        { userId: contract.userId,     amount: -contract.fee, type: 2, remark: `支付房源「${contract.room?.name ?? ''}」续期房租`, orderId: orderRecord.id, balanceAfter: updatedTenant.wallet },
        { userId: contract.landlordId, amount:  contract.fee, type: 3, remark: `收到房源「${contract.room?.name ?? ''}」续期房租`, orderId: orderRecord.id, balanceAfter: updatedLandlord.wallet },
      ],
    });

    // 最后一期且已到期 → 自动触发合法退房
    const isLastPeriod = payingPeriods.length === 1;
    const isExpired    = new Date() >= new Date(contract.offlineTime);
    let finalStatus    = 1;
    let isCheckout     = false;
    let checkoutTime: Date | null = null;
    let refund: boolean | null    = null;

    if (isLastPeriod && isExpired) {
      finalStatus = 2; isCheckout = true; checkoutTime = new Date(); refund = true;

      await tx.room.update({ where: { id: contract.roomId }, data: { isRented: 1 } });

      const refundedLandlord = await tx.user.update({ where: { id: contract.landlordId }, data: { wallet: { decrement: contract.pledge } }, select: { wallet: true } });
      const refundedTenant   = await tx.user.update({ where: { id: contract.userId     }, data: { wallet: { increment: contract.pledge } }, select: { wallet: true } });

      const refundOrder = await tx.order.create({
        data: { contractId, payerId: contract.landlordId, payeeId: contract.userId, roomId: contract.roomId, type: 3, pledge: contract.pledge },
      });
      await tx.walletRecord.createMany({
        data: [
          { userId: contract.userId,     amount:  contract.pledge, type: 4, remark: '押金退款',        orderId: refundOrder.id, balanceAfter: refundedTenant.wallet },
          { userId: contract.landlordId, amount: -contract.pledge, type: 2, remark: '退还押金给租客', orderId: refundOrder.id, balanceAfter: refundedLandlord.wallet },
        ],
      });
      await tx.notification.createMany({
        data: [
          { userId: contract.userId,     type: 8,  title: '租约已到期，押金已退回',  content: `您在房源「${contract.room?.name ?? ''}」的租约已到期，押金 ¥${contract.pledge.toFixed(2)} 已退回至您的钱包。`, relatedType: 'contract', relatedId: contractId },
          { userId: contract.landlordId, type: 11, title: '租客租约到期已退房',       content: `租客的租约已到期，押金 ¥${contract.pledge.toFixed(2)} 已从您的钱包扣除退还给租客。`, relatedType: 'contract', relatedId: contractId },
        ],
      });
    }

    const tenantName = tenant.nickname || tenant.username;
    await tx.notification.createMany({
      data: [
        { userId: contract.userId,     type: 5, title: '缴租成功', content: `您已成功缴纳房源「${contract.room?.name ?? ''}」${nextPeriod.start.substring(0, 10)} 至 ${nextPeriod.end.substring(0, 10)} 的租金 ¥${contract.fee.toFixed(2)}。`, relatedType: 'contract', relatedId: contractId },
        { userId: contract.landlordId, type: 6, title: '收租成功', content: `租客 ${tenantName} 已缴纳房源「${contract.room?.name ?? ''}」${nextPeriod.start.substring(0, 10)} 至 ${nextPeriod.end.substring(0, 10)} 的租金 ¥${contract.fee.toFixed(2)}。`, relatedType: 'contract', relatedId: contractId },
      ],
    });

    return tx.contract.update({
      where: { id: contractId },
      data: { paidPeriod: newPaidPeriod, payingPeriod: newPayingPeriod, status: finalStatus, isCheckout, checkoutTime, refund },
      include: INCLUDE,
    });
  });

  return serializeContract(updated);
}

/* ─── renewContract ───────────────────────────────────────────────────────── */
export async function renewContract(params: {
  contractId: number;
  renewMonths: number;
  initiatorId: number;  // 用于判断是租客还是房东发起，决定通知方向
}) {
  const { contractId, renewMonths, initiatorId } = params;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { room: true, user: true, landlord: true },
  });
  if (!contract)           throw new ServiceError('合同不存在', 404);
  if (contract.status === 2) throw new ServiceError('合同已完成，无法续租');
  if (contract.isCheckout)   throw new ServiceError('已退房，无法续租');

  const payMonths = contract.room?.pay ?? 1;
  if (renewMonths % payMonths !== 0) {
    throw new ServiceError(`续租月数必须是 ${payMonths} 的整数倍`);
  }

  const newOfflineTime = addMonths(new Date(contract.offlineTime), renewMonths);
  const newPeriods     = generatePeriods(new Date(contract.offlineTime), newOfflineTime, payMonths);
  const existingPayingPeriod = JSON.parse(contract.payingPeriod) as { start: string; end: string }[];
  const newPayingPeriod = JSON.stringify([...existingPayingPeriod, ...newPeriods]);

  const tenantName   = contract.user?.nickname     || contract.user?.username     || '租客';
  const isLandlordAction = initiatorId === contract.landlordId;

  const updated = await prisma.$transaction(async (tx) => {
    if (isLandlordAction) {
      await tx.notification.create({
        data: {
          userId: contract.userId, type: 4,
          title: '房东为您续租',
          content: `房东对房源「${contract.room?.name ?? ''}」的合同进行了续租，续租 ${renewMonths} 个月，新合同截止日期为 ${newOfflineTime.toLocaleDateString('zh-CN')}。`,
          relatedType: 'contract', relatedId: contractId,
        },
      });
    } else {
      await tx.notification.create({
        data: {
          userId: contract.landlordId, type: 4,
          title: '租客续租通知',
          content: `租客 ${tenantName} 对房源「${contract.room?.name ?? ''}」进行了续租，续租 ${renewMonths} 个月，新合同截止日期为 ${newOfflineTime.toLocaleDateString('zh-CN')}，请查看最新合同。`,
          relatedType: 'contract', relatedId: contractId,
        },
      });
    }

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

  return serializeContract(updated);
}

/* ─── checkoutContract ────────────────────────────────────────────────────── */
export async function checkoutContract(params: { contractId: number }) {
  const { contractId } = params;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { room: true, user: true, landlord: true },
  });
  if (!contract)           throw new ServiceError('合同不存在', 404);
  if (contract.isCheckout) throw new ServiceError('合同已退房');
  if (contract.status === 2) throw new ServiceError('合同已完成');

  const payingPeriods = JSON.parse(contract.payingPeriod ?? '[]') as unknown[];
  const isLegal       = payingPeriods.length === 0;
  const isEarlyLegal  = isLegal && new Date() < contract.offlineTime;
  const checkoutTime  = new Date();
  const tenantName    = contract.user?.nickname   || contract.user?.username   || '';
  const roomName      = contract.room?.name ?? '';

  const updated = await prisma.$transaction(async (tx) => {
    await tx.room.update({ where: { id: contract.roomId }, data: { isRented: 1 } });

    if (isLegal) {
      const refundOrder = await tx.order.create({
        data: { contractId, payerId: contract.landlordId, payeeId: contract.userId, roomId: contract.roomId, type: 3, pledge: contract.pledge },
      });
      const refundedLandlord = await tx.user.update({ where: { id: contract.landlordId }, data: { wallet: { decrement: contract.pledge } }, select: { wallet: true } });
      const refundedTenant   = await tx.user.update({ where: { id: contract.userId     }, data: { wallet: { increment: contract.pledge } }, select: { wallet: true } });
      await tx.walletRecord.createMany({
        data: [
          { userId: contract.userId,     amount:  contract.pledge, type: 4, remark: `房源「${roomName}」押金退款`,        orderId: refundOrder.id, balanceAfter: refundedTenant.wallet },
          { userId: contract.landlordId, amount: -contract.pledge, type: 2, remark: `退还房源「${roomName}」押金给租客`, orderId: refundOrder.id, balanceAfter: refundedLandlord.wallet },
        ],
      });

      const tenantContent   = isEarlyLegal
        ? `您已提前结清房源「${roomName}」的全部租金并退房，押金 ¥${contract.pledge.toFixed(2)} 已退回至您的钱包。`
        : `您的租约已到期，房源「${roomName}」押金 ¥${contract.pledge.toFixed(2)} 已退回至您的钱包。`;
      const landlordContent = isEarlyLegal
        ? `租客 ${tenantName} 已提前结清所有租金并退出房源「${roomName}」，押金 ¥${contract.pledge.toFixed(2)} 已从您的钱包扣除退还给租客。`
        : `租客 ${tenantName} 租约到期已退房「${roomName}」，押金 ¥${contract.pledge.toFixed(2)} 已从您的钱包扣除退还给租客。`;

      await tx.notification.createMany({
        data: [
          { userId: contract.userId,     type: 8,  title: isEarlyLegal ? '退房成功，押金已退回（提前退房）' : '退房成功，押金已退回', content: tenantContent,   relatedType: 'contract', relatedId: contractId },
          { userId: contract.landlordId, type: 11, title: `租客 ${tenantName} 已退房`,                                                  content: landlordContent, relatedType: 'contract', relatedId: contractId },
        ],
      });
    } else {
      await tx.notification.createMany({
        data: [
          { userId: contract.userId,     type: 10, title: '提前退房确认，押金不予退还', content: `您已提前退出房源「${roomName}」，仍有未结清租金，按合同规定押金 ¥${contract.pledge.toFixed(2)} 不予退还。`, relatedType: 'contract', relatedId: contractId },
          { userId: contract.landlordId, type: 11, title: `租客 ${tenantName} 已提前退房`, content: `租客 ${tenantName} 已提前退出您的房源「${roomName}」，仍有未结清租金，押金无需退还。`, relatedType: 'contract', relatedId: contractId },
        ],
      });
    }

    return tx.contract.update({
      where: { id: contractId },
      data: { status: 2, isCheckout: true, checkoutTime, refund: isLegal },
      include: INCLUDE,
    });
  });

  return serializeContract(updated);
}
