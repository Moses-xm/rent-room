import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePortalAuth } from '@/lib/portal-auth';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';

// POST /api/portal/account/verify-landlord
// 房东认证：填写必要信息后将 identity 升级为 2
export async function POST(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const phone    = typeof body.phone    === 'string' ? body.phone.trim()    : '';
    const email    = typeof body.email    === 'string' ? body.email.trim()    : '';
    const realname = typeof body.realname === 'string' ? body.realname.trim() : '';

    if (!phone)    return NextResponse.json({ success: false, message: '手机号不能为空' }, { status: 400 });
    if (!email)    return NextResponse.json({ success: false, message: '邮箱不能为空' }, { status: 400 });
    if (!realname) return NextResponse.json({ success: false, message: '真实姓名不能为空' }, { status: 400 });

    const updateData: Record<string, unknown> = {
      phone, email, realname,
      identity: 2,
    };

    if (body.nickname  != null) updateData.nickname  = String(body.nickname).trim() || null;
    if (body.gender    != null) updateData.gender    = Number(body.gender);
    if (body.province  != null) updateData.province  = String(body.province).trim()  || null;
    if (body.city      != null) updateData.city      = String(body.city).trim()      || null;
    if (body.district  != null) updateData.district  = String(body.district).trim()  || null;
    if (body.address   != null) updateData.address   = String(body.address).trim()   || null;
    if (body.avatar    != null) updateData.avatar    = normalizeUploadPathForStorage(String(body.avatar).trim());

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateData as Parameters<typeof prisma.user.update>[0]['data'],
      select: { id: true, username: true, identity: true, nickname: true, avatar: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, message: '认证失败，请重试' }, { status: 500 });
  }
}
