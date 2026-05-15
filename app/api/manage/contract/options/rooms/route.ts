import { NextRequest, NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    // 只返回已发布且未租出的房源（用于新建合同时选择）
    const rooms = await prisma.room.findMany({
      where: { isPublished: 2, isRented: 1 },
      select: {
        id: true,
        name: true,
        roomCode: true,
        cover: true,
        price: true,
        pledge: true,
        pay: true,
        minTenancy: true,
        publisher: { select: { id: true, username: true, nickname: true, avatar: true } },
        community: { select: { name: true, district: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: rooms.map((r) => ({
        ...r,
        cover: resolveUploadedFileUrl(r.cover),
        publisher: {
          ...r.publisher,
          avatar: r.publisher.avatar ? resolveUploadedFileUrl(r.publisher.avatar) : null,
        },
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
