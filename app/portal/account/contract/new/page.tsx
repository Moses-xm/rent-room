'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, CheckCircle2, CreditCard, Eye, FileText, Home,
} from 'lucide-react';
import { toast } from 'sonner';
import { MineShell } from '@/components/portal/MineShell';
import { RoomImage } from '@/components/portal/RoomImage';
import { Modal } from '@/components/Modal';
import { portalRequest } from '@/utils/portal-request';
import { getPortalProfile, getPortalToken } from '@/utils/portal-auth';
import { fmtDate } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type RoomInfo = {
  id: number;
  name: string;
  roomCode: string;
  coverUrl: string;
  price: number;
  pledge: number;
  pay: number;
  minTenancy: number;
  isRented: number;
  community: { name: string; district: string } | null;
  publisher: { id: number; username: string; nickname: string | null; avatarUrl: string } | null;
};
type Period = { start: string; end: string };

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function generatePeriods(onlineTime: Date, offlineTime: Date, payMonths: number): Period[] {
  const periods: Period[] = [];
  let current = new Date(onlineTime);
  while (current < offlineTime) {
    const end = addMonths(current, payMonths);
    periods.push({ start: current.toISOString(), end: end.toISOString() });
    current = end;
  }
  return periods;
}

/* ─── Contract Preview ─────────────────────────────────────────────────────── */
function ContractPreview({
  room, onlineTime, tenancy, tenantName,
}: {
  room: RoomInfo | null;
  onlineTime: string;
  tenancy: number;
  tenantName: string;
}) {
  if (!room || !onlineTime || !tenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Eye size={32} className="text-text-disabled mb-3" />
        <p className="text-sm text-text-muted">填写左侧信息后，合同预览将在此处显示</p>
      </div>
    );
  }

  const onlineDate   = new Date(onlineTime + 'T00:00:00');
  const offlineDate  = addMonths(onlineDate, tenancy);
  const pledgeAmount = room.price * room.pledge;
  const fee          = room.price * room.pay;
  const totalAmount  = pledgeAmount + fee;
  const allPeriods   = generatePeriods(onlineDate, offlineDate, room.pay);
  const totalPeriods = allPeriods.length;
  const firstPeriod  = allPeriods[0];
  const restPeriods  = allPeriods.slice(1);

  const landlordName = room.publisher?.nickname || room.publisher?.username || '—';

  return (
    <div className="space-y-4">
      {/* 合同头部 */}
      <div className="bg-[var(--color-primary-tint)] border border-[var(--color-primary)]/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-[var(--color-primary)]">租赁合同预览</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <p className="text-text-muted mb-0.5 text-xs">房源</p>
            <p className="font-medium text-text">{room.name}</p>
            <p className="text-xs text-text-muted font-mono">{room.roomCode}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5 text-xs">租客</p>
            <p className="font-medium text-text">{tenantName}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5 text-xs">房东</p>
            <p className="font-medium text-text">{landlordName}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5 text-xs">开始时间</p>
            <p className="font-mono text-sm text-text">{fmtDate(onlineDate.toISOString())}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5 text-xs">结束时间</p>
            <p className="font-mono text-sm text-[var(--color-primary)] font-medium">{fmtDate(offlineDate.toISOString())}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5 text-xs">租期</p>
            <p className="font-medium text-text">{tenancy} 个月</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5 text-xs">付款方式</p>
            <p className="text-text">押 {room.pledge} 付 {room.pay}</p>
          </div>
        </div>
      </div>

      {/* 费用明细 */}
      <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-3 bg-white">
        <p className="text-sm font-semibold text-text">费用明细</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">押金（{room.pledge} 个月）</span>
            <span className="font-mono font-medium text-text">¥{pledgeAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">每期房租（{room.pay} 个月 × ¥{room.price.toFixed(0)}/月）</span>
            <span className="font-mono font-medium text-text">¥{fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">总期数</span>
            <span className="text-text">{totalPeriods} 期</span>
          </div>
          <div className="h-px bg-[var(--color-border)]" />
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-text">首次付款合计</span>
            <span className="font-mono text-[var(--color-accent-dark)]">¥{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 期限明细 */}
      <div className="border border-[var(--color-border)] rounded-xl p-4 space-y-2 bg-white">
        <p className="text-sm font-semibold text-text mb-3">期限明细</p>
        <div className="space-y-1.5">
          {firstPeriod && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-100 grid place-items-center shrink-0">
                <CheckCircle2 size={12} className="text-amber-500" />
              </span>
              <span className="text-text-muted">第 1 期</span>
              <span className="font-mono text-text ml-auto">{fmtDate(firstPeriod.start)} ~ {fmtDate(firstPeriod.end)}</span>
              <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded shrink-0">应付</span>
            </div>
          )}
          {restPeriods.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-[var(--color-surface-2)] grid place-items-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
              </span>
              <span className="text-text-muted">第 {i + 2} 期</span>
              <span className="font-mono text-text ml-auto">{fmtDate(p.start)} ~ {fmtDate(p.end)}</span>
              <span className="text-xs bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded shrink-0">待付</span>
            </div>
          ))}
        </div>
      </div>

      {/* 付款提示 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <CreditCard size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">创建合同即视为完成签约</p>
            <p className="text-sm text-amber-600 mt-0.5">
              创建后将立即从您的钱包扣除押金 ¥{pledgeAmount.toFixed(2)} + 首期房租 ¥{fee.toFixed(2)}，
              合计 <strong>¥{totalAmount.toFixed(2)}</strong>，并将款项转入房东钱包。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pay Dialog ──────────────────────────────────────────────────────────── */
function PayDialog({
  open, pledgeAmount, fee,
  onConfirm, onClose,
}: {
  open: boolean;
  pledgeAmount: number;
  fee: number;
  onConfirm: (payCode: string) => Promise<void>;
  onClose: () => void;
}) {
  const [payCode, setPayCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (payCode.length !== 6) { toast.error('请输入 6 位支付密码'); return; }
    setLoading(true);
    try { await onConfirm(payCode); }
    finally { setLoading(false); }
  }

  function handleClose() { setPayCode(''); onClose(); }

  return (
    <Modal open={open} onClose={handleClose}>
      <div
        className="relative flex w-full max-w-sm flex-col overflow-hidden bg-white rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-6 py-5">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-tint)] grid place-items-center">
            <CreditCard size={18} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text">确认付款</h3>
            <p className="text-xs text-text-muted mt-0.5">请输入您的支付密码完成签约</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">押金</span><span className="font-mono">¥{pledgeAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">首期房租</span><span className="font-mono">¥{fee.toFixed(2)}</span></div>
            <div className="h-px bg-[var(--color-border)]" />
            <div className="flex justify-between font-semibold">
              <span className="text-text">合计</span>
              <span className="font-mono text-[var(--color-accent-dark)]">¥{(pledgeAmount + fee).toFixed(2)}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">支付密码</label>
            <input
              type="password"
              maxLength={6}
              inputMode="numeric"
              autoFocus
              placeholder="请输入您的 6 位支付密码"
              value={payCode}
              onChange={(e) => setPayCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full h-11 px-3 border border-[var(--color-border)] rounded-xl text-sm outline-none
                         focus:border-[var(--color-primary)] tracking-[0.5em] text-center
                         transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-10 border border-[var(--color-border)] rounded-xl text-sm text-text hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 h-10 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : '确认创建合同'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function FormSkeleton() {
  return (
    <MineShell title="立即租赁">
      <div className="p-5 lg:p-8 space-y-5">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-20 h-4 skeleton-shimmer rounded" />
                <div className="w-full h-11 skeleton-shimmer rounded-xl" />
              </div>
            ))}
          </div>
          <div className="w-full h-64 skeleton-shimmer rounded-xl" />
        </div>
      </div>
    </MineShell>
  );
}

/* ─── Main Content ────────────────────────────────────────────────────────── */
function NewContractContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = parseInt(searchParams.get('roomId') || '0');

  const [room, setRoom]     = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenancy, setTenancy] = useState('');
  const [onlineTime, setOnlineTime] = useState('');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const profile = useMemo(() => getPortalProfile(), []);
  const tenantName = profile?.nickname || profile?.username || '我';

  const fetchRoom = useCallback(async () => {
    if (!roomId) { router.replace('/portal/account/contract'); return; }
    try {
      const res = await portalRequest<{ success: boolean; data: RoomInfo }>(`/portal/rooms/${roomId}`, { silent: true });
      const r = res.data;
      if (r.isRented === 2) {
        toast.error('该房源已被租出');
        router.replace('/portal/account/contract');
        return;
      }
      if (profile?.id && r.publisher?.id === profile.id) {
        toast.error('不能租用自己发布的房源');
        router.replace('/portal/account/contract');
        return;
      }
      setRoom(r);
    } catch {
      toast.error('房源不存在或已下架');
      router.replace('/portal/account/contract');
    } finally {
      setLoading(false);
    }
  }, [roomId, router, profile?.id]);

  useEffect(() => {
    if (!getPortalToken()) { router.replace('/portal/login'); return; }
    fetchRoom();
  }, [fetchRoom, router]);

  const tenancyNum  = parseInt(tenancy) || 0;
  const payMonths   = room?.pay ?? 1;
  const minTenancy  = room?.minTenancy ?? 1;
  const isValidTen  = tenancyNum >= minTenancy && tenancyNum % payMonths === 0;
  const offlineDate = onlineTime && tenancyNum && isValidTen ? addMonths(new Date(onlineTime + 'T00:00:00'), tenancyNum) : null;
  const pledgeAmount = room ? room.price * room.pledge : 0;
  const fee          = room ? room.price * room.pay : 0;

  const handleCreate = useCallback(async (payCode: string) => {
    if (!room || !isValidTen || !onlineTime) return;
    setSubmitting(true);
    try {
      const res = await portalRequest<{ success: boolean; data: { id: number } }>(
        '/portal/account/contracts',
        { method: 'POST', json: { roomId: room.id, tenancy: tenancyNum, onlineTime, payCode } },
      );
      if (res.success && res.data?.id) {
        toast.success('合同创建成功');
        setPayDialogOpen(false);
        router.push(`/portal/account/contract/${res.data.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }, [room, isValidTen, onlineTime, tenancyNum, router]);

  if (loading || !room) return <FormSkeleton />;

  return (
    <MineShell title="立即租赁">
      <div className="p-5 lg:p-8">
        {/* 面包屑 */}
        <div className="flex items-center gap-1.5 text-sm text-text-muted mb-6">
          <button onClick={() => router.back()} className="w-7 h-7 grid place-items-center hover:text-text transition-colors cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <Link href="/portal/account/contract" className="hover:text-text transition-colors">我的合同</Link>
          <span className="text-xs">›</span>
          <span className="text-text font-medium">创建合同</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-start">
          {/* ── 左：表单 ── */}
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 space-y-5">

            {/* 房源信息（只读展示） */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">房源</label>
              <div className="border border-[var(--color-primary)] bg-[var(--color-primary-tint)] rounded-xl px-3 py-2.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <RoomImage src={room.coverUrl} alt={room.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{room.name}</p>
                  <p className="text-xs text-text-muted font-mono">{room.roomCode} · ¥{room.price}/月 · 押{room.pledge}付{room.pay}</p>
                </div>
              </div>
            </div>

            {/* 房源详细信息 */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-text">房源 & 房东信息</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-white rounded-lg border border-[var(--color-border)]">
                  <p className="text-text-muted text-xs mb-0.5">月租</p>
                  <p className="font-mono font-medium text-text">¥{room.price.toFixed(0)}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-[var(--color-border)]">
                  <p className="text-text-muted text-xs mb-0.5">押付方式</p>
                  <p className="font-medium text-text">押{room.pledge}付{room.pay}</p>
                </div>
                <div className="text-center p-2 bg-white rounded-lg border border-[var(--color-border)]">
                  <p className="text-text-muted text-xs mb-0.5">最短租期</p>
                  <p className="font-medium text-text">{room.minTenancy}个月</p>
                </div>
              </div>
              {room.publisher && (
                <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)]">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--color-primary-tint)] shrink-0">
                    <RoomImage src={room.publisher.avatarUrl} alt={room.publisher.username} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm text-text-muted">
                    房东：<span className="font-medium text-text">{room.publisher.nickname || room.publisher.username}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 租客（当前用户，只读） */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">租客（您）</label>
              <div className="border border-[var(--color-border)] rounded-xl px-3 py-2.5 flex items-center gap-2 bg-[var(--color-surface)]">
                <div className="w-7 h-7 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary)] text-xs font-semibold grid place-items-center shrink-0">
                  {tenantName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-text">{tenantName}</span>
                <span className="ml-auto text-xs text-text-muted">当前登录账号</span>
              </div>
            </div>

            {/* 租期 */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                租期（月）
                <span className="text-text-muted font-normal ml-2 text-xs">
                  最短 {minTenancy} 个月，必须是 {payMonths} 的整数倍
                </span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.from({ length: 4 }, (_, i) => {
                  const m = Math.max(minTenancy, payMonths) + i * payMonths;
                  return (
                    <button
                      key={m}
                      onClick={() => setTenancy(String(m))}
                      className={`px-3 h-8 rounded-lg border text-sm transition-colors cursor-pointer
                        ${tenancyNum === m
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-medium'
                          : 'border-[var(--color-border)] text-text-muted hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                        }`}
                    >
                      {m} 月
                    </button>
                  );
                })}
              </div>
              <input
                type="number"
                min={minTenancy}
                step={payMonths}
                placeholder={`输入月数（最少 ${minTenancy} 个月）`}
                value={tenancy}
                onChange={(e) => setTenancy(e.target.value)}
                className={`w-full h-11 px-3 border rounded-xl text-sm outline-none transition-[border-color,box-shadow]
                  ${tenancy && !isValidTen ? 'border-red-400' : 'border-[var(--color-border)] focus:border-[var(--color-primary)]'}
                  focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                  placeholder:text-text-muted`}
              />
              {tenancy && !isValidTen && (
                <p className="text-xs text-red-500 mt-1">租期不能少于 {minTenancy} 个月，且必须是 {payMonths} 的整数倍</p>
              )}
            </div>

            {/* 开始时间 */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">开始租房时间</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="date"
                  value={onlineTime}
                  onChange={(e) => setOnlineTime(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 border border-[var(--color-border)] rounded-xl text-sm outline-none
                             focus:border-[var(--color-primary)] text-text bg-white
                             transition-[border-color,box-shadow] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
                />
              </div>
            </div>

            {/* 结束时间（只读） */}
            {offlineDate && (
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">结束时间（自动计算）</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={offlineDate.toISOString().substring(0, 10)}
                    readOnly
                    className="w-full h-11 pl-9 pr-3 border border-[var(--color-border)] rounded-xl text-sm outline-none bg-[var(--color-surface)] text-text-muted cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-text-muted mt-1">根据开始时间和租期自动计算，不可手动修改</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.back()}
                className="flex-1 h-11 border border-[var(--color-border)] rounded-xl text-sm text-text hover:bg-[var(--color-surface)] transition-colors flex items-center justify-center cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!isValidTen) { toast.error(`租期必须 ≥ ${minTenancy} 且为 ${payMonths} 的倍数`); return; }
                  if (!onlineTime) { toast.error('请选择开始日期'); return; }
                  setPayDialogOpen(true);
                }}
                disabled={submitting}
                className="flex-1 h-11 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FileText size={15} />
                创建合同
              </button>
            </div>
          </div>

          {/* ── 右：合同预览 ── */}
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 lg:sticky lg:top-5">
            <div className="flex items-center gap-2 mb-5">
              <Eye size={16} className="text-text-muted" />
              <h2 className="text-sm font-semibold text-text">合同预览</h2>
            </div>
            <ContractPreview
              room={room}
              onlineTime={onlineTime}
              tenancy={tenancyNum}
              tenantName={tenantName}
            />
          </div>
        </div>
      </div>

      <PayDialog
        open={payDialogOpen}
        pledgeAmount={pledgeAmount}
        fee={fee}
        onConfirm={handleCreate}
        onClose={() => setPayDialogOpen(false)}
      />
    </MineShell>
  );
}

export default function NewContractPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <NewContractContent />
    </Suspense>
  );
}
