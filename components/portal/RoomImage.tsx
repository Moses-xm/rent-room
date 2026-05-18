"use client";

interface RoomImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function RoomImage({ src, alt = "", className = "" }: RoomImageProps) {
  const placeholder = (
    <div
      className={`${className} bg-[repeating-linear-gradient(-45deg,#f4f4f4,#f4f4f4_10px,#ededed_10px,#ededed_20px)] flex items-center justify-center text-xs text-[#9aa0a6]`}
    >
      暂无图片
    </div>
  );

  if (!src) return placeholder;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        const ph = document.createElement("div");
        ph.className = `${el.className} bg-[repeating-linear-gradient(-45deg,#f4f4f4,#f4f4f4_10px,#ededed_10px,#ededed_20px)] flex items-center justify-center text-xs text-[#9aa0a6]`;
        ph.textContent = "图片占位";
        el.replaceWith(ph);
      }}
    />
  );
}
