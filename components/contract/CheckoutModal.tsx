'use client';

import { useState } from 'react';
import { LogOut, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/Modal';
import { fmtDate } from '@/utils/format';

export type ContractForCheckout = {
  id: number;
  onlineTime: string;
  offlineTime: string;
  pledge: number;
  payingPeriod: string;
  room: { name: string } | null;
  user: { username: string } | null;
};

type CheckoutKind = 'legal-expired' | 'legal-early' | 'illegal';

function detectKind(contract: ContractForCheckout): CheckoutKind {
  const payingPeriods = JSON.parse(contract.payingPeriod) as unknown[];
  if (payingPeriods.length > 0) return 'illegal';
  return new Date() >= new Date(contract.offlineTime) ? 'legal-expired' : 'legal-early';
}

type Props = {
  contract: ContractForCheckout | null;
  onClose: () => void;
  onSuccess: () => void;
  onCheckout: (contractId: number) => Promise<void>;
};

export default function CheckoutModal({ contract, onClose, onSuccess, onCheckout }: Props) {
  const [loading, setLoading] = useState(false);

  function handleClose() { if (!loading) onClose(); }

  async function handleConfirm() {
    if (!contract) return;
    setLoading(true);
    try {
      const kind = detectKind(contract);
      await onCheckout(contract.id);
      toast.success(kind === 'illegal' ? '提前退房已确认，押金不予退还' : '合法退房成功，押金已退还');
      onClose();
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const kind = contract ? detectKind(contract) : 'illegal';
  const isLegal = kind !== 'illegal';

  return (
    <Modal open={!!contract} onClose={handleClose}>
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-[var(--color-card)] rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 grid place-items-center">
              <LogOut size={15} className="text-orange-600" />
            </div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">退房操作</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-sm grid place-items-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 合同概况 */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">房源</p>
                <p className="font-medium text-[var(--color-text)]">{contract?.room?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">合同开始</p>
                <p className="font-mono text-[var(--color-text)] text-xs">{contract ? fmtDate(contract.onlineTime) : '—'}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">合同截止</p>
                <p className="font-mono text-[var(--color-text)] text-xs">{contract ? fmtDate(contract.offlineTime) : '—'}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">已交押金</p>
                <p className="font-mono text-[var(--color-text)] text-xs">¥{contract?.pledge.toFixed(2)}</p>
              </div>
              {contract?.user && (
                <div>
                  <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">租客</p>
                  <p className="font-medium text-[var(--color-text)] text-xs">{contract.user.username}</p>
                </div>
              )}
            </div>
          </div>

          {/* 自动判断结果 */}
          {contract && (
            <div className={`rounded-xl p-4 border-2 ${isLegal ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${isLegal ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                  {isLegal
                    ? <CheckCircle size={18} className="text-emerald-600" />
                    : <AlertTriangle size={18} className="text-rose-600" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isLegal ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {kind === 'legal-expired' && '合法退房（到期）'}
                    {kind === 'legal-early'   && '合法退房（已付清）'}
                    {kind === 'illegal'        && '提前退房（非法）'}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1 leading-relaxed">
                    {kind === 'legal-expired' && `合同已到期且全部租金已结清，押金 ¥${contract.pledge.toFixed(2)} 将从房东钱包退回租客钱包。`}
                    {kind === 'legal-early'   && `租客已提前结清全部租金，押金 ¥${contract.pledge.toFixed(2)} 将从房东钱包退回租客钱包。`}
                    {kind === 'illegal'        && `仍有未结清的租金期数，属于提前违约退房，押金 ¥${contract.pledge.toFixed(2)} 不予退还。`}
                  </p>
                  <p className="text-xs text-amber-600 mt-1.5">此操作不可撤销，房源将重新上架。</p>
                </div>
              </div>
            </div>
          )}

          {/* 提前但付清：额外提醒 */}
          {kind === 'legal-early' && contract && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 leading-relaxed">
                该合同租约尚未到期（到期日 {fmtDate(contract.offlineTime)}），租客已主动结清所有租金，确认退房后押金照常退还。
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-10 border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
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
