'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

type DrawerProps = {
  open: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Drawer({ open, title, subtitle, onClose, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[100]">
      {/* 点击遮罩关闭 */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="fixed right-0 top-0 bottom-0 w-[480px] max-w-[96vw]
                   bg-[var(--color-card)] z-[101] flex flex-col
                   shadow-[-16px_0_40px_rgba(0,0,0,.12)]
                   animate-in slide-in-from-right-5 duration-250"
      >
        {/* head */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border-subtle)] shrink-0">
          <div>
            {title && (
              <div className="font-[family-name:var(--typeface-display)] text-[20px] font-medium text-[var(--color-text)] leading-tight">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-[12.5px] text-[var(--color-text-muted)] mt-1">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-[var(--radius-sm)] grid place-items-center
                       text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]
                       hover:text-[var(--color-text)] transition-colors shrink-0 ml-4"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* foot */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
