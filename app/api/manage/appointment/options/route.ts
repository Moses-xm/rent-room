import { NextRequest, NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const rows = await prisma.appointment.findMany({
      select: {
        user:     { select: { id: true, username: true, nickname: true } },
        landlord: { select: { id: true, username: true, nickname: true } },
        room:     { select: { id: true, name: true, roomCode: true } },
      },
    });

    const usersMap    = new Map<number, { id: number; username: string; nickname: string | null }>();
    const landlordsMap = new Map<number, { id: number; username: string; nickname: string | null }>();
    const roomsMap    = new Map<number, { id: number; name: string; roomCode: string }>();

    for (const row of rows) {
      if (row.user     && !usersMap.has(row.user.id))         usersMap.set(row.user.id, row.user);
      if (row.landlord && !landlordsMap.has(row.landlord.id)) landlordsMap.set(row.landlord.id, row.landlord);
      if (row.room     && !roomsMap.has(row.room.id))         roomsMap.set(row.room.id, row.room);
    }

    return NextResponse.json({
      success: true,
      users:     Array.from(usersMap.values()),
      landlords: Array.from(landlordsMap.values()),
      rooms:     Array.from(roomsMap.values()),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
