'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type FilterSelectOption = { value: string; label: string };

interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: FilterSelectOption[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  error?: string;
}

export default function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  clearable = true,
  error,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // disabled 时面板不可见；派生状态避免在 effect 内同步 setState
  const effectiveOpen = open && !disabled;

  // 纯 DOM 更新，不含 setState（供 useLayoutEffect 同步调用）
  const updatePos = useCallback(() => {
    if (!triggerRef.current || !panelRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const panel = panelRef.current;
    const ph = Math.min(panel.scrollHeight, 240);
    const spaceBelow = vh - trigger.bottom - 4;
    const top = spaceBelow >= ph ? trigger.bottom + 4 : trigger.top - ph - 4;
    panel.style.left = `${trigger.left}px`;
    panel.style.top = `${top}px`;
  }, []);

  // 滚动/resize 回调用：先判断触发器是否离屏，离屏则关闭，否则重新定位
  const reposition = useCallback(() => {
    if (!triggerRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    if (trigger.bottom < 0 || trigger.top > vh) {
      setOpen(false);
    } else {
      updatePos();
    }
  }, [updatePos]);

  // 初次打开：设置宽度、定位、显示（仅 DOM 操作，不调用含 setState 的函数）
  useLayoutEffect(() => {
    if (!effectiveOpen || !triggerRef.current || !panelRef.current) return;
    panelRef.current.style.width = `${triggerRef.current.getBoundingClientRect().width}px`;
    updatePos();
    panelRef.current.style.visibility = 'visible';
  }, [effectiveOpen, updatePos]);

  // 滚动时跟随重新定位（面板内部滚动除外）；窗口 resize 时也重新定位
  useEffect(() => {
    if (!effectiveOpen) return;
    let rafId: number;
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(reposition);
    };
    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(reposition);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
    };
  }, [effectiveOpen, reposition]);

  // 点击外部关闭
  useEffect(() => {
    if (!effectiveOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [effectiveOpen]);

  // Escape 关闭
  useEffect(() => {
    if (!effectiveOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [effectiveOpen]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className={`w-full h-8.5 pl-3 pr-8 border rounded-sm bg-card text-text-2 text-body outline-none transition-[border-color,box-shadow] text-left relative disabled:opacity-40 disabled:cursor-not-allowed ${
          error
            ? 'border-danger hover:border-danger focus:border-danger focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_15%,transparent)]'
            : 'border-border hover:border-text-disabled focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
        }`}
      >
        <span className="block truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted transition-transform duration-150 ${effectiveOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {effectiveOpen && (
        <div
          ref={panelRef}
          className="fixed z-[200] bg-card border border-border rounded-sm shadow-lg overflow-y-auto max-h-60"
          style={{ top: 0, left: 0, visibility: 'hidden' }}
        >
          {clearable && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 text-body transition-colors ${
                !value ? 'text-primary font-medium' : 'text-text-muted hover:bg-surface-2'
              }`}
            >
              <span className="flex-1 min-w-0 truncate">{placeholder}</span>
              {!value && <Check size={13} className="shrink-0" />}
            </button>
          )}

          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 text-body transition-colors ${
                o.value === value
                  ? 'text-primary font-medium bg-primary-tint'
                  : 'text-text hover:bg-surface-2'
              }`}
            >
              <span className="flex-1 min-w-0 truncate">{o.label}</span>
              {o.value === value && <Check size={13} className="shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
