"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { MANAGE_HOME_PATH, MANAGE_LOGIN_PATH, MANAGE_TOKEN_KEY } from "@/utils/manage-auth";

export function ManageLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const token = useSyncExternalStore(
    () => () => undefined,
    () => localStorage.getItem(MANAGE_TOKEN_KEY),
    () => null,
  );

  useEffect(() => {
    const isLoginPage = pathname === MANAGE_LOGIN_PATH;

    if (isLoginPage) {
      if (token) {
        router.replace(MANAGE_HOME_PATH);
      }
      return;
    }

    if (!token) {
      router.replace(MANAGE_LOGIN_PATH);
    }
  }, [pathname, router, token]);

  if (pathname === MANAGE_LOGIN_PATH) {
    return children;
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm backdrop-blur-xl">
          正在校验管理端登录状态...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-[72px]' : 'ml-56'}`}>
        <Topbar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
