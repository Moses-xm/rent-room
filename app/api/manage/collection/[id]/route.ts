import { NextResponse } from 'next/server';
import { serializeCollection } from '@/lib/collection';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const collectionId = parseInt(id);
    const body = await req.json();
    const userId = parseInt(body.userId);
    const roomId = parseInt(body.roomId);

    if (!userId || isNaN(userId)) {
      return NextResponse.json({ success: false, message: '请选择用户' }, { status: 400 });
    }
    if (!roomId || isNaN(roomId)) {
      return NextResponse.json({ success: false, message: '请选择房源' }, { status: 400 });
    }

    const existing = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '收藏记录不存在' }, { status: 404 });
    }

    const [userExists, roomExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.room.findUnique({ where: { id: roomId } }),
    ]);

    if (!userExists) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }
    if (!roomExists) {
      return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });
    }

    const conflict = await prisma.collection.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (conflict && conflict.id !== collectionId) {
      return NextResponse.json({ success: false, message: '该用户已收藏此房源' }, { status: 409 });
    }

    const item = await prisma.collection.update({
      where: { id: collectionId },
      data: { userId, roomId },
      include: {
        user: { select: { id: true, username: true, nickname: true, avatar: true } },
        room: { select: { id: true, name: true, roomCode: true, cover: true } },
      },
    });

    return NextResponse.json({ success: true, data: serializeCollection(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const collectionId = parseInt(id);

    const existing = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '收藏记录不存在' }, { status: 404 });
    }

    await prisma.collection.delete({ where: { id: collectionId } });
    return NextResponse.json({ success: true, data: { id: collectionId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
