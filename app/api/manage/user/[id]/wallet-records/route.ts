import { NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { serializeWalletRecord } from '@/lib/wallet-record';

// dateRange → 起始时间
function getStartDate(dateRange: string): Date | null {
  const now = new Date();
  switch (dateRange) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '4months':
      return new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    default:
      return null; // 全部
  }
}

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const userId = parseInt(id);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')));
    const dateRange = searchParams.get('dateRange') ?? 'month';

    const startDate = getStartDate(dateRange);
    const where = {
      userId,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
