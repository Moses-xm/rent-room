'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, Pencil, Eye, EyeOff, User, Phone,
  MapPin, Wallet, ShieldCheck, Calendar, RefreshCw, Plus,
  TrendingUp, TrendingDown, Receipt, ReceiptText,
} from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { Modal } from '@/components/Modal';
import Pagination from '@/components/Pagination';
import UserFormModal, { type ModalState, type UserFormData } from '../user-form-modal';
import { fmtDateTime } from '@/utils/format';
import {
  WALLET_RECORD_TYPE_OPTIONS,
  WALLET_DATE_RANGE_OPTIONS,
  DEFAULT_PAGE_SIZE,
} from '@/utils/constants';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type UserDetail = {
  id: number;
  username: string;
  avatar?: string | null;
  phone?: string | null;
  nickname?: string | null;
  realname?: string | null;
  gender: number;
  identity: number;
  isActive: boolean;
  email?: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  wallet: number;
  payCode: string;
  createdAt: string;
  updatedAt: string;
};

type WalletRecord = {
  id: number;
  userId: number;
  amount: number;
  type: number;
  remark: string | null;
  orderId: number | null;
  balanceAfter: number | null;
  createdAt: string;
  updatedAt: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name?.trim().charAt(0).toUpperCase() || '?';
}

function getGenderLabel(g: number) {
  return g === 1 ? '男' : g === 2 ? '女' : '不愿透露';
}

function getRecordTypeLabel(type: number) {
  return WALLET_RECORD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? '未知';
}

// 类型 → 主题色 variant
function getRecordVariant(type: number): 'success' | 'danger' | 'warning' | 'info' | 'muted' {
  switch (type) {
    case 1: return 'success';   // 充值
    case 2: return 'danger';    // 支付租房
    case 3: return 'warning';   // 收款(房东)
    case 4: return 'info';      // 退押金
    default: return 'muted';
  }
}

/* ─── Field row ───────────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 border-b border-border-subtle last:border-0">
      <span className="text-body-sm text-text-muted pt-px">{label}</span>
      <span className="text-body text-text">{children}</span>
    </div>
  );
}

/* ─── Section card ────────────────────────────────────────────────────────── */
function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
        <span className="text-text-disabled">{icon}</span>
        <span className="text-body-sm font-emphasis text-text-2">{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

/* ─── Recharge Modal ──────────────────────────────────────────────────────── */
function RechargeModal({
  open,
  onClose,
  onSuccess,
  username,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
  username: string;
}) {
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState('');
  const userId = useParams().id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setAmount('');
      setRemark('');
      setAmountError('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError('请输入大于 0 的金额');
      return;
    }
    setAmountError('');
    setSubmitting(true);
    try {
      const res = await request<{ success: boolean; data: { newBalance: number } }>(
        `/manage/user/${userId}/recharge`,
        { method: 'POST', json: { amount: num, remark: remark.trim() || undefined } }
      );
      if (res.success) {
        toast.success(`已为 ${username} 充值 ¥${num.toFixed(2)}`);
        onSuccess(res.data.newBalance);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 预设快捷金额
  const PRESETS = [100, 500, 1000, 2000, 5000];

  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="relative w-full max-w-sm bg-card rounded-lg shadow-xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle bg-surface">
          <div className="w-8 h-8 rounded-full bg-success-bg grid place-items-center shrink-0">
            <Wallet size={15} className="text-success" />
          </div>
          <div>
            <p className="text-body font-emphasis text-text">钱包充值</p>
            <p className="text-caption text-text-muted">为 {username} 充值</p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 快捷金额 */}
          <div>
            <p className="text-caption text-text-muted mb-2">快捷金额</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setAmount(String(p)); setAmountError(''); }}
                  className={`px-3 h-7 text-body-sm rounded-sm border transition-colors cursor-pointer ${
                    amount === String(p)
                      ? 'border-primary bg-primary-tint text-primary-dark font-medium'
                      : 'border-border text-text-2 hover:border-text-disabled bg-card'
                  }`}
                >
                  ¥{p.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 充值金额 */}
          <div>
            <label className="text-body-sm text-text-2 font-medium block mb-1.5">
              充值金额 <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-body font-medium select-none">¥</span>
              <input
                ref={inputRef}
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                placeholder="请输入充值金额"
                className={`w-full h-9 pl-7 pr-3 text-body border rounded-sm bg-card text-text outline-none transition-[border-color,box-shadow] ${
                  amountError
                    ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_15%,transparent)]'
                    : 'border-border hover:border-text-disabled focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
                }`}
              />
            </div>
            {amountError && <p className="text-caption text-danger mt-1">{amountError}</p>}
          </div>

          {/* 备注 */}
          <div>
            <label className="text-body-sm text-text-2 font-medium block mb-1.5">备注说明</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={100}
              placeholder="选填，例如：年度充值礼包"
              className="w-full h-9 px-3 text-body border border-border rounded-sm bg-card text-text outline-none transition-[border-color,box-shadow] hover:border-text-disabled focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-9 text-body-sm border border-border rounded-sm text-text-2 bg-card hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-9 text-body-sm rounded-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Plus size={13} strokeWidth={2.5} />
                  确认充值
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─── Wallet Records Section ──────────────────────────────────────────────── */
function WalletRecordsSection({ userId }: { userId: number }) {
  const [dateRange, setDateRange] = useState('month');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [records, setRecords] = useState<WalletRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetch = useCallback(async (p: number, ps: number, dr: string) => {
    setLoading(true);
    try {
      const res = await request<{
        success: boolean;
        data: WalletRecord[];
        total: number;
        totalPages: number;
      }>(`/manage/user/${userId}/wallet-records?page=${p}&limit=${ps}&dateRange=${dr}`);
      if (res.success) {
        setRecords(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setHasLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetch(page, pageSize, dateRange); }, [fetch, page, pageSize, dateRange]);

  const handleDateRange = (v: string) => {
    setDateRange(v);
    setPage(1);
  };
  const handlePageSize = (ps: number) => {
    setPageSize(ps);
    setPage(1);
  };

  const amountColor = (amount: number) =>
    amount > 0 ? 'text-success' : 'text-danger';

  const amountPrefix = (amount: number) => amount > 0 ? '+' : '-';

  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-subtle bg-surface flex-wrap">
        <div className="flex items-center gap-2">
          <ReceiptText size={14} className="text-text-disabled" />
          <span className="text-body-sm font-emphasis text-text-2">钱包流水</span>
          {hasLoaded && (
            <span className="text-caption text-text-muted bg-surface-2 px-1.5 py-0.5 rounded-sm tabular-nums">
              共 {total} 条
            </span>
          )}
        </div>
        {/* 时间筛选 pills */}
        <div className="flex items-center gap-1">
          {WALLET_DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleDateRange(opt.value)}
              className={`h-7 px-3 text-caption rounded-sm border transition-colors cursor-pointer ${
                dateRange === opt.value
                  ? 'border-primary bg-primary-tint text-primary-dark font-medium'
                  : 'border-transparent text-text-muted hover:bg-surface-2 hover:text-text-2'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      {loading ? (
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-20 rounded skeleton-shimmer" />
                <div className="h-3 w-36 rounded skeleton-shimmer opacity-60" />
              </div>
              <div className="h-4 w-16 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
          <Receipt size={36} className="opacity-20" />
          <p className="text-body-sm">
            {dateRange === 'all' ? '暂无任何钱包记录' : `该时间段内暂无流水记录`}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border-subtle">
            {records.map((rec) => {
              const variant = getRecordVariant(rec.type);
              return (
                <li key={rec.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface/60 transition-colors">
                  {/* 类型图标圆圈 */}
                  <div className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
                    variant === 'success' ? 'bg-success-bg' :
                    variant === 'danger'  ? 'bg-danger-bg'  :
                    variant === 'warning' ? 'bg-warning-bg' :
                    variant === 'info'    ? 'bg-info-bg'    :
                    'bg-surface-2'
                  }`}>
                    {rec.amount > 0
                      ? <TrendingUp size={14} className={`text-${variant}`} />
                      : <TrendingDown size={14} className={`text-${variant}`} />
                    }
                  </div>

                  {/* 主体信息 */}
                  <div className="flex-1 min-w-0">
                    <StatusPill variant={variant}>{getRecordTypeLabel(rec.type)}</StatusPill>
                    {rec.remark && (
                      <p className="text-caption text-text-muted mt-0.5 break-words">{rec.remark}</p>
                    )}
                    <p className="text-caption text-text-disabled mt-0.5 font-mono">
                      {fmtDateTime(rec.createdAt)}
                    </p>
                  </div>

                  {/* 金额 + 交易后余额 */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-body font-semibold font-mono tabular-nums ${amountColor(rec.amount)}`}>
                      {amountPrefix(rec.amount)}¥{Math.abs(rec.amount).toFixed(2)}
                    </span>
                    {rec.balanceAfter != null && (
                      <span className="text-caption text-text-disabled font-mono tabular-nums mt-0.5">
                        余额 ¥{rec.balanceAfter.toFixed(2)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* 分页 */}
          {hasLoaded && total > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={handlePageSize}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [showPayCode, setShowPayCode] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [recordsKey, setRecordsKey] = useState(0);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request<{ success: boolean; data: UserDetail }>(`/manage/user/${userId}`);
      if (res.success) setUser(res.data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleSaved = async (data: UserFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/user/${editingId}`, { method: 'PUT', json: data });
      toast.success('用户信息修改成功');
      await fetchUser();
    }
  };

  // 充值成功：更新余额显示 + 刷新流水列表
  const handleRechargeSuccess = (newBalance: number) => {
    setUser((prev) => prev ? { ...prev, wallet: newBalance } : prev);
    setRecordsKey((k) => k + 1);
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-sm skeleton-shimmer opacity-50 shrink-0" />
            <div className="h-4 w-44 rounded skeleton-shimmer opacity-50" />
          </div>
          <div className="h-8 w-20 rounded-sm skeleton-shimmer shrink-0" />
        </div>
        <div className="bg-card border border-border rounded-md shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full skeleton-shimmer-warm shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-28 rounded skeleton-shimmer" />
                <div className="h-5 w-14 rounded-full skeleton-shimmer opacity-70" />
                <div className="h-5 w-12 rounded-full skeleton-shimmer opacity-70" />
              </div>
              <div className="h-3.5 w-40 rounded skeleton-shimmer opacity-50" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-12 rounded skeleton-shimmer opacity-50" />
                <div className="h-4 w-16 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {[6, 3].map((fieldCount, i) => (
              <div key={i} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                  <div className="h-4 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="px-5 divide-y divide-border-subtle">
                  {Array.from({ length: fieldCount }).map((_, j) => (
                    <div key={j} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                      <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                      <div className={`h-3.5 rounded skeleton-shimmer ${j % 2 === 0 ? 'w-24' : 'w-32'}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[2, 2].map((fieldCount, i) => (
              <div key={i} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                  <div className="h-4 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="px-5 divide-y divide-border-subtle">
                  {Array.from({ length: fieldCount }).map((_, j) => (
                    <div key={j} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                      <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                      <div className="h-3.5 w-20 rounded skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="h-16 rounded-md skeleton-shimmer opacity-30" />
          </div>
        </div>
        {/* wallet records skeleton */}
        <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-subtle bg-surface">
            <div className="h-4 w-20 rounded skeleton-shimmer" />
            <div className="flex gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-7 w-16 rounded-sm skeleton-shimmer opacity-50" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-20 rounded skeleton-shimmer" />
                  <div className="h-3 w-36 rounded skeleton-shimmer opacity-60" />
                </div>
                <div className="h-4 w-16 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <User size={40} className="opacity-25" />
        <p className="text-body">用户不存在或已被删除</p>
        <button
          onClick={() => router.push('/manage/user')}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors cursor-pointer"
        >
          返回用户管理
        </button>
      </div>
    );
  }

  const avatarUrl = resolveUploadedFileUrl(user.avatar ?? '');
  const displayName = user.nickname || user.username;
  const locationParts = [user.province, user.city, user.district, user.address].filter(Boolean);

  return (
    <div className="space-y-4">

      {/* ── 面包屑 + 操作 ── */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1.5 text-body-sm min-w-0">
          <button
            onClick={() => router.back()}
            title="返回"
            className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={17} />
          </button>
          <span className="text-text-disabled shrink-0">/</span>
          <Link href="/manage/user" className="text-text-muted hover:text-text transition-colors shrink-0">
            用户管理
          </Link>
          <ChevronRight size={13} className="text-text-disabled shrink-0" />
          <span className="text-text font-emphasis truncate">{displayName}</span>
        </nav>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setRechargeOpen(true)}
            className="h-8 px-3 text-body-sm rounded-sm font-medium
                       bg-success text-white hover:bg-success-dark transition-colors
                       flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={12} strokeWidth={2.5} />
            钱包充值
          </button>
          <button
            onClick={() => setModalState({ mode: 'edit', user })}
            className="h-8 px-3 text-body-sm rounded-sm font-medium
                       bg-primary text-white hover:bg-primary-dark transition-colors
                       flex items-center gap-1.5 cursor-pointer"
          >
            <Pencil size={12} strokeWidth={2.5} />
            编辑信息
          </button>
        </div>
      </div>

      {/* ── 用户 profile 卡片 ── */}
      <div className="bg-card border border-border rounded-md shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full grid place-items-center overflow-hidden shrink-0 bg-primary-tint text-primary-dark text-lg font-semibold border border-border">
            {avatarUrl
              ? <img src={avatarUrl} alt={user.username} className="h-full w-full object-cover" />
              : initials(displayName)
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[17px] font-semibold text-text leading-tight">{displayName}</span>
              <StatusPill variant={user.identity === 2 ? 'warning' : 'info'}>
                {user.identity === 2 ? '房东' : '普通用户'}
              </StatusPill>
              <StatusPill variant={user.isActive ? 'success' : 'muted'}>
                {user.isActive ? '正常' : '停用'}
              </StatusPill>
            </div>
            <p className="text-body-sm text-text-muted font-mono mt-0.5">
              @{user.username}
              <span className="mx-2 text-text-disabled">·</span>
              UID {user.id}
            </p>
          </div>
        </div>

        {/* 快速指标行 */}
        <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-caption text-text-muted mb-0.5">真实姓名</p>
            <p className="text-body text-text font-medium">{user.realname || '—'}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-0.5">性别</p>
            <p className="text-body text-text font-medium">{getGenderLabel(user.gender)}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-0.5">钱包余额</p>
            <p className="text-body text-text font-medium font-mono">¥ {user.wallet.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-0.5">注册时间</p>
            <p className="text-body text-text font-medium font-mono">{fmtDateTime(user.createdAt).slice(0, 10)}</p>
          </div>
        </div>
      </div>

      {/* ── 两栏布局 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 左栏（主要信息）*/}
        <div className="lg:col-span-2 space-y-4">

          {/* 基本信息 */}
          <Section title="基本信息" icon={<User size={14} />}>
            <Field label="用户名">{user.username}</Field>
            <Field label="昵称">{user.nickname || '—'}</Field>
            <Field label="真实姓名">{user.realname || '—'}</Field>
            <Field label="性别">{getGenderLabel(user.gender)}</Field>
            <Field label="身份">
              <StatusPill variant={user.identity === 2 ? 'warning' : 'info'}>
                {user.identity === 2 ? '房东' : '普通用户'}
              </StatusPill>
            </Field>
            <Field label="账号状态">
              <StatusPill variant={user.isActive ? 'success' : 'muted'}>
                {user.isActive ? '正常使用' : '已停用'}
              </StatusPill>
            </Field>
          </Section>

          {/* 联系方式 */}
          <Section title="联系方式" icon={<Phone size={14} />}>
            <Field label="手机号">
              <span className="font-mono">{user.phone || '—'}</span>
            </Field>
            <Field label="邮箱">
              <span className="font-mono">{user.email || '—'}</span>
            </Field>
            <Field label="所在地区">
              {locationParts.length > 0
                ? <span className="flex items-center gap-1.5"><MapPin size={12} className="text-text-muted shrink-0" />{locationParts.join(' ')}</span>
                : '—'
              }
            </Field>
          </Section>

        </div>

        {/* 右栏（账户 & 时间）*/}
        <div className="space-y-4">

          {/* 账户信息 */}
          <Section title="账户信息" icon={<Wallet size={14} />}>
            <Field label="钱包余额">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">¥ {user.wallet.toFixed(2)}</span>
                <button
                  onClick={() => setRechargeOpen(true)}
                  className="h-5.5 px-2 text-caption rounded border border-success text-success hover:bg-success-bg transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus size={10} strokeWidth={2.5} />
                  充值
                </button>
              </div>
            </Field>
            <Field label="支付密码">
              <span className="flex items-center gap-2">
                <span className="font-mono tracking-widest">
                  {showPayCode ? user.payCode : '••••••'}
                </span>
                <button
                  onClick={() => setShowPayCode((v) => !v)}
                  className="text-text-disabled hover:text-text-muted transition-colors cursor-pointer"
                  title={showPayCode ? '隐藏' : '查看'}
                >
                  {showPayCode ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </span>
            </Field>
          </Section>

          {/* 时间记录 */}
          <Section title="时间记录" icon={<Calendar size={14} />}>
            <Field label="注册时间">
              <span className="font-mono text-body-sm">{fmtDateTime(user.createdAt)}</span>
            </Field>
            <Field label="最后修改">
              <span className="flex items-center gap-1.5 font-mono text-body-sm">
                <RefreshCw size={11} className="text-text-muted shrink-0" />
                {fmtDateTime(user.updatedAt)}
              </span>
            </Field>
          </Section>

          {/* 账号安全提示 */}
          <div className="bg-surface border border-border-subtle rounded-md px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={15} className="text-text-disabled mt-px shrink-0" />
              <p className="text-caption text-text-muted leading-relaxed">
                支付密码仅在用户进行钱包相关操作时使用，管理员可在编辑页修改。
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── 钱包流水 ── */}
      <WalletRecordsSection key={recordsKey} userId={userId} />

      <UserFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <RechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        onSuccess={handleRechargeSuccess}
        username={displayName}
      />
    </div>
  );
}
