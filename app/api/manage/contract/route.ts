import { NextRequest, NextResponse } from 'next/server';
import { serializeContract } from '@/lib/contract';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { createContract, ServiceError } from '@/lib/contract-service';

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
    const userIdParam     = searchParams.get('userId');
    const landlordIdParam = searchParams.get('landlordId');
    const roomIdParam     = searchParams.get('roomId');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (statusParam)              where.status     = parseInt(statusParam);
    if (userIdParam)              where.userId     = parseInt(userIdParam);
    if (landlordIdParam)          where.landlordId = parseInt(landlordIdParam);
    if (roomIdParam)              where.roomId     = parseInt(roomIdParam);
    if (isCheckoutP === 'true')   where.isCheckout = true;
    if (isCheckoutP === 'false')  where.isCheckout = false;
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
    const userId        = parseInt(body.userId);
    const roomId        = parseInt(body.roomId);
    const tenancy       = parseInt(body.tenancy);
    const payCode       = String(body.payCode || '');
    const onlineTime    = body.onlineTime;

    if (!userId || isNaN(userId))                   return NextResponse.json({ success: false, message: '请选择租客' }, { status: 400 });
    if (!roomId || isNaN(roomId))                   return NextResponse.json({ success: false, message: '请选择房源' }, { status: 400 });
    if (!tenancy || isNaN(tenancy) || tenancy <= 0) return NextResponse.json({ success: false, message: '请输入有效租期' }, { status: 400 });
    if (!onlineTime)                                return NextResponse.json({ success: false, message: '请选择开始日期' }, { status: 400 });
    if (!payCode)                                   return NextResponse.json({ success: false, message: '请输入支付密码' }, { status: 400 });

    const data = await createContract({ userId, roomId, tenancy, onlineTime, payCode });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ServiceError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
