import { NextRequest, NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const rows = await prisma.notification.findMany({
      select: {
        user: { select: { id: true, username: true, nickname: true } },
      },
    });

    const usersMap = new Map<number, { id: number; username: string; nickname: string | null }>();
    for (const row of rows) {
      if (row.user && !usersMap.has(row.user.id)) usersMap.set(row.user.id, row.user);
    }

    return NextResponse.json({
      success: true,
      users: Array.from(usersMap.values()),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
