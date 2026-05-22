"use client";

import { useState } from "react";
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
  onLogin,
}: {
  state: GateState;
  onClose: () => void;
  onVerify: () => void;
  onLogin: () => void;
}) {
  if (!state) return null;

  const isUnauth = state === "unauth";

  return (
    <Modal open onClose={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-[360px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部彩色图示区 */}
        <div className="relative bg-primary-tint-2 px-6 pt-8 pb-10 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-primary-tint text-primary hover:bg-primary-tint-2 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {/* 图标 */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-tint mb-3">
            <svg viewBox="0 0 48 48" className="w-9 h-9 fill-current text-primary" xmlns="http://www.w3.org/2000/svg">
              {isUnauth ? (
                /* 用户/锁图标 */
                <path d="M24 4a8 8 0 1 1 0 16A8 8 0 0 1 24 4zm0 20c8.84 0 16 3.58 16 8v4H8v-4c0-4.42 7.16-8 16-8zm10 18a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H14a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h20z" />
              ) : (
                /* 房屋图标 */
                <path d="M24 4L4 22h6v20h12V30h4v12h12V22h6L24 4zm0 5.34L38 22.5V38h-8V26H18v12h-8V22.5L24 9.34z" />
              )}
            </svg>
          </div>
          <h3 className="text-text text-lg font-semibold">
            {isUnauth ? "请先登录" : "完成房东认证"}
          </h3>
          <p className="text-text-2 text-sm mt-1">
            {isUnauth ? "登录后才可以发布房源" : "认证后即可发布房源"}
          </p>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-5">
          <p className="text-sm text-[var(--color-text-2)] leading-relaxed text-center">
            {isUnauth
              ? "您尚未登录账号。请先登录，并完成房东认证后，才可以发布房源信息。"
              : "您的账号尚未完成房东认证。请填写个人信息完成认证后，即可发布房源。"}
          </p>

          <div className="flex flex-col gap-2.5 mt-5">
            {isUnauth ? (
              <>
                <button
                  onClick={onLogin}
                  className="w-full h-10 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  去登录
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-10 border border-[var(--color-border)] text-[var(--color-text-2)] text-sm rounded-lg cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                >
                  稍后再说
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onVerify}
                  className="w-full h-10 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  进行房东认证
                </button>
                <button
                  onClick={onClose}
                  className="w-full h-10 border border-[var(--color-border)] text-[var(--color-text-2)] text-sm rounded-lg cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
                >
                  取消
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function TopMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [gateState, setGateState] = useState<GateState>(null);

  function handleLandlordGate(href: string) {
    if (typeof window === "undefined") return;
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
        onLogin={() => { setGateState(null); router.push("/portal/login"); }}
      />
    </>
  );
}
