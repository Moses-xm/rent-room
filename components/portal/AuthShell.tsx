import Link from "next/link";
import { PORTAL_AUTH_BG } from "@/utils/constants";

const SEP = <span className="text-[#ccc]">|</span>;

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('${PORTAL_AUTH_BG}')` }}
    >
      {/* 顶部导航 */}
      <header className="flex items-center justify-between h-15.5 border-b-2 border-(--color-primary-brand) px-4 lg:px-38">
        <Link href="/portal" className="text-(--color-primary-brand) text-[25px] leading-none">
          雅阁租房
        </Link>
        <nav className="flex items-center gap-1.5 text-base">
          <Link href="/portal/login" className="p-link mx-1.5">
            登录
          </Link>
          {SEP}
          <Link href="/portal/register" className="p-link mx-1.5">
            注册
          </Link>
        </nav>
      </header>

      {/* 居中登录卡片 */}
      <div className="mx-4 mt-16 lg:w-135 lg:mx-auto lg:mt-37.5 bg-white border border-[#eee] shadow-[0_0_10px_#999] py-8">
        {children}
      </div>
    </div>
  );
}
