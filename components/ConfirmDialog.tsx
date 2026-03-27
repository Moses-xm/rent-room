'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  icon?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  loading = false,
  danger = false,
  icon,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  const iconWrapCls = danger
    ? 'bg-red-50 text-red-500'
    : 'bg-amber-50 text-amber-500';
  const confirmBtnCls = danger
    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-100'
    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm space-y-5 rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${iconWrapCls}`}
        >
          {icon ?? <AlertTriangle size={32} />}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          {description ? (
            <div className="text-sm text-slate-500">{description}</div>
          ) : null}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${confirmBtnCls}`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
