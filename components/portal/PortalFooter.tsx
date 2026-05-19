import { PORTAL_FOOTER_LINKS } from "@/utils/constants";

const SEP = <span className="mx-2.5 text-[#ccc]">|</span>;

export function PortalFooter() {
  return (
    <footer className="mt-5 bg-[#f9f9f9] border-t border-[#e6e6e6]">
      <div className="max-w-295 mx-auto px-4 text-center py-5">
        {/* 链接行 */}
        <div className="flex items-center justify-center h-[30px] text-xs text-[#333]">
          {PORTAL_FOOTER_LINKS.map((label, i) => (
            <span key={label} className="flex items-center">
              <a className="p-link">{label}</a>
              {i < PORTAL_FOOTER_LINKS.length - 1 && SEP}
            </span>
          ))}
        </div>
        {/* 版权行 */}
        <div className="text-xs text-[#333] h-[30px] leading-[30px]">
          Copyright © 2026 雅阁租房系统 All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
