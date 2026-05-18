import Link from "next/link";
import { RoomImage } from "@/components/portal/RoomImage";
import { RoomTags, type RoomTag } from "@/components/portal/RoomTags";

interface RoomRowProps {
  href: string;
  name: string;
  imageUrl?: string;
  tags?: RoomTag[];
  subTitle?: string;
  description?: string;
  price: number;
}

export function RoomRow({
  href,
  name,
  imageUrl,
  tags,
  subTitle,
  description,
  price,
}: RoomRowProps) {
  return (
    <Link
      href={href}
      className="flex flex-col lg:flex-row lg:justify-between group min-h-35 lg:min-h-43.75 p-4 lg:p-5 border-b border-dashed border-border cursor-pointer hover:bg-surface"
    >
      {/* 缩略图 */}
      <div className="w-full lg:w-45 h-40 lg:h-33.75 shrink-0 overflow-hidden">
        <RoomImage src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* 信息区 */}
      <div className="flex-1 lg:pl-5 overflow-hidden text-text-2 mt-3 lg:mt-0">
        <div className="font-bold text-text text-base truncate group-hover:text-(--color-accent) group-hover:underline">
          {name}
        </div>
        {subTitle && <div className="text-sm mt-1 truncate">{subTitle}</div>}
        {tags && tags.length > 0 && <RoomTags tags={tags} className="mt-2" />}
        {description && <div className="text-sm mt-2 line-clamp-2">{description}</div>}
      </div>

      {/* 价格 */}
      <div className="text-(--color-accent-dark) font-bold text-xl shrink-0 flex items-center lg:justify-end mt-3 lg:mt-0 lg:pl-4">
        <span>¥{price.toLocaleString()}</span>
        <span className="text-sm text-text-muted font-normal ml-1">/月</span>
      </div>
    </Link>
  );
}
