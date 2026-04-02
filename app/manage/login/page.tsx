"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Toaster, toast } from "sonner";
import { request } from "@/utils/request";
import { MANAGE_HOME_PATH, MANAGE_TOKEN_KEY } from "@/utils/manage-auth";

type LoginResponse = {
  success: boolean;
  message?: string;
  manageToken?: string;
  "manage-token"?: string;
};

export default function ManageLoginPage() {
  const router = useRouter();
  const verifiedRef = useRef(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    verifiedRef.current = isVerified;
  }, [isVerified]);

  useEffect(() => {
    const token = localStorage.getItem(MANAGE_TOKEN_KEY);
    if (token) {
      router.replace(MANAGE_HOME_PATH);
    }
  }, [router]);

  const resetSlider = () => {
    setSliderValue(0);
    setIsVerified(false);
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (value >= 100) {
      setSliderValue(100);
      setIsVerified(true);
    } else if (isVerified) {
      setIsVerified(false);
    }
  };

  const finalizeSlider = () => {
    if (!verifiedRef.current) {
      setSliderValue(0);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      toast.error("请输入用户名和密码");
      return;
    }

    if (!verifiedRef.current) {
      toast.error("请先完成滑块验证");
      return;
    }

    setSubmitting(true);

    try {
      const response = await request<LoginResponse>("/manage/login", {
        method: "POST",
        skipDefaults: true,
        json: {
          username: username.trim(),
          password,
          sliderVerified: true,
        },
      });

      const token = response["manage-token"] || response.manageToken;
      if (!token) {
        throw new Error("登录成功但未收到凭证");
      }

      localStorage.setItem(MANAGE_TOKEN_KEY, token);
      toast.success(response.message || "登录成功");
      router.replace(MANAGE_HOME_PATH);
    } catch (submitError: unknown) {
      toast.error(submitError instanceof Error ? submitError.message : "登录失败，请稍后再试");
      resetSlider();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !shadow-lg",
            title: "!text-sm !font-medium",
            description: "!text-xs",
          },
        }}
      />

      <div className="absolute inset-0 bg-slate-100" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.65),rgba(241,245,249,0.92))]" />

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg rounded-[30px] border border-slate-200/80 bg-white px-8 py-9 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:px-10">
          <div className="mb-9 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary-50 p-2.5 ring-1 ring-primary-100">
              <Image
                src="/images/logo2.png"
                alt="雅阁租房平台 Logo"
                width={716}
                height={716}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">雅阁租房平台</h1>
              <p className="mt-1 text-sm text-slate-500">管理端账号登录</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="username">
                用户名
              </label>
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入管理员用户名"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary-50"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="password">
                密码
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary-50"
              />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <ShieldCheck className="h-4 w-4 text-primary" />
                安全验证
              </div>

              <div
                className={`relative overflow-hidden rounded-2xl border px-3 py-3 ${
                  isVerified ? "border-primary-200 bg-primary-50" : "border-slate-200 bg-slate-100"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 rounded-2xl ${
                    isVerified ? "bg-primary-100" : "bg-primary-200/70"
                  }`}
                  style={{ width: `${sliderValue}%` }}
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-16 text-sm text-slate-500">
                  {isVerified ? "验证通过" : "拖动滑块到最右侧完成验证"}
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue}
                  onChange={(event) => handleSliderChange(Number(event.target.value))}
                  onMouseUp={finalizeSlider}
                  onTouchEnd={finalizeSlider}
                  aria-label="滑块验证"
                  className="manage-slider relative z-10 h-12 w-full cursor-grab appearance-none bg-transparent active:cursor-grabbing"
                />
                <div
                  className="pointer-events-none absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-white shadow-sm transition-transform"
                  style={{ left: `calc((100% - 44px) * ${sliderValue / 100})` }}
                >
                  {isVerified ? "✓" : "›"}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.22)] transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "登录中..." : "登录"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
