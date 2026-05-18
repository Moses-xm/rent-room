"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RoomImage } from "@/components/portal/RoomImage";

interface CarouselItem {
  id: number;
  imageUrl: string;
  path: string;
}

export function HeroCarousel({ items }: { items: CarouselItem[] }) {
  const total = items.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 首尾各克隆一张：[last_clone, ...items, first_clone]
  // 从 idx=1 开始（真实第一张），自动播放永远向右
  const extended = total > 1 ? [items[total - 1], ...items, items[0]] : items;
  const [idx, setIdx] = useState(total > 1 ? 1 : 0);
  const [animated, setAnimated] = useState(true);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total <= 1) return;
    timerRef.current = setInterval(() => setIdx((i) => i + 1), 6000);
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  // 过渡结束后：若停在克隆帧，无动画跳回真实帧
  const handleTransitionEnd = useCallback(() => {
    if (total <= 1) return;
    if (idx === extended.length - 1) {
      // 停在 first_clone → 跳回真实第一张
      setAnimated(false);
      setIdx(1);
    } else if (idx === 0) {
      // 停在 last_clone → 跳回真实最后一张
      setAnimated(false);
      setIdx(total);
    }
  }, [idx, total, extended.length]);

  // 双 rAF：等 DOM 完成无动画跳转后，再恢复动画
  useEffect(() => {
    if (!animated) {
      let f2: number;
      const f1 = requestAnimationFrame(() => {
        f2 = requestAnimationFrame(() => setAnimated(true));
      });
      return () => {
        cancelAnimationFrame(f1);
        cancelAnimationFrame(f2);
      };
    }
  }, [animated]);

  const goTo = useCallback((newIdx: number) => {
    setIdx(newIdx);
    resetTimer();
  }, [resetTimer]);

  // 圆点高亮对应真实索引（0-based）
  const dotIdx =
    total <= 1 ? 0
    : idx === 0 ? total - 1
    : idx >= extended.length - 1 ? 0
    : idx - 1;

  if (total === 0) {
    return <div className="w-full h-60 lg:h-[470px] mt-5 bg-surface" />;
  }

  const slideW = 100 / extended.length;

  return (
    <div className="relative w-full h-60 lg:h-[470px] mt-5 overflow-hidden bg-surface group">

      {/* 滑动轨道 */}
      <div
        className={animated ? "flex h-full transition-transform duration-500 ease-in-out" : "flex h-full"}
        style={{
          width: `${extended.length * 100}%`,
          transform: `translateX(-${idx * slideW}%)`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extended.map((item, i) => (
          <div key={i} className="h-full shrink-0" style={{ width: `${slideW}%` }}>
            <Link href={item.path || "#"} className="block w-full h-full">
              <RoomImage
                src={item.imageUrl}
                alt={`轮播图${i}`}
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
        ))}
      </div>

      {/* 左右箭头（hover 时显示） */}
      {total > 1 && (
        <>
          <button
            onClick={() => goTo(idx - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label="上一张"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goTo(idx + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label="下一张"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 圆点导航 */}
      {total > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i + 1)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                i === dotIdx ? "bg-white" : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`切换到第${i + 1}张`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
