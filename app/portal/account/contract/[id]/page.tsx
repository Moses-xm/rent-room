'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard, Home,
  LogOut, RefreshCw, Trash2, AlertTriangle, CheckCircle, XCircle,
  User, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { MineShell } from '@/components/portal/MineShell';
import { RoomImage } from '@/components/portal/RoomImage';
import ConfirmDialog from '@/components/ConfirmDialog';
import PayModal from '@/components/contract/PayModal';
import RenewModal from '@/components/contract/RenewModal';
import CheckoutModal from '@/components/contract/CheckoutModal';
import { portalRequest } from '@/utils/portal-request';
import { fmtDate, fmtDateTime } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type ContractDetail = {
  id: number;
  userId: number;
  roomId: number;
  landlordId: number;
  tenancy: number;
  onlineTime: string;
  offlineTime: string;
  pledge: number;
  fee: number;
  paidPeriod: string;
  payingPeriod: string;
  renewTimes: number;
  renewMonths: number;
  status: number;
  isCheckout: boolean;
  checkoutTime: string | null;
  refund: boolean | null;
  createdAt: string;
  myRole: 'tenant' | 'landlord';
  user: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
  room: { id: number; name: string; roomCode: string; cover: string; price: number; pledge: number; pay: number; minTenancy: number } | null;
  landlord: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
};

type Period = { start: string; end: string };

/* ─── Info row ────────────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-xs text-text-muted shrink-0 w-24">{label}</span>
      <span className={`text-xs text-text text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

/* ─── Period list ─────────────────────────────────────────────────────────── */
function PeriodList({ periods, paid }: { periods: Period[]; paid: boolean }) {
  return (
    <div className="space-y-1.5">
      {periods.map((p, i) => (
        <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${paid ? 'bg-emerald-50 border border-emerald-100' : 'bg-sky-50 border border-sky-100'}`}>
          {paid
            ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            : <Clock size={13} className="text-sky-500 shrink-0" />}
          <span className="text-xs font-mono text-text">{fmtDate(p.start)} ~ {fmtDate(p.end)}</span>
          <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${paid ? 'text-emerald-600 bg-emerald-100' : 'text-sky-600 bg-sky-100'}`}>
            {paid ? '已付' : '待付'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Status Badges ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: number }) {
  return status === 1
    ? <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium"><Clock size={11} />进行中</span>
    : <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle2 size={11} />已完成</span>;
}

function CheckoutBadge({ isCheckout, refund }: { isCheckout: boolean; refund: boolean | null }) {
  if (!isCheckout) return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--color-surface-2)] text-text-muted rounded-full text-xs font-medium"><Home size={11} />居住中</span>;
  if (refund === true) return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle size={11} />合法退房（押金已退）</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium"><XCircle size={11} />提前退房（押金未退）</span>;
}

/* ─── Section card ────────────────────────────────────────────────────────── */
function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-text-muted">{icon}</span>
        <h2 className="text-sm font-semibold text-text">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function InfoRowSkeleton() {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[var(--color-border)] last:border-0">
      <div className="skeleton-shimmer h-3 w-16 rounded" />
      <div className="skeleton-shimmer h-3 w-24 rounded" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <MineShell title="合同详情">
      <div className="p-5 lg:p-8 space-y-5">

        {/* 面包屑 */}
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer w-7 h-7 rounded" />
          <div className="skeleton-shimmer h-3 w-12 rounded" />
          <div className="skeleton-shimmer h-3 w-4 rounded" />
          <div className="skeleton-shimmer h-3 w-28 rounded" />
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* 左栏 */}
          <div className="space-y-4">

            {/* 当事人 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
              <div className="skeleton-shimmer h-4 w-24 rounded mb-4" />
              <div className="grid sm:grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)]">
                    <div className="skeleton-shimmer w-9 h-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton-shimmer h-3 w-20 rounded" />
                      <div className="skeleton-shimmer h-2.5 w-14 rounded" />
                    </div>
                    <div className="skeleton-shimmer h-5 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* 租赁房源 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
              <div className="skeleton-shimmer h-4 w-20 rounded mb-4" />
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)]">
                <div className="skeleton-shimmer w-14 h-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-shimmer h-3 w-3/4 rounded" />
                  <div className="skeleton-shimmer h-2.5 w-1/3 rounded" />
                  <div className="skeleton-shimmer h-2.5 w-1/2 rounded" />
                </div>
              </div>
            </div>

            {/* 租期信息 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
              <div className="skeleton-shimmer h-4 w-20 rounded mb-4" />
              {[...Array(4)].map((_, i) => <InfoRowSkeleton key={i} />)}
            </div>

            {/* 费用信息 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
              <div className="skeleton-shimmer h-4 w-20 rounded mb-4" />
              {[...Array(5)].map((_, i) => <InfoRowSkeleton key={i} />)}
            </div>
          </div>

          {/* 右栏 */}
          <div className="space-y-4">

            {/* 合同操作 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
              <div className="skeleton-shimmer h-4 w-20 rounded mb-3" />
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton-shimmer h-10 w-full rounded-xl" />
                ))}
              </div>
            </div>

            {/* 状态摘要 */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
              <div className="skeleton-shimmer h-3 w-16 rounded mb-3" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="skeleton-shimmer h-3 w-14 rounded" />
                    <div className="skeleton-shimmer h-3 w-12 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MineShell>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [payModal,      setPayModal]      = useState(false);
  const [renewModal,    setRenewModal]    = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchContract = useCallback(async () => {
    try {
      const res = await portalRequest<{ success: boolean; data: ContractDetail }>(`/portal/account/contracts/${id}`);
      setContract(res.data);
    } catch {
      router.replace('/portal/account/contract');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchContract(); }, [fetchContract]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await portalRequest(`/portal/account/contracts/${id}`, { method: 'DELETE' });
      toast.success('合同已删除');
      router.replace('/portal/account/contract');
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  if (loading) return <DetailSkeleton />;
  if (!contract) return null;

  const paidPeriods   = JSON.parse(contract.paidPeriod)   as Period[];
  const payingPeriods = JSON.parse(contract.payingPeriod) as Period[];
  const isTenant   = contract.myRole === 'tenant';
  const isLandlord = contract.myRole === 'landlord';
  const canPay      = isTenant && contract.status === 1 && !contract.isCheckout && payingPeriods.length > 0;
  const canRenew    = contract.status === 1 && !contract.isCheckout;
  const canCheckout = contract.status === 1 && !contract.isCheckout;
  const canDelete   = contract.isCheckout;

  const roomName     = contract.room?.name ?? '—';
  const tenantUser   = contract.user;
  const landlordUser = contract.landlord;

  return (
    <MineShell title="合同详情">
      <div className="p-5 lg:p-8 space-y-5">

        {/* 面包屑 + 徽章 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-text-muted min-w-0">
            <button onClick={() => router.back()} className="w-7 h-7 grid place-items-center hover:text-text cursor-pointer shrink-0">
              <ArrowLeft size={16} />
            </button>
            <Link href="/portal/account/contract" className="hover:text-text transition-colors shrink-0">我的合同</Link>
            <span className="text-[var(--color-border)]">/</span>
            <span className="text-text font-medium truncate max-w-40">{roomName}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={contract.status} />
            <CheckoutBadge isCheckout={contract.isCheckout} refund={contract.refund} />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">

          {/* ── 左栏 ── */}
          <div className="space-y-4">

            {/* 当事人 */}
            <SectionCard icon={<User size={15} />} title="合同当事人">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { user: tenantUser,   role: '租客', highlight: isTenant },
                  { user: landlordUser, role: '房东', highlight: isLandlord },
                ].map(({ user, role, highlight }) => user && (
                  <div key={user.id} className={`flex items-center gap-3 p-3 rounded-xl border ${highlight ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)]' : 'border-[var(--color-border)]'}`}>
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[var(--color-surface)]">
                      <RoomImage src={user.avatar ?? undefined} alt={user.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{user.username}</p>
                      {user.nickname && <p className="text-xs text-text-muted truncate">{user.nickname}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs bg-[var(--color-surface-2)] text-text-muted px-2 py-0.5 rounded-full shrink-0">{role}</span>
                      {highlight && <span className="text-xs text-[var(--color-primary)] shrink-0">（您）</span>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* 房源信息 */}
            {contract.room && (
              <SectionCard icon={<Building2 size={15} />} title="租赁房源">
                <Link
                  href={`/portal/room/${contract.room.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-tint)] transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-[var(--color-surface)]">
                    <RoomImage src={contract.room.cover} alt={contract.room.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text group-hover:text-[var(--color-primary)] truncate transition-colors">{contract.room.name}</p>
                    <p className="text-xs text-text-muted font-mono mt-0.5">{contract.room.roomCode}</p>
                    <p className="text-xs text-text-muted mt-0.5">¥{contract.room.price}/月 · 押{contract.room.pledge}付{contract.room.pay} · 最短{contract.room.minTenancy}月</p>
                  </div>
                </Link>
              </SectionCard>
            )}

            {/* 租期信息 */}
            <SectionCard icon={<Calendar size={15} />} title="租期信息">
              <InfoRow label="开始时间" value={fmtDate(contract.onlineTime)} mono />
              <InfoRow label="结束时间" value={fmtDate(contract.offlineTime)} mono />
              <InfoRow label="租期" value={`${contract.tenancy} 个月`} />
              {contract.renewTimes > 0 && (
                <>
                  <InfoRow label="续租次数" value={`${contract.renewTimes} 次`} />
                  <InfoRow label="累计续租" value={`${contract.renewMonths} 个月`} />
                </>
              )}
              <InfoRow label="付款方式" value={`押 ${contract.room?.pledge ?? '?'} 付 ${contract.room?.pay ?? '?'}`} />
            </SectionCard>

            {/* 费用信息 */}
            <SectionCard icon={<CreditCard size={15} />} title="费用信息">
              <InfoRow label="押金" value={`¥${contract.pledge.toFixed(2)}`} mono />
              <InfoRow label="每期租金" value={`¥${contract.fee.toFixed(2)}`} mono />
              <InfoRow label="已付期数" value={`${paidPeriods.length} 期`} />
              <InfoRow label="待付期数" value={`${payingPeriods.length} 期`} />
              <InfoRow label="总期数" value={`${paidPeriods.length + payingPeriods.length} 期`} />
              <InfoRow label="创建时间" value={fmtDateTime(contract.createdAt)} mono />
            </SectionCard>

            {/* 退房信息 */}
            {contract.isCheckout && (
              <div className={`border rounded-2xl p-5 ${contract.refund ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <LogOut size={15} className={contract.refund ? 'text-emerald-600' : 'text-rose-600'} />
                  <h2 className="text-sm font-semibold text-text">退房信息</h2>
                </div>
                <InfoRow label="退房类型" value={contract.refund ? '合法退房' : '提前退房（非法）'} />
                <InfoRow label="退房时间" value={contract.checkoutTime ? fmtDateTime(contract.checkoutTime) : '—'} mono />
                <InfoRow label="押金处理" value={contract.refund ? `已退还 ¥${contract.pledge.toFixed(2)}` : '押金不予退还'} />
              </div>
            )}

            {/* 期限明细 */}
            {paidPeriods.length > 0 && (
              <SectionCard icon={<CheckCircle2 size={15} className="text-emerald-500" />} title={`已付租期（${paidPeriods.length} 期）`}>
                <PeriodList periods={paidPeriods} paid />
              </SectionCard>
            )}
            {payingPeriods.length > 0 && (
              <SectionCard icon={<Clock size={15} className="text-sky-500" />} title={`待付租期（${payingPeriods.length} 期）`}>
                <PeriodList periods={payingPeriods} paid={false} />
              </SectionCard>
            )}
            {payingPeriods.length === 0 && paidPeriods.length > 0 && (
              <p className="text-xs text-emerald-600 text-center py-2">所有租金均已结清 ✓</p>
            )}
          </div>

          {/* ── 右栏：操作面板 ── */}
          <div className="lg:sticky lg:top-5 space-y-4">

            {/* 合同操作 */}
            {(canPay || canRenew || canCheckout) && (
              <div className="bg-white border border-[var(--color-border)] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-text mb-3">合同操作</h2>
                <div className="space-y-2">
                  {canPay && (
                    <button
                      onClick={() => setPayModal(true)}
                      className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer"
                    >
                      <CreditCard size={14} />
                      交房租
                      {payingPeriods.length > 0 && (
                        <span className="ml-auto text-xs bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded">
                          下期 ¥{contract.fee.toFixed(0)}
                        </span>
                      )}
                    </button>
                  )}
                  {canRenew && (
                    <button
                      onClick={() => setRenewModal(true)}
                      className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-sky-200 bg-sky-50 text-sm text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      续租
                    </button>
                  )}
                  {canCheckout && (
                    <button
                      onClick={() => setCheckoutModal(true)}
                      className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-orange-200 bg-orange-50 text-sm text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all cursor-pointer"
                    >
                      <LogOut size={14} />
                      退房
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 删除操作 */}
            {canDelete && (
              <div className="bg-white border border-rose-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-rose-500" />
                  <h2 className="text-sm font-semibold text-rose-700">危险操作</h2>
                </div>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  删除合同
                </button>
                <p className="text-xs text-text-muted mt-2">删除后双方均无法再查看，不可撤销。</p>
              </div>
            )}

            {/* 状态摘要 */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-text">状态摘要</p>
              <div className="text-xs text-text-muted space-y-1.5">
                <div className="flex justify-between"><span>合同编号</span><span className="text-text font-mono">#{contract.id}</span></div>
                <div className="flex justify-between"><span>已付期数</span><span className="text-text">{paidPeriods.length} 期</span></div>
                <div className="flex justify-between"><span>待付期数</span><span className={payingPeriods.length > 0 ? 'text-sky-600' : 'text-emerald-600'}>{payingPeriods.length} 期</span></div>
                <div className="flex justify-between"><span>续租次数</span><span className="text-text">{contract.renewTimes} 次</span></div>
                <div className="flex justify-between"><span>我的角色</span><span className="text-[var(--color-primary)]">{isTenant ? '租客' : '房东'}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PayModal
        contract={payModal ? contract : null}
        onClose={() => setPayModal(false)}
        onSuccess={fetchContract}
        onPay={(contractId, payCode) =>
          portalRequest(`/portal/account/contracts/${contractId}/pay`, { method: 'POST', json: { payCode } })
        }
      />
      <RenewModal
        contract={renewModal ? contract : null}
        onClose={() => setRenewModal(false)}
        onSuccess={fetchContract}
        onRenew={(contractId, renewMonths) =>
          portalRequest(`/portal/account/contracts/${contractId}/renew`, { method: 'POST', json: { renewMonths } })
        }
      />
      <CheckoutModal
        contract={checkoutModal ? contract : null}
        onClose={() => setCheckoutModal(false)}
        onSuccess={fetchContract}
        onCheckout={(contractId) =>
          portalRequest(`/portal/account/contracts/${contractId}/checkout`, { method: 'POST', json: {} })
        }
      />
      <ConfirmDialog
        open={deleteConfirm}
        title="删除合同"
        description={`确定要删除房源「${roomName}」的合同记录吗？此操作不可撤销。`}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm(false)}
      />
    </MineShell>
  );
}
