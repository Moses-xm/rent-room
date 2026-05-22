import { NextRequest, NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/portal-auth';
import { payContract, ServiceError } from '@/lib/contract-service';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST /api/portal/account/contracts/[id]/pay — 租客缴纳续期房租
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requirePortalAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    // 授权：只有租客本人可以缴租
    const contract = await prisma.contract.findUnique({ where: { id: contractId }, select: { userId: true } });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
    if (contract.userId !== auth.user.id) return NextResponse.json({ success: false, message: '只有租客本人可以缴租' }, { status: 403 });

    const body    = await req.json();
    const payCode = String(body.payCode || '');
    if (!payCode) return NextResponse.json({ success: false, message: '请输入支付密码' }, { status: 400 });

    const data = await payContract({ contractId, payCode });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ServiceError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
