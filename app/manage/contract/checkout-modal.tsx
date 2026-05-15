'use client';

import { useState } from 'react';
import { LogOut, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import { Modal } from '@/components/Modal';
import type { ContractItem } from './page';

type Props = {
  contract: ContractItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CheckoutModal({ contract, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'choose' | 'confirm'>('choose');
  const [isLegal, setIsLegal] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleClose = () => { setMode('choose'); setIsLegal(true); onClose(); };

  const handleChoose = (legal: boolean) => { setIsLegal(legal); setMode('confirm'); };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await request(`/manage/contract/${contract!.id}/checkout`, { method: 'POST', json: { legal: isLegal } });
      toast.success(isLegal ? '合法退房成功，押金已退还租客' : '非法退房确认，押金不予退还');
      handleClose();
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const payingPeriods = contract ? (JSON.parse(contract.payingPeriod) as unknown[]) : [];

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
              <div><p className="text-text-muted mb-0.5">房源</p><p className="font-emphasis text-text truncate">{contract?.room?.name ?? '—'}</p></div>
              <div><p className="text-text-muted mb-0.5">租客</p><p className="font-emphasis text-text">{contract?.user?.username ?? '—'}</p></div>
              <div><p className="text-text-muted mb-0.5">已交押金</p><p className="font-mono text-text">¥{contract?.pledge.toFixed(2)}</p></div>
              <div><p className="text-text-muted mb-0.5">剩余期数</p><p className="text-text">{payingPeriods.length} 期</p></div>
            </div>
          </div>

          {mode === 'choose' && (
            <>
              <p className="text-body-sm text-text-muted">请选择退房类型：</p>
              <div className="space-y-3">
                <button
                  onClick={() => handleChoose(true)}
                  className="w-full text-left p-4 border-2 border-border rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 grid place-items-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <CheckCircle size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-body font-semibold text-text">合法退房</p>
                      <p className="text-body-sm text-text-muted mt-0.5">押金 ¥{contract?.pledge.toFixed(2)} 将退还给租客</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleChoose(false)}
                  className="w-full text-left p-4 border-2 border-border rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-100 grid place-items-center shrink-0 group-hover:bg-rose-200 transition-colors">
                      <AlertTriangle size={18} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-body font-semibold text-text">提前退房（非法）</p>
                      <p className="text-body-sm text-text-muted mt-0.5">押金 ¥{contract?.pledge.toFixed(2)} 将不予退还</p>
                    </div>
                  </div>
                </button>
              </div>
              <button onClick={handleClose} className="w-full h-10 border border-border rounded-xl text-body text-text hover:bg-surface-2 transition-colors cursor-pointer">取消</button>
            </>
          )}

          {mode === 'confirm' && (
            <>
              <div className={`rounded-xl p-4 border-2 ${isLegal ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${isLegal ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                    {isLegal ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-rose-600" />}
                  </div>
                  <div>
                    <p className={`text-body font-semibold ${isLegal ? 'text-emerald-700' : 'text-rose-700'}`}>{isLegal ? '合法退房确认' : '提前退房确认'}</p>
                    <p className="text-body-sm text-text-muted mt-1">
                      {isLegal
                        ? `押金 ¥${contract?.pledge.toFixed(2)} 将从房东钱包退回到租客钱包，房源重新上架。`
                        : `押金 ¥${contract?.pledge.toFixed(2)} 不予退还给租客，房源重新上架。`}
                      此操作不可撤销。
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMode('choose')} disabled={loading} className="flex-1 h-10 border border-border rounded-xl text-body text-text hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer">返回</button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 h-10 rounded-xl text-body font-medium text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2
                    ${isLegal ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  <LogOut size={14} />
                  {loading ? '处理中...' : '确认退房'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
