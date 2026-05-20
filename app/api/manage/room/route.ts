import { NextRequest, NextResponse } from 'next/server';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { serializeRoom } from '@/lib/room';

const communitySelect = {
  id: true, name: true, province: true, city: true,
  district: true, street: true, streetNumber: true, subwayLine: true, lng: true, lat: true,
};
const publisherSelect = {
  id: true, username: true, nickname: true, realname: true, avatar: true, phone: true,
};

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isPublished = searchParams.get('isPublished');
    const isRented = searchParams.get('isRented');
    const publisherId = searchParams.get('publisherId');
    const rentType = searchParams.get('rentType');
    const roomType = searchParams.get('roomType');
    const direction = searchParams.get('direction');
    const province = searchParams.get('province');
    const city = searchParams.get('city');
    const district = searchParams.get('district');
    const skip = (page - 1) * limit;

    const communityWhere = {
      ...(province ? { province } : {}),
      ...(city ? { city } : {}),
      ...(district ? { district } : {}),
    };

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { roomCode: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(isPublished ? { isPublished: Number(isPublished) } : {}),
      ...(isRented ? { isRented: Number(isRented) } : {}),
      ...(publisherId ? { publisherId: Number(publisherId) } : {}),
      ...(rentType ? { rentType: Number(rentType) } : {}),
      ...(roomType ? { roomType } : {}),
      ...(direction ? { direction } : {}),
      ...(Object.keys(communityWhere).length > 0 ? { community: communityWhere } : {}),
    };

    const [total, items] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          community: { select: communitySelect },
          publisher: { select: publisherSelect },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeRoom),
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
    const {
      name, cmyId, rentType, minTenancy, bedroom, parlour, bathroom,
      roomType, direction, price, area, pledge, pay, floor, floors, level, lift,
      description, cover, images, facilityIds, publisherId,
      isPublished, publishTime, isRented,
    } = body;

    if (!name || !cmyId || !rentType || !roomType || !direction || !publisherId ||
        bedroom == null || parlour == null || bathroom == null ||
        price == null || area == null || pledge == null || pay == null ||
        floor == null || floors == null || level == null || !cover) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 },
      );
    }

    const roomCode = `R${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const normalizedCover = normalizeUploadPathForStorage(cover);

    let normalizedImages = '[]';
    if (Array.isArray(images) && images.length > 0) {
      normalizedImages = JSON.stringify(images.map((p: string) => normalizeUploadPathForStorage(p)));
    }

    const item = await prisma.room.create({
      data: {
        name: name.trim(),
        cmyId: Number(cmyId),
        rentType: Number(rentType),
        minTenancy: Number(minTenancy) || 1,
        bedroom: Number(bedroom),
        parlour: Number(parlour),
        bathroom: Number(bathroom),
        roomType,
        direction,
        price: Number(price),
        area: Number(area),
        pledge: Number(pledge),
        pay: Number(pay),
        floor: Number(floor),
        floors: Number(floors),
        level: Number(level),
        lift: Number(lift) || 1,
        description: description || null,
        cover: normalizedCover,
        images: normalizedImages,
        facilityIds: Array.isArray(facilityIds) ? JSON.stringify(facilityIds) : (facilityIds || '[]'),
        publisherId: Number(publisherId),
        isPublished: Number(isPublished) || 1,
        publishTime: publishTime ? new Date(publishTime) : null,
        roomCode,
        isRented: Number(isRented) || 1,
      },
      include: {
        community: { select: communitySelect },
        publisher: { select: publisherSelect },
      },
    });

    return NextResponse.json({ success: true, data: serializeRoom(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
