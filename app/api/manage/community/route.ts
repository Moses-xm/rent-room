import { NextRequest, NextResponse } from 'next/server';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/community';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const province = searchParams.get('province') || '';
    const city = searchParams.get('city') || '';
    const district = searchParams.get('district') || '';
    const all = searchParams.get('all') === 'true';
    const skip = (page - 1) * limit;

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { city: { contains: search, mode: 'insensitive' as const } },
              { district: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(province ? { province } : {}),
      ...(city ? { city } : {}),
      ...(district ? { district } : {}),
    };

    if (all) {
      const items = await prisma.community.findMany({
        where,
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ success: true, data: items.map(serializeCommunity) });
    }

    const [total, items] = await Promise.all([
      prisma.community.count({ where }),
      prisma.community.findMany({ where, take: limit, skip, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeCommunity),
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
    const { name, province, city, district, street, streetNumber, subwayLine, lng, lat, cover } = body;

    if (!name || !province || !city || !district || lng == null || lat == null || !cover) {
      return NextResponse.json({ success: false, message: '小区名称、省市区、经纬度、封面图片均为必填项' }, { status: 400 });
    }

    const normalizedCover = normalizeUploadPathForStorage(cover);

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
        cover: normalizedCover,
      },
    });

    return NextResponse.json({ success: true, data: serializeCommunity(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
