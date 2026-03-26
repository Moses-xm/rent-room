export default function DashboardPage() {
  const stats = [
    { label: "本月总收入", curr: "¥ 124,500", prev: "+12% 相比上月", icon: "💰", color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "在租房源", curr: "83 / 100", prev: "利用率 83%", icon: "🏠", color: "text-primary", bg: "bg-primary-50" },
    { label: "本月新增租客", curr: "12 人", prev: "+4% 相比上月", icon: "👥", color: "text-blue-500", bg: "bg-blue-50" },
    { label: "待处理报修", curr: "3 单", prev: "2单紧急", icon: "🔧", color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">数据看板</h1>
        <p className="text-slate-500 text-sm font-medium">欢迎回来，这里是您的房源租赁数据概览表</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${stat.bg}`}>
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500 mb-1">{stat.label}</div>
              <div className="text-2xl font-extrabold text-slate-900">{stat.curr}</div>
            </div>
            <div className={`text-xs font-semibold mt-4 ${stat.color}`}>
              {stat.prev}
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-3 gap-6">
        {/* Income Chart Placeholder */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">月度营收趋势</h2>
            <select className="border border-slate-200 text-slate-600 text-xs px-2 py-1 rounded outline-none w-24">
              <option>今年</option>
              <option>去年</option>
            </select>
          </div>
          <div className="flex-1 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-slate-300 relative overflow-hidden bg-slate-50/50">
            {/* simple mock visual bars */}
            <div className="absolute bottom-0 w-full px-12 flex items-end justify-between h-48 opacity-50">
               {[40, 60, 45, 80, 55, 90, 75].map((h, j) => (
                 <div key={j} className="w-8 bg-primary-200 rounded-t-sm" style={{ height: `${h}%` }}></div>
               ))}
            </div>
            <span className="z-10 font-medium">营收图表占位区 (可接入 ECharts/Recharts)</span>
          </div>
        </div>

        {/* Action / Notifications */}
        <div className="col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">最新动态</h2>
            <button className="text-primary text-xs font-semibold hover:underline">查看全部</button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {[1, 2, 3, 4, 5].map((x) => (
              <div key={x} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 text-xs">
                  通知
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">新租客 {['王先生', '李女士', '陈杰'][x%3]} 已签约</div>
                  <div className="text-xs text-slate-500 mb-1">通过线上平台完成了 {['阳光上城3栋201', '碧桂园豪华独栋', 'CBD中心一室'][x%3]} 的电子签约。</div>
                  <div className="text-[10px] text-slate-400 font-medium">{x} 小时前</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
