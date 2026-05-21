import { NextRequest, NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';
import { serializeWalletRecord } from '@/lib/wallet-record';

// POST /api/portal/account/recharge
export async function POST(req: NextRequest) {
  const auth = await requirePortalAuth(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const remark: string | null = body.remark?.trim() || null;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: '充值金额必须大于 0' }, { status: 400 });
    }

    const { walletRecord, updatedUser } = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: auth.user.id },
        data: { wallet: { increment: amount } },
        select: { wallet: true },
      });
      const record = await tx.walletRecord.create({
        data: { userId: auth.user.id, amount, type: 1, remark, balanceAfter: updated.wallet },
      });
      return { walletRecord: record, updatedUser: updated };
    });

    return NextResponse.json({
      success: true,
      data: {
        walletRecord: serializeWalletRecord(walletRecord),
        newBalance: updatedUser.wallet,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: '充值失败' }, { status: 500 });
  }
}
