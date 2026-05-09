"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, ChevronsLeft, ChevronsRight } from "lucide-react";

const NAV_GROUPS = [
  {
    group: "概览",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/manage" },
    ],
  },
  {
    group: "业务管理",
    items: [
      { key: "room",  label: "房源管理",   icon: Building2, path: "/manage/room" },
      { key: "admin", label: "管理员管理", icon: Users,     path: "/manage/admin" },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  toggleCollapse,
}: {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen flex flex-col bg-card border-r border-border">

      {/* ── Brand ── */}
      <div
        className={`flex items-center shrink-0 border-b border-border-subtle
          ${isCollapsed ? "justify-center h-15 px-4" : "gap-3 h-15 px-5.5 pb-0.5"}`}
      >
        <Link
          href="/manage"
          title="返回首页"
          className={`shrink-0 hover:opacity-80 transition-opacity
            ${isCollapsed ? "w-10 h-10" : "w-9 h-9"}`}
        >
          <Image
            src="/images/logo2.png"
            alt="雅阁租房系统"
            width={716}
            height={716}
            className="h-full w-full object-contain"
            priority
          />
        </Link>
        {!isCollapsed && (
          <span className="font-semibold text-sm text-text whitespace-nowrap">
            雅阁租房系统
          </span>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3.5 px-3 overflow-y-auto">
        {NAV_GROUPS.map((g) => (
          <div key={g.group}>
            {isCollapsed ? (
              <div className="h-3" />
            ) : (
              <div className="text-[10.5px] font-semibold uppercase tracking-[.16em]
                              text-text-disabled px-3.5 pt-3.5 pb-2">
                {g.group}
              </div>
            )}

            {g.items.map((item) => {
              const isActive =
                item.path === "/manage"
                  ? pathname === "/manage"
                  : pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-2.75 px-3.5 py-2.25 mb-px
                    rounded-sm text-[13.5px] font-medium relative
                    transition-colors duration-150
                    ${isCollapsed ? "justify-center" : ""}
                    ${isActive
                      ? "text-primary bg-primary-tint font-semibold"
                      : "text-text-2 hover:text-text hover:bg-surface-2"
                    }`}
                >
                  {isActive && (
                    <span
                      className="absolute top-2 bottom-2 w-0.5 rounded-r bg-primary"
                      style={{ left: isCollapsed ? 0 : "-12px" }}
                    />
                  )}
                  <Icon className="w-4.5 h-4.5 shrink-0 opacity-90" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle ── */}
      <div
        className={`hidden lg:flex shrink-0 border-t border-border-subtle py-2
          ${isCollapsed ? "justify-center" : "justify-end px-3"}`}
      >
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "展开菜单" : "折叠菜单"}
          className="flex h-8 w-8 items-center justify-center rounded-sm
                     text-text-muted cursor-pointer transition-colors
                     hover:bg-surface-2 hover:text-text"
        >
          {isCollapsed
            ? <ChevronsRight className="h-4 w-4" />
            : <ChevronsLeft  className="h-4 w-4" />
          }
        </button>
      </div>
    </aside>
  );
}
