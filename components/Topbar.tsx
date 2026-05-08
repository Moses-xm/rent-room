"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
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
  data?: {
    username: string;
    avatar?: string | null;
  };
};

function getAvatarFallback(username?: string | null) {
  const normalizedName = username?.trim();
  if (!normalizedName) return "?";
  return normalizedName.charAt(0).toUpperCase();
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<ManageProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const getSubpage = () => {
    if (pathname.includes("/room")) return "房源管理";
    if (pathname.includes("/admin")) return "管理员管理";
    if (pathname.includes("/profile")) return "Profile";
    return "";
  };

  const subpage = getSubpage();
  const avatarUrl = resolveUploadedFileUrl(profile?.avatar);
  const avatarFallback = getAvatarFallback(profile?.username);

  useEffect(() => {
    const syncProfile = () => {
      setProfile(getManageProfile());
      setProfileReady(true);
    };

    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener(MANAGE_PROFILE_CHANGED_EVENT, syncProfile);

    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener(MANAGE_PROFILE_CHANGED_EVENT, syncProfile);
    };
  }, []);

  useEffect(() => {
    if (!profileReady || profile?.username) {
      return;
    }

    let cancelled = false;

    request<ManageProfileResponse>("/manage/profile", { silent: true })
      .then((response) => {
        if (cancelled || !response.data?.username) {
          return;
        }

        const nextProfile: ManageProfile = response.data.avatar
          ? { username: response.data.username, avatar: response.data.avatar }
          : { username: response.data.username };

        setManageProfile(nextProfile);
        setProfile(nextProfile);
      })
      .catch(() => {
        // When profile hydration fails, request() already handles auth redirects.
        // Silent mode suppresses non-critical error toasts for background sync.
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.username, profileReady]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!menuRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    clearManageToken();
    setMenuOpen(false);
    setLogoutDialogOpen(false);
    router.replace(MANAGE_LOGIN_PATH);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40 w-full transition-all">
        <div className="flex items-center text-sm">
          <Link
            href="/manage"
            className="text-slate-500 font-medium transition-colors hover:text-slate-900"
          >
            Dashboard
          </Link>
          {subpage && (
            <>
              <span className="mx-2 text-slate-300">›</span>
              <span className="font-bold text-slate-900">{subpage}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <CitySelector />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="manage-profile-menu"
              aria-haspopup="menu"
              onClick={() => setMenuOpen((value) => !value)}
              className={`group flex items-center gap-3 rounded-full border bg-white pl-1 pr-3 py-1 shadow-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-100 ${
                menuOpen
                  ? "border-primary/60 shadow-[0_14px_34px_rgba(15,23,42,0.12)]"
                  : "border-slate-200 hover:border-primary/60"
              }`}
            >
              <div className="rounded-full border border-transparent p-0.5 transition-colors duration-200">
                <div
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white ring-2 ring-slate-200 transition-colors duration-200"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={profile?.username || "管理员头像"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarFallback
                  )}
                </div>
              </div>
              <div className="hidden text-left sm:block">
                <p className="max-w-32 truncate text-sm font-semibold text-slate-900">
                  {profile?.username || "管理员"}
                </p>
                <p className="text-xs text-slate-400 transition-colors duration-200">
                  账户中心
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition-all duration-300 ease-out ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              id="manage-profile-menu"
              className={`absolute right-0 top-full z-50 mt-3 w-72 origin-top-right transition-all duration-200 ease-out ${
                menuOpen
                  ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none -translate-y-2 scale-95 opacity-0"
              }`}
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_50px_rgba(15,23,42,0.15)]">
                <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white">
                    {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={profile?.username || "管理员头像"}
                      className="h-full w-full object-cover"
                    />
                    ) : (
                      avatarFallback
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {profile?.username || "管理员"}
                    </p>
                    <p className="text-xs text-slate-400">管理端账户</p>
                  </div>
                </div>

                <div className="p-2">
                  <Link
                    href={MANAGE_PROFILE_PATH}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <UserRound className="h-4 w-4 text-slate-400" />
                    Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setLogoutDialogOpen(true);
                    }}
                    className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="确认退出登录？"
        description="退出后需要重新登录才能继续访问管理后台。"
        confirmText="退出登录"
        cancelText="取消"
        icon={<LogOut size={32} />}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
