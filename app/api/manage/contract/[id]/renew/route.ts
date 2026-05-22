import { NextRequest, NextResponse } from 'next/server';
import { requireManageAuth } from '@/lib/manage-auth';
import { renewContract, ServiceError } from '@/lib/contract-service';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const body = await req.json();
    const renewMonths = parseInt(body.renewMonths);
    if (!renewMonths || isNaN(renewMonths) || renewMonths <= 0) {
      return NextResponse.json({ success: false, message: '请输入有效的续租月数' }, { status: 400 });
    }

    // 管理端由管理员代为操作，以租客身份发起通知（initiatorId 传 0 表示管理员）
    // 实际通知发给房东，与原逻辑一致
    const data = await renewContract({ contractId, renewMonths, initiatorId: 0 });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof ServiceError) return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
