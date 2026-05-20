"use client";

import { useRef, useState } from "react";

interface Props {
  verified: boolean;
  onVerified: (v: boolean) => void;
  disabled?: boolean;
}

export function SliderCaptcha({ verified, onVerified, disabled = false }: Props) {
  const [value, setValue] = useState(0);
  const doneRef = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const v = Number(e.target.value);
    setValue(v);
    if (v >= 100) {
      doneRef.current = true;
      onVerified(true);
    } else if (doneRef.current) {
      doneRef.current = false;
      onVerified(false);
    }
  };

  const handleRelease = () => {
    if (!doneRef.current) setValue(0);
  };

  return (
    <div
      className={`relative h-9.5 overflow-hidden border ${
        verified
          ? "border-(--color-primary-brand) bg-[#f0f8ef]"
          : "border-[#d9d9d9] bg-[#f5f5f5]"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* green fill when verified */}
      {verified && (
        <div className="absolute inset-0 bg-[var(--color-primary-brand)] opacity-10 pointer-events-none" />
      )}

      {/* center text */}
      <div className="absolute inset-0 flex items-center justify-center text-sm text-[#aaa] pointer-events-none select-none px-12">
        {verified ? "验证通过" : "请按住滑块，拖动到最右边"}
      </div>

      {/* invisible range input covers full track */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onMouseUp={handleRelease}
        onTouchEnd={handleRelease}
        aria-label="滑块验证"
        className="portal-slider relative z-10 h-9.5 w-full cursor-grab appearance-none bg-transparent active:cursor-grabbing"
      />

      {/* visible thumb button */}
      <div
        className="pointer-events-none absolute top-0 z-20 flex h-9.5 w-10 items-center justify-center bg-white border-r border-[#d9d9d9] text-[#999] text-base shadow-sm transition-[left]"
        style={{ left: `calc((100% - 40px) * ${value / 100})` }}
      >
        {verified ? (
          <span className="text-(--color-primary-brand) font-bold text-sm">✓</span>
        ) : (
          <span className="text-[#bbb] font-bold tracking-tighter text-xs">›››</span>
        )}
      </div>
    </div>
  );
}
