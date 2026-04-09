const tabs = [
  { label: "全部房源 (All)", count: 128, active: true },
  { label: "待出租 (Vacant)", count: 24 },
  { label: "看房中 (Viewing)", count: 16 },
  { label: "签约中 (Signing)", count: 5 },
  { label: "已出租 (Occupied)", count: 83 },
];

const mockData = [
  { id: 1, name: "阳光精品两居室", code: "ROOM-001", client: "Michael Yang", source: "直租", date: "Mar 25, 2026", loc: "朝阳区", status: "Vacant" },
  { id: 2, name: "温馨主卧合租", code: "ROOM-002", client: "Monkey Wong", source: "中介转租", date: "Mar 25, 2026", loc: "海淀区", status: "Vacant" },
  { id: 3, name: "CBD豪华单间", code: "ROOM-003", client: "Pangyu Song", source: "直租", date: "Mar 25, 2026", loc: "静安区", status: "Vacant" },
];

export default function ManagePage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-slate-900 mb-2">房源管理 (Properties)</h1>
      <p className="text-slate-500 text-sm mb-8 font-medium">
        管理所有已发布租赁房源的状态信息，跟踪签约进度
      </p>

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-4 mb-8">
        {tabs.map((tab) => (
          <div
            key={tab.label}
            className={`flex items-center justify-between px-4 py-2 flex-grow min-w-[180px] rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
              tab.active
                ? "bg-slate-50 border-primary text-primary font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg opacity-70">
                {tab.active ? "👥" : tab.label.includes("Vacant") ? "✨" : tab.label.includes("Viewing") ? "📅" : tab.label.includes("Signing") ? "💰" : "🚫"}
              </span>
              <span className="text-sm">{tab.label}</span>
            </div>
            <span className="text-sm font-bold">{tab.count}</span>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex gap-4 mb-4 items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search by room name or property code..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary transition-colors focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="relative w-64">
          <select className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none appearance-none bg-white font-medium text-slate-700">
            <option>所有区域 (All Locations)</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</span>
        </div>
        <div className="text-sm font-semibold text-slate-500 ml-auto whitespace-nowrap">
          {mockData.length} 件房源
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-6 gap-4 p-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase border-b border-slate-100 bg-slate-50">
          <div className="col-span-2">房东/业主 (Owner)</div>
          <div className="col-span-1">房源名称 (Property Name)</div>
          <div className="col-span-1">状态 (Status)</div>
          <div className="col-span-1">发布时间 (Listed On)</div>
          <div className="col-span-1">位置 (Location)</div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {mockData.map((row) => (
            <div key={row.id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-slate-50/50 transition-colors">
              <div className="col-span-2 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                  {row.client.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-0.5">{row.client}</div>
                  <div className="text-xs text-slate-400">{row.code} ({row.source})</div>
                </div>
              </div>
              
              <div className="col-span-1 text-sm text-slate-600 font-medium">
                {row.name}
              </div>
              
              <div className="col-span-1">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary text-xs font-bold border border-primary-200/50 cursor-pointer">
                  待出租 <span className="opacity-50">▼</span>
                </span>
              </div>
              
              <div className="col-span-1 text-sm text-slate-500">{row.date}</div>
              
              <div className="col-span-1 text-sm text-slate-500">
                <span className="mr-1 text-slate-400">📍</span> {row.loc}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white text-sm">
          <div className="flex items-center gap-3 text-slate-500">
            Rows 
            <select className="border border-slate-200 rounded px-2 py-1 outline-none text-slate-700 font-medium">
              <option>10</option>
            </select>
            <span className="font-semibold text-slate-700">1–3</span> of 3
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 text-slate-300">«</button>
            <button className="px-2 py-1 text-slate-300">‹</button>
            <button className="w-8 h-8 rounded bg-primary text-white font-bold flex items-center justify-center shadow-sm">1</button>
            <button className="px-2 py-1 text-slate-300">›</button>
            <button className="px-2 py-1 text-slate-300">»</button>
          </div>
        </div>
      </div>
    </div>
  );
}
