import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';

type Params = { params: Promise<{ id: string }> };

// GET /api/portal/account/communities/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const cmyId = parseInt(id);
  if (isNaN(cmyId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const item = await prisma.community.findFirst({
      where: { id: cmyId, creatorId: auth.user.id },
      include: { _count: { select: { rooms: true } } },
    });
    if (!item) return NextResponse.json({ success: false, message: '小区不存在' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        name: item.name,
        province: item.province,
        city: item.city,
        district: item.district,
        street: item.street ?? '',
        streetNumber: item.streetNumber ?? '',
        subwayLine: item.subwayLine ?? '',
        lng: String(item.lng),
        lat: String(item.lat),
        cover: item.cover,
        roomCount: item._count.rooms,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取失败' }, { status: 500 });
  }
}

// PUT /api/portal/account/communities/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const cmyId = parseInt(id);
  if (isNaN(cmyId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const existing = await prisma.community.findFirst({
      where: { id: cmyId, creatorId: auth.user.id },
    });
    if (!existing) return NextResponse.json({ success: false, message: '小区不存在' }, { status: 404 });

    const body = await req.json();
    const { name, province, city, district, street, streetNumber, subwayLine, lng, lat, cover } = body;

    if (!name?.trim() || !province || !city || !district || !lng || !lat || !cover?.trim())
      return NextResponse.json({ success: false, message: '缺少必填字段' }, { status: 400 });

    await prisma.community.update({
      where: { id: cmyId },
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
      },
    });

    return NextResponse.json({ success: true, data: { id: cmyId } });
  } catch {
    return NextResponse.json({ success: false, message: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/portal/account/communities/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const cmyId = parseInt(id);
  if (isNaN(cmyId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const existing = await prisma.community.findFirst({
      where: { id: cmyId, creatorId: auth.user.id },
      include: { _count: { select: { rooms: true } } },
    });
    if (!existing) return NextResponse.json({ success: false, message: '小区不存在' }, { status: 404 });
    if (existing._count.rooms > 0)
      return NextResponse.json({ success: false, message: '该小区已有房源，无法删除' }, { status: 400 });

    await prisma.community.delete({ where: { id: cmyId } });
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
