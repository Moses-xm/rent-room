"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GlobalHeader } from "@/components/portal/GlobalHeader";
import { TopMenu } from "@/components/portal/TopMenu";
import { PortalFooter } from "@/components/portal/PortalFooter";
import { MobileNav } from "@/components/portal/MobileNav";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // 路由切换时关闭抽屉
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* 移动端遮罩 */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* 移动端抽屉 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-70 bg-white shadow-xl transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <MobileNav onClose={() => setMobileOpen(false)} />
      </div>

      {/* 顶部导航 */}
      <GlobalHeader onMenuToggle={() => setMobileOpen((v) => !v)} />
      <TopMenu />

      {/* 页面内容 */}
      <main className="flex-1">{children}</main>

      {/* 页脚 */}
      <PortalFooter />
    </div>
  );
}
