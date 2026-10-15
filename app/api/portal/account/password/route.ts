import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword } from '@/lib/password';
import { requirePortalAuth } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';

// PUT /api/portal/account/password
export async function PUT(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json() as { currentPassword?: string; newPassword?: string };
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '').trim();

    if (!currentPassword) {
      return NextResponse.json({ success: false, message: '请输入当前密码' }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, message: '新密码不能少于 6 位' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { password: true },
    });
    // 用 400 而不是 401：401 会让前端当成登录过期直接登出
    if (!user || !(await verifyPassword(currentPassword, user.password))) {
      return NextResponse.json({ success: false, message: '当前密码错误' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { password: await hashPassword(newPassword) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: '修改密码失败' }, { status: 500 });
  }
}
