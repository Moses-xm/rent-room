"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Toaster, toast } from "sonner";
import { request } from "@/utils/request";
import {
  MANAGE_HOME_PATH,
  getManageToken,
  setManageProfile,
  setManageToken,
} from "@/utils/manage-auth";

type LoggedInAdmin = {
  username: string;
  avatar?: string | null;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  manageToken?: string;
  "manage-token"?: string;
  admin?: LoggedInAdmin;
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
    const token = getManageToken();
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
        silent: true,
      });

      const token = response["manage-token"] || response.manageToken;
      if (!token) {
        throw new Error("登录成功但未收到凭证");
      }

      setManageToken(token);
      setManageProfile({
        username: response.admin?.username || username.trim(),
        ...(response.admin?.avatar ? { avatar: response.admin.avatar } : {}),
      });
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
    <div className="min-h-screen bg-surface flex items-center justify-center px-5 py-10">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-md rounded-lg border border-border bg-card px-8 py-9 shadow-sm">

        {/* ── 头部：居中竖排 ── */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 overflow-hidden rounded-xl border border-border">
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
            <h1 className="font-(family-name:--typeface-display) text-h2 font-heading tracking-tight text-text leading-tight">
              雅阁租房平台
            </h1>
            <p className="mt-1 text-body text-text-muted">管理端账号登录</p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-body-sm font-emphasis text-text-2 mb-1.5" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="请输入管理员用户名"
              className="h-9.5 w-full rounded-sm border border-border bg-card px-3 text-body text-text outline-none
                         transition-[border-color,box-shadow] hover:border-text-disabled placeholder:text-text-subtle
                         focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
            />
          </div>

          <div>
            <label className="block text-body-sm font-emphasis text-text-2 mb-1.5" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入密码"
              className="h-9.5 w-full rounded-sm border border-border bg-card px-3 text-body text-text outline-none
                         transition-[border-color,box-shadow] hover:border-text-disabled placeholder:text-text-subtle
                         focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
            />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-body-sm font-emphasis text-text-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              安全验证
            </div>

            <div
              className={`relative h-10 overflow-hidden rounded-sm border ${
                isVerified ? "border-primary bg-primary-tint" : "border-border bg-surface-2"
              }`}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 bg-primary opacity-10"
                style={{ width: `${sliderValue}%` }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-14 text-body-sm text-text-muted">
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
                className="manage-slider relative z-10 h-10 w-full cursor-grab appearance-none bg-transparent active:cursor-grabbing"
              />
              <div
                className="pointer-events-none absolute top-0 z-20 flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-body font-semibold text-white transition-transform"
                style={{ left: `calc((100% - 40px) * ${sliderValue / 100})` }}
              >
                {isVerified ? "✓" : "›"}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 h-9.5 w-full rounded-sm bg-primary text-[13.5px] font-medium text-white
                       transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
