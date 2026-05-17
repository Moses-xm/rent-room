'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronRight, Home, User, Building2, Calendar, CreditCard,
  RefreshCw, LogOut, Trash2, Pencil, CheckCircle2, Clock,
  AlertTriangle, CheckCircle, XCircle, EyeOff, Eye,
} from 'lucide-react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import { fmtDate, fmtDateTime } from '@/utils/format';
import ConfirmDialog from '@/components/ConfirmDialog';
import PayModal from '../pay-modal';
import RenewModal from '../renew-modal';
import CheckoutModal from '../checkout-modal';
import type { ContractItem } from '../page';

/* ─── Status helpers ────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: number }) {
  return status === 1 ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-body-sm font-medium">
      <Clock size={13} />
      进行中
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-body-sm font-medium">
      <CheckCircle2 size={13} />
      已完成
    </span>
  );
}

function CheckoutBadge({ isCheckout, refund }: { isCheckout: boolean; refund: boolean | null }) {
  if (!isCheckout) return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-body-sm font-medium">
      <Home size={13} />
      居住中
    </span>
  );
  if (refund === true) return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-body-sm font-medium">
      <CheckCircle size={13} />
      合法退房（押金已退）
    </span>
  );
  if (refund === false) return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-body-sm font-medium">
      <XCircle size={13} />
      提前退房（押金未退）
    </span>
  );
  return null;
}

/* ─── User mini card ─────────────────────────────────────────────────────────── */
function UserCard({ user, role }: { user: ContractItem['user']; role: string }) {
  if (!user) return null;
  return (
    <Link href={`/manage/user/${user.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary-tint/30 transition-all group">
      <div className="w-10 h-10 rounded-full grid place-items-center bg-primary-tint text-primary-dark text-sm font-semibold border border-border overflow-hidden shrink-0">
        {user.avatar
          ? <img src={resolveUploadedFileUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
          : (user.nickname || user.username).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-emphasis text-text group-hover:text-primary truncate transition-colors">{user.username}</p>
        {user.nickname && <p className="text-tiny text-text-muted truncate">{user.nickname}</p>}
      </div>
      <span className="text-tiny bg-surface border border-border text-text-muted px-2 py-0.5 rounded-full shrink-0">{role}</span>
    </Link>
  );
}

/* ─── Info row ───────────────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-body-sm text-text-muted shrink-0 w-28">{label}</span>
      <span className={`text-body-sm text-text text-right ${mono ? 'font-mono' : 'font-emphasis'}`}>{value}</span>
    </div>
  );
}

/* ─── Period list ────────────────────────────────────────────────────────────── */
function PeriodList({ periods, paid }: { periods: { start: string; end: string }[]; paid: boolean }) {
  return (
    <div className="space-y-1.5">
      {periods.map((p, i) => (
        <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${paid ? 'bg-emerald-50 border border-emerald-100' : 'bg-sky-50 border border-sky-100'}`}>
          {paid
            ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            : <Clock size={14} className="text-sky-500 shrink-0" />}
          <span className="text-body-sm font-mono text-text">
            {fmtDate(p.start)} ~ {fmtDate(p.end)}
          </span>
          <span className={`ml-auto text-tiny font-medium px-1.5 py-0.5 rounded shrink-0 ${paid ? 'text-emerald-600 bg-emerald-100' : 'text-sky-600 bg-sky-100'}`}>
            {paid ? '已付' : '待付'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [contract, setContract] = useState<ContractItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [payOpen,          setPayOpen]          = useState(false);
  const [renewOpen,        setRenewOpen]        = useState(false);
  const [checkoutOpen,     setCheckoutOpen]     = useState(false);
  const [deleteOpen,       setDeleteOpen]       = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [hideUserOpen,     setHideUserOpen]     = useState(false);
  const [hideLandlordOpen, setHideLandlordOpen] = useState(false);
  const [hidingUser,       setHidingUser]       = useState(false);
  const [hidingLandlord,   setHidingLandlord]   = useState(false);
  const [unhidingUser,     setUnhidingUser]     = useState(false);
  const [unhidingLandlord, setUnhidingLandlord] = useState(false);

  const load = async () => {
    const res = await request<{ success: boolean; data: ContractItem }>(`/manage/contract/${id}`);
    if (res.success) setContract(res.data);
    else toast.error('合同不存在或加载失败');
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => { setLoading(true); load(); };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await request(`/manage/contract/${id}`, { method: 'DELETE', json: {} });
      toast.success('合同删除成功');
      router.push('/manage/contract');
    } finally {
      setDeleting(false);
    }
  };

  const handleHideUser = async () => {
    if (hidingUser) return;
    setHidingUser(true);
    try {
      await request(`/manage/contract/${id}`, { method: 'DELETE', json: { side: 'tenant' } });
      toast.success('已对租客隐藏此合同');
      setHideUserOpen(false);
      refresh();
    } finally {
      setHidingUser(false);
    }
  };

  const handleHideLandlord = async () => {
    if (hidingLandlord) return;
    setHidingLandlord(true);
    try {
      await request(`/manage/contract/${id}`, { method: 'DELETE', json: { side: 'landlord' } });
      toast.success('已对房东隐藏此合同');
      setHideLandlordOpen(false);
      refresh();
    } finally {
      setHidingLandlord(false);
    }
  };

  const handleShowUser = async () => {
    if (unhidingUser) return;
    setUnhidingUser(true);
    try {
      await request(`/manage/contract/${id}`, { method: 'PATCH', json: { side: 'tenant' } });
      toast.success('已恢复对租客显示此合同');
      refresh();
    } finally {
      setUnhidingUser(false);
    }
  };

  const handleShowLandlord = async () => {
    if (unhidingLandlord) return;
    setUnhidingLandlord(true);
    try {
      await request(`/manage/contract/${id}`, { method: 'PATCH', json: { side: 'landlord' } });
      toast.success('已恢复对房东显示此合同');
      refresh();
    } finally {
      setUnhidingLandlord(false);
    }
  };

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 skeleton-shimmer rounded-sm" />
          <div className="w-44 h-4 skeleton-shimmer rounded" />
        </div>
        <div className="w-32 h-7 skeleton-shimmer rounded" />
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div className="w-32 h-5 skeleton-shimmer rounded mb-4" />
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between py-2.5 border-b border-border last:border-0">
                    <div className="w-24 h-4 skeleton-shimmer rounded" />
                    <div className="w-32 h-4 skeleton-shimmer rounded" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="w-full h-10 skeleton-shimmer rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  const paidPeriods   = JSON.parse(contract.paidPeriod)   as { start: string; end: string }[];
  const payingPeriods = JSON.parse(contract.payingPeriod) as { start: string; end: string }[];
  const canEdit         = contract.status === 1 && !contract.isCheckout;
  const canPay          = contract.status === 1 && !contract.isCheckout && payingPeriods.length > 0;
  const canRenew        = contract.status === 1 && !contract.isCheckout;
  const canCheckout     = contract.status === 1 && !contract.isCheckout;
  const canDelete       = contract.isCheckout;
  const canHideUser     = contract.isCheckout && !contract.userDeleted;
  const canHideLandlord = contract.isCheckout && !contract.landlordDeleted;
  const canShowUser     = contract.isCheckout && contract.userDeleted;
  const canShowLandlord = contract.isCheckout && contract.landlordDeleted;

  return (
    <div className="space-y-5">
      {/* ── 面包屑 ── */}
      <div className="flex items-center gap-1.5 text-body-sm min-w-0">
        <button
          onClick={() => router.back()}
          title="返回"
          className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <span className="text-text-disabled shrink-0">/</span>
        <Link href="/manage/contract" className="text-text-muted hover:text-text transition-colors shrink-0">
          合同管理
        </Link>
        <ChevronRight size={13} className="text-text-disabled shrink-0" />
        <span className="text-text font-emphasis truncate">合同详情</span>
      </div>

      {/* ── 标题 ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">合同详情</h1>
            <span className="text-body-sm text-text-muted font-mono">#{contract.id}</span>
          </div>
          <p className="text-body text-text-muted mt-1">创建于 {fmtDateTime(contract.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={contract.status} />
          <CheckoutBadge isCheckout={contract.isCheckout} refund={contract.refund} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">

        {/* ── Left: Detail cards ── */}
        <div className="space-y-4">

          {/* 当事人 */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-text-muted" />
              <h2 className="text-body font-semibold text-text">合同当事人</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <UserCard user={contract.user} role="租客" />
              <UserCard user={contract.landlord} role="房东" />
            </div>
          </div>

          {/* 房源 */}
          {contract.room && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-text-muted" />
                <h2 className="text-body font-semibold text-text">租赁房源</h2>
              </div>
              <Link href={`/manage/room/${contract.room.id}`} className="flex items-center gap-4 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary-tint/30 transition-all group">
                <div className="w-14 h-14 rounded-xl shrink-0 bg-surface border border-border overflow-hidden flex items-center justify-center">
                  {contract.room.cover
                    ? <img src={resolveUploadedFileUrl(contract.room.cover)} alt={contract.room.name} className="w-full h-full object-cover" />
                    : <Home size={20} className="text-text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-emphasis text-text group-hover:text-primary truncate transition-colors">{contract.room.name}</p>
                  <p className="text-body-sm text-text-muted font-mono mt-0.5">{contract.room.roomCode}</p>
                  <p className="text-body-sm text-text-muted mt-0.5">¥{contract.room.price.toFixed(0)}/月 · 押{contract.room.pledge}付{contract.room.pay}</p>
                </div>
              </Link>
            </div>
          )}

          {/* 租期信息 */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} className="text-text-muted" />
              <h2 className="text-body font-semibold text-text">租期信息</h2>
            </div>
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
          </div>

          {/* 费用信息 */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} className="text-text-muted" />
              <h2 className="text-body font-semibold text-text">费用信息</h2>
            </div>
            <InfoRow label="押金" value={`¥${contract.pledge.toFixed(2)}`} mono />
            <InfoRow label="每期租金" value={`¥${contract.fee.toFixed(2)}`} mono />
            <InfoRow label="已付期数" value={`${paidPeriods.length} 期`} />
            <InfoRow label="待付期数" value={`${payingPeriods.length} 期`} />
            <InfoRow label="总期数" value={`${paidPeriods.length + payingPeriods.length} 期`} />
          </div>

          {/* 退房信息 */}
          {contract.isCheckout && (
            <div className={`border rounded-2xl shadow-sm p-5 ${contract.refund ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <LogOut size={16} className={contract.refund ? 'text-emerald-600' : 'text-rose-600'} />
                <h2 className="text-body font-semibold text-text">退房信息</h2>
              </div>
              <InfoRow label="退房类型" value={
                contract.refund === true ? '合法退房' : '提前退房（非法）'
              } />
              <InfoRow label="退房时间" value={contract.checkoutTime ? fmtDateTime(contract.checkoutTime) : '—'} mono />
              <InfoRow label="押金处理" value={
                contract.refund === true
                  ? `已退还给租客 ¥${contract.pledge.toFixed(2)}`
                  : '押金不予退还（已归房东）'
              } />
            </div>
          )}

          {/* 已付期限 */}
          {paidPeriods.length > 0 && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <h2 className="text-body font-semibold text-text">已付租期 ({paidPeriods.length} 期)</h2>
              </div>
              <PeriodList periods={paidPeriods} paid />
            </div>
          )}

          {/* 待付期限 */}
          {payingPeriods.length > 0 && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-sky-500" />
                <h2 className="text-body font-semibold text-text">待付租期 ({payingPeriods.length} 期)</h2>
              </div>
              <PeriodList periods={payingPeriods} paid={false} />
            </div>
          )}
        </div>

        {/* ── Right: Operations panel ── */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* 操作 */}
          {(canEdit || canPay || canRenew || canCheckout) && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <h2 className="text-body font-semibold text-text mb-4">合同操作</h2>
              <div className="space-y-2">
                {canEdit && (
                  <Link
                    href={`/manage/contract/${id}/edit`}
                    className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-border text-body text-text hover:border-primary hover:bg-primary-tint hover:text-primary transition-all"
                  >
                    <Pencil size={15} />
                    修改开始时间
                  </Link>
                )}
                {canPay && (
                  <button
                    onClick={() => setPayOpen(true)}
                    className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-body text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer"
                  >
                    <CreditCard size={15} />
                    交房租
                    {payingPeriods.length > 0 && (
                      <span className="ml-auto text-tiny bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded">
                        下期 ¥{contract.fee.toFixed(0)}
                      </span>
                    )}
                  </button>
                )}
                {canRenew && (
                  <button
                    onClick={() => setRenewOpen(true)}
                    className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-sky-200 bg-sky-50 text-body text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer"
                  >
                    <RefreshCw size={15} />
                    续租
                  </button>
                )}
                {canCheckout && (
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    className="flex items-center gap-3 w-full h-10 px-4 rounded-xl border border-orange-200 bg-orange-50 text-body text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all cursor-pointer"
                  >
                    <LogOut size={15} />
                    退房
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 隐藏 / 删除操作（仅退房后可用） */}
          {(canHideUser || canHideLandlord || canShowUser || canShowLandlord || canDelete) && (
            <div className="bg-card border border-rose-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={15} className="text-rose-500" />
                <h2 className="text-body font-semibold text-rose-700">危险操作</h2>
              </div>
              <div className="space-y-2">
                {canHideUser && (
                  <button
                    onClick={() => setHideUserOpen(true)}
                    className="flex items-center gap-2 w-full h-10 px-4 rounded-xl border border-amber-200 bg-amber-50 text-body text-amber-700 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    <EyeOff size={15} />
                    为租客隐藏
                    <span className="ml-auto text-tiny text-amber-500">租客端不再显示</span>
                  </button>
                )}
                {canShowUser && (
                  <button
                    onClick={handleShowUser}
                    disabled={unhidingUser}
                    className="flex items-center gap-2 w-full h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-body text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye size={15} />
                    {unhidingUser ? '处理中...' : '取消对租客隐藏'}
                    <span className="ml-auto text-tiny text-emerald-500">恢复租客端显示</span>
                  </button>
                )}
                {canHideLandlord && (
                  <button
                    onClick={() => setHideLandlordOpen(true)}
                    className="flex items-center gap-2 w-full h-10 px-4 rounded-xl border border-amber-200 bg-amber-50 text-body text-amber-700 hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    <EyeOff size={15} />
                    为房东隐藏
                    <span className="ml-auto text-tiny text-amber-500">房东端不再显示</span>
                  </button>
                )}
                {canShowLandlord && (
                  <button
                    onClick={handleShowLandlord}
                    disabled={unhidingLandlord}
                    className="flex items-center gap-2 w-full h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 text-body text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Eye size={15} />
                    {unhidingLandlord ? '处理中...' : '取消对房东隐藏'}
                    <span className="ml-auto text-tiny text-emerald-500">恢复房东端显示</span>
                  </button>
                )}
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-xl border border-rose-300 bg-rose-50 text-body text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <Trash2 size={15} />
                  彻底删除合同
                </button>
              </div>
              <p className="text-caption text-text-muted mt-3">
                隐藏后仅对该端用户不可见，管理后台仍可查看。彻底删除后所有人均无法查看，操作不可撤销。
              </p>
            </div>
          )}

          {/* 合同元信息 */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
            <h2 className="text-body font-semibold text-text mb-3">元信息</h2>
            <div className="space-y-2 text-body-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">合同 ID</span>
                <span className="font-mono text-text">#{contract.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">创建时间</span>
                <span className="font-mono text-text">{fmtDate(contract.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">最后更新</span>
                <span className="font-mono text-text">{fmtDate(contract.updatedAt)}</span>
              </div>
              {(contract.userDeleted || contract.landlordDeleted) && (
                <div className="pt-1 mt-1 border-t border-border space-y-1.5">
                  {contract.userDeleted && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">租客可见</span>
                      <span className="inline-flex items-center gap-1 text-tiny bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                        <EyeOff size={10} />
                        已隐藏
                      </span>
                    </div>
                  )}
                  {contract.landlordDeleted && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">房东可见</span>
                      <span className="inline-flex items-center gap-1 text-tiny bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                        <EyeOff size={10} />
                        已隐藏
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 弹窗 ── */}
      <PayModal      contract={payOpen      ? contract : null} onClose={() => setPayOpen(false)}      onSuccess={refresh} />
      <RenewModal    contract={renewOpen    ? contract : null} onClose={() => setRenewOpen(false)}    onSuccess={refresh} />
      <CheckoutModal contract={checkoutOpen ? contract : null} onClose={() => setCheckoutOpen(false)} onSuccess={refresh} />

      <ConfirmDialog
        open={deleteOpen}
        title="确认彻底删除合同？"
        description={
          <>
            合同 <span className="font-semibold text-text">#{contract.id}</span> 将被永久删除，
            房东和租客均无法再查看此合同，此操作不可撤销。
          </>
        }
        confirmText="确认删除"
        cancelText="取消"
        loading={deleting}
        danger
        icon={<Trash2 size={32} />}
        onClose={() => { if (!deleting) setDeleteOpen(false); }}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={hideUserOpen}
        title="为租客隐藏此合同？"
        description={
          <>
            合同 <span className="font-semibold text-text">#{contract.id}</span>{' '}
            将在租客端隐藏，租客将无法再查看此合同。管理后台仍可正常查看。
          </>
        }
        confirmText="确认隐藏"
        cancelText="取消"
        loading={hidingUser}
        danger
        icon={<EyeOff size={32} />}
        onClose={() => { if (!hidingUser) setHideUserOpen(false); }}
        onConfirm={handleHideUser}
      />

      <ConfirmDialog
        open={hideLandlordOpen}
        title="为房东隐藏此合同？"
        description={
          <>
            合同 <span className="font-semibold text-text">#{contract.id}</span>{' '}
            将在房东端隐藏，房东将无法再查看此合同。管理后台仍可正常查看。
          </>
        }
        confirmText="确认隐藏"
        cancelText="取消"
        loading={hidingLandlord}
        danger
        icon={<EyeOff size={32} />}
        onClose={() => { if (!hidingLandlord) setHideLandlordOpen(false); }}
        onConfirm={handleHideLandlord}
      />
    </div>
  );
}
