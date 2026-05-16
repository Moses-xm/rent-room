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

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page        = parseInt(searchParams.get('page')  || '1');
    const limit       = parseInt(searchParams.get('limit') || '10');
    const search      = searchParams.get('search') || '';
    const typeParam   = searchParams.get('type');
    const payerIdParam  = searchParams.get('payerId');
    const payeeIdParam  = searchParams.get('payeeId');
    const roomIdParam   = searchParams.get('roomId');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (typeParam)    where.type    = parseInt(typeParam);
    if (payerIdParam) where.payerId = parseInt(payerIdParam);
    if (payeeIdParam) where.payeeId = parseInt(payeeIdParam);
    if (roomIdParam)  where.roomId  = parseInt(roomIdParam);
    if (search) {
      where.OR = [
        { payer: { username: { contains: search, mode: 'insensitive' as const } } },
        { payer: { nickname: { contains: search, mode: 'insensitive' as const } } },
        { room:  { name:     { contains: search, mode: 'insensitive' as const } } },
        { room:  { roomCode: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeOrder),
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
