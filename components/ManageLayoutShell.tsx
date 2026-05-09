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
      {/* CSS grid + sticky sidebar：侧边栏宽度变化时平滑过渡 */}
      <div
        className="min-h-screen bg-[var(--color-surface)]"
        style={{
          display: "grid",
          gridTemplateColumns: `${isCollapsed ? 72 : 232}px 1fr`,
          transition: "grid-template-columns 300ms ease",
        }}
      >
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed((v) => !v)}
      />
      <div className="flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-8 py-7 pb-12">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
