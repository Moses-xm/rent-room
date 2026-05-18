export type TagColor = "red" | "green" | "blue" | "yellow";

export interface RoomTag {
  label: string;
  color: TagColor;
}

const TAG_STYLES: Record<TagColor, string> = {
  red:    "text-[#e88a78] bg-[#fcf4f1]",
  green:  "text-[#799374] bg-[#f2f6ed]",
  blue:   "text-[#6682ae] bg-[#f0f4f8]",
  yellow: "text-[#8b7500] bg-[#fffaf0]",
};

interface RoomTagsProps {
  tags: RoomTag[];
  className?: string;
}

export function RoomTags({ tags, className = "" }: RoomTagsProps) {
  if (!tags.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag, i) => (
        <span
          key={i}
          className={`${TAG_STYLES[tag.color]} h-5.5 px-2.5 text-xs leading-5.5 rounded-2xl`}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}
