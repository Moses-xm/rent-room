import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';

type Params = { params: Promise<{ id: string }> };

// GET /api/portal/account/rooms/[id] — 获取单个房源详情（用于编辑回填）
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const room = await prisma.room.findFirst({
      where: { id: roomId, publisherId: auth.user.id },
    });
    if (!room) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        name: room.name,
        cmyId: String(room.cmyId),
        rentType: String(room.rentType),
        minTenancy: String(room.minTenancy),
        bedroom: String(room.bedroom),
        parlour: String(room.parlour),
        bathroom: String(room.bathroom),
        roomType: room.roomType,
        direction: room.direction,
        price: String(room.price),
        area: String(room.area),
        pledge: String(room.pledge),
        pay: String(room.pay),
        floor: String(room.floor),
        floors: String(room.floors),
        level: String(room.level),
        lift: String(room.lift),
        description: room.description ?? '',
        cover: room.cover,
        images: (() => { try { return JSON.parse(room.images); } catch { return []; } })(),
        facilityIds: (() => { try { return JSON.parse(room.facilityIds); } catch { return []; } })(),
        isPublished: room.isPublished,
        isRented: room.isRented,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取失败' }, { status: 500 });
  }
}

// PUT /api/portal/account/rooms/[id] — 更新房源
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const existing = await prisma.room.findFirst({
      where: { id: roomId, publisherId: auth.user.id },
    });
    if (!existing) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    const body = await req.json();
    const { name, cmyId, rentType, minTenancy, bedroom, parlour, bathroom,
            roomType, direction, price, area, pledge, pay, floor, floors,
            level, lift, description, cover, images, facilityIds } = body;

    if (!name?.trim() || !cmyId || !rentType || !roomType || !direction || !cover?.trim())
      return NextResponse.json({ success: false, message: '缺少必填字段' }, { status: 400 });

    await prisma.room.update({
      where: { id: roomId },
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
      },
    });

    return NextResponse.json({ success: true, data: { id: roomId } });
  } catch {
    return NextResponse.json({ success: false, message: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/portal/account/rooms/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效 ID' }, { status: 400 });

  try {
    const existing = await prisma.room.findFirst({
      where: { id: roomId, publisherId: auth.user.id },
    });
    if (!existing) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });
    if (existing.isRented === 2)
      return NextResponse.json({ success: false, message: '已租出的房源不能删除' }, { status: 400 });

    await prisma.room.delete({ where: { id: roomId } });
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, message: '删除失败' }, { status: 500 });
  }
}
