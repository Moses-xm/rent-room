"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { Toaster } from "sonner";
import {
  MANAGE_AUTH_CHANGED_EVENT,
  MANAGE_HOME_PATH,
  MANAGE_LOGIN_PATH,
  getManageToken,
} from "@/utils/manage-auth";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export function ManageLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    const syncAuthStatus = () => {
      setAuthStatus(getManageToken() ? "authenticated" : "unauthenticated");
    };

    syncAuthStatus();
    window.addEventListener("storage", syncAuthStatus);
    window.addEventListener(MANAGE_AUTH_CHANGED_EVENT, syncAuthStatus);

    return () => {
      window.removeEventListener("storage", syncAuthStatus);
      window.removeEventListener(MANAGE_AUTH_CHANGED_EVENT, syncAuthStatus);
    };
  }, []);

  // 路由切换时关闭移动端菜单
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (authStatus === "checking") return;

    const isLoginPage = pathname === MANAGE_LOGIN_PATH;
    if (isLoginPage) {
      if (authStatus === "authenticated") router.replace(MANAGE_HOME_PATH);
      return;
    }
    if (authStatus === "unauthenticated") router.replace(MANAGE_LOGIN_PATH);
  }, [authStatus, pathname, router]);

  if (pathname === MANAGE_LOGIN_PATH) return children;
  if (authStatus !== "authenticated") return null;

  return (
    <>
      <Toaster position="top-right" richColors />

      {/* 移动端侧边栏背景遮罩 */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-300
          ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* 移动端侧边栏抽屉 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar
          isCollapsed={false}
          toggleCollapse={() => {}}
          isMobile
          onMobileClose={() => setIsMobileOpen(false)}
        />
      </div>

      {/* 主布局：flexbox，移动端内容全宽，桌面端侧边栏 + 内容并排 */}
      <div className="min-h-screen bg-surface flex">

        {/* 桌面端侧边栏（移动端隐藏，不占空间） */}
        <div
          className="hidden lg:block shrink-0"
          style={{
            width: isCollapsed ? 72 : 232,
            transition: "width 300ms ease",
          }}
        >
          <Sidebar
            isCollapsed={isCollapsed}
            toggleCollapse={() => setIsCollapsed((v) => !v)}
          />
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMobileMenuToggle={() => setIsMobileOpen((v) => !v)} />
          <main className="flex-1 px-4 sm:px-6 md:px-8 py-5 md:py-7 pb-12">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
