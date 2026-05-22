"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Heart, CalendarCheck, Home, FileText, ShoppingCart, Bell, LogOut,
  Building2, BadgeCheck,
  type LucideProps,
} from "lucide-react";
import { IDENTITY_LABEL } from "@/utils/constants";
import { LogoutConfirmDialog } from "@/components/portal/LogoutConfirmDialog";
import {
  clearPortalAuth,
  getPortalProfile,
  PORTAL_AUTH_CHANGED_EVENT,
  PORTAL_LOGIN_PATH,
  type PortalProfile,
} from "@/utils/portal-auth";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { PORTAL_MINE_MENU, PORTAL_MINE_BANNER } from "@/utils/constants";

type IconComponent = React.ComponentType<LucideProps>;

const MINE_ICON_MAP: Record<string, IconComponent> = {
  "/portal/account/info":         User,
  "/portal/account/collection":   Heart,
  "/portal/account/appointment":  CalendarCheck,
  "/portal/account/room":         Home,
  "/portal/account/community":    Building2,
  "/portal/account/contract":     FileText,
  "/portal/account/orders":       ShoppingCart,
  "/portal/account/notification": Bell,
  "/portal/account/landlord":     BadgeCheck,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return "夜深了";
  if (h < 12) return "上午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function MineShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [checked, setChecked] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const sync = () => {
      setProfile(getPortalProfile());
      setChecked(true);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PORTAL_AUTH_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PORTAL_AUTH_CHANGED_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!profile) {
      router.replace(
        `${PORTAL_LOGIN_PATH}?redirect=${encodeURIComponent(pathname)}`
      );
    }
  }, [checked, profile, pathname, router]);

  if (!checked || !profile) return null;

  const avatarUrl = resolveUploadedFileUrl(profile.avatar);
  const displayName = profile.nickname ?? profile.username;

  return (
    <div className="min-h-screen bg-[#f1f1f1] text-[#333]">
      {/* ── 顶栏（全宽绿色）────────────────────────── */}
      <div className="w-full h-13.75 bg-primary shadow-sm">
        <div className="flex items-center justify-between max-w-295 mx-auto h-13.75 px-4 lg:px-0">
          <div className="flex items-center gap-3 text-[#f7faf1]">
            <Link href="/portal" className="text-[27px] font-medium hover:opacity-80 transition-opacity">
              雅阁租房
            </Link>
            <span className="text-xl">|</span>
            <span className="text-[22px] font-medium">个人中心</span>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="text-white text-sm cursor-pointer flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <LogOut className="w-4 h-4" />
            退出
          </button>
        </div>
      </div>

      {/* ── 用户横幅（全宽）──────────────────────────── */}
      <div
        className="w-full h-25 bg-primary"
        style={{
          backgroundImage: `url('${PORTAL_MINE_BANNER}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex items-center max-w-295 mx-auto h-25 px-4 lg:px-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-17.5 h-17.5 rounded-full object-cover shrink-0 ring-2 ring-white/60"
            />
          ) : (
            <div className="w-17.5 h-17.5 rounded-full bg-primary-tint-2 flex items-center justify-center text-primary text-3xl font-semibold shrink-0 ring-2 ring-white/60">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="ml-5 flex flex-col gap-1">
            <span className="text-[#333] text-base font-medium">
              {getGreeting()}，{displayName}
            </span>
            <span className="text-[#555] text-sm">
              您的身份：{IDENTITY_LABEL[profile.identity ?? 1] ?? '用户'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 主内容区 ─────────────────────────────────── */}
      <div className="max-w-295 mx-auto px-4 lg:px-0 py-5 min-h-[calc(100vh-250px)]">
        {/* 移动端：水平滚动 Tab */}
        <div className="flex lg:hidden overflow-x-auto bg-white -mx-4 px-2 mb-4 border-b border-[#eee]">
          {PORTAL_MINE_MENU.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const Icon = MINE_ICON_MAP[href];
            return (
              <Link
                key={href}
                href={href}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-primary border-primary"
                    : "text-[#666] border-transparent"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                {label}
              </Link>
            );
          })}
        </div>

        {/* 桌面端：侧边菜单 + 内容并排 */}
        <div className="flex gap-5">
          {/* 侧边菜单 */}
          <aside className="hidden lg:block w-50 shrink-0 self-start">
            {PORTAL_MINE_MENU.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              const Icon = MINE_ICON_MAP[href];
              return (
                <Link
                  key={href}
                  href={href}
                  className={`p-mine-item${isActive ? " active" : ""}`}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  <span>{label}</span>
                </Link>
              );
            })}
          </aside>

          {/* 内容容器 */}
          <main className="flex-1 bg-white min-w-0">
            <div className="h-13.5 px-6 text-lg border-b border-[#eee] flex items-center">
              {title}
            </div>
            {children}
          </main>
        </div>
      </div>

      <LogoutConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          clearPortalAuth();
          router.replace(PORTAL_LOGIN_PATH);
        }}
      />
    </div>
  );
}
