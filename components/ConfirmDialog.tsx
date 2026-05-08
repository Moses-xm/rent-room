'use client';

import { cloneElement, type ReactNode } from 'react';
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

  const iconBgColor = danger ? 'rgba(239,68,68,0.1)' : 'rgba(217,119,6,0.1)';
  const iconColor = danger ? '#ef4444' : '#d97706';
  const confirmBtnBgColor = danger ? '#ef4444' : '#1f2937';
  const confirmBtnHoverBgColor = danger ? '#dc2626' : '#111827';

  // Scale down custom icons to 18px
  const renderIcon = () => {
    if (!icon) {
      return <AlertTriangle size={18} color={iconColor} strokeWidth={2.5} />;
    }
    if (typeof icon === 'object' && 'props' in icon) {
      return cloneElement(icon as React.ReactElement<any>, { size: 18 });
    }
    return icon;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
      >
        <div className="flex items-start gap-4 mb-3">
          <div
            className="flex items-center justify-center rounded-xl w-10 h-10 shrink-0"
            style={{ background: iconBgColor }}
          >
            {renderIcon()}
          </div>
          <h3 className="font-semibold text-base text-slate-900">{title}</h3>
        </div>

        {description ? (
          <p className="text-sm text-slate-500 mb-5 ml-14">{description}</p>
        ) : null}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: '#f3f4f6',
              color: '#6b7280',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: confirmBtnBgColor }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = confirmBtnHoverBgColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = confirmBtnBgColor;
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
