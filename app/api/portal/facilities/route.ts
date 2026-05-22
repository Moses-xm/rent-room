import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/portal/facilities?all=true
export async function GET() {
  try {
    const data = await prisma.facility.findMany({ orderBy: { id: 'asc' } });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, message: '获取设施失败' }, { status: 500 });
  }
}
