import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { serializeUser } from '@/lib/user';
import { deleteUploadedAvatar } from '@/lib/uploaded-file';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const userId = parseInt(id);
    const body = await req.json();

    const {
      username,
      password,
      avatar,
      phone,
      nickname,
      realname,
      gender,
      identity,
      isActive,
      email,
      province,
      city,
      district,
      address,
      wallet,
      payCode,
    } = body;

    const normalizedAvatar = normalizeUploadPathForStorage(avatar);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!existingUser) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    type UserUpdateData = Prisma.userUpdateInput;
    const data: UserUpdateData = {
      username,
      avatar: normalizedAvatar || null,
      phone: phone || null,
      nickname: nickname || null,
      realname: realname || null,
      gender: gender !== undefined ? Number(gender) : undefined,
      identity: identity !== undefined ? Number(identity) : undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      email: email || null,
      province: province || null,
      city: city || null,
      district: district || null,
      address: address || null,
      wallet: wallet !== undefined ? Number(wallet) : undefined,
      payCode: payCode || undefined,
    };

    if (password) {
      data.password = password;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    const previousAvatar = existingUser.avatar?.trim() || '';
    const nextAvatar = normalizedAvatar;
    if (previousAvatar && previousAvatar !== nextAvatar) {
      try {
        await deleteUploadedAvatar(previousAvatar);
      } catch (cleanupError) {
        console.error('Failed to delete previous avatar:', cleanupError);
      }
    }

    return NextResponse.json({ success: true, data: serializeUser(user) });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: '用户名已存在' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const userId = parseInt(id);

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true, data: { id: userId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
