import { NextRequest, NextResponse } from 'next/server';
import { serializeContract, generatePeriods, addMonths } from '@/lib/contract';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

const INCLUDE = {
  user:     { select: { id: true, username: true, nickname: true, avatar: true } },
  room:     { select: { id: true, name: true, roomCode: true, cover: true, price: true, pledge: true, pay: true, minTenancy: true } },
  landlord: { select: { id: true, username: true, nickname: true, avatar: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page         = parseInt(searchParams.get('page')       || '1');
    const limit        = parseInt(searchParams.get('limit')      || '10');
    const search       = searchParams.get('search')      || '';
    const statusParam  = searchParams.get('status');
    const isCheckoutP  = searchParams.get('isCheckout');
    const userIdParam  = searchParams.get('userId');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (statusParam)         where.status     = parseInt(statusParam);
    if (userIdParam)         where.userId     = parseInt(userIdParam);
    if (isCheckoutP === 'true')  where.isCheckout = true;
    if (isCheckoutP === 'false') where.isCheckout = false;
    if (search) {
      where.OR = [
        { user:     { username: { contains: search, mode: 'insensitive' as const } } },
        { user:     { nickname: { contains: search, mode: 'insensitive' as const } } },
        { landlord: { username: { contains: search, mode: 'insensitive' as const } } },
        { room:     { name:     { contains: search, mode: 'insensitive' as const } } },
        { room:     { roomCode: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.contract.count({ where }),
      prisma.contract.findMany({ where, take: limit, skip, orderBy: { createdAt: 'desc' }, include: INCLUDE }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeContract),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const userId    = parseInt(body.userId);
    const roomId    = parseInt(body.roomId);
    const tenancy   = parseInt(body.tenancy);
    const payCode   = String(body.payCode || '');
    const onlineTimeStr = body.onlineTime;

    if (!userId || isNaN(userId)) return NextResponse.json({ success: false, message: '请选择租客' }, { status: 400 });
    if (!roomId || isNaN(roomId)) return NextResponse.json({ success: false, message: '请选择房源' }, { status: 400 });
    if (!tenancy || isNaN(tenancy) || tenancy <= 0) return NextResponse.json({ success: false, message: '请输入有效租期' }, { status: 400 });
    if (!onlineTimeStr) return NextResponse.json({ success: false, message: '请选择开始日期' }, { status: 400 });
    if (!payCode) return NextResponse.json({ success: false, message: '请输入支付密码' }, { status: 400 });

    const onlineTime = new Date(onlineTimeStr);
    if (isNaN(onlineTime.getTime())) return NextResponse.json({ success: false, message: '开始日期格式错误' }, { status: 400 });

    // 查房源
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { publisher: { select: { id: true, username: true, nickname: true, wallet: true } } },
    });
    if (!room) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });
    if (room.isRented === 2) return NextResponse.json({ success: false, message: '该房源已被租出' }, { status: 400 });
    if (room.isPublished !== 2) return NextResponse.json({ success: false, message: '该房源尚未发布' }, { status: 400 });
    if (tenancy < room.minTenancy) return NextResponse.json({ success: false, message: `租期不能少于最短租期 ${room.minTenancy} 个月` }, { status: 400 });
    if (tenancy % room.pay !== 0) return NextResponse.json({ success: false, message: `租期必须是 ${room.pay} 的整数倍` }, { status: 400 });
    if (userId === room.publisherId) return NextResponse.json({ success: false, message: '租客不能租用自己发布的房源' }, { status: 400 });

    const landlordId = room.publisherId;
    const tenant = await prisma.user.findUnique({ where: { id: userId } });
    if (!tenant) return NextResponse.json({ success: false, message: '租客不存在' }, { status: 404 });
    if (tenant.payCode !== payCode) return NextResponse.json({ success: false, message: '支付密码错误' }, { status: 400 });

    const pledgeAmount = room.price * room.pledge;
    const fee = room.price * room.pay;
    const totalAmount = pledgeAmount + fee;

    if (tenant.wallet < totalAmount) {
      return NextResponse.json({ success: false, message: `租客余额不足，需要 ¥${totalAmount.toFixed(2)}，当前余额 ¥${tenant.wallet.toFixed(2)}` }, { status: 400 });
    }

    const offlineTime = addMonths(onlineTime, tenancy);
    const allPeriods = generatePeriods(onlineTime, offlineTime, room.pay);
    const paidPeriod   = JSON.stringify([allPeriods[0]]);
    const payingPeriod = JSON.stringify(allPeriods.slice(1));

    // 事务
    const contract = await prisma.$transaction(async (tx) => {
      // 再次检查房源状态（防并发）
      const lockedRoom = await tx.room.findFirst({ where: { id: roomId, isRented: 1 } });
      if (!lockedRoom) throw new Error('该房源已被租出');

      // 创建合同
      const c = await tx.contract.create({
        data: {
          userId, roomId, landlordId,
          tenancy, onlineTime, offlineTime,
          pledge: pledgeAmount, fee,
          paidPeriod, payingPeriod,
          status: 1,
        },
        include: INCLUDE,
      });

      // 更新房源
      await tx.room.update({
        where: { id: roomId },
        data: { isRented: 2, times: { increment: 1 }, income: { increment: totalAmount } },
      });

      // 更新钱包
      await tx.user.update({ where: { id: userId },     data: { wallet: { decrement: totalAmount } } });
      await tx.user.update({ where: { id: landlordId }, data: { wallet: { increment: totalAmount } } });

      // 创建订单
      const orderRecord = await tx.order.create({
        data: {
          contractId: c.id, payerId: userId, payeeId: landlordId, roomId,
          type: 1, fee, pledge: pledgeAmount,
          paidPeriod: `${allPeriods[0].start.substring(0, 10)}~${allPeriods[0].end.substring(0, 10)}`,
        },
      });

      // 钱包记录
      await tx.walletRecord.createMany({
        data: [
          { userId, amount: -totalAmount, type: 2, remark: `支付房源「${room.name}」首期押金+房租`, orderId: orderRecord.id },
          { userId: landlordId, amount: totalAmount, type: 3, remark: `收到房源「${room.name}」首期押金+房租`, orderId: orderRecord.id },
        ],
      });

      const tenantName   = tenant.nickname || tenant.username;
      const landlordUser = await tx.user.findUnique({ where: { id: landlordId }, select: { nickname: true, username: true } });
      const landlordName = landlordUser?.nickname || landlordUser?.username || '';

      // 通知
      await tx.notification.createMany({
        data: [
          {
            userId: landlordId, type: 4,
            title: '有新租客签约入住',
            content: `租客 ${tenantName} 已签订房源「${room.name}」的租赁合同，租期 ${tenancy} 个月，开始时间 ${onlineTime.toLocaleDateString('zh-CN')}，请查看合同详情。`,
            relatedType: 'contract', relatedId: c.id,
          },
          {
            userId, type: 5,
            title: '付款成功',
            content: `您已成功支付房源「${room.name}」首期押金 ¥${pledgeAmount.toFixed(2)} + 首期房租 ¥${fee.toFixed(2)}，共 ¥${totalAmount.toFixed(2)}。`,
            relatedType: 'contract', relatedId: c.id,
          },
          {
            userId: landlordId, type: 6,
            title: '收款成功',
            content: `您已收到租客 ${tenantName} 支付的房源「${room.name}」首期押金+房租共 ¥${totalAmount.toFixed(2)}。`,
            relatedType: 'contract', relatedId: c.id,
          },
          {
            userId, type: 5,
            title: '合同创建成功',
            content: `您与房东 ${landlordName} 的租赁合同已创建成功，租期 ${tenancy} 个月（${onlineTime.toLocaleDateString('zh-CN')} 至 ${offlineTime.toLocaleDateString('zh-CN')}）。`,
            relatedType: 'contract', relatedId: c.id,
          },
        ],
      });

      return c;
    });

    return NextResponse.json({ success: true, data: serializeContract(contract) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
