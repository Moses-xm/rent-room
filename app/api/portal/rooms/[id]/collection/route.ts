import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth, verifyPortalToken } from '@/lib/portal-auth';

type Params = { params: Promise<{ id: string }> };

function getOptionalUserId(req: NextRequest): number | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const payload = verifyPortalToken(authHeader.slice(7).trim());
  return payload?.userId ?? null;
}

// GET /api/portal/rooms/[id]/collection — 查询是否已收藏（未登录返回 false）
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  const userId = getOptionalUserId(req);
  if (!userId) return NextResponse.json({ success: true, data: { collected: false, collectionId: null } });

  try {
    const record = await prisma.collection.findUnique({ where: { userId_roomId: { userId, roomId } } });
    return NextResponse.json({ success: true, data: { collected: !!record, collectionId: record?.id ?? null } });
  } catch {
    return NextResponse.json({ success: false, message: '查询失败' }, { status: 500 });
  }
}

// POST /api/portal/rooms/[id]/collection — 添加收藏
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true } });
    if (!room) return NextResponse.json({ success: false, message: '房源不存在' }, { status: 404 });

    const record = await prisma.collection.upsert({
      where: { userId_roomId: { userId: auth.user.id, roomId } },
      create: { userId: auth.user.id, roomId },
      update: {},
    });
    return NextResponse.json({ success: true, data: { collectionId: record.id } });
  } catch {
    return NextResponse.json({ success: false, message: '收藏失败' }, { status: 500 });
  }
}

// DELETE /api/portal/rooms/[id]/collection — 取消收藏
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const roomId = parseInt(id);
  if (isNaN(roomId)) return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });

  try {
    await prisma.collection.deleteMany({ where: { userId: auth.user.id, roomId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '取消收藏失败' }, { status: 500 });
  }
}
