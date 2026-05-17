"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  clearPortalAuth,
  getPortalProfile,
  PORTAL_AUTH_CHANGED_EVENT,
  PORTAL_LOGIN_PATH,
  type PortalProfile,
} from "@/utils/portal-auth";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { PORTAL_SEARCH_PATH } from "@/utils/constants";

const SEP = <span className="mx-2.5 text-[#ccc]">|</span>;

export function GlobalHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const router = useRouter();
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
    if (q) router.push(`${PORTAL_SEARCH_PATH}?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = () => {
    clearPortalAuth();
    router.replace(PORTAL_LOGIN_PATH);
  };

  const avatarUrl = resolveUploadedFileUrl(profile?.avatar);
  const displayName = profile?.nickname ?? profile?.username;

  return (
    <header className="w-full bg-white">
      {/* ── 移动端头部 ─────────────────────────── */}
      <div className="flex lg:hidden items-center justify-between h-14 px-4 border-b border-[#e6e6e6]">
        <Link href="/portal" className="text-(--color-primary-brand) text-xl font-medium">
          雅阁租房
        </Link>
        <button
          onClick={onMenuToggle}
          className="w-9 h-9 flex items-center justify-center text-[#333] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── 桌面端头部 ─────────────────────────── */}
      <div className="hidden lg:flex items-center justify-between max-w-295 mx-auto h-15.5">
        {/* 左：品牌 + 城市 */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/portal" className="text-(--color-primary-brand) text-[25px] leading-none">
            雅阁租房
          </Link>
          <div className="text-sm text-[#666]">
            当前城市：<span className="text-primary">杭州</span>
          </div>
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

        {/* 右：用户链接 */}
        <div className="shrink-0 flex items-center text-sm text-[#333] pl-6">
          {profile ? (
            <>
              {avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover mr-1.5"
                />
              )}
              <Link href="/portal/account/info" className="p-link">
                {displayName}
              </Link>
              {SEP}
              <Link href="/portal/account/info" className="p-link">
                个人中心
              </Link>
              {SEP}
              <span className="p-link" onClick={handleLogout}>
                退出
              </span>
            </>
          ) : (
            <>
              <Link href="/portal/login" className="p-link">
                登录
              </Link>
              {SEP}
              <Link href="/portal/register" className="p-link">
                注册
              </Link>
              {SEP}
              <Link href="/portal/account/info" className="p-link">
                个人中心
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
