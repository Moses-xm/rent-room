import { NextRequest, NextResponse } from 'next/server';
import { serializeContract, generatePeriods, addMonths } from '@/lib/contract';
import { requireManageAuth } from '@/lib/manage-auth';
import { prisma } from '@/lib/prisma';

const INCLUDE = {
  user:     { select: { id: true, username: true, nickname: true, avatar: true } },
  room:     { select: { id: true, name: true, roomCode: true, cover: true, price: true, pledge: true, pay: true, minTenancy: true } },
  landlord: { select: { id: true, username: true, nickname: true, avatar: true } },
} as const;

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const contract = await prisma.contract.findUnique({ where: { id: contractId }, include: INCLUDE });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });

    return NextResponse.json({ success: true, data: serializeContract(contract) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// 编辑合同：进行中状态只允许修改 onlineTime（结束时间和期限自动重算）
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: { select: { pay: true, name: true } } },
    });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });
    if (contract.status === 2) return NextResponse.json({ success: false, message: '已完成的合同不能修改' }, { status: 400 });
    if (contract.isCheckout) return NextResponse.json({ success: false, message: '已退房的合同不能修改开始时间' }, { status: 400 });

    const body = await req.json();
    const onlineTimeStr = body.onlineTime;
    if (!onlineTimeStr) return NextResponse.json({ success: false, message: '请提供新的开始时间' }, { status: 400 });

    const onlineTime = new Date(onlineTimeStr);
    if (isNaN(onlineTime.getTime())) return NextResponse.json({ success: false, message: '开始时间格式错误' }, { status: 400 });

    const payMonths = contract.room?.pay ?? 1;
    const offlineTime = addMonths(onlineTime, contract.tenancy);
    const allPeriods = generatePeriods(onlineTime, offlineTime, payMonths);

    // 保留已付期数数量，重新生成对应的期限（基于新的开始时间）
    const paidCount = (JSON.parse(contract.paidPeriod) as unknown[]).length;
    const paidPeriod   = JSON.stringify(allPeriods.slice(0, paidCount));
    const payingPeriod = JSON.stringify(allPeriods.slice(paidCount));

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: { onlineTime, offlineTime, paidPeriod, payingPeriod },
      include: INCLUDE,
    });

    return NextResponse.json({ success: true, data: serializeContract(updated) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// 取消隐藏：将 userDeleted 或 landlordDeleted 置回 false
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });

    const body = await req.json() as Record<string, unknown>;
    const side = body.side as string | undefined;

    if (side === 'tenant') {
      const updated = await prisma.contract.update({ where: { id: contractId }, data: { userDeleted: false }, include: INCLUDE });
      return NextResponse.json({ success: true, data: serializeContract(updated) });
    }
    if (side === 'landlord') {
      const updated = await prisma.contract.update({ where: { id: contractId }, data: { landlordDeleted: false }, include: INCLUDE });
      return NextResponse.json({ success: true, data: serializeContract(updated) });
    }

    return NextResponse.json({ success: false, message: '请指定 side: tenant 或 landlord' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// 删除合同：合同未退房（isCheckout=false）时不允许删除
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManageAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });

    if (!contract.isCheckout) {
      return NextResponse.json(
        { success: false, message: '合同尚未退房，不可删除。请先执行退房操作后再删除合同。' },
        { status: 400 },
      );
    }

    // 判断删除目标（tenant / landlord / both）
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const side = body.side as string | undefined; // 'tenant' | 'landlord' | undefined(both)

    if (side === 'tenant') {
      await prisma.contract.update({ where: { id: contractId }, data: { userDeleted: true } });
      return NextResponse.json({ success: true, data: null });
    }
    if (side === 'landlord') {
      await prisma.contract.update({ where: { id: contractId }, data: { landlordDeleted: true } });
      return NextResponse.json({ success: true, data: null });
    }

    // 双方均删除 → 硬删除（管理员操作）
    await prisma.contract.delete({ where: { id: contractId } });
    return NextResponse.json({ success: true, data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
