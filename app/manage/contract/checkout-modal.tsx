'use client';

import { useState } from 'react';
import { LogOut, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
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

type CheckoutKind =
  | 'legal-expired'     // 到期退房（已付清 + 合同已到期）→ 合法
  | 'legal-early'       // 提前退房但已付清全部租金       → 合法
  | 'illegal';          // 仍有未付期数                  → 非法

function detectKind(contract: ContractItem): CheckoutKind {
  const payingPeriods = JSON.parse(contract.payingPeriod) as unknown[];
  if (payingPeriods.length > 0) return 'illegal';
  return new Date() >= new Date(contract.offlineTime) ? 'legal-expired' : 'legal-early';
}

export default function CheckoutModal({ contract, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClose = () => { if (!loading) onClose(); };

  const handleConfirm = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      // 后端自行判断合法/非法，此处无需传 legal 参数
      await request(`/manage/contract/${contract.id}/checkout`, { method: 'POST', json: {} });
      const kind = detectKind(contract);
      toast.success(kind === 'illegal' ? '提前退房已确认，押金不予退还' : '合法退房成功，押金已退还租客');
      onClose();
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const kind = contract ? detectKind(contract) : 'illegal';
  const isLegal = kind !== 'illegal';

  return (
    <Modal open={!!contract} onClose={handleClose}>
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden bg-card rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-100 grid place-items-center">
              <LogOut size={15} className="text-orange-600" />
            </div>
            <h2 className="text-h3 font-heading text-text">退房操作</h2>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 合同概况 */}
          <div className="bg-slate-50 border border-border rounded-xl p-4">
            <div className="grid grid-cols-2 gap-2 text-body-sm">
              <div className="col-span-2"><p className="text-text-muted mb-0.5">房源</p><p className="font-emphasis text-text">{contract?.room?.name ?? '—'}</p></div>
              <div><p className="text-text-muted mb-0.5">合同开始</p><p className="font-mono text-text">{contract ? fmtDate(contract.onlineTime) : '—'}</p></div>
              <div><p className="text-text-muted mb-0.5">合同截止</p><p className="font-mono text-text">{contract ? fmtDate(contract.offlineTime) : '—'}</p></div>
              <div><p className="text-text-muted mb-0.5">已交押金</p><p className="font-mono text-text">¥{contract?.pledge.toFixed(2)}</p></div>
              <div><p className="text-text-muted mb-0.5">租客</p><p className="font-emphasis text-text">{contract?.user?.username ?? '—'}</p></div>
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
                  <p className={`text-body font-semibold ${isLegal ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {kind === 'legal-expired' && '合法退房（到期）'}
                    {kind === 'legal-early'   && '合法退房（已付清）'}
                    {kind === 'illegal'        && '提前退房（非法）'}
                  </p>
                  <p className="text-body-sm text-text-muted mt-1 leading-relaxed">
                    {kind === 'legal-expired' && `合同已到期且全部租金已结清，押金 ¥${contract.pledge.toFixed(2)} 将从房东钱包退回租客钱包。`}
                    {kind === 'legal-early'   && `租客已提前结清全部租金，押金 ¥${contract.pledge.toFixed(2)} 将从房东钱包退回租客钱包。`}
                    {kind === 'illegal'        && `仍有未结清的租金期数，属于提前违约退房，押金 ¥${contract.pledge.toFixed(2)} 不予退还。`}
                  </p>
                  <p className="text-body-sm text-amber-600 mt-1.5">此操作不可撤销，房源将重新上架。</p>
                </div>
              </div>
            </div>
          )}

          {/* 提前但付清：额外提醒 */}
          {kind === 'legal-early' && contract && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-body-sm text-amber-700 leading-relaxed">
                该合同租约尚未到期（到期日 {fmtDate(contract.offlineTime)}），租客已主动结清所有租金，确认退房后押金照常退还。
              </p>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 h-10 border border-border rounded-xl text-body text-text hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex-1 h-10 rounded-xl text-body font-medium text-white transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2
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
