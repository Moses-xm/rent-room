'use client';

import { type ReactNode } from 'react';
import { useBodyScrollLock } from '@/utils/use-body-scroll-lock';

type ModalProps = {
  open: boolean;
  children: ReactNode;
};

/**
 * 所有弹窗的基础容器。
 * 负责：遮罩层渲染、backdrop blur、居中布局、背景滚动锁定。
 * 各弹窗只需在 children 里放自己的面板内容（带 zoom-in-95 动画）。
 */
export function Modal({ open, children }: ModalProps) {
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[3px] animate-in fade-in duration-200 *:max-h-[80dvh] md:*:max-h-[calc(100dvh-2rem)]">
      {children}
    </div>
  );
}
