import { NextRequest, NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

function calcDelta(current: number, previous: number): { value: number; up: boolean } {
  if (previous === 0 && current === 0) return { value: 0, up: true };
  if (previous === 0) return { value: 100, up: true };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.round(Math.abs(pct) * 10) / 10, up: pct >= 0 };
}

export async function GET(req: NextRequest) {
  const auth = await requireManageAuth(req);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = thisMonthStart;
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    totalRooms,
    rentedRooms,
    totalUsers,
    newRoomsThisMonth,
    newRoomsLastMonth,
    newContractsThisMonth,
    newContractsLastMonth,
    newUsersThisMonth,
    newUsersLastMonth,
    revenueThisMonth,
    revenueLastMonth,
    revenueOrdersRaw,
    roomTypeStats,
    topRoomsRaw,
    latestOrdersRaw,
    activeContracts,
    pendingAppointments,
  ] = await Promise.all([
    prisma.room.count(),
    prisma.room.count({ where: { isRented: 2 } }),
    prisma.user.count(),
    prisma.room.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.room.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    prisma.contract.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.contract.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    prisma.order.aggregate({
      _sum: { fee: true, pledge: true },
      where: { type: { not: 3 }, createdAt: { gte: thisMonthStart } },
    }),
    prisma.order.aggregate({
      _sum: { fee: true, pledge: true },
      where: { type: { not: 3 }, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
    }),
    prisma.order.findMany({
      where: { type: { not: 3 }, createdAt: { gte: twelveMonthsAgo } },
      select: { fee: true, pledge: true, createdAt: true },
    }),
    prisma.room.groupBy({ by: ['rentType'], _count: { id: true } }),
    prisma.room.findMany({
      select: {
        id: true,
        name: true,
        roomCode: true,
        _count: { select: { collections: true } },
      },
      orderBy: { collections: { _count: 'desc' } },
      take: 5,
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fee: true,
        pledge: true,
        type: true,
        createdAt: true,
        payer: { select: { username: true, nickname: true } },
        room: { select: { name: true, roomCode: true } },
      },
    }),
    prisma.contract.count({ where: { status: 1, isCheckout: false } }),
    prisma.appointment.count({ where: { status: 1 } }),
  ]);

  // Build revenue by month (last 12 months)
  const revenueMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    revenueMap[key] = 0;
  }
  for (const o of revenueOrdersRaw) {
    const d = o.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in revenueMap) {
      revenueMap[key] += (o.fee ?? 0) + (o.pledge ?? 0);
    }
  }
  const revenueByMonth = Object.entries(revenueMap).map(([key, revenue]) => ({
    label: `${parseInt(key.split('-')[1])}月`,
    revenue: Math.round(revenue),
  }));

  // Room type stats (整租 / 合租)
  const totalForType = roomTypeStats.reduce((s, r) => s + r._count.id, 0);
  const roomTypeMapped = [1, 2].map(rt => {
    const found = roomTypeStats.find(r => r.rentType === rt);
    const count = found ? found._count.id : 0;
    return {
      label: rt === 1 ? '整租' : '合租',
      count,
      pct: totalForType > 0 ? Math.round((count / totalForType) * 100) : 0,
    };
  });

  const thisRevenue = (revenueThisMonth._sum.fee ?? 0) + (revenueThisMonth._sum.pledge ?? 0);
  const lastRevenue = (revenueLastMonth._sum.fee ?? 0) + (revenueLastMonth._sum.pledge ?? 0);
  const vacancyRate =
    totalRooms > 0
      ? Math.round(((totalRooms - rentedRooms) / totalRooms) * 1000) / 10
      : 0;

  return NextResponse.json({
    success: true,
    data: {
      kpi: {
        totalRooms,
        totalRoomsDelta: calcDelta(newRoomsThisMonth, newRoomsLastMonth),
        rentedRooms,
        rentedRoomsDelta: calcDelta(newContractsThisMonth, newContractsLastMonth),
        monthRevenue: Math.round(thisRevenue),
        monthRevenueDelta: calcDelta(thisRevenue, lastRevenue),
        totalUsers,
        totalUsersDelta: calcDelta(newUsersThisMonth, newUsersLastMonth),
        activeContracts,
        pendingAppointments,
        vacancyRate,
      },
      revenueByMonth,
      roomTypeStats: roomTypeMapped,
      topRooms: topRoomsRaw.map(r => ({
        id: r.id,
        name: r.name,
        roomCode: r.roomCode,
        collectionCount: r._count.collections,
      })),
      latestOrders: latestOrdersRaw.map(o => ({
        id: o.id,
        type: o.type,
        fee: o.fee,
        pledge: o.pledge,
        amount: (o.fee ?? 0) + (o.pledge ?? 0),
        payerUsername: o.payer.username,
        payerNickname: o.payer.nickname,
        roomName: o.room.name,
        roomCode: o.room.roomCode,
        createdAt: o.createdAt.toISOString(),
      })),
    },
  });
}
