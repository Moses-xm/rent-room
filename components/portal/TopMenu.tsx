"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { PORTAL_NAV_MENU } from "@/utils/constants";
import { getPortalProfile, getPortalToken } from "@/utils/portal-auth";
import { Modal } from "@/components/Modal";

type GateState = "unauth" | "notLandlord" | null;

function LandlordGateModal({
  state,
  onClose,
  onVerify,
}: {
  state: GateState;
  onClose: () => void;
  onVerify: () => void;
}) {
  if (!state) return null;
  return (
    <Modal open onClose={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[90vw] max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <span className="text-base font-medium text-[#333]">提示</span>
          <button onClick={onClose} className="text-[#999] hover:text-[#333] cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-6 text-sm text-[#555] leading-relaxed">
          {state === "unauth"
            ? "请先登录，并完成房东认证后，才可以发布房源。"
            : "您尚未完成房东认证，需要先填写个人信息完成认证，才可以发布房源。"}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="h-9 px-5 border border-[#ddd] text-[#666] text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors"
          >
            取消
          </button>
          {state === "notLandlord" && (
            <button
              onClick={onVerify}
              className="h-9 px-5 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity"
            >
              进行房东认证
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function TopMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [gateState, setGateState] = useState<GateState>(null);

  // 刷新时同步登录态（profile 存在于 localStorage）
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function handleLandlordGate(href: string) {
    if (!mounted) return;
    if (!getPortalToken()) {
      setGateState("unauth");
      return;
    }
    const profile = getPortalProfile();
    if (!profile || (profile.identity ?? 1) < 2) {
      setGateState("notLandlord");
      return;
    }
    router.push(href);
  }

  return (
    <>
      <nav className="hidden lg:block w-full bg-primary">
        <div className="flex max-w-295 mx-auto px-4">
          {PORTAL_NAV_MENU.map(({ href, label, exact, landlordGate }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            if (landlordGate) {
              return (
                <button
                  key={href}
                  onClick={() => handleLandlordGate(href)}
                  className={`p-menu-link cursor-pointer${isActive ? " active" : ""}`}
                >
                  {label}
                </button>
              );
            }
            return (
              <Link key={href} href={href} className={`p-menu-link${isActive ? " active" : ""}`}>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <LandlordGateModal
        state={gateState}
        onClose={() => setGateState(null)}
        onVerify={() => { setGateState(null); router.push("/portal/account/landlord"); }}
      />
    </>
  );
}
