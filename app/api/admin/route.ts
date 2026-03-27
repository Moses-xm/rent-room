import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [total, admins] = await Promise.all([
      prisma.admin.count({ where }),
      prisma.admin.findMany({
        where,
        take: limit,
        skip,
        orderBy: { created: 'desc' }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      data: admins,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, avatar, isActive } = body;
    
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '用户名和密码必填' }, { status: 400 });
    }

    const admin = await prisma.admin.create({
      data: { 
        username, 
        password, 
        avatar,
        isActive: isActive !== undefined ? isActive : true
      },
    });
    
    return NextResponse.json({ success: true, data: admin });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
