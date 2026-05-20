import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// GET /api/portal/account/collections?page=&limit=
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip  = (page - 1) * limit;

  try {
    const where = { userId: auth.user.id };
    const [total, data] = await Promise.all([
      prisma.collection.count({ where }),
      prisma.collection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          room: {
            select: {
              id: true, name: true, price: true, cover: true,
              rentType: true, area: true,
              community: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(c => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        room: {
          id: c.room.id,
          name: c.room.name,
          price: c.room.price,
          cover: c.room.cover,
          rentType: c.room.rentType,
          area: c.room.area,
          communityName: c.room.community.name,
        },
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取收藏失败' }, { status: 500 });
  }
}

// DELETE /api/portal/account/collections?id=xxx
export async function DELETE(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const id = parseInt(new URL(req.url).searchParams.get('id') || '');
  if (isNaN(id)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const record = await prisma.collection.findUnique({ where: { id } });
    if (!record || record.userId !== auth.user.id) {
      return NextResponse.json({ success: false, message: '收藏不存在' }, { status: 404 });
    }
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '取消收藏失败' }, { status: 500 });
  }
}
