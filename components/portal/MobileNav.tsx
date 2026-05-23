"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import {
  getPortalProfile,
  getPortalToken,
} from "@/utils/portal-auth";
import { PORTAL_NAV_MENU, PORTAL_SEARCH_PATH } from "@/utils/constants";
import { Modal } from "@/components/Modal";

type GateState = "unauth" | "notLandlord" | null;

export function MobileNav({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [gateState, setGateState] = useState<GateState>(null);

  const handleSearch = () => {
    const q = searchRef.current?.value.trim();
    if (q) {
      router.push(`${PORTAL_SEARCH_PATH}?q=${encodeURIComponent(q)}`);
      onClose();
    }
  };

  function handleLandlordGate(href: string) {
    if (!getPortalToken()) {
      setGateState("unauth");
      return;
    }
    const p = getPortalProfile();
    if (!p || (p.identity ?? 1) < 2) {
      setGateState("notLandlord");
      return;
    }
    onClose();
    router.push(href);
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto">
        {/* 顶部 */}
        <div className="flex items-center justify-between h-14 px-4 bg-primary shrink-0">
          <span className="text-white text-xl font-medium">雅阁租房</span>
          <button onClick={onClose} className="text-white cursor-pointer w-8 h-8 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 城市 */}
        <div className="px-4 py-3 text-sm text-[#666] border-b border-[#e6e6e6]">
          当前城市：<span className="text-primary">杭州</span>
        </div>

        {/* 搜索框 */}
        <div className="px-4 py-3 border-b border-[#e6e6e6]">
          <div className="flex h-9">
            <input
              ref={searchRef}
              placeholder="搜索区域、小区或房源"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-3 text-sm border border-[#d9d9d9] border-r-0 outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-4 text-white text-sm bg-(--color-accent) cursor-pointer"
            >
              搜索
            </button>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1">
          {PORTAL_NAV_MENU.map(({ href, label, exact, landlordGate }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            if (landlordGate) {
              return (
                <button
                  key={href}
                  onClick={() => handleLandlordGate(href)}
                  className={`w-full text-left flex items-center px-4 py-3.5 text-[15px] border-b border-[#f0f0f0] transition-colors cursor-pointer ${
                    isActive
                      ? "text-primary bg-primary-tint border-l-[3px] border-l-primary pl-3.5"
                      : "text-[#333]"
                  }`}
                >
                  {label}
                </button>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center px-4 py-3.5 text-[15px] border-b border-[#f0f0f0] transition-colors ${
                  isActive
                    ? "text-primary bg-primary-tint border-l-[3px] border-l-primary pl-3.5"
                    : "text-[#333]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

      </div>

      {/* 拦截弹窗 */}
      <Modal open={!!gateState} onClose={() => setGateState(null)}>
        <div
          className="bg-white rounded-lg shadow-xl w-[90vw] max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
            <span className="text-base font-medium text-[#333]">提示</span>
            <button onClick={() => setGateState(null)} className="text-[#999] hover:text-[#333] cursor-pointer transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-6 text-sm text-[#555] leading-relaxed">
            {gateState === "unauth"
              ? "请先登录，并完成房东认证后，才可以发布房源。"
              : "您尚未完成房东认证，需要先填写个人信息完成认证，才可以发布房源。"}
          </div>
          <div className="flex justify-end gap-2 px-5 pb-5">
            <button
              onClick={() => setGateState(null)}
              className="h-9 px-5 border border-[#ddd] text-[#666] text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors"
            >
              取消
            </button>
            {gateState === "notLandlord" && (
              <button
                onClick={() => { setGateState(null); onClose(); router.push("/portal/account/landlord"); }}
                className="h-9 px-5 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity"
              >
                进行房东认证
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
