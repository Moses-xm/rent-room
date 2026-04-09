"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
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
    if (authStatus === "checking") {
      return;
    }

    const isLoginPage = pathname === MANAGE_LOGIN_PATH;

    if (isLoginPage) {
      if (authStatus === "authenticated") {
        router.replace(MANAGE_HOME_PATH);
      }
      return;
    }

    if (authStatus === "unauthenticated") {
      router.replace(MANAGE_LOGIN_PATH);
    }
  }, [authStatus, pathname, router]);

  if (pathname === MANAGE_LOGIN_PATH) {
    return children;
  }

  if (authStatus !== "authenticated") {
    return null;
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
