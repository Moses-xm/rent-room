import Link from "next/link";
import { RoomImage } from "@/components/portal/RoomImage";
import { RoomTags, type RoomTag } from "@/components/portal/RoomTags";

interface RoomRowProps {
  href: string;
  name: string;
  imageUrl?: string;
  tags?: RoomTag[];
  subTitle?: string;
  broker?: string;
  description?: string;
  price: number;
}

export function RoomRow({
  href,
  name,
  imageUrl,
  tags,
  subTitle,
  broker,
  description,
  price,
}: RoomRowProps) {
  return (
    <Link
      href={href}
      className="flex flex-col lg:flex-row lg:justify-between group px-5 py-5 lg:px-5 lg:py-6 border-b border-dashed border-border cursor-pointer hover:bg-surface"
    >
      {/* 缩略图 */}
      <div className="w-full lg:w-45 h-40 lg:h-33.75 shrink-0 overflow-hidden">
        <RoomImage src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* 信息区 */}
      <div className="flex-1 lg:pl-5 overflow-hidden text-text-2 mt-4 lg:mt-0 flex flex-col lg:justify-between lg:h-33.75">
        <div className="font-bold text-text text-base truncate group-hover:text-(--color-accent) group-hover:underline">
          {name}
        </div>
        {(subTitle || broker) && (
          <div className="text-sm mt-3 lg:mt-0 flex items-center gap-5 truncate">
            {subTitle && <span className="truncate">{subTitle}</span>}
            {broker && (
              <span className="flex items-center gap-0.5 shrink-0 text-text-muted">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
                {broker}
              </span>
            )}
          </div>
        )}
        {description && <div className="text-sm mt-3 lg:mt-0 truncate text-text-muted">{description}</div>}
        {tags && tags.length > 0 && <RoomTags tags={tags} className="mt-3 lg:mt-0" />}
      </div>

      {/* 价格 */}
      <div className="text-(--color-accent-dark) font-bold text-xl shrink-0 flex items-center lg:justify-end mt-3 lg:mt-0 lg:pl-4">
        <span>¥{price.toLocaleString()}</span>
        <span className="text-sm text-text-muted font-normal ml-1">/月</span>
      </div>
    </Link>
  );
}
