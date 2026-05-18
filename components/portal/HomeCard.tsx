import Link from "next/link";
import { RoomImage } from "@/components/portal/RoomImage";

interface HomeCardProps {
  href: string;
  name: string;
  imageUrl?: string;
  leftText: string;
  rightText: string;
}

export function HomeCard({ href, name, imageUrl, leftText, rightText }: HomeCardProps) {
  return (
    <Link
      href={href}
      className="block border border-border bg-white cursor-pointer group hover:shadow-sm transition-shadow"
    >
      <div className="w-full aspect-[250/187] overflow-hidden">
        <RoomImage
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="text-[15px] text-center h-8.5 leading-8.5 px-2 truncate group-hover:text-(--color-accent) group-hover:underline">
        {name}
      </h3>
      <div className="flex justify-between px-5 text-sm text-text-2 pb-3">
        <span>{leftText}</span>
        <span className="text-(--color-accent-dark) font-bold">{rightText}</span>
      </div>
    </Link>
  );
}
