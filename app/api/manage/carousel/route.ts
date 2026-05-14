import { NextRequest, NextResponse } from 'next/server';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { serializeCarousel } from '@/lib/carousel';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get('sort'); // 'order' | 'createdAt'

    const items = await prisma.carousel.findMany({
      orderBy: sort === 'order'
        ? [{ sortOrder: 'asc' }, { id: 'asc' }]
        : { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: items.map(serializeCarousel),
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
    const { image, path, published, sortOrder } = body;

    if (!image?.trim()) {
      return NextResponse.json({ success: false, message: '轮播图图片不能为空' }, { status: 400 });
    }
    if (!path?.trim()) {
      return NextResponse.json({ success: false, message: '跳转路径不能为空' }, { status: 400 });
    }

    const item = await prisma.carousel.create({
      data: {
        image: normalizeUploadPathForStorage(image) || image.trim(),
        path: path.trim(),
        published: published === true,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    return NextResponse.json({ success: true, data: serializeCarousel(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
