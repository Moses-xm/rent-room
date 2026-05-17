'use client';

import { useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
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

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function RenewModal({ contract, onClose, onSuccess }: Props) {
  const [renewMonths, setRenewMonths] = useState('');
  const [loading, setLoading] = useState(false);

  const payMonths = contract?.room?.pay ?? 1;
  const renewMonthsNum = parseInt(renewMonths) || 0;
  const isValidRenew = renewMonthsNum > 0 && renewMonthsNum % payMonths === 0;

  const preview = useMemo(() => {
    if (!contract || !isValidRenew) return null;
    return { newEnd: addMonths(new Date(contract.offlineTime), renewMonthsNum) };
  }, [contract, renewMonthsNum, isValidRenew]);

  const handleClose = () => { setRenewMonths(''); onClose(); };

  const handleSubmit = async () => {
    if (!isValidRenew) { toast.error(`续租月数必须是 ${payMonths} 的整数倍`); return; }
    setLoading(true);
    try {
      await request(`/manage/contract/${contract!.id}/renew`, { method: 'POST', json: { renewMonths: renewMonthsNum } });
      toast.success(`续租 ${renewMonthsNum} 个月成功`);
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
            <div className="w-8 h-8 rounded-full bg-sky-100 grid place-items-center">
              <RefreshCw size={15} className="text-sky-600" />
            </div>
            <h2 className="text-h3 font-heading text-text">续租</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* 当前合同信息 */}
          <div className="bg-slate-50 border border-border rounded-xl p-4">
            <p className="text-body-sm font-semibold text-text mb-3">当前合同</p>
            <div className="grid grid-cols-2 gap-2 text-body-sm">
              <div className="col-span-2">
                <p className="text-text-muted mb-0.5">房源名称</p>
                <p className="text-text font-medium">{contract?.room?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-text-muted mb-0.5">最短租期</p>
                <p className="text-text">{contract?.room?.minTenancy ?? '—'} 个月</p>
              </div>
              <div>
                <p className="text-text-muted mb-0.5">付款方式</p>
                <p className="text-text">每 {payMonths} 个月一付</p>
              </div>
              <div>
                <p className="text-text-muted mb-0.5">合同开始</p>
                <p className="font-mono text-text">{contract ? fmtDate(contract.onlineTime) : '—'}</p>
              </div>
              <div>
                <p className="text-text-muted mb-0.5">合同截止</p>
                <p className="font-mono text-text">{contract ? fmtDate(contract.offlineTime) : '—'}</p>
              </div>
              <div>
                <p className="text-text-muted mb-0.5">每期租金</p>
                <p className="font-mono text-text">¥{contract?.fee.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-muted mb-0.5">续租次数</p>
                <p className="text-text">{contract?.renewTimes ?? 0} 次</p>
              </div>
            </div>
          </div>

          {/* 续租月数 */}
          <div>
            <label className="block text-body-sm font-emphasis text-text mb-2">
              续租月数
              <span className="text-text-muted font-normal ml-2">必须是 {payMonths} 的整数倍</span>
            </label>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {[payMonths, payMonths * 2, payMonths * 3, payMonths * 4].map((m) => (
                <button
                  key={m}
                  onClick={() => setRenewMonths(String(m))}
                  className={`px-3 h-8 rounded-lg border text-body-sm transition-colors cursor-pointer
                    ${renewMonthsNum === m ? 'border-primary bg-primary-tint text-primary font-medium' : 'border-border text-text-muted hover:border-primary hover:text-primary'}`}
                >
                  {m} 月
                </button>
              ))}
            </div>
            <input
              type="number"
              min={payMonths}
              step={payMonths}
              placeholder={`自定义（${payMonths} 的整数倍）`}
              value={renewMonths}
              onChange={(e) => setRenewMonths(e.target.value)}
              className={`w-full h-10 px-3 border rounded-xl text-body outline-none transition-[border-color,box-shadow]
                ${renewMonths && !isValidRenew ? 'border-red-400' : 'border-border focus:border-primary'}
                focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)] placeholder:text-text-muted`}
            />
            {renewMonths && !isValidRenew && (
              <p className="text-caption text-red-500 mt-1">续租月数必须是 {payMonths} 的整数倍</p>
            )}
          </div>

          {/* 预览 */}
          {preview && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={13} className="text-sky-600" />
                <p className="text-body-sm font-semibold text-sky-700">续租预览</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-body-sm">
                <div>
                  <p className="text-text-muted mb-0.5">续租月数</p>
                  <p className="text-text">{renewMonthsNum} 个月</p>
                </div>
                <div>
                  <p className="text-text-muted mb-0.5">续租后截止</p>
                  <p className="font-mono text-sky-700 font-medium">{fmtDate(preview.newEnd.toISOString())}</p>
                </div>
              </div>
              <p className="text-caption text-sky-600 pt-1">续租后可在合同详情中另行交租</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleClose} disabled={loading} className="flex-1 h-10 border border-border rounded-xl text-body text-text hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">取消</button>
            <button onClick={handleSubmit} disabled={loading || !isValidRenew} className="flex-1 h-10 bg-sky-600 text-white rounded-xl text-body font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
              {loading ? '处理中...' : '确认续租'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
