'use client';

import { useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/Modal';
import { fmtDate } from '@/utils/format';

export type ContractForPay = {
  id: number;
  onlineTime: string;
  offlineTime: string;
  fee: number;
  payingPeriod: string;
  room: { name: string } | null;
  user: { username: string } | null;
};

type Props = {
  contract: ContractForPay | null;
  onClose: () => void;
  onSuccess: () => void;
  onPay: (contractId: number, payCode: string) => Promise<void>;
};

type Period = { start: string; end: string };

export default function PayModal({ contract, onClose, onSuccess, onPay }: Props) {
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
      await onPay(contract!.id, payCode);
      toast.success('缴租成功');
      handleClose();
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={!!contract} onClose={handleClose}>
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-[var(--color-card)] rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 grid place-items-center">
              <CreditCard size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">交房租</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-sm grid place-items-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {nextPeriod ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-700 mb-2">下一期房租详情</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
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
                  <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">缴租时段</p>
                  <p className="font-mono text-[var(--color-text)] text-xs">{fmtDate(nextPeriod.start)} ~ {fmtDate(nextPeriod.end)}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">应付金额</p>
                  <p className="font-mono text-base font-semibold text-emerald-700">¥{contract?.fee.toFixed(2)}</p>
                </div>
                {contract?.user && (
                  <div className="col-span-2">
                    <p className="text-[var(--color-text-muted)] mb-0.5 text-xs">租客</p>
                    <p className="font-medium text-[var(--color-text)]">{contract.user.username}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-center text-sm text-[var(--color-text-muted)]">
              所有租期均已缴清
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-2">支付密码</label>
            <input
              type="password"
              maxLength={6}
              inputMode="numeric"
              autoFocus
              placeholder="请输入 6 位支付密码"
              value={payCode}
              onChange={(e) => setPayCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full h-11 px-3 border border-[var(--color-border)] rounded-xl text-sm outline-none
                         transition-[border-color,box-shadow] focus:border-[var(--color-primary)]
                         focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                         placeholder:text-[var(--color-text-muted)] tracking-[0.4em] text-center"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-10 border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !nextPeriod}
              className="flex-1 h-10 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : '确认缴租'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
