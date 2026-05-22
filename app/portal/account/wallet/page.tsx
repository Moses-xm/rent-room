"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  X, Eye, EyeOff, Plus,
  Receipt, ReceiptText, TrendingUp, TrendingDown, Wallet,
} from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import { MineShell } from "@/components/portal/MineShell";
import { Modal } from "@/components/Modal";
import { portalRequest } from "@/utils/portal-request";
import { fmtDateTime } from "@/utils/format";
import {
  WALLET_RECORD_TYPE_OPTIONS, WALLET_DATE_RANGE_OPTIONS,
  DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS,
} from "@/utils/constants";
import Pagination from "@/components/Pagination";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type UserInfo = {
  id: number;
  wallet: number;
  payCode: string;
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
function getRecordTypeLabel(type: number) {
  return WALLET_RECORD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "未知";
}

function getRecordVariant(type: number) {
  switch (type) {
    case 1: return "success";
    case 2: return "danger";
    case 3: return "warning";
    case 4: return "info";
    default: return "muted";
  }
}

/* ─── Recharge Modal ──────────────────────────────────────────────────────── */
function RechargeModal({
  open, onClose, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [amountError, setAmountError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const PRESETS = [100, 500, 1000, 2000, 5000];

  useEffect(() => {
    if (open) {
      setAmount("");
      setRemark("");
      setAmountError("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError("请输入大于 0 的金额");
      return;
    }
    setAmountError("");
    setSubmitting(true);
    try {
      const res = await portalRequest<{ success: boolean; data: { newBalance: number } }>(
        "/portal/account/recharge",
        { method: "POST", json: { amount: num, remark: remark.trim() || undefined } }
      );
      toast.success(`充值 ¥${num.toFixed(2)} 成功`);
      onSuccess(res.data.newBalance);
      onClose();
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <span className="text-base font-medium text-text">钱包充值</span>
          <button onClick={onClose} className="text-text-muted hover:text-text cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-2">快捷金额</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setAmount(String(p)); setAmountError(""); }}
                  className={`px-3 h-7 text-sm rounded border transition-colors cursor-pointer ${
                    amount === String(p)
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                      : "border-[#ddd] text-text-2 hover:border-[#aaa]"
                  }`}
                >
                  ¥{p.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-text-2 font-medium block mb-1.5">
              充值金额 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium select-none">¥</span>
              <input
                ref={inputRef}
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setAmountError(""); }}
                placeholder="请输入充值金额"
                className={`w-full h-9 pl-7 pr-3 text-sm border rounded outline-none transition-colors ${
                  amountError
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#ddd] focus:border-[var(--color-primary)]"
                }`}
              />
            </div>
            {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
          </div>
          <div>
            <label className="text-sm text-text-2 font-medium block mb-1.5">备注说明</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={100}
              placeholder="选填"
              className="w-full h-9 px-3 text-sm border border-[#ddd] rounded outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-9 text-sm border border-[#ddd] rounded text-text-2 hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-9 text-sm rounded font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Plus className="w-3.5 h-3.5" />确认充值</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─── Edit PayCode Modal ──────────────────────────────────────────────────── */
function EditPayCodeModal({
  value, onClose, onSave,
}: {
  value: string;
  onClose: () => void;
  onSave: (val: string) => Promise<void>;
}) {
  const [fieldValue, setFieldValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(fieldValue);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <span className="text-base font-medium text-text">修改支付密码</span>
          <button onClick={onClose} className="text-text-muted hover:text-text cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <div className="relative">
            <input
              ref={inputRef}
              type={showSecret ? "text" : "password"}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="请输入支付密码"
              className="w-full h-9 pl-3 pr-9 border border-[#ddd] rounded text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="h-9 px-5 border border-[#ddd] text-text-2 text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 bg-[var(--color-primary)] text-white text-sm rounded cursor-pointer hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Wallet Records ──────────────────────────────────────────────────────── */
function WalletRecordsSection() {
  const [dateRange, setDateRange] = useState('month');
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(DEFAULT_PAGE_SIZE);
  const [records, setRecords]     = useState<WalletRecord[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async (p: number, ps: number, dr: string) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean; data: WalletRecord[]; total: number; totalPages: number;
      }>(`/portal/account/wallet-records?page=${p}&limit=${ps}&dateRange=${dr}`);
      setRecords(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setHasLoaded(true);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, pageSize, dateRange); }, [load, page, pageSize, dateRange]);

  const handleDateRange = (v: string) => { setDateRange(v); setPage(1); };
  const handlePageSize  = (ps: number) => { setPageSize(ps); setPage(1); };

  const amountColor  = (amount: number) => amount > 0 ? 'text-success' : 'text-danger';
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
            {dateRange === 'all' ? '暂无任何钱包记录' : '该时间段内暂无流水记录'}
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border-subtle">
            {records.map((rec) => {
              const variant = getRecordVariant(rec.type);
              return (
                <li key={rec.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface/60 transition-colors">
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
                  <div className="flex-1 min-w-0">
                    <StatusPill variant={variant}>{getRecordTypeLabel(rec.type)}</StatusPill>
                    {rec.remark && (
                      <p className="text-caption text-text-muted mt-0.5 break-words">{rec.remark}</p>
                    )}
                    <p className="text-caption text-text-disabled mt-0.5 font-mono">
                      {fmtDateTime(rec.createdAt)}
                    </p>
                  </div>
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
          {hasLoaded && total > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={handlePageSize}
              pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function WalletPage() {
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayCode, setShowPayCode] = useState(false);
  const [editPayCode, setEditPayCode] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [walletKey, setWalletKey] = useState(0);

  useEffect(() => {
    portalRequest<{ success: boolean; data: UserInfo }>("/portal/account/info")
      .then((res) => setInfo(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSavePayCode(val: string) {
    const res = await portalRequest<{ success: boolean; data: UserInfo }>(
      "/portal/account/info",
      { method: "PUT", json: { payCode: val } }
    );
    setInfo(res.data);
    setEditPayCode(false);
    toast.success("支付密码已更新");
  }

  /* ── Skeleton ── */
  if (loading) {
    return (
      <MineShell title="我的钱包">
        <div className="px-6 py-5 space-y-5">
          <div className="skeleton-shimmer-warm h-24 rounded-lg" />
          <div className="flex items-center gap-4">
            <div className="skeleton-shimmer w-16 h-4 rounded shrink-0" />
            <div className="skeleton-shimmer flex-1 h-4 rounded max-w-36" />
          </div>
          <div className="skeleton-shimmer h-64 rounded-md" />
        </div>
      </MineShell>
    );
  }

  if (!info) return null;

  return (
    <MineShell title="我的钱包">
      <div className="px-6 py-5 space-y-6">
        {/* ── 余额卡片 ── */}
        <div className="bg-primary-tint-2 border border-primary/25 rounded-xl px-6 py-5">
          <div className="flex items-center gap-2 mb-3 text-primary-dark">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-medium">账户余额</span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-primary-dark">
              ¥{info.wallet.toFixed(2)}
            </span>
            <button
              onClick={() => setRechargeOpen(true)}
              className="shrink-0 h-9 px-5 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              充值
            </button>
          </div>
        </div>

        {/* ── 支付密码 ── */}
        <div className="flex items-center gap-4 py-1">
          <span className="w-20 text-sm text-text-muted shrink-0">支付密码</span>
          <span className="flex items-center gap-2 flex-1">
            <span className="text-sm text-text font-mono tracking-widest">
              {showPayCode ? info.payCode : "••••••"}
            </span>
            <button
              onClick={() => setShowPayCode((v) => !v)}
              className="text-text-muted hover:text-text transition-colors cursor-pointer"
              title={showPayCode ? "隐藏" : "查看"}
            >
              {showPayCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </span>
          <button
            onClick={() => setEditPayCode(true)}
            className="shrink-0 h-7 px-4 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs rounded cursor-pointer hover:bg-[var(--color-primary)] hover:text-white transition-colors"
          >
            修改
          </button>
        </div>

        {/* ── 钱包流水 ── */}
        <WalletRecordsSection key={walletKey} />
      </div>

      <RechargeModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        onSuccess={(newBalance) => {
          setInfo((prev) => prev ? { ...prev, wallet: newBalance } : prev);
          setWalletKey((k) => k + 1);
        }}
      />

      {editPayCode && info && (
        <EditPayCodeModal
          value={info.payCode}
          onClose={() => setEditPayCode(false)}
          onSave={handleSavePayCode}
        />
      )}
    </MineShell>
  );
}
