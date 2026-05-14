"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Settings, UserRound } from "lucide-react";
import { CitySelector } from "@/components/CitySelector";
import ConfirmDialog from "@/components/ConfirmDialog";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { request } from "@/utils/request";
import {
  MANAGE_LOGIN_PATH,
  MANAGE_PROFILE_CHANGED_EVENT,
  MANAGE_PROFILE_PATH,
  clearManageToken,
  getManageProfile,
  setManageProfile,
  type ManageProfile,
} from "@/utils/manage-auth";

type ManageProfileResponse = {
  success: boolean;
  data?: { username: string; avatar?: string | null };
};

function getAvatarFallback(username?: string | null) {
  const name = username?.trim();
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

type CrumbItem = { label: string; href?: string };

function resolveCrumbs(pathname: string): CrumbItem[] {
  if (/^\/manage\/user\/.+/.test(pathname))
    return [{ label: "用户管理", href: "/manage/user" }, { label: "用户详情" }];
  if (/^\/manage\/community\/new$/.test(pathname))
    return [{ label: "小区管理", href: "/manage/community" }, { label: "新建小区" }];
  if (/^\/manage\/community\/\d+\/edit$/.test(pathname))
    return [{ label: "小区管理", href: "/manage/community" }, { label: "编辑小区" }];
  if (/^\/manage\/community\/\d+/.test(pathname))
    return [{ label: "小区管理", href: "/manage/community" }, { label: "小区详情" }];
  if (/^\/manage\/room\/new$/.test(pathname))
    return [{ label: "房源管理", href: "/manage/room" }, { label: "新建房源" }];
  if (/^\/manage\/room\/\d+\/edit$/.test(pathname))
    return [{ label: "房源管理", href: "/manage/room" }, { label: "编辑房源" }];
  if (/^\/manage\/room\/\d+/.test(pathname))
    return [{ label: "房源管理", href: "/manage/room" }, { label: "房源详情" }];
  const flat: Record<string, string> = {
    "/manage/community": "小区管理",
    "/manage/user":      "用户管理",
    "/manage/room":      "房源管理",
    "/manage/admin":     "管理员管理",
    "/manage/facility":  "房屋设施",
    "/manage/carousel":  "轮播图管理",
    "/manage/profile":   "个人资料",
  };
  const entry = Object.entries(flat).find(([p]) => pathname.startsWith(p));
  return entry ? [{ label: entry[1] }] : [];
}

export function Topbar({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [profile, setProfile]           = useState<ManageProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [logoutOpen, setLogoutOpen]     = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const crumbs = resolveCrumbs(pathname);
  const avatarUrl      = resolveUploadedFileUrl(profile?.avatar);
  const avatarFallback = getAvatarFallback(profile?.username);

  useEffect(() => {
    const sync = () => { setProfile(getManageProfile()); setProfileReady(true); };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(MANAGE_PROFILE_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(MANAGE_PROFILE_CHANGED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!profileReady || profile?.username) return;
    let cancelled = false;
    request<ManageProfileResponse>("/manage/profile", { silent: true }).then((res) => {
      if (cancelled || !res.data?.username) return;
      const next: ManageProfile = res.data.avatar
        ? { username: res.data.username, avatar: res.data.avatar }
        : { username: res.data.username };
      setManageProfile(next);
      setProfile(next);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [profile?.username, profileReady]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (e.target instanceof Node && !menuRef.current?.contains(e.target))
        setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    clearManageToken();
    setMenuOpen(false);
    setLogoutOpen(false);
    router.replace(MANAGE_LOGIN_PATH);
  };

  const Avatar = ({ size }: { size: "sm" | "lg" }) => {
    const cls = size === "sm" ? "w-7 h-7 text-caption" : "w-9.5 h-9.5 text-[14px]";
    return (
      <div className={`${cls} rounded-full overflow-hidden grid place-items-center shrink-0
                       bg-primary-tint text-primary-dark font-semibold`}>
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatarUrl} alt={profile?.username ?? "头像"} className="h-full w-full object-cover" />
          : avatarFallback}
      </div>
    );
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full flex items-center bg-card border-b border-border"
        style={{ height: 60, padding: "0 28px" }}
      >
        {/* 汉堡菜单按钮（仅移动端） */}
        <button
          onClick={onMobileMenuToggle}
          title="打开菜单"
          className="lg:hidden w-8.5 h-8.5 mr-2 rounded-sm grid place-items-center
                     text-text-2 hover:bg-surface-2 hover:text-text transition-colors"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        {/* 面包屑 */}
        <nav className="hidden lg:flex items-center gap-2 text-body-sm">
          <Link
            href="/manage"
            className={`transition-colors ${crumbs.length ? "text-text-muted hover:text-text" : "text-text font-emphasis"}`}
          >
            Dashboard
          </Link>
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-text-disabled">/</span>
              {crumb.href
                ? <Link href={crumb.href} className="text-text-muted hover:text-text transition-colors">{crumb.label}</Link>
                : <span className="text-text font-emphasis">{crumb.label}</span>
              }
            </span>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center">
          {/* 通知铃 */}
          <button
            title="通知"
            className="w-8.5 h-8.5 rounded-sm grid place-items-center relative
                       text-text-2 hover:bg-surface-2 hover:text-text transition-colors"
          >
            <Bell className="w-4.25 h-4.25" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-danger" />
          </button>

          <div className="w-px h-5.5 bg-border mx-2.5" />

          <CitySelector />

          <div className="w-px h-5.5 bg-border mx-2.5" />

          {/* 用户菜单 */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-sm text-body-sm
                         hover:bg-surface-2 transition-colors"
            >
              <Avatar size="sm" />
              <span className="hidden sm:block font-medium text-text max-w-30 truncate">
                {profile?.username ?? "管理员"}
              </span>
              <ChevronDown
                className="w-3.5 h-3.5 text-text-muted opacity-55 transition-transform duration-200"
                style={{ transform: menuOpen ? "rotate(180deg)" : "none" }}
              />
            </button>

            {/* Popover：.popover-user 风格 */}
            {menuOpen && (
              <div
                className="absolute right-0 z-50 popover-animate
                           bg-card border border-border rounded-lg"
                style={{
                  top: "calc(100% + 8px)",
                  width: 240,
                  padding: 8,
                  boxShadow: "0 16px 48px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.04)",
                }}
              >
                {/* 用户信息头 */}
                <div className="flex items-center gap-3 px-3 pt-3 pb-3.5
                                border-b border-border-subtle mb-1.5">
                  <Avatar size="lg" />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-text truncate">
                      {profile?.username ?? "管理员"}
                    </div>
                    <div className="text-caption text-text-muted mt-0.5">管理端账户</div>
                  </div>
                </div>

                <Link
                  href={MANAGE_PROFILE_PATH}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.25 rounded-sm
                             text-body text-text-2 hover:bg-surface hover:text-text transition-colors"
                >
                  <UserRound className="w-4 h-4 text-text-muted" />
                  个人资料
                </Link>
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2.5 w-full px-3 py-2.25 rounded-sm
                             text-body text-text-2 opacity-40 cursor-not-allowed"
                >
                  <Settings className="w-4 h-4 text-text-muted" />
                  账号设置
                </button>

                <div className="h-px bg-border-subtle my-1.5" />

                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); setLogoutOpen(true); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.25 rounded-sm
                             text-body text-danger hover:bg-danger-bg transition-colors"
                >
                  <LogOut className="w-4 h-4 text-danger" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={logoutOpen}
        title="确认退出登录？"
        description="退出后需要重新登录才能继续访问管理后台。"
        confirmText="退出登录"
        cancelText="取消"
        icon={<LogOut size={32} />}
        danger
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
