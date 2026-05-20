import Link from "next/link";
import { RoomImage } from "@/components/portal/RoomImage";
import { RoomTags, type RoomTag } from "@/components/portal/RoomTags";

interface CommunityRowProps {
  href: string;
  name: string;
  imageUrl?: string;
  address?: string;
  district?: string;
  subwayLine?: string | null;
  roomCount?: number;
  avgPrice?: number;
}

function parseSubwayLines(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.join(" / ");
  } catch {}
  return raw.split(/[,，\/、]+/).map((s) => s.trim()).filter(Boolean).join(" / ");
}

export function CommunityRow({
  href,
  name,
  imageUrl,
  address,
  district,
  subwayLine,
  roomCount,
  avgPrice,
}: CommunityRowProps) {
  const locationText = [district, address].filter(Boolean).join("  ");

  const tags: RoomTag[] = [
    ...(subwayLine ? [
      { color: "green" as const, label: "近地铁" },
      { color: "yellow" as const, label: parseSubwayLines(subwayLine) },
    ] : []),
    ...(roomCount !== undefined ? [{ color: "blue" as const, label: `${roomCount}套房源` }] : []),
    ...(avgPrice !== undefined ? [{ color: "red" as const, label: `均价¥${avgPrice.toLocaleString()}` }] : []),
  ];

  return (
    <Link
      href={href}
      className="flex flex-col lg:flex-row group p-4 lg:p-5 border-b border-dashed border-border cursor-pointer hover:bg-surface"
    >
      {/* 图片 */}
      <div className="w-full lg:w-36 h-32 lg:h-27 shrink-0 overflow-hidden">
        <RoomImage src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* 信息：三行撑满缩略图高度 */}
      <div className="flex-1 lg:pl-5 overflow-hidden text-text-2 mt-3 lg:mt-0 flex flex-col gap-3">
        <div className="font-bold text-text text-base truncate group-hover:text-(--color-accent) group-hover:underline">
          {name}
        </div>
        {locationText && (
          <div className="text-sm truncate text-text-muted">{locationText}</div>
        )}
        {tags.length > 0 && <RoomTags tags={tags} />}
      </div>
    </Link>
  );
}
