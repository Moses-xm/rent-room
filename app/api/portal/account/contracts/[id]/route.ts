import { NextRequest, NextResponse } from 'next/server';
import { serializeContract } from '@/lib/contract';
import { requirePortalAuth } from '@/lib/portal-auth';
import { prisma } from '@/lib/prisma';
import { resolveUploadedFileUrl } from '@/lib/upload-path';

const INCLUDE = {
  user:     { select: { id: true, username: true, nickname: true, avatar: true } },
  room:     { select: { id: true, name: true, roomCode: true, cover: true, price: true, pledge: true, pay: true, minTenancy: true } },
  landlord: { select: { id: true, username: true, nickname: true, avatar: true } },
} as const;

type Params = { params: Promise<{ id: string }> };

// GET /api/portal/account/contracts/[id] — 获取合同详情（租客或房东可访问）
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requirePortalAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const contract = await prisma.contract.findUnique({ where: { id: contractId }, include: INCLUDE });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });

    const myId = auth.user.id;
    if (contract.userId !== myId && contract.landlordId !== myId) {
      return NextResponse.json({ success: false, message: '无权访问此合同' }, { status: 403 });
    }


    const role = contract.userId === myId ? 'tenant' : 'landlord';
    const s = serializeContract(contract);
    return NextResponse.json({
      success: true,
      data: {
        ...s,
        myRole: role,
        room: s.room ? { ...s.room, cover: resolveUploadedFileUrl(s.room.cover) } : null,
        user: s.user ? { ...s.user, avatar: s.user.avatar ? resolveUploadedFileUrl(s.user.avatar) : null } : null,
        landlord: s.landlord ? { ...s.landlord, avatar: s.landlord.avatar ? resolveUploadedFileUrl(s.landlord.avatar) : null } : null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE /api/portal/account/contracts/[id] — 软删除合同（仅已退房后可删）
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const auth = await requirePortalAuth(req);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const contractId = parseInt(id);
    if (isNaN(contractId)) return NextResponse.json({ success: false, message: '无效的合同 ID' }, { status: 400 });

    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) return NextResponse.json({ success: false, message: '合同不存在' }, { status: 404 });

    const myId = auth.user.id;
    if (contract.userId !== myId && contract.landlordId !== myId) {
      return NextResponse.json({ success: false, message: '无权操作此合同' }, { status: 403 });
    }
    if (!contract.isCheckout) {
      return NextResponse.json({ success: false, message: '合同尚未退房，不可删除' }, { status: 400 });
    }

    if (contract.userId === myId) {
      await prisma.contract.update({ where: { id: contractId }, data: { userDeleted: true } });
    } else {
      await prisma.contract.update({ where: { id: contractId }, data: { landlordDeleted: true } });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
