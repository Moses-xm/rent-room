import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { serializeAdmin } from '@/lib/admin';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [total, admins] = await Promise.all([
      prisma.admin.count({ where }),
      prisma.admin.findMany({
        where,
        take: limit,
        skip,
        orderBy: { created: 'desc' }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: admins.map(serializeAdmin),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { username, password, avatar, isActive } = body;
    const normalizedAvatar = normalizeUploadPathForStorage(avatar);
    
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '用户名和密码必填' }, { status: 400 });
    }

    const admin = await prisma.admin.create({
      data: {
        username,
        password,
        avatar: normalizedAvatar || null,
        isActive: isActive !== undefined ? isActive : true
      },
    });

    return NextResponse.json({ success: true, data: serializeAdmin(admin) });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: '用户名已存在' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
