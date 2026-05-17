"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import {
  clearPortalAuth,
  getPortalProfile,
  PORTAL_AUTH_CHANGED_EVENT,
  PORTAL_LOGIN_PATH,
  type PortalProfile,
} from "@/utils/portal-auth";
import { PORTAL_NAV_MENU, PORTAL_SEARCH_PATH } from "@/utils/constants";

export function MobileNav({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);

  useEffect(() => {
    const sync = () => setProfile(getPortalProfile());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PORTAL_AUTH_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PORTAL_AUTH_CHANGED_EVENT, sync);
    };
  }, []);

  const handleSearch = () => {
    const q = searchRef.current?.value.trim();
    if (q) {
      router.push(`${PORTAL_SEARCH_PATH}?q=${encodeURIComponent(q)}`);
      onClose();
    }
  };

  const handleLogout = () => {
    clearPortalAuth();
    onClose();
    router.replace(PORTAL_LOGIN_PATH);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* 抽屉顶部：品牌 + 关闭 */}
      <div className="flex items-center justify-between h-14 px-4 bg-[var(--color-primary)] flex-shrink-0">
        <span className="text-white text-xl font-medium">雅阁租房</span>
        <button
          onClick={onClose}
          className="text-white cursor-pointer w-8 h-8 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 城市 */}
      <div className="px-4 py-3 text-sm text-[#666] border-b border-[#e6e6e6]">
        当前城市：<span className="text-[var(--color-primary)]">杭州</span>
      </div>

      {/* 搜索框 */}
      <div className="px-4 py-3 border-b border-[#e6e6e6]">
        <div className="flex h-9">
          <input
            ref={searchRef}
            placeholder="搜索区域、小区或房源"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-3 text-sm border border-[#d9d9d9] border-r-0 outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-4 text-white text-sm bg-[var(--color-accent)] cursor-pointer"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1">
        {PORTAL_NAV_MENU.map(({ href, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center px-4 py-3.5 text-[15px] border-b border-[#f0f0f0] transition-colors ${
                isActive
                  ? "text-[var(--color-primary)] bg-[var(--color-primary-tint)] border-l-[3px] border-l-[var(--color-primary)] pl-3.5"
                  : "text-[#333]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* 用户区域 */}
      <div className="border-t border-[#e6e6e6] px-4 py-4 flex-shrink-0">
        {profile ? (
          <div className="flex flex-col gap-3 text-sm">
            <div className="text-[#333] font-medium">{profile.nickname ?? profile.username}</div>
            <Link href="/portal/account/info" onClick={onClose} className="p-link">
              个人中心
            </Link>
            <button onClick={handleLogout} className="text-left text-[var(--color-accent)] cursor-pointer text-sm">
              退出登录
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/portal/login"
              onClick={onClose}
              className="text-[var(--color-primary)] font-medium"
            >
              登录
            </Link>
            <Link href="/portal/register" onClick={onClose} className="text-[#333]">
              注册
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
