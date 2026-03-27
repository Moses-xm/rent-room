import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update Admin
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const adminId = parseInt(id);
    const body = await req.json();
    const { username, password, avatar, isActive } = body;

    const data: any = { 
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
    
    return NextResponse.json({ success: true, data: admin });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Delete Admin
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const adminId = parseInt(id);
    
    await prisma.admin.delete({ where: { id: adminId } });
    return NextResponse.json({ success: true, data: { id: adminId } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
