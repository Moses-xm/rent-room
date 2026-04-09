import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Manage */}
        <Link href="/manage" className="block h-full">
          <div className="h-64 flex flex-col justify-between group relative overflow-hidden rounded-2xl bg-slate-800 border border-violet-500/20 p-8 cursor-pointer hover:border-violet-500/50 hover:bg-slate-800/80 hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-xl mb-4 shadow-lg">
                🏢
              </div>
              <h2 className="text-xl font-bold text-white mb-2">管理平台</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                房源、租客、合同与账单一站式管理后台
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-400 group-hover:text-violet-300 transition-colors">
              进入管理平台 <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </Link>

        {/* Portal */}
        <Link href="/portal" className="block h-full">
          <div className="h-64 flex flex-col justify-between group relative overflow-hidden rounded-2xl bg-slate-800 border border-sky-500/20 p-8 cursor-pointer hover:border-sky-500/50 hover:bg-slate-800/80 hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center text-xl mb-4 shadow-lg">
                🏠
              </div>
              <h2 className="text-xl font-bold text-white mb-2">客户端平台</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                浏览房源、在线预约、签约缴费，轻松找到理想居所
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 group-hover:text-sky-300 transition-colors">
              进入客户端 <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </Link>
      </div>

      <p className="mt-16 text-slate-600 text-xs tracking-widest">
        © 2026 雅阁租房系统
      </p>
    </main>
  );
}
