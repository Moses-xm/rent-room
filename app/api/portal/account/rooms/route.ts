import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// GET /api/portal/account/rooms?page=&limit=
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip  = (page - 1) * limit;

  try {
    const where = { publisherId: auth.user.id };
    const [total, data] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, name: true, price: true, cover: true,
          isPublished: true, isRented: true, rentType: true,
          publishTime: true, createdAt: true,
          community: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(r => ({
        id: r.id,
        name: r.name,
        price: r.price,
        cover: r.cover,
        isPublished: r.isPublished,
        isRented: r.isRented,
        rentType: r.rentType,
        communityName: r.community.name,
        publishTime: r.publishTime?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取房源失败' }, { status: 500 });
  }
}
