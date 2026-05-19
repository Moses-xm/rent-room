"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RoomImage } from "@/components/portal/RoomImage";

interface CarouselItem {
  id: number;
  imageUrl: string;
  path: string;
}

const AUTOPLAY_DELAY = 6000;

type DirectionalEmblaApi = NonNullable<
  ReturnType<typeof useEmblaCarousel>[1]
> & {
  scrollTo: (index: number, jump?: boolean, direction?: number) => void;
};

export function HeroCarousel({ items }: { items: CarouselItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAutoplayRef = useRef<() => void>(() => {});

  const stopAutoplay = useCallback(() => {
    if (!timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();

    if (items.length <= 1 || !emblaApi) return;

    timerRef.current = setTimeout(() => {
      if (document.visibilityState === "hidden") return;
      emblaApi.scrollNext();
      startAutoplayRef.current();
    }, AUTOPLAY_DELAY);
  }, [emblaApi, items.length, stopAutoplay]);

  useEffect(() => {
    startAutoplayRef.current = startAutoplay;
  }, [startAutoplay]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    startAutoplay();
  }, [emblaApi, startAutoplay]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    startAutoplay();
  }, [emblaApi, startAutoplay]);

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;

      const currentIndex = emblaApi.selectedScrollSnap();
      const direction = index > currentIndex ? -1 : 1;

      (emblaApi as DirectionalEmblaApi).scrollTo(index, false, direction);
      startAutoplay();
    },
    [emblaApi, startAutoplay],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    startAutoplay();

    const handlePageShow = () => {
      emblaApi.reInit();
      startAutoplay();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        emblaApi.reInit();
        startAutoplay();
      } else {
        stopAutoplay();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAutoplay();
    };
  }, [emblaApi, onSelect, startAutoplay, stopAutoplay]);

  if (items.length === 0) {
    return <div className="w-full h-60 lg:h-117.5 mt-5 bg-surface" />;
  }

  return (
    <div className="relative w-full h-60 lg:h-117.5 mt-5 group">
      {/* Embla 视口 */}
      <div ref={emblaRef} className="w-full h-full overflow-hidden">
        <div className="flex h-full">
          {items.map((item, i) => (
            <div key={item.id} className="shrink-0 w-full h-full">
              <Link href={item.path || "#"} className="block w-full h-full">
                <RoomImage
                  src={item.imageUrl}
                  alt={`轮播图${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 左右箭头（hover 时显示） */}
      {items.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label="上一张"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
            aria-label="下一张"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 圆点导航 */}
      {items.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                i === selectedIndex ? "bg-white" : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`切换到第${i + 1}张`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
