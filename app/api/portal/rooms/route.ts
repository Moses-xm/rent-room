import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeRoom } from '@/lib/room';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

const communitySelect = {
  id: true,
  name: true,
  province: true,
  city: true,
  district: true,
  street: true,
  streetNumber: true,
  lng: true,
  lat: true,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'latest'; // latest | hot
    const district = searchParams.get('district') || '';
    const subwayLine = searchParams.get('subwayLine') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const rentType = searchParams.get('rentType');
    const skip = (page - 1) * limit;

    const communityFilter = {
      ...(district ? { district } : {}),
      ...(subwayLine ? { subwayLine: { contains: subwayLine } } : {}),
    };

    const where = {
      isPublished: 2,
      ...(Object.keys(communityFilter).length > 0 ? { community: communityFilter } : {}),
      ...(rentType ? { rentType: Number(rentType) } : {}),
      ...((minPrice || maxPrice)
        ? {
            price: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
    };

    const orderBy =
      sort === 'hot'
        ? { views: 'desc' as const }
        : { createdAt: 'desc' as const };

    const [total, items] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        take: limit,
        skip,
        orderBy,
        include: { community: { select: communitySelect } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map((r) => ({
        ...serializeRoom(r),
        coverUrl: resolveUploadedFileUrl(r.cover),
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
