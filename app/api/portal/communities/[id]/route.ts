import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/community';
import { serializeRoom } from '@/lib/room';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

const publisherSelect = {
  id: true,
  nickname: true,
  realname: true,
  username: true,
  avatar: true,
  phone: true,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const communityId = parseInt(id);
    if (isNaN(communityId)) {
      return NextResponse.json({ success: false, message: '无效的小区 ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return NextResponse.json({ success: false, message: '小区不存在' }, { status: 404 });
    }

    const roomWhere = { cmyId: communityId, isPublished: 2 };

    const [total, rooms] = await Promise.all([
      prisma.room.count({ where: roomWhere }),
      prisma.room.findMany({
        where: roomWhere,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          community: {
            select: {
              id: true, name: true, province: true, city: true,
              district: true, street: true, streetNumber: true, lng: true, lat: true,
            },
          },
          publisher: { select: publisherSelect },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      community: {
        ...serializeCommunity(community),
        coverUrl: resolveUploadedFileUrl(community.cover),
      },
      data: rooms.map((r) => ({
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
