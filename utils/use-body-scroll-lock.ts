import { useEffect } from 'react';

// 支持多个弹窗同时存在时的引用计数
let lockCount = 0;
let savedScrollY = 0;

function lockBody() {
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${savedScrollY}px`;
  }
  lockCount++;
}

function unlockBody() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
  }
}

export function useBodyScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    lockBody();
    return () => unlockBody();
  }, [enabled]);
}
