"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PORTAL_NAV_MENU } from "@/utils/constants";

export function TopMenu() {
  const pathname = usePathname();

  return (
    // 移动端隐藏，桌面端全宽绿色导航栏
    <nav className="hidden lg:block w-full bg-primary">
      <div className="flex max-w-295 mx-auto px-4">
        {PORTAL_NAV_MENU.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`p-menu-link${isActive ? " active" : ""}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
