import Link from "next/link";
import { RoomImage } from "@/components/portal/RoomImage";

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
  return (
    <Link
      href={href}
      className="flex flex-col lg:flex-row group p-4 lg:p-5 border-b border-dashed border-border cursor-pointer hover:bg-surface"
    >
      {/* 图片 */}
      <div className="w-full lg:w-36 h-32 lg:h-27 shrink-0 overflow-hidden">
        <RoomImage src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* 信息 */}
      <div className="flex-1 lg:pl-5 overflow-hidden text-text-2 mt-3 lg:mt-0">
        <div className="font-bold text-text text-base truncate group-hover:text-(--color-accent) group-hover:underline">
          {name}
        </div>
        {district && <div className="text-sm mt-1 truncate">{district}</div>}
        {address && <div className="text-sm mt-1 truncate text-text-muted">{address}</div>}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
          {roomCount !== undefined && <span>{roomCount} 套房源</span>}
          {avgPrice !== undefined && (
            <span>
              均价{" "}
              <span className="text-(--color-accent-dark) font-bold">
                ¥{avgPrice.toLocaleString()}
              </span>
            </span>
          )}
          {subwayLine && (
            <span className="inline-flex items-center gap-1 text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded">
              近地铁 · {subwayLine}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
