'use client';

import { useState } from 'react';
import { CreditCard, X } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import { Modal } from '@/components/Modal';
import { fmtDate } from '@/utils/format';
import type { ContractItem } from './page';

type Props = {
  contract: ContractItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function PayModal({ contract, onClose, onSuccess }: Props) {
  const [payCode, setPayCode] = useState('');
  const [loading, setLoading] = useState(false);

  const payingPeriods = contract ? (JSON.parse(contract.payingPeriod) as { start: string; end: string }[]) : [];
  const nextPeriod = payingPeriods[0];

  const handleClose = () => { setPayCode(''); onClose(); };

  const handleSubmit = async () => {
    if (!payCode || payCode.length !== 6) { toast.error('请输入 6 位支付密码'); return; }
    if (!nextPeriod) { toast.error('所有租期均已缴清'); return; }
    setLoading(true);
    try {
      await request(`/manage/contract/${contract!.id}/pay`, { method: 'POST', json: { payCode } });
      toast.success('缴租成功');
      handleClose();
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!contract} onClose={handleClose}>
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-card rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 grid place-items-center">
              <CreditCard size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-h3 font-heading text-text">交房租</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {nextPeriod ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <p className="text-body-sm font-semibold text-emerald-700 mb-2">下一期房租详情</p>
              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <div className="col-span-2">
                  <p className="text-text-muted mb-0.5">房源</p>
                  <p className="font-emphasis text-text">{contract?.room?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-text-muted mb-0.5">合同开始</p>
                  <p className="font-mono text-text">{contract ? fmtDate(contract.onlineTime) : '—'}</p>
                </div>
                <div>
                  <p className="text-text-muted mb-0.5">合同截止</p>
                  <p className="font-mono text-text">{contract ? fmtDate(contract.offlineTime) : '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-muted mb-0.5">缴租时段</p>
                  <p className="font-mono text-text">{fmtDate(nextPeriod.start)} ~ {fmtDate(nextPeriod.end)}</p>
                </div>
                <div>
                  <p className="text-text-muted mb-0.5">应付金额</p>
                  <p className="font-mono text-h3 font-heading text-emerald-700">¥{contract?.fee.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-text-muted mb-0.5">租客</p>
                  <p className="font-emphasis text-text">{contract?.user?.username ?? '—'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-border rounded-xl p-4 text-center text-body text-text-muted">
              所有租期均已缴清
            </div>
          )}

          <div>
            <label className="block text-body-sm font-emphasis text-text mb-2">租客支付密码</label>
            <input
              type="password"
              maxLength={6}
              inputMode="numeric"
              placeholder="请输入租客 6 位支付密码"
              value={payCode}
              onChange={(e) => setPayCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full h-11 px-3 border border-border rounded-xl text-body outline-none
                         transition-[border-color,box-shadow] focus:border-primary
                         focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                         placeholder:text-text-muted tracking-[0.4em] text-center"
            />
            <p className="text-caption text-text-muted mt-1.5">代替租客输入其 6 位数字支付密码进行确认</p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleClose} disabled={loading} className="flex-1 h-10 border border-border rounded-xl text-body text-text hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer">取消</button>
            <button onClick={handleSubmit} disabled={loading || !nextPeriod} className="flex-1 h-10 bg-emerald-600 text-white rounded-xl text-body font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? '处理中...' : '确认缴租'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
