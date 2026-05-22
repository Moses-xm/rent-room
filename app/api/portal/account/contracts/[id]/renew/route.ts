import { NextRequest, NextResponse } from 'next/server';
import { requirePortalAuth } from '@/lib/portal-auth';
import { renewContract, ServiceError } from '@/lib/contract-service';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST /api/portal/account/contracts/[id]/renew — 续租（租客或房东均可发起）
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requirePortalAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    // 授权：必须是合同当事人（租客或房东）
    const contract = await prisma.contract.findUnique({ where: { id: contractId }, select: { userId: true, landlordId: true } });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
    const myId = auth.user.id;
    if (contract.userId !== myId && contract.landlordId !== myId) {
      return NextResponse.json({ success: false, message: '无权操作此合同' }, { status: 403 });
    }

    const body = await req.json();
    const renewMonths = parseInt(body.renewMonths);
    if (!renewMonths || isNaN(renewMonths) || renewMonths <= 0) {
      return NextResponse.json({ success: false, message: '请输入有效的续租月数' }, { status: 400 });
    }

    const data = await renewContract({ contractId, renewMonths, initiatorId: myId });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ServiceError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
