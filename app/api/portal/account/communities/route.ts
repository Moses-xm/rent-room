import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';

// GET /api/portal/account/communities — 我创建的小区列表
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip  = (page - 1) * limit;

  try {
    const where = { creatorId: auth.user.id };
    const [total, data] = await Promise.all([
      prisma.community.count({ where }),
      prisma.community.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { _count: { select: { rooms: true } } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: data.map(c => ({
        id: c.id,
        name: c.name,
        province: c.province,
        city: c.city,
        district: c.district,
        street: c.street,
        cover: c.cover,
        roomCount: c._count.rooms,
        createdAt: c.createdAt.toISOString(),
      })),
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取失败' }, { status: 500 });
  }
}

// POST /api/portal/account/communities — 创建小区
export async function POST(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { identity: true },
    });
    if (!user || user.identity !== 2) {
      return NextResponse.json({ success: false, message: '需要房东身份才能创建小区' }, { status: 403 });
    }

    const body = await req.json();
    const { name, province, city, district, street, streetNumber, subwayLine, lng, lat, cover } = body;

    if (!name?.trim() || !province || !city || !district || !lng || !lat || !cover?.trim())
      return NextResponse.json({ success: false, message: '缺少必填字段' }, { status: 400 });

    const item = await prisma.community.create({
      data: {
        name: name.trim(),
        province,
        city,
        district,
        street: street || null,
        streetNumber: streetNumber || null,
        subwayLine: subwayLine || null,
        lng: Number(lng),
        lat: Number(lat),
        cover: normalizeUploadPathForStorage(cover.trim()),
        creatorId: auth.user.id,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, data: { id: item.id } });
  } catch {
    return NextResponse.json({ success: false, message: '创建失败' }, { status: 500 });
  }
}
