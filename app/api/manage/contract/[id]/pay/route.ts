import { NextRequest, NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { payContract, ServiceError } from '@/lib/contract-service';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const body = await req.json();
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
