import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';

// GET /api/portal/account/info
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true, username: true, nickname: true, phone: true,
        email: true, gender: true, identity: true, avatar: true,
        wallet: true, payCode: true, province: true, city: true,
        district: true, address: true, createdAt: true,
      },
    });
    if (!user) return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    return NextResponse.json({ success: true, data: { ...user, createdAt: user.createdAt.toISOString() } });
  } catch {
    return NextResponse.json({ success: false, message: '获取资料失败' }, { status: 500 });
  }
}

// PUT /api/portal/account/info
export async function PUT(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json() as {
      nickname?: string; phone?: string; email?: string; gender?: number; avatar?: string; payCode?: string;
    };
    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        nickname: body.nickname ?? undefined,
        phone:    body.phone    ?? undefined,
        email:    body.email    ?? undefined,
        gender:   typeof body.gender === 'number' ? body.gender : undefined,
        avatar:   body.avatar   !== undefined ? body.avatar : undefined,
        payCode:  body.payCode  ?? undefined,
      },
      select: {
        id: true, username: true, nickname: true, phone: true,
        email: true, gender: true, identity: true, avatar: true,
        wallet: true, payCode: true, createdAt: true,
      },
    });
    return NextResponse.json({ success: true, data: { ...updated, createdAt: updated.createdAt.toISOString() } });
  } catch {
    return NextResponse.json({ success: false, message: '更新资料失败' }, { status: 500 });
  }
}
