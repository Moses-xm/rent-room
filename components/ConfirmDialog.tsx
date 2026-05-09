'use client';

import { cloneElement, type ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/Modal';

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
  const renderIcon = () => {
    if (!icon) return <AlertTriangle size={18} strokeWidth={2.5} />;
    if (typeof icon === 'object' && 'props' in icon) {
      return cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 18 });
    }
    return icon;
  };

  return (
    <Modal open={open}>
      <div className="relative w-full max-w-sm bg-card border border-border rounded-lg shadow-(--shadow-lg) p-6 animate-in zoom-in-95 duration-200">

        {/* 图标 + 标题 */}
        <div className="flex items-start gap-4 mb-3">
          <div
            className={`w-11 h-11 rounded-full grid place-items-center shrink-0 ${
              danger ? 'bg-danger-bg text-danger' : 'bg-warning-bg text-warning'
            }`}
          >
            {renderIcon()}
          </div>
          <h3 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-tight mt-1">
            {title}
          </h3>
        </div>

        {description && (
          <p className="text-body text-text-muted leading-relaxed mb-5 ml-15">
            {description}
          </p>
        )}

        {/* 按钮 */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-8.5 px-3.5 text-body rounded-sm font-medium transition-colors
                       bg-card border border-border text-text-2
                       hover:bg-surface-2
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-8.5 px-3.5 text-body rounded-sm font-medium transition-colors
                       bg-danger text-white hover:opacity-90 active:scale-95
                       disabled:cursor-not-allowed disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
