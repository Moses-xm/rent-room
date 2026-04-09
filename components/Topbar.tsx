"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { MANAGE_LOGIN_PATH, clearManageToken } from "@/utils/manage-auth";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Simple mocked breadcrumbs
  const getSubpage = () => {
    if (pathname.includes("/room")) return "房源管理";
    if (pathname.includes("/admin")) return "管理员管理";
    return "";
  };
  
  const subpage = getSubpage();

  const handleLogout = () => {
    clearManageToken();
    router.replace(MANAGE_LOGIN_PATH);
  };

  return (
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
        {/* Notification Bell */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-blue-700 transition">
          C1
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          退出
        </button>
      </div>
    </header>
  );
}
