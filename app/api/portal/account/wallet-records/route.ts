import { NextRequest, NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';
import { serializeWalletRecord } from '@/lib/wallet-record';

function getStartDate(dateRange: string): Date | null {
  const now = new Date();
  switch (dateRange) {
    case 'week':    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':   return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '4months': return new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    default:        return null;
  }
}

// GET /api/portal/account/wallet-records
export async function GET(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')));
    const dateRange = searchParams.get('dateRange') ?? 'month';

    const startDate = getStartDate(dateRange);
    const where = {
      userId: auth.user.id,
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
    };

    const [total, records] = await Promise.all([
      prisma.walletRecord.count({ where }),
      prisma.walletRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: records.map(serializeWalletRecord),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ success: false, message: '获取流水失败' }, { status: 500 });
  }
}
