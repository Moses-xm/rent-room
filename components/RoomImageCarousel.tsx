'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

type Props = {
  images: string[];
  name: string;
};

export default function RoomImageCarousel({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const total = images.length;

  const goPrev = () => setActive(i => (i - 1 + total) % total);
  const goNext = () => setActive(i => (i + 1) % total);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
    touchStartX.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50">
        <Home size={40} className="text-gray-300" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative overflow-hidden"
        style={{ height: '320px', touchAction: 'pan-y', userSelect: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 模糊背景条带 */}
        <div
          className="absolute inset-0 flex"
          style={{ transform: `translateX(-${active * 100}%)`, transition: 'transform 0.35s ease' }}
        >
          {images.map((url, i) => (
            <div key={i} className="relative w-full h-full shrink-0 overflow-hidden">
              <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'blur(8px)', transform: 'scale(1.08)', opacity: 0.65 }} />
            </div>
          ))}
        </div>
        {/* 图片条带 */}
        <div
          className="relative flex h-full"
          style={{ transform: `translateX(-${active * 100}%)`, transition: 'transform 0.35s ease' }}
        >
          {images.map((url, i) => (
            <div key={i} className="w-full h-full shrink-0 flex items-center justify-center">
              <img src={url} alt={i === 0 ? name : ''} draggable={false} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
        {total > 1 && (
          <button onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer">
            <ChevronLeft size={18} />
          </button>
        )}
        {total > 1 && (
          <button onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors cursor-pointer">
            <ChevronRight size={18} />
          </button>
        )}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${i === active ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>
      {total > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {images.map((url, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-colors cursor-pointer ${
                i === active ? 'border-[var(--color-primary,theme(colors.blue.500))]' : 'border-transparent'
              }`}>
              <img src={url} alt="" draggable={false} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
