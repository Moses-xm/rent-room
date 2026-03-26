import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
      {/* Brand */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🏡</div>
        <h1 className="text-4xl font-bold text-white tracking-widest mb-2">
          雅阁租房系统
        </h1>
        <p className="text-slate-400 tracking-[0.3em] text-sm font-light">
          专业 · 诚信 · 高效 · 便捷
        </p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Manage */}
        <Link href="/manage">
          <div className="group relative overflow-hidden rounded-2xl bg-slate-800/60 border border-violet-500/20 backdrop-blur p-8 cursor-pointer hover:border-violet-500/50 hover:-translate-y-1 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-events-none" />
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center text-2xl mb-5 shadow-lg">
              🏢
            </div>
            <h2 className="text-xl font-bold text-white mb-2">管理平台</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              房源、租客、合同与账单一站式管理后台
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
              进入管理平台 <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </Link>

        {/* Portal */}
        <Link href="/portal">
          <div className="group relative overflow-hidden rounded-2xl bg-slate-800/60 border border-sky-500/20 backdrop-blur p-8 cursor-pointer hover:border-sky-500/50 hover:-translate-y-1 transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 to-transparent pointer-events-none" />
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-400 to-sky-700 flex items-center justify-center text-2xl mb-5 shadow-lg">
              🏠
            </div>
            <h2 className="text-xl font-bold text-white mb-2">客户端平台</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              浏览房源、在线预约、签约缴费，轻松找到理想居所
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
              进入客户端 <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </Link>
      </div>

      <p className="mt-12 text-slate-600 text-xs tracking-widest">
        © 2026 雅阁租房系统
      </p>
    </main>
  );
}
