import { useEffect } from 'react';

// 支持多个弹窗同时存在时的引用计数
let lockCount = 0;
let savedScrollY = 0;
let savedPaddingRight = '';

function lockBody() {
  if (lockCount === 0) {
    // 测量滚动条宽度，锁定后以 padding-right 补偿，避免内容区抖动
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    savedScrollY = window.scrollY;
    savedPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${savedScrollY}px`;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
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
    document.body.style.paddingRight = savedPaddingRight;
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
