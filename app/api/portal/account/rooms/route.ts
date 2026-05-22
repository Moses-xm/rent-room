import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';

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

// POST /api/portal/account/rooms — 房东创建房源
export async function POST(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    // 验证是否为房东
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { identity: true },
    });
    if (!user || user.identity !== 2) {
      return NextResponse.json({ success: false, message: '需要房东身份才能发布房源' }, { status: 403 });
    }

    const body = await req.json();
    const { name, cmyId, rentType, minTenancy, bedroom, parlour, bathroom,
            roomType, direction, price, area, pledge, pay, floor, floors,
            level, lift, description, cover, images, facilityIds } = body;

    if (!name?.trim() || !cmyId || !rentType || !roomType || !direction || !cover?.trim())
      return NextResponse.json({ success: false, message: '缺少必填字段' }, { status: 400 });

    const roomCode = `R${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const item = await prisma.room.create({
      data: {
        name: name.trim(),
        cmyId: Number(cmyId),
        rentType: Number(rentType),
        minTenancy: Number(minTenancy) || 1,
        bedroom: Number(bedroom) || 1,
        parlour: Number(parlour) || 1,
        bathroom: Number(bathroom) || 1,
        roomType,
        direction,
        price: Number(price),
        area: Number(area),
        pledge: Number(pledge) || 1,
        pay: Number(pay) || 1,
        floor: Number(floor) || 1,
        floors: Number(floors) || 1,
        level: Number(level) || 2,
        lift: Number(lift) || 1,
        description: description || null,
        cover: normalizeUploadPathForStorage(cover.trim()),
        images: Array.isArray(images) && images.length > 0
          ? JSON.stringify(images.map((p: string) => normalizeUploadPathForStorage(p)))
          : '[]',
        facilityIds: Array.isArray(facilityIds) ? JSON.stringify(facilityIds) : '[]',
        publisherId: auth.user.id,
        isPublished: 1,
        roomCode,
        isRented: 1,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, data: { id: item.id } });
  } catch {
    return NextResponse.json({ success: false, message: '创建房源失败' }, { status: 500 });
  }
}
