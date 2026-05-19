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
    const bedrooms = searchParams.get('bedrooms') || '';
    const roomType = searchParams.get('roomType') || '';
    const direction = searchParams.get('direction') || '';
    const nearSubway = searchParams.get('nearSubway') === 'true';
    const hasElevator = searchParams.get('hasElevator') === 'true';
    const skip = (page - 1) * limit;

    const bedroomMap: Record<string, object> = {
      '一室': { equals: 1 },
      '二室': { equals: 2 },
      '三室': { equals: 3 },
      '四室': { equals: 4 },
      '五室及以上': { gte: 5 },
    };

    const communityFilter = {
      ...(district ? { district } : {}),
      ...(subwayLine ? { subwayLine: { contains: subwayLine } } : {}),
      ...(nearSubway ? { subwayLine: { not: null, notIn: [''] } } : {}),
    };

    const where = {
      isPublished: 2,
      ...(Object.keys(communityFilter).length > 0 ? { community: communityFilter } : {}),
      ...(rentType ? { rentType: Number(rentType) } : {}),
      ...(roomType ? { roomType } : {}),
      ...(direction ? { direction } : {}),
      ...(hasElevator ? { lift: 2 } : {}),
      ...(bedrooms && bedroomMap[bedrooms] ? { bedroom: bedroomMap[bedrooms] } : {}),
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

    const publisherSelect = {
      id: true,
      nickname: true,
      realname: true,
      username: true,
      avatar: true,
      phone: true,
    };

    const [total, items] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        take: limit,
        skip,
        orderBy,
        include: {
          community: { select: communitySelect },
          publisher: { select: publisherSelect },
        },
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
