"use client";

import { AuthShell } from "@/components/portal/AuthShell";
import { SliderCaptcha } from "@/components/portal/SliderCaptcha";
import { portalRequest } from "@/utils/portal-request";
import {
  PORTAL_HOME_PATH,
  getPortalToken,
  setPortalProfile,
  setPortalToken,
} from "@/utils/portal-auth";
import { Eye, EyeOff, Lock, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type LoginResponse = {
  success: boolean;
  message?: string;
  token?: string;
  profile?: { username: string; nickname?: string; avatar?: string };
};

export default function PortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [sliderVerified, setSliderVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const sliderKeyRef = useRef(0); // reset key

  useEffect(() => {
    if (getPortalToken()) router.replace(PORTAL_HOME_PATH);
  }, [router]);

  const resetSlider = () => {
    sliderKeyRef.current += 1;
    setSliderVerified(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { toast.error("请输入用户名"); return; }
    if (!password) { toast.error("请输入密码"); return; }
    if (!sliderVerified) { toast.error("请先完成滑块验证"); return; }

    setSubmitting(true);
    try {
      const res = await portalRequest<LoginResponse>("/portal/login", {
        method: "POST",
        json: { username: username.trim(), password, sliderVerified: true },
        silent: true,
      });
      if (!res.token) throw new Error("登录成功但未收到凭证");
      setPortalToken(res.token);
      if (res.profile) setPortalProfile(res.profile);
      toast.success(res.message || "登录成功");
      const redirect = searchParams.get("redirect");
      router.replace(redirect || PORTAL_HOME_PATH);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "登录失败");
      resetSlider();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="px-10">
        <h2 className="text-[28px] font-semibold text-center text-[#333] mb-6">
          欢迎登录
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* 用户名 */}
          <div className="relative flex items-center border border-[#d9d9d9] focus-within:border-(--color-primary-brand) transition-colors bg-white">
            <User className="absolute left-3 w-4 h-4 text-[#bbb] shrink-0" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="h-9.5 w-full pl-9 pr-9 text-sm text-[#333] outline-none bg-transparent placeholder:text-[#ccc]"
            />
            {username && (
              <button
                type="button"
                onClick={() => setUsername("")}
                className="absolute right-3 text-[#bbb] hover:text-[#999] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 密码 */}
          <div className="relative flex items-center border border-[#d9d9d9] focus-within:border-(--color-primary-brand) transition-colors bg-white">
            <Lock className="absolute left-3 w-4 h-4 text-[#bbb] shrink-0" />
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="h-9.5 w-full pl-9 pr-9 text-sm text-[#333] outline-none bg-transparent placeholder:text-[#ccc]"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 text-[#bbb] hover:text-[#999] cursor-pointer"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* 滑块验证 */}
          <SliderCaptcha
            key={sliderKeyRef.current}
            verified={sliderVerified}
            onVerified={setSliderVerified}
          />

          {/* 记住密码 */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-[#555]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-[#62ab00] cursor-pointer"
            />
            记住密码
          </label>

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-primary text-white text-base tracking-[0.25em] cursor-pointer disabled:cursor-not-allowed hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? "登录中..." : "登 录"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[#999]">
          还没有账号？
          <Link href="/portal/register" className="text-primary hover:underline ml-1">
            立即注册
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
