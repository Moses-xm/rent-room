import { NextResponse } from 'next/server';
import { serializeFacility } from '@/lib/facility';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const facilityId = parseInt(id);
    const body = await req.json();
    const { name, icon } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, message: '设施名称不能为空' }, { status: 400 });
    }
    if (!icon?.trim()) {
      return NextResponse.json({ success: false, message: '设施图标不能为空' }, { status: 400 });
    }

    const existing = await prisma.facility.findUnique({ where: { id: facilityId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: '设施不存在' }, { status: 404 });
    }

    const item = await prisma.facility.update({
      where: { id: facilityId },
      data: { name: name.trim(), icon: icon.trim() },
    });

    return NextResponse.json({ success: true, data: serializeFacility(item) });
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
    const facilityId = parseInt(id);

    await prisma.facility.delete({ where: { id: facilityId } });
    return NextResponse.json({ success: true, data: { id: facilityId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
