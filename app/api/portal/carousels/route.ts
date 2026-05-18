import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeCarousel } from '@/lib/carousel';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

export async function GET() {
  try {
    const items = await prisma.carousel.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: items.map((c) => ({
        ...serializeCarousel(c),
        imageUrl: resolveUploadedFileUrl(c.image),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
