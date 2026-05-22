import Link from "next/link";
import { BadgeCheck, ChevronRight, LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  label: string;
};

type Props = {
  features: Feature[];
};

export function LandlordGate({ features }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] px-6 py-12 lg:py-16 select-none">
      {/* 图标区域 */}
      <div className="relative mb-8">
        {/* 背景光晕 */}
        <div className="absolute inset-0 rounded-full bg-[var(--color-primary)]/10 blur-2xl scale-150" />
        {/* 外圈装饰 */}
        <div className="relative w-24 h-24 rounded-full bg-linear-to-br from-[var(--color-primary)]/15 to-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-[var(--color-primary)]/25 to-[var(--color-primary)]/10 flex items-center justify-center">
            <BadgeCheck className="w-8 h-8 text-[var(--color-primary)]" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* 文案 */}
      <h3 className="text-[#222] text-lg font-semibold mb-2">需要完成房东认证</h3>
      <p className="text-[#888] text-sm text-center max-w-xs leading-relaxed mb-8">
        认证后即可解锁房东专属功能，轻松管理房源与小区，享受完整服务权限。
      </p>

      {/* 功能列表 */}
      <div className="w-full max-w-sm mb-8">
        <div className="grid grid-cols-2 gap-2.5">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#f7faf7] border border-[var(--color-primary)]/12"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/12 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              </div>
              <span className="text-xs text-[#555] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/portal/account/landlord"
        className="group inline-flex items-center gap-2 h-11 px-8 bg-[var(--color-primary)] text-white text-sm font-medium rounded-full cursor-pointer hover:opacity-90 transition-all shadow-sm shadow-[var(--color-primary)]/30"
      >
        立即认证房东
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* 底部提示 */}
      <p className="mt-4 text-xs text-[#bbb]">认证免费，填写真实信息即可通过</p>
    </div>
  );
}
