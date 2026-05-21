import { NextRequest, NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';

// PUT /api/portal/account/password
export async function PUT(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json() as { newPassword?: string };
    const newPassword = String(body.newPassword ?? '').trim();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: '新密码不能少于 6 位' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { password: newPassword },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '修改密码失败' }, { status: 500 });
  }
}
