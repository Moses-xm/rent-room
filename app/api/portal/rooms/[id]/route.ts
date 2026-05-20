import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeRoom } from '@/lib/room';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) {
    return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });
  }
  await prisma.room.update({ where: { id: roomId }, data: { views: { increment: 1 } } }).catch(() => {});
  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = parseInt(id);
    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: { id: roomId, isPublished: 2 },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            province: true,
            city: true,
            district: true,
            street: true,
            streetNumber: true,
            subwayLine: true,
            lng: true,
            lat: true,
          },
        },
        publisher: {
          select: {
            id: true,
            username: true,
            nickname: true,
            realname: true,
            avatar: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });
    }

    // 解析设施 ID，批量查询设施名称
    let facilityIds: number[] = [];
    try {
      const parsed = JSON.parse(room.facilityIds || '[]');
      if (Array.isArray(parsed)) facilityIds = parsed.map(Number).filter(Boolean);
    } catch {}

    const facilities =
      facilityIds.length > 0
        ? await prisma.facility.findMany({
            where: { id: { in: facilityIds } },
            select: { id: true, name: true, icon: true },
          })
        : [];

    // 解析多图 URL
    let imageList: string[] = [];
    try {
      const parsed = JSON.parse(room.images || '[]');
      if (Array.isArray(parsed)) imageList = parsed;
    } catch {}

    const serialized = serializeRoom(room);

    return NextResponse.json({
      success: true,
      data: {
        ...serialized,
        coverUrl: resolveUploadedFileUrl(room.cover),
        imageUrls: imageList.map(resolveUploadedFileUrl),
        publisher: serialized.publisher
          ? {
              ...serialized.publisher,
              avatarUrl: resolveUploadedFileUrl(serialized.publisher.avatar),
            }
          : null,
        facilities,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
