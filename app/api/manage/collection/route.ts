import { NextRequest, NextResponse } from 'next/server';
import { serializeCollection } from '@/lib/collection';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const userIdParam = searchParams.get('userId');
    const roomIdParam = searchParams.get('roomId');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userIdParam) where.userId = parseInt(userIdParam);
    if (roomIdParam) where.roomId = parseInt(roomIdParam);
    if (search) {
      where.OR = [
        { user: { username: { contains: search, mode: 'insensitive' as const } } },
        { user: { nickname: { contains: search, mode: 'insensitive' as const } } },
        { room: { name: { contains: search, mode: 'insensitive' as const } } },
        { room: { roomCode: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.collection.count({ where }),
      prisma.collection.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, nickname: true, avatar: true } },
          room: { select: { id: true, name: true, roomCode: true, cover: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeCollection),
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
    const userId = parseInt(body.userId);
    const roomId = parseInt(body.roomId);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ success: false, message: '请选择用户' }, { status: 400 });
    }
    if (!roomId || isNaN(roomId)) {
      return NextResponse.json({ success: false, message: '请选择房源' }, { status: 400 });
    }

    const [userExists, roomExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.room.findUnique({ where: { id: roomId } }),
    ]);

    if (!userExists) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }
    if (!roomExists) {
      return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });
    }

    const existing = await prisma.collection.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: '该用户已收藏此房源' }, { status: 409 });
    }

    const item = await prisma.collection.create({
      data: { userId, roomId },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } },
        room: { select: { id: true, name: true, roomCode: true, cover: true } },
      },
    });

    return NextResponse.json({ success: true, data: serializeCollection(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
