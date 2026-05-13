import { NextResponse } from 'next/server';
import { normalizeUploadPathForStorage } from '@/lib/upload-path';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { serializeCommunity } from '@/lib/community';
import { deleteUploadedAvatar } from '@/lib/uploaded-file';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const item = await prisma.community.findUnique({ where: { id: parseInt(id) } });
    if (!item) {
      return NextResponse.json({ success: false, message: '小区不存在' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: serializeCommunity(item) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const communityId = parseInt(id);
    const body = await req.json();
    const { name, province, city, district, street, streetNumber, subwayLine, lng, lat, cover } = body;

    if (!name || !province || !city || !district || lng == null || lat == null || !cover) {
      return NextResponse.json({ success: false, message: '小区名称、省市区、经纬度、封面图片均为必填项' }, { status: 400 });
    }

    const existing = await prisma.community.findUnique({
      where: { id: communityId },
      select: { cover: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: '小区不存在' }, { status: 404 });
    }

    const normalizedCover = normalizeUploadPathForStorage(cover);

    const item = await prisma.community.update({
      where: { id: communityId },
      data: {
        name: name.trim(),
        province,
        city,
        district,
        street: street || null,
        streetNumber: streetNumber || null,
        subwayLine: subwayLine || null,
        lng: Number(lng),
        lat: Number(lat),
        cover: normalizedCover,
      },
    });

    const prevCover = existing.cover?.trim() || '';
    if (prevCover && prevCover !== normalizedCover) {
      try { await deleteUploadedAvatar(prevCover); } catch (e) { console.error(e); }
    }

    return NextResponse.json({ success: true, data: serializeCommunity(item) });
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
    const communityId = parseInt(id);
    await prisma.community.delete({ where: { id: communityId } });
    return NextResponse.json({ success: true, data: { id: communityId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
