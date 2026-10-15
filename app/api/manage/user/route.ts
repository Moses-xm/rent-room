import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { requireManageAuth } from '@/lib/manage-auth';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { serializeUser } from '@/lib/user';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const identity = searchParams.get('identity');
    const all = searchParams.get('all') === 'true';
    const skip = (page - 1) * limit;

    const where = {
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
              { nickname: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(identity ? { identity: Number(identity) } : {}),
    };

    if (all) {
      const users = await prisma.user.findMany({ where, orderBy: { username: 'asc' } });
      return NextResponse.json({ success: true, data: users.map(serializeUser) });
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, take: limit, skip, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: users.map(serializeUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    const { username, password, avatar, phone, nickname, realname, gender, identity, isActive, email, province, city, district, address, wallet, payCode } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: '用户名和密码必填' }, { status: 400 });
    }

    const normalizedAvatar = normalizeUploadPathForStorage(avatar);

    const user = await prisma.user.create({
      data: {
        username,
        password: await hashPassword(password),
        avatar: normalizedAvatar || null,
        phone: phone || null,
        nickname: nickname || null,
        realname: realname || null,
        gender: gender !== undefined ? Number(gender) : 3,
        identity: identity !== undefined ? Number(identity) : 1,
        isActive: isActive !== undefined ? isActive : true,
        email: email || null,
        province: province || null,
        city: city || null,
        district: district || null,
        address: address || null,
        wallet: wallet !== undefined ? Number(wallet) : 0,
        payCode: payCode || '000000',
      },
    });

    return NextResponse.json({ success: true, data: serializeUser(user) });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ success: false, message: '用户名已存在' }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
