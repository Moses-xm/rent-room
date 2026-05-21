"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import { LogoutConfirmDialog } from "@/components/portal/LogoutConfirmDialog";
import { NotificationBell } from "@/components/portal/NotificationBell";
import {
  clearPortalAuth,
  getPortalProfile,
  PORTAL_AUTH_CHANGED_EVENT,
  PORTAL_LOGIN_PATH,
  type PortalProfile,
} from "@/utils/portal-auth";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { PORTAL_SEARCH_PATH } from "@/utils/constants";
import { CitySelector } from "@/components/CitySelector";

const SEP = <span className="mx-2.5 text-[#ccc]">|</span>;

export function GlobalHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!popoverOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const handleSearch = () => {
    const q = searchRef.current?.value.trim();
    if (q) router.push(`${PORTAL_SEARCH_PATH}?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = () => {
    clearPortalAuth();
    setConfirmOpen(false);
    router.replace(PORTAL_LOGIN_PATH);
  };

  const avatarUrl = resolveUploadedFileUrl(profile?.avatar);
  const displayName = profile?.nickname ?? profile?.username;

  return (
    <>
      <header className="w-full bg-white">
        {/* ── 移动端头部 ─────────────────────────── */}
        <div className="flex lg:hidden items-center h-14 px-4 border-b border-[#e6e6e6]">
          <button
            onClick={onMenuToggle}
            className="w-9 h-9 flex items-center justify-center text-[#333] cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/portal" className="flex-1 text-center text-(--color-primary-brand) text-xl font-medium">
            雅阁租房
          </Link>
          <div className="shrink-0 flex items-center pr-1">
            <CitySelector variant="portal" />
          </div>
        </div>

        {/* ── 桌面端头部 ─────────────────────────── */}
        <div className="hidden lg:flex items-center justify-between max-w-295 mx-auto px-4 h-15.5">
          {/* 左：品牌 + 城市 */}
          <div className="flex items-end gap-4 shrink-0">
            <Link href="/portal" className="text-(--color-primary-brand) text-[25px] leading-none">
              雅阁租房
            </Link>
            <CitySelector variant="portal" />
          </div>

          {/* 中：搜索框 */}
          <div className="flex items-center flex-1 max-w-150 mx-6 h-8.25">
            <input
              ref={searchRef}
              placeholder="请输入区域、小区或房源关键词"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 h-8.25 px-2.5 text-sm border border-[#d9d9d9] border-r-0 outline-none"
            />
            <button
              onClick={handleSearch}
              className="w-30 h-8.25 text-white text-[17px] tracking-[4px] bg-(--color-accent) cursor-pointer"
            >
              搜索
            </button>
          </div>

          {/* 右：用户区域 */}
          <div className="shrink-0 flex items-center text-sm text-[#333] pl-6">
            {profile ? (
              /* 已登录：铃铛 + 头像 + 用户名 */
              <><NotificationBell />
              <div ref={popoverRef} className="relative ml-3">
                <button
                  onClick={() => setPopoverOpen((v) => !v)}
                  className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary-tint-2 flex items-center justify-center text-primary text-xs font-semibold">
                        {(displayName ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-[#333]">{displayName}</span>
                </button>

                {/* Popover */}
                {popoverOpen && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white border border-[#e6e6e6] shadow-lg z-50 py-1">
                    <div className="px-4 py-2 text-xs text-[#999] border-b border-[#f0f0f0] truncate">
                      {displayName}
                    </div>
                    <Link
                      href="/portal/account/info"
                      onClick={() => setPopoverOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm text-[#333] hover:bg-[#f7f7f7] transition-colors cursor-pointer"
                    >
                      个人中心
                    </Link>
                    <button
                      onClick={() => { setPopoverOpen(false); setConfirmOpen(true); }}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-[#e74c3c] hover:bg-[#fff5f5] transition-colors cursor-pointer"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div></>
            ) : (
              /* 未登录 */
              <>
                <Link href="/portal/login" className="p-link">登录</Link>
                {SEP}
                <Link href="/portal/register" className="p-link">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <LogoutConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
