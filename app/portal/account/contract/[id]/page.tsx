'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, CreditCard, Home,
  LogOut, RefreshCw, Trash2, AlertTriangle, CheckCircle, XCircle,
  Info, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { MineShell } from '@/components/portal/MineShell';
import { RoomImage } from '@/components/portal/RoomImage';
import { Modal } from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
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

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function detectCheckoutKind(contract: ContractDetail): 'legal-expired' | 'legal-early' | 'illegal' {
  const payingPeriods = JSON.parse(contract.payingPeriod) as unknown[];
  if (payingPeriods.length > 0) return 'illegal';
  return new Date() >= new Date(contract.offlineTime) ? 'legal-expired' : 'legal-early';
}

/* ─── Info row ────────────────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-border)] last:border-0">
      <span className="text-sm text-text-muted shrink-0 w-24">{label}</span>
      <span className={`text-sm text-text text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
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
            ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            : <Clock size={14} className="text-sky-500 shrink-0" />}
          <span className="text-sm font-mono text-text">{fmtDate(p.start)} ~ {fmtDate(p.end)}</span>
          <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${paid ? 'text-emerald-600 bg-emerald-100' : 'text-sky-600 bg-sky-100'}`}>
            {paid ? '已付' : '待付'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Pay Modal (交房租) ───────────────────────────────────────────────────── */
function PayModal({ contract, onClose, onSuccess }: { contract: ContractDetail | null; onClose: () => void; onSuccess: (updated: ContractDetail) => void }) {
  const [payCode, setPayCode] = useState('');
  const [loading, setLoading] = useState(false);

  const payingPeriods = contract ? (JSON.parse(contract.payingPeriod) as Period[]) : [];
  const nextPeriod = payingPeriods[0];

  function handleClose() { setPayCode(''); onClose(); }

  async function handleSubmit() {
    if (!payCode || payCode.length !== 6) { toast.error('请输入 6 位支付密码'); return; }
    if (!nextPeriod) { toast.error('所有租期均已缴清'); return; }
    setLoading(true);
    try {
      const res = await portalRequest<{ success: boolean; data: ContractDetail }>(
        `/portal/account/contracts/${contract!.id}/pay`,
        { method: 'POST', json: { payCode } },
      );
      toast.success('缴租成功');
      handleClose();
      onSuccess(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!contract} onClose={handleClose}>
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-white rounded-2xl shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 grid place-items-center">
              <CreditCard size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-text">交房租</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 grid place-items-center text-text-muted hover:text-text cursor-pointer"><X size={15} /></button>
        </div>
        <div className="p-6 space-y-5">
          {nextPeriod ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-700 mb-2">下一期房租详情</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2"><p className="text-text-muted mb-0.5 text-xs">房源</p><p className="font-medium text-text">{contract?.room?.name ?? '—'}</p></div>
                <div><p className="text-text-muted mb-0.5 text-xs">缴租时段</p><p className="font-mono text-text text-xs">{fmtDate(nextPeriod.start)} ~ {fmtDate(nextPeriod.end)}</p></div>
                <div><p className="text-text-muted mb-0.5 text-xs">应付金额</p><p className="font-mono text-base font-semibold text-emerald-700">¥{contract?.fee.toFixed(2)}</p></div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center text-sm text-text-muted">所有租期均已缴清</div>
          )}
          <div>
            <label className="block text-sm font-medium text-text mb-2">支付密码</label>
            <input
              type="password" maxLength={6} inputMode="numeric" autoFocus
              placeholder="请输入您的 6 位支付密码"
              value={payCode}
              onChange={(e) => setPayCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full h-11 px-3 border border-[var(--color-border)] rounded-xl text-sm outline-none focus:border-[var(--color-primary)] tracking-[0.4em] text-center transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleClose} disabled={loading} className="flex-1 h-10 border border-[var(--color-border)] rounded-xl text-sm text-text hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">取消</button>
            <button onClick={handleSubmit} disabled={loading || !nextPeriod} className="flex-1 h-10 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
              {loading ? '处理中...' : '确认缴租'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Renew Modal (续租) ──────────────────────────────────────────────────── */
function RenewModal({ contract, onClose, onSuccess }: { contract: ContractDetail | null; onClose: () => void; onSuccess: (updated: ContractDetail) => void }) {
  const [renewMonths, setRenewMonths] = useState('');
  const [loading, setLoading] = useState(false);

  const payMonths = contract?.room?.pay ?? 1;
  const renewMonthsNum = parseInt(renewMonths) || 0;
  const isValidRenew = renewMonthsNum > 0 && renewMonthsNum % payMonths === 0;
  const newEnd = isValidRenew && contract ? addMonths(new Date(contract.offlineTime), renewMonthsNum) : null;

  function handleClose() { setRenewMonths(''); onClose(); }

  async function handleSubmit() {
    if (!isValidRenew) { toast.error(`续租月数必须是 ${payMonths} 的整数倍`); return; }
    setLoading(true);
    try {
      const res = await portalRequest<{ success: boolean; data: ContractDetail }>(
        `/portal/account/contracts/${contract!.id}/renew`,
        { method: 'POST', json: { renewMonths: renewMonthsNum } },
      );
      toast.success(`续租 ${renewMonthsNum} 个月成功`);
      handleClose();
      onSuccess(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!contract} onClose={handleClose}>
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-white rounded-2xl shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-100 grid place-items-center"><RefreshCw size={15} className="text-sky-600" /></div>
            <h2 className="text-base font-semibold text-text">续租</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 grid place-items-center text-text-muted hover:text-text cursor-pointer"><X size={15} /></button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm font-semibold text-text mb-3">当前合同</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2"><p className="text-text-muted mb-0.5 text-xs">房源名称</p><p className="font-medium text-text">{contract?.room?.name ?? '—'}</p></div>
              <div><p className="text-text-muted mb-0.5 text-xs">合同截止</p><p className="font-mono text-text text-xs">{contract ? fmtDate(contract.offlineTime) : '—'}</p></div>
              <div><p className="text-text-muted mb-0.5 text-xs">付款方式</p><p className="text-text text-xs">每 {payMonths} 个月一付</p></div>
              <div><p className="text-text-muted mb-0.5 text-xs">每期租金</p><p className="font-mono text-text text-xs">¥{contract?.fee.toFixed(2)}</p></div>
              <div><p className="text-text-muted mb-0.5 text-xs">续租次数</p><p className="text-text text-xs">{contract?.renewTimes ?? 0} 次</p></div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">续租月数<span className="text-text-muted font-normal ml-2 text-xs">必须是 {payMonths} 的整数倍</span></label>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {[payMonths, payMonths * 2, payMonths * 3, payMonths * 4].map((m) => (
                <button key={m} onClick={() => setRenewMonths(String(m))}
                  className={`px-3 h-8 rounded-lg border text-sm transition-colors cursor-pointer
                    ${renewMonthsNum === m ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-medium' : 'border-[var(--color-border)] text-text-muted hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}
                >
                  {m} 月
                </button>
              ))}
            </div>
            <input
              type="number" min={payMonths} step={payMonths}
              placeholder={`自定义（${payMonths} 的整数倍）`}
              value={renewMonths}
              onChange={(e) => setRenewMonths(e.target.value)}
              className={`w-full h-10 px-3 border rounded-xl text-sm outline-none transition-[border-color,box-shadow] placeholder:text-text-muted
                ${renewMonths && !isValidRenew ? 'border-red-400' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'}
                focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]`}
            />
            {renewMonths && !isValidRenew && <p className="text-xs text-red-500 mt-1">续租月数必须是 {payMonths} 的整数倍</p>}
          </div>
          {newEnd && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><RefreshCw size={13} className="text-sky-600" /><p className="text-sm font-semibold text-sky-700">续租预览</p></div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><p className="text-text-muted mb-0.5 text-xs">续租月数</p><p className="text-text">{renewMonthsNum} 个月</p></div>
                <div><p className="text-text-muted mb-0.5 text-xs">续租后截止</p><p className="font-mono text-sky-700 font-medium text-xs">{fmtDate(newEnd.toISOString())}</p></div>
              </div>
              <p className="text-xs text-sky-600 pt-1">续租后可在合同详情中另行交租</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={handleClose} disabled={loading} className="flex-1 h-10 border border-[var(--color-border)] rounded-xl text-sm text-text hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">取消</button>
            <button onClick={handleSubmit} disabled={loading || !isValidRenew} className="flex-1 h-10 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
              {loading ? '处理中...' : '确认续租'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Checkout Modal (退房) ───────────────────────────────────────────────── */
function CheckoutModal({ contract, onClose, onSuccess }: { contract: ContractDetail | null; onClose: () => void; onSuccess: (updated: ContractDetail) => void }) {
  const [loading, setLoading] = useState(false);
  function handleClose() { if (!loading) onClose(); }

  async function handleConfirm() {
    if (!contract) return;
    setLoading(true);
    try {
      const res = await portalRequest<{ success: boolean; data: ContractDetail }>(
        `/portal/account/contracts/${contract.id}/checkout`,
        { method: 'POST', json: {} },
      );
      const kind = detectCheckoutKind(contract);
      toast.success(kind === 'illegal' ? '提前退房已确认，押金不予退还' : '合法退房成功，押金已退还');
      onClose();
      onSuccess(res.data);
    } finally {
      setLoading(false);
    }
  }

  const kind = contract ? detectCheckoutKind(contract) : 'illegal';
  const isLegal = kind !== 'illegal';

  return (
    <Modal open={!!contract} onClose={handleClose}>
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-white rounded-2xl shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 grid place-items-center"><LogOut size={15} className="text-orange-600" /></div>
            <h2 className="text-base font-semibold text-text">退房操作</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 grid place-items-center text-text-muted hover:text-text cursor-pointer"><X size={15} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2"><p className="text-text-muted mb-0.5 text-xs">房源</p><p className="font-medium text-text">{contract?.room?.name ?? '—'}</p></div>
              <div><p className="text-text-muted mb-0.5 text-xs">合同截止</p><p className="font-mono text-text text-xs">{contract ? fmtDate(contract.offlineTime) : '—'}</p></div>
              <div><p className="text-text-muted mb-0.5 text-xs">已交押金</p><p className="font-mono text-text text-xs">¥{contract?.pledge.toFixed(2)}</p></div>
            </div>
          </div>

          {contract && (
            <div className={`rounded-xl p-4 border-2 ${isLegal ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${isLegal ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  {isLegal ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isLegal ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {kind === 'legal-expired' && '合法退房（到期）'}
                    {kind === 'legal-early'   && '合法退房（已付清）'}
                    {kind === 'illegal'        && '提前退房（非法）'}
                  </p>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">
                    {kind === 'legal-expired' && `合同已到期且全部租金已结清，押金 ¥${contract.pledge.toFixed(2)} 将从房东钱包退回您的钱包。`}
                    {kind === 'legal-early'   && `您已提前结清全部租金，押金 ¥${contract.pledge.toFixed(2)} 将从房东钱包退回您的钱包。`}
                    {kind === 'illegal'        && `仍有未结清的租金期数，属于提前违约退房，押金 ¥${contract.pledge.toFixed(2)} 不予退还。`}
                  </p>
                  <p className="text-xs text-amber-600 mt-1.5">此操作不可撤销，房源将重新上架。</p>
                </div>
              </div>
            </div>
          )}

          {kind === 'legal-early' && contract && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 leading-relaxed">
                该合同租约尚未到期（到期日 {fmtDate(contract.offlineTime)}），您已主动结清所有租金，确认退房后押金照常退还。
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleClose} disabled={loading} className="flex-1 h-10 border border-[var(--color-border)] rounded-xl text-sm text-text hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">取消</button>
            <button onClick={handleConfirm} disabled={loading}
              className={`flex-1 h-10 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2
                ${isLegal ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
            >
              <LogOut size={14} />
              {loading ? '处理中...' : '确认退房'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Status Badges ───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: number }) {
  return status === 1
    ? <span className="inline-flex items-center gap-1 px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium"><Clock size={12} />进行中</span>
    : <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle2 size={12} />已完成</span>;
}

function CheckoutBadge({ isCheckout, refund }: { isCheckout: boolean; refund: boolean | null }) {
  if (!isCheckout) return <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-surface-2)] text-text-muted rounded-full text-xs font-medium"><Home size={12} />居住中</span>;
  if (refund === true) return <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle size={12} />合法退房（押金已退）</span>;
  return <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium"><XCircle size={12} />提前退房（押金未退）</span>;
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function DetailSkeleton() {
  return (
    <MineShell title="合同详情">
      <div className="p-5 lg:p-8 space-y-5">
        <div className="w-40 h-4 skeleton-shimmer rounded" />
        <div className="w-48 h-7 skeleton-shimmer rounded" />
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton-shimmer rounded-2xl" />)}
          </div>
          <div className="h-80 skeleton-shimmer rounded-2xl" />
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
  const isTenant      = contract.myRole === 'tenant';
  const isLandlord    = contract.myRole === 'landlord';
  const canPay        = isTenant && contract.status === 1 && !contract.isCheckout && payingPeriods.length > 0;
  const canRenew      = contract.status === 1 && !contract.isCheckout;
  const canCheckout   = contract.status === 1 && !contract.isCheckout;
  const canDelete     = contract.isCheckout;

  const roomName   = contract.room?.name ?? '—';
  const tenantUser = contract.user;
  const landlordUser = contract.landlord;

  return (
    <MineShell title="合同详情">
      <div className="p-5 lg:p-8 space-y-5">
        {/* 面包屑 */}
        <div className="flex items-center gap-1.5 text-sm text-text-muted">
          <button onClick={() => router.back()} className="w-7 h-7 grid place-items-center hover:text-text cursor-pointer"><ArrowLeft size={16} /></button>
          <Link href="/portal/account/contract" className="hover:text-text transition-colors">我的合同</Link>
          <span className="text-xs">›</span>
          <span className="text-text font-medium truncate max-w-48">{roomName}</span>
        </div>

        {/* 标题行 */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-text">{roomName}</h1>
          <StatusBadge status={contract.status} />
          <CheckoutBadge isCheckout={contract.isCheckout} refund={contract.refund} />
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* ── 左栏 ── */}
          <div className="space-y-5">

            {/* 合同信息 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <Calendar size={15} className="text-text-muted" />合同信息
              </h2>
              <InfoRow label="合同编号" value={`#${contract.id}`} mono />
              <InfoRow label="开始时间" value={fmtDate(contract.onlineTime)} mono />
              <InfoRow label="结束时间" value={fmtDate(contract.offlineTime)} mono />
              <InfoRow label="租期" value={`${contract.tenancy} 个月`} />
              {contract.renewTimes > 0 && <InfoRow label="续租" value={`${contract.renewTimes} 次，共 ${contract.renewMonths} 个月`} />}
              <InfoRow label="押金" value={`¥${contract.pledge.toFixed(2)}`} mono />
              <InfoRow label="每期房租" value={`¥${contract.fee.toFixed(2)}`} mono />
              <InfoRow label="付款方式" value={`押 ${contract.room?.pledge} 付 ${contract.room?.pay}`} />
              {contract.isCheckout && contract.checkoutTime && (
                <InfoRow label="退房时间" value={fmtDateTime(contract.checkoutTime)} mono />
              )}
              <InfoRow label="创建时间" value={fmtDateTime(contract.createdAt)} mono />
            </div>

            {/* 房源信息 */}
            {contract.room && (
              <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                  <Home size={15} className="text-text-muted" />房源信息
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--color-surface)]">
                    <RoomImage src={contract.room.cover} alt={contract.room.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/portal/room/${contract.room.id}`} className="text-sm font-medium text-text hover:text-[var(--color-accent)] truncate block">
                      {contract.room.name}
                    </Link>
                    <p className="text-xs text-text-muted font-mono mt-0.5">{contract.room.roomCode}</p>
                    <p className="text-xs text-text-muted mt-0.5">¥{contract.room.price}/月 · 押{contract.room.pledge}付{contract.room.pay} · 最短{contract.room.minTenancy}月</p>
                  </div>
                </div>
              </div>
            )}

            {/* 当事人 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-text mb-4">当事人</h2>
              <div className="space-y-3">
                {[
                  { user: tenantUser,   role: '租客', highlight: isTenant },
                  { user: landlordUser, role: '房东', highlight: isLandlord },
                ].map(({ user, role, highlight }) => user && (
                  <div key={user.id} className={`flex items-center gap-3 p-3 rounded-xl border ${highlight ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)]' : 'border-[var(--color-border)]'}`}>
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[var(--color-surface)]">
                      <RoomImage src={user.avatar ?? undefined} alt={user.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{user.username}</p>
                      {user.nickname && <p className="text-xs text-text-muted">{user.nickname}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs bg-[var(--color-surface-2)] text-text-muted px-2 py-0.5 rounded-full">{role}</span>
                      {highlight && <span className="text-xs text-[var(--color-primary)]">（您）</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 期限明细 */}
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-text mb-4">期限明细</h2>
              <div className="space-y-4">
                {paidPeriods.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">已付 {paidPeriods.length} 期</p>
                    <PeriodList periods={paidPeriods} paid />
                  </div>
                )}
                {payingPeriods.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">待付 {payingPeriods.length} 期</p>
                    <PeriodList periods={payingPeriods} paid={false} />
                  </div>
                )}
                {payingPeriods.length === 0 && paidPeriods.length > 0 && (
                  <p className="text-sm text-emerald-600 text-center py-2">所有租金均已结清 ✓</p>
                )}
              </div>
            </div>
          </div>

          {/* ── 右栏：操作面板 ── */}
          <div className="lg:sticky lg:top-5 space-y-4">
            <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-text mb-4">操作</h2>
              <div className="space-y-3">
                {/* 交房租 - 仅租客 */}
                {isTenant && (
                  <button
                    onClick={() => setPayModal(true)}
                    disabled={!canPay}
                    className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <CreditCard size={15} />
                    {canPay ? '交房租' : payingPeriods.length === 0 ? '租金已结清' : '无需缴租'}
                  </button>
                )}

                {/* 续租 - 双方均可 */}
                <button
                  onClick={() => setRenewModal(true)}
                  disabled={!canRenew}
                  className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium border border-sky-500 text-sky-600 rounded-xl hover:bg-sky-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw size={15} />
                  续租
                </button>

                {/* 退房 - 双方均可 */}
                <button
                  onClick={() => setCheckoutModal(true)}
                  disabled={!canCheckout}
                  className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium border border-orange-400 text-orange-600 rounded-xl hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <LogOut size={15} />
                  {contract.isCheckout ? '已退房' : '退房'}
                </button>

                {/* 删除 - 退房后可删 */}
                <button
                  onClick={() => setDeleteConfirm(true)}
                  disabled={!canDelete}
                  className="w-full h-10 flex items-center justify-center gap-2 text-sm font-medium border border-rose-300 text-rose-500 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Trash2 size={15} />
                  删除合同
                </button>
              </div>

              {!contract.isCheckout && (
                <p className="text-xs text-text-muted mt-4 text-center">合同退房后方可删除</p>
              )}
            </div>

            {/* 当前状态摘要 */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-text">状态摘要</p>
              <div className="text-xs text-text-muted space-y-1">
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
        onSuccess={(updated) => setContract({ ...updated, myRole: contract.myRole })}
      />
      <RenewModal
        contract={renewModal ? contract : null}
        onClose={() => setRenewModal(false)}
        onSuccess={(updated) => setContract({ ...updated, myRole: contract.myRole })}
      />
      <CheckoutModal
        contract={checkoutModal ? contract : null}
        onClose={() => setCheckoutModal(false)}
        onSuccess={(updated) => setContract({ ...updated, myRole: contract.myRole })}
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
