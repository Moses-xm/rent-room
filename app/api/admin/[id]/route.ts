import { NextResponse } from 'next/server';
import { serializeAdmin } from '@/lib/admin';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

// Update Admin
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const adminId = parseInt(id);
    const body = await req.json();
    const { username, password, avatar, isActive } = body;

    const data: {
      username?: string;
      avatar?: string | null;
      isActive?: boolean;
      modified: Date;
      password?: string;
    } = {
      username, 
      avatar, 
      isActive,
      modified: new Date() 
    };
    
    // Only update password if provided
    if (password) {
      data.password = password;
    }

    const admin = await prisma.admin.update({
      where: { id: adminId },
      data,
    });
    
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
