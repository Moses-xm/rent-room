import { NextRequest, NextResponse } from 'next/server';
import { isManagedUploadPath, normalizeUploadPathForStorage } from '@/lib/upload-path';
import { deleteUploadedPicture } from '@/lib/uploaded-file';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { serializeRoom } from '@/lib/room';

function parseImagePaths(raw: string): string[] {
  try { const arr = JSON.parse(raw || '[]'); return Array.isArray(arr) ? arr : []; }
  catch { return []; }
}

function cleanupFiles(paths: string[]) {
  const managed = paths.filter(isManagedUploadPath);
  if (managed.length) Promise.allSettled(managed.map(deleteUploadedPicture)).catch(() => {});
}

const communitySelect = {
  id: true, name: true, province: true, city: true,
  district: true, street: true, streetNumber: true, lng: true, lat: true,
};
const publisherSelect = {
  id: true, username: true, nickname: true, realname: true, avatar: true, phone: true,
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const roomId = parseInt(id);
    if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效的房源 ID' }, { status: 400 });

    const item = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        community: { select: communitySelect },
        publisher: { select: publisherSelect },
      },
    });

    if (!item) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    // Fetch facility details
    let facilities: { id: number; name: string; icon: string }[] = [];
    try {
      const ids: number[] = JSON.parse(item.facilityIds || '[]');
      if (ids.length > 0) {
        facilities = await prisma.facility.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, icon: true },
        });
      }
    } catch { /* ignore parse error */ }

    return NextResponse.json({
      success: true,
      data: { ...serializeRoom(item), facilities },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const roomId = parseInt(id);
    if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效的房源 ID' }, { status: 400 });

    const existing = await prisma.room.findUnique({ where: { id: roomId } });
    if (!existing) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    const body = await req.json();
    const {
      name, cmyId, rentType, minTenancy, bedroom, parlour, bathroom,
      roomType, direction, price, area, pledge, pay, floor, floors, level, lift,
      description, cover, images, facilityIds, publisherId,
      isPublished, publishTime, isRented,
    } = body;

    const normalizedCover = cover ? normalizeUploadPathForStorage(cover) : existing.cover;

    let normalizedImages = existing.images;
    if (Array.isArray(images)) {
      normalizedImages = JSON.stringify(images.map((p: string) => normalizeUploadPathForStorage(p)));
    }

    const item = await prisma.room.update({
      where: { id: roomId },
      data: {
        name: name?.trim() ?? existing.name,
        cmyId: cmyId != null ? Number(cmyId) : existing.cmyId,
        rentType: rentType != null ? Number(rentType) : existing.rentType,
        minTenancy: minTenancy != null ? Number(minTenancy) : existing.minTenancy,
        bedroom: bedroom != null ? Number(bedroom) : existing.bedroom,
        parlour: parlour != null ? Number(parlour) : existing.parlour,
        bathroom: bathroom != null ? Number(bathroom) : existing.bathroom,
        roomType: roomType ?? existing.roomType,
        direction: direction ?? existing.direction,
        price: price != null ? Number(price) : existing.price,
        area: area != null ? Number(area) : existing.area,
        pledge: pledge != null ? Number(pledge) : existing.pledge,
        pay: pay != null ? Number(pay) : existing.pay,
        floor: floor != null ? Number(floor) : existing.floor,
        floors: floors != null ? Number(floors) : existing.floors,
        level: level != null ? Number(level) : existing.level,
        lift: lift != null ? Number(lift) : existing.lift,
        description: description !== undefined ? (description || null) : existing.description,
        cover: normalizedCover,
        images: normalizedImages,
        facilityIds: Array.isArray(facilityIds) ? JSON.stringify(facilityIds) : existing.facilityIds,
        publisherId: publisherId != null ? Number(publisherId) : existing.publisherId,
        isPublished: isPublished != null ? Number(isPublished) : existing.isPublished,
        publishTime: publishTime !== undefined
          ? (publishTime ? new Date(publishTime) : null)
          : existing.publishTime,
        isRented: isRented != null ? Number(isRented) : existing.isRented,
      },
      include: {
        community: { select: communitySelect },
        publisher: { select: publisherSelect },
      },
    });

    // 清理被移除的孤儿文件（fire-and-forget）
    const orphans: string[] = [];
    if (normalizedCover !== existing.cover) orphans.push(existing.cover);
    const oldImagePaths = parseImagePaths(existing.images);
    const newImageSet = new Set(parseImagePaths(normalizedImages));
    for (const p of oldImagePaths) { if (!newImageSet.has(p)) orphans.push(p); }
    cleanupFiles(orphans);

    return NextResponse.json({ success: true, data: serializeRoom(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const roomId = parseInt(id);
    if (isNaN(roomId)) return NextResponse.json({ success: false, message: '无效的房源 ID' }, { status: 400 });

    const existing = await prisma.room.findUnique({ where: { id: roomId } });
    if (!existing) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    await prisma.room.delete({ where: { id: roomId } });

    // 删除房源时清理所有关联文件
    cleanupFiles([existing.cover, ...parseImagePaths(existing.images)]);

    return NextResponse.json({ success: true, data: { id: roomId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
