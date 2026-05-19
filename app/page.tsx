import Link from "next/link";
import { ArrowRight, Building2, HomeIcon } from "lucide-react";
import AppLogo from "@/components/AppLogo";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] flex flex-col items-center justify-center p-6 text-[#2f2a24]">
      {/* Brand */}
      <div className="text-center mb-12 max-w-2xl">
        <AppLogo className="mx-auto mb-5 size-16" />
        <h1 className="text-4xl font-semibold tracking-[0.18em] mb-3">
          雅阁租房系统
        </h1>
        <p className="text-[#8a8175] text-sm leading-7 font-light">
          连接房东、租客与运营管理的一站式租房平台
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Manage */}
        <Link href="/manage" className="block h-full">
          <div className="h-64 flex flex-col justify-between group relative overflow-hidden rounded-2xl bg-[#fffdf8] border border-[#e8ddcb] p-8 cursor-pointer shadow-[0_18px_50px_rgba(67,52,35,0.08)] hover:border-[#d5c4ab] hover:bg-white hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#f2eadf] text-[#6f5a42] flex items-center justify-center text-xl mb-4 shadow-[0_10px_24px_rgba(111,90,66,0.12)]">
                <Building2 size={23} strokeWidth={1.8} />
              </div>
              <h2 className="text-xl font-bold text-[#2f2a24] mb-2">管理平台</h2>
              <p className="text-[#7f766b] text-sm leading-relaxed">
                房源、租客、合同与账单统一管理
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#7a654c] group-hover:text-[#5f4d39] transition-colors">
              进入管理平台
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        {/* Portal */}
        <Link href="/portal" className="block h-full">
          <div className="h-64 flex flex-col justify-between group relative overflow-hidden rounded-2xl bg-[#fffdf8] border border-[#dfe8d2] p-8 cursor-pointer shadow-[0_18px_50px_rgba(67,52,35,0.08)] hover:border-[#c9dab7] hover:bg-white hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#edf4e5] text-[#5f7f33] flex items-center justify-center text-xl mb-4 shadow-[0_10px_24px_rgba(95,127,51,0.12)]">
                <HomeIcon size={23} strokeWidth={1.8} />
              </div>
              <h2 className="text-xl font-bold text-[#2f2a24] mb-2">用户平台</h2>
              <p className="text-[#7f766b] text-sm leading-relaxed">
                找房、预约、签约与缴费全流程在线完成
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#5f7f33] group-hover:text-[#4f6d27] transition-colors">
              进入用户平台
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </div>

      <p className="mt-16 text-[#b3a797] text-xs tracking-widest">
        © 2026 雅阁租房系统
      </p>
    </main>
  );
}
