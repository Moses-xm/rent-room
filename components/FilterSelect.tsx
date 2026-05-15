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
}

export default function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
    if (!open || !triggerRef.current || !panelRef.current) return;
    panelRef.current.style.width = `${triggerRef.current.getBoundingClientRect().width}px`;
    updatePos();
    panelRef.current.style.visibility = 'visible';
  }, [open, updatePos]);

  // 滚动时跟随重新定位（面板内部滚动除外）；窗口 resize 时也重新定位
  useEffect(() => {
    if (!open) return;
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
  }, [open, reposition]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Escape 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-8.5 pl-3 pr-8 border border-border rounded-sm bg-card text-text-2 text-body outline-none focus:border-primary transition-colors text-left relative"
      >
        <span className="block truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-[200] bg-card border border-border rounded-sm shadow-lg overflow-y-auto max-h-60"
          style={{ top: 0, left: 0, visibility: 'hidden' }}
        >
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
