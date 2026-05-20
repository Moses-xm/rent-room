import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || '';
    if (!city) {
      return NextResponse.json({ success: false, message: '缺少城市参数' }, { status: 400 });
    }

    const communities = await prisma.community.findMany({
      where: { city },
      select: {
        id: true,
        name: true,
        district: true,
        lat: true,
        lng: true,
        _count: { select: { rooms: { where: { isPublished: 2 } } } },
      },
    });

    const communityData = communities
      .filter((c) => c.lat !== 0 || c.lng !== 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        district: c.district,
        lat: c.lat,
        lng: c.lng,
        roomCount: c._count.rooms,
      }));

    // Aggregate communities by district to compute center + room count
    const districtMap = new Map<
      string,
      { totalLat: number; totalLng: number; count: number; roomCount: number }
    >();
    for (const c of communityData) {
      const d = districtMap.get(c.district) ?? {
        totalLat: 0,
        totalLng: 0,
        count: 0,
        roomCount: 0,
      };
      d.totalLat += c.lat;
      d.totalLng += c.lng;
      d.count += 1;
      d.roomCount += c.roomCount;
      districtMap.set(c.district, d);
    }

    const districtData = Array.from(districtMap.entries())
      .filter(([, d]) => d.count > 0)
      .map(([name, d]) => ({
        name,
        lat: d.totalLat / d.count,
        lng: d.totalLng / d.count,
        roomCount: d.roomCount,
      }));

    return NextResponse.json({
      success: true,
      districts: districtData,
      communities: communityData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
