import { NextRequest, NextResponse } from 'next/server';
import { serializeFacility } from '@/lib/facility';
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

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [total, items] = await Promise.all([
      prisma.facility.count({ where }),
      prisma.facility.findMany({ where, take: limit, skip, orderBy: { createdAt: 'desc' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: items.map(serializeFacility),
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
    const { name, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, message: '设施名称不能为空' }, { status: 400 });
    }
    if (!icon?.trim()) {
      return NextResponse.json({ success: false, message: '设施图标不能为空' }, { status: 400 });
    }

    const item = await prisma.facility.create({ data: { name: name.trim(), icon: icon.trim() } });
    return NextResponse.json({ success: true, data: serializeFacility(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
