import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/community';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const district = searchParams.get('district') || '';
    const city = searchParams.get('city') || '';
    const skip = (page - 1) * limit;

    const where = {
      ...(city ? { city } : {}),
      ...(district ? { district } : {}),
    };

    // all=true 时返回全量列表（下拉选择用）
    if (all) {
      const items = await prisma.community.findMany({
        where,
        orderBy: { name: 'asc' },
        select: { id: true, name: true, district: true, city: true },
      });
      return NextResponse.json({ success: true, data: items });
    }

    const [total, items] = await Promise.all([
      prisma.community.count({ where }),
      prisma.community.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { rooms: { where: { isPublished: 2 } } },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map((c) => ({
        ...serializeCommunity(c),
        coverUrl: resolveUploadedFileUrl(c.cover),
        roomCount: c._count.rooms,
      })),
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
