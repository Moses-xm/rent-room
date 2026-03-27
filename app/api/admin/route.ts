import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { created: 'desc' }
    });
    return NextResponse.json({ success: true, data: admins });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, avatar } = body;
    
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '用户名和密码必填' }, { status: 400 });
    }

    const admin = await prisma.admin.create({
      data: { username, password, avatar },
    });
    
    return NextResponse.json({ success: true, data: admin });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
