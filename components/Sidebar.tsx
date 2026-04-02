"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

const navItems = [
  { icon: "❖", label: "Dashboard", path: "/manage" },
  { icon: "🏠", label: "房源管理", path: "/manage/room" },
  { icon: "👤", label: "管理员管理", path: "/manage/admin" },
];

export function Sidebar({ isCollapsed, toggleCollapse }: { isCollapsed: boolean, toggleCollapse: () => void }) {
  const pathname = usePathname();

  const renderNav = (items: typeof navItems) => (
    <ul className="space-y-1">
      {items.map((item) => {
        // active state requires exact match for root `/manage` dashboard to avoid matching all sub-routes, 
        // and startsWith for child routes like `/manage/room`
        const isActive = item.path === "/manage" ? pathname === "/manage" : pathname.startsWith(item.path);

        return (
          <li key={item.label}>
            <Link
              href={item.path}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center px-4 py-2.5 mx-3 rounded-lg text-sm font-medium transition-colors relative
                 ${isActive
                  ? "bg-primary-50 text-primary font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
              )}
              <span className={`text-lg transition-transform ${isCollapsed ? "mx-auto" : "mr-3"} ${isActive ? "text-primary" : "text-slate-400"}`}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside className={`bg-white fixed top-0 left-0 h-screen flex flex-col border-r border-slate-200 z-50 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-56'}`}>
      {/* Brand & User Profile */}
      <div className={`px-4 border-b border-slate-200 flex items-center h-16 shrink-0 ${isCollapsed ? 'justify-center' : 'gap-3 px-6'}`}>
        <Link
          href="/manage"
          className={`shrink-0 transition-opacity hover:opacity-90 ${isCollapsed ? "w-10 h-10" : "w-11 h-11"}`}
          title="返回首页"
        >
          <Image
            src="/images/logo2.png"
            alt="雅阁房产管理 Logo"
            width={716}
            height={716}
            className="h-full w-full object-contain"
            priority
          />
        </Link>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <div className="font-bold text-slate-900 text-sm whitespace-nowrap">雅阁房产管理</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto no-scrollbar overflow-x-hidden">
        {renderNav(navItems)}
      </nav>

      {/* Collapse button bottom */}
      <div className={`hidden lg:flex border-t border-slate-200 py-2 ${isCollapsed ? 'justify-center' : 'justify-end px-3'}`}>
        <button 
          onClick={toggleCollapse}
          title={isCollapsed ? '展开菜单' : '折叠菜单'}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 cursor-pointer hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
