import { NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';
import { serializeWalletRecord } from '@/lib/wallet-record';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await props.params;
    const userId = parseInt(id);

    const body = await req.json();
    const amount = Number(body.amount);
    const remark: string | null = body.remark?.trim() || null;

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: '充值金额必须大于 0' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 });
    }

    const { walletRecord, updatedUser } = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { wallet: { increment: amount } },
        select: { wallet: true },
      });
      const record = await tx.walletRecord.create({
        data: { userId, amount, type: 1, remark, balanceAfter: updated.wallet },
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
