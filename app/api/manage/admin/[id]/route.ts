import { NextResponse } from 'next/server';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { serializeAdmin } from '@/lib/admin';
import { requireManageAuth } from '@/lib/manage-auth';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { deleteUploadedAvatar } from '@/lib/uploaded-file';

// Update Admin
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const adminId = parseInt(id);
    const body = await req.json();
    const { username, password, avatar, isActive } = body;
    const normalizedAvatar = normalizeUploadPathForStorage(avatar);
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { avatar: true },
    });

    if (!existingAdmin) {
      return NextResponse.json({ success: false, message: '管理员不存在' }, { status: 404 });
    }

    const data: {
      username?: string;
      avatar?: string | null;
      isActive?: boolean;
      password?: string;
    } = {
      username,
      avatar: normalizedAvatar || null,
      isActive,
    };

    if (password) {
      data.password = await hashPassword(password);
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data,
    });

    const previousAvatar = existingAdmin.avatar?.trim() || '';
    const nextAvatar = normalizedAvatar;

    if (previousAvatar && previousAvatar !== nextAvatar) {
      try {
        await deleteUploadedAvatar(previousAvatar);
      } catch (cleanupError) {
        console.error('Failed to delete previous avatar:', cleanupError);
      }
    }

    return NextResponse.json({ success: true, data: serializeAdmin(admin) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// Delete Admin
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const adminId = parseInt(id);

    await prisma.admin.delete({ where: { id: adminId } });
    return NextResponse.json({ success: true, data: { id: adminId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
