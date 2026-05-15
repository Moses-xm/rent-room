import { NextRequest, NextResponse } from 'next/server';
import { serializeNotification } from '@/lib/notification';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

const INCLUDE = {
  user: { select: { id: true, username: true, nickname: true, avatar: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page        = parseInt(searchParams.get('page')   || '1');
    const limit       = parseInt(searchParams.get('limit')  || '10');
    const search      = searchParams.get('search') || '';
    const typeParam   = searchParams.get('type');
    const isReadParam = searchParams.get('isRead');
    const userIdParam = searchParams.get('userId');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (typeParam)   where.type   = parseInt(typeParam);
    if (userIdParam) where.userId = parseInt(userIdParam);
    if (isReadParam === 'true')  where.isRead = true;
    if (isReadParam === 'false') where.isRead = false;
    if (search) {
      where.OR = [
        { title:   { contains: search, mode: 'insensitive' as const } },
        { content: { contains: search, mode: 'insensitive' as const } },
        { user: { username: { contains: search, mode: 'insensitive' as const } } },
        { user: { nickname: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeNotification),
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
