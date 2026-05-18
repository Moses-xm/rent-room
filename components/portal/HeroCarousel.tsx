"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RoomImage } from "@/components/portal/RoomImage";

interface CarouselItem {
  id: number;
  imageUrl: string;
  path: string;
}

interface HeroCarouselProps {
  items: CarouselItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (!items.length) {
    return <div className="w-full h-60 lg:h-[470px] mt-5 bg-surface" />;
  }

  return (
    <div className="relative w-full h-60 lg:h-[470px] mt-5 overflow-hidden bg-surface">
      {items.map((item, i) => (
        <Link
          key={item.id}
          href={item.path || "#"}
          className={`absolute inset-0 transition-opacity duration-500 ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          tabIndex={i === current ? 0 : -1}
        >
          <RoomImage
            src={item.imageUrl}
            alt={`轮播图${i + 1}`}
            className="w-full h-full object-cover"
          />
        </Link>
      ))}

      {/* 圆点导航 */}
      {items.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                i === current ? "bg-white" : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`切换到第${i + 1}张`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
