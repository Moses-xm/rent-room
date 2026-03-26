import Link from "next/link";

const navItems = [
  { icon: "📊", label: "仪表盘", active: true },
  { icon: "🏠", label: "房源管理" },
  { icon: "👥", label: "租客管理" },
  { icon: "📄", label: "合同管理" },
  { icon: "💰", label: "账单管理" },
  { icon: "🔔", label: "消息通知" },
  { icon: "⚙️", label: "系统设置" },
];

const stats = [
  { icon: "🏠", label: "在租房源", value: "128", color: "border-t-violet-500" },
  { icon: "👥", label: "在租租客", value: "96", color: "border-t-sky-500" },
  { icon: "💰", label: "本月收入", value: "¥248,000", color: "border-t-emerald-500" },
  { icon: "📄", label: "待签合同", value: "12", color: "border-t-amber-500" },
];

export default function ManagePage() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-60 bg-gradient-to-b from-violet-900 to-violet-700 fixed top-0 left-0 h-full flex flex-col shadow-xl z-50">
        <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
          <span className="text-xl">🏢</span>
          <span className="text-white font-bold text-sm tracking-wide">雅阁管理后台</span>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                item.active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-white/10">
          <Link href="/" className="text-white/50 text-xs hover:text-white/80 transition-colors">
            ← 返回首页
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
            <p className="text-slate-500 text-sm mt-1">欢迎回来，管理员</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center text-white font-bold text-sm shadow">
            管
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {stats.map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl p-6 shadow-sm border-t-4 ${s.color}`}>
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Content placeholder */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-6">最新租赁动态</h2>
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="text-4xl mb-4">📋</span>
            <p className="text-sm">暂无数据，后续功能即将开放</p>
          </div>
        </div>
      </main>
    </div>
  );
}
