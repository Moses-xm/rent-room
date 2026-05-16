"use client";

import Link from "next/link";
import AppLogo from "@/components/AppLogo";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, UserRound, MapPin, ChevronsLeft, ChevronsRight, X, GalleryHorizontal, Wrench, Heart, CalendarCheck, Bell, FileText, ShoppingCart } from "lucide-react";

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
      { key: "admin",     label: "管理员管理", icon: Users,     path: "/manage/admin" },
      { key: "user",      label: "用户管理",   icon: UserRound, path: "/manage/user" },
      { key: "community", label: "小区管理",   icon: MapPin,    path: "/manage/community" },
      { key: "room",      label: "房源管理",   icon: Building2,          path: "/manage/room" },
      { key: "facility",  label: "房屋设施",   icon: Wrench,             path: "/manage/facility" },
      { key: "carousel",    label: "轮播图管理", icon: GalleryHorizontal,  path: "/manage/carousel" },
      { key: "collection",   label: "收藏管理",   icon: Heart,             path: "/manage/collection" },
      { key: "appointment",   label: "预约管理",   icon: CalendarCheck,     path: "/manage/appointment" },
      { key: "notification", label: "通知管理",   icon: Bell,              path: "/manage/notification" },
      { key: "contract",    label: "合同管理",   icon: FileText,          path: "/manage/contract" },
      { key: "order",       label: "订单管理",   icon: ShoppingCart,      path: "/manage/order" },
    ],
  },
];

export function Sidebar({
  isCollapsed,
  toggleCollapse,
  isMobile = false,
  onMobileClose,
}: {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col bg-card border-r border-border
        ${isMobile ? "h-full w-64" : "sticky top-0 h-screen"}`}
    >

      {/* ── Brand ── */}
      <div
        className={`flex items-center shrink-0 border-b border-border-subtle
          ${isCollapsed && !isMobile ? "justify-center h-15 px-4" : "gap-3 h-15 px-5.5 pb-0.5"}`}
      >
        <Link
          href="/manage"
          title="返回首页"
          className={`shrink-0 hover:opacity-80 transition-opacity
            ${isCollapsed && !isMobile ? "w-10 h-10" : "w-9 h-9"}`}
        >
          <AppLogo className="h-full w-full" />
        </Link>
        {(!isCollapsed || isMobile) && (
          <span className="flex-1 font-semibold text-sm text-text whitespace-nowrap">
            雅阁租房系统
          </span>
        )}
        {/* 移动端关闭按钮 */}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-sm
                       text-text-muted cursor-pointer transition-colors
                       hover:bg-surface-2 hover:text-text shrink-0"
            title="关闭菜单"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3.5 px-3 overflow-y-auto">
        {NAV_GROUPS.map((g) => (
          <div key={g.group}>
            {isCollapsed && !isMobile ? (
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
                  title={isCollapsed && !isMobile ? item.label : undefined}
                  className={`flex items-center gap-2.75 px-3.5 py-2.25 mb-px
                    rounded-sm text-[13.5px] font-medium relative
                    transition-colors duration-150
                    ${isCollapsed && !isMobile ? "justify-center" : ""}
                    ${isActive
                      ? "text-primary bg-primary-tint font-semibold"
                      : "text-text-2 hover:text-text hover:bg-surface-2"
                    }`}
                >
                  {isActive && (
                    <span
                      className="absolute top-2 bottom-2 w-0.5 rounded-r bg-primary"
                      style={{ left: isCollapsed && !isMobile ? 0 : "-12px" }}
                    />
                  )}
                  <Icon className="w-4.5 h-4.5 shrink-0 opacity-90" />
                  {(!isCollapsed || isMobile) && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── 桌面端折叠切换（移动端不显示） ── */}
      {!isMobile && (
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
      )}
    </aside>
  );
}
