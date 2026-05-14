import { NextResponse } from 'next/server';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { serializeCarousel } from '@/lib/carousel';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { deleteUploadedAvatar } from '@/lib/uploaded-file';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const carouselId = parseInt(id);
    const body = await req.json();
    const { image, path, published, sortOrder } = body;

    if (!image?.trim()) {
      return NextResponse.json({ success: false, message: '轮播图图片不能为空' }, { status: 400 });
    }
    if (!path?.trim()) {
      return NextResponse.json({ success: false, message: '跳转路径不能为空' }, { status: 400 });
    }

    const existing = await prisma.carousel.findUnique({
      where: { id: carouselId },
      select: { image: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: '轮播图不存在' }, { status: 404 });
    }

    const normalizedImage = normalizeUploadPathForStorage(image) || image.trim();

    const item = await prisma.carousel.update({
      where: { id: carouselId },
      data: {
        image: normalizedImage,
        path: path.trim(),
        published: published === true,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    if (existing.image && existing.image !== normalizedImage) {
      try {
        await deleteUploadedAvatar(existing.image);
      } catch (cleanupError) {
        console.error('Failed to delete previous carousel image:', cleanupError);
      }
    }

    return NextResponse.json({ success: true, data: serializeCarousel(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const carouselId = parseInt(id);
    const body = await req.json();

    const existing = await prisma.carousel.findUnique({ where: { id: carouselId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '轮播图不存在' }, { status: 404 });
    }

    if (typeof body.published !== 'boolean') {
      return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 });
    }

    const item = await prisma.carousel.update({
      where: { id: carouselId },
      data: { published: body.published as boolean },
    });

    return NextResponse.json({ success: true, data: serializeCarousel(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const carouselId = parseInt(id);

    const existing = await prisma.carousel.findUnique({
      where: { id: carouselId },
      select: { image: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: '轮播图不存在' }, { status: 404 });
    }

    await prisma.carousel.delete({ where: { id: carouselId } });

    if (existing.image) {
      try {
        await deleteUploadedAvatar(existing.image);
      } catch (cleanupError) {
        console.error('Failed to delete carousel image on delete:', cleanupError);
      }
    }

    return NextResponse.json({ success: true, data: { id: carouselId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
