import Link from "next/link";

const quickTags = ["整租", "合租", "近地铁", "拎包入住", "宠物友好"];

const portalStats = [
  { value: "12,800+", label: "在租房源" },
  { value: "32,000+", label: "注册用户" },
  { value: "98%", label: "好评率" },
  { value: "50+", label: "覆盖城市" },
];

const rooms = [
  { id: 1, title: "阳光精品两居室", location: "朝阳区·三元桥", price: "6,500", type: "整租", emoji: "🛋️", bg: "from-blue-100 to-blue-200", tags: ["近地铁", "精装修", "拎包入住"] },
  { id: 2, title: "温馨主卧合租", location: "海淀区·中关村", price: "3,200", type: "合租", emoji: "🛏️", bg: "from-emerald-100 to-emerald-200", tags: ["宠物友好", "近地铁", "独卫"] },
  { id: 3, title: "现代简约三居室", location: "浦东新区·陆家嘴", price: "12,000", type: "整租", emoji: "🏙️", bg: "from-violet-100 to-violet-200", tags: ["江景", "高层", "车位"] },
  { id: 4, title: "CBD精品公寓", location: "静安区·南京西路", price: "8,800", type: "整租", emoji: "🏢", bg: "from-amber-100 to-amber-200", tags: ["商务区", "拎包入住", "智能家居"] },
];

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl">🏡</span>
            <span className="font-bold text-slate-900 tracking-wide">雅阁租房</span>
          </div>
          <nav className="flex gap-6 flex-1">
            {["首页", "房源", "地图找房", "我的收藏", "联系我们"].map((item) => (
              <span key={item} className="text-sm text-slate-600 hover:text-sky-600 cursor-pointer transition-colors font-medium">
                {item}
              </span>
            ))}
          </nav>
          <div className="flex gap-3 flex-shrink-0">
            <button className="px-4 py-2 rounded-lg border border-sky-500 text-sky-600 text-sm font-semibold hover:bg-sky-50 transition-colors">
              登录
            </button>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold hover:from-sky-600 hover:to-sky-700 transition-all shadow-sm">
              免费注册
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-900 via-sky-700 to-sky-500 py-20 px-6 text-center">
        <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
          找到你的<span className="text-amber-300">理想居所</span>
        </h1>
        <p className="text-sky-100 text-lg mb-10">精选优质房源，诚信租赁，让租房更简单</p>

        {/* Search bar */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl flex items-center px-5 py-2 shadow-xl mb-6">
          <span className="text-lg mr-3">🔍</span>
          <input
            type="text"
            placeholder="搜索城市、小区或地铁站..."
            className="flex-1 outline-none text-slate-700 text-sm bg-transparent py-2"
          />
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-bold hover:from-sky-600 hover:to-sky-700 transition-all">
            搜索房源
          </button>
        </div>

        {/* Quick tags */}
        <div className="flex gap-3 justify-center flex-wrap">
          {quickTags.map((tag) => (
            <span key={tag} className="px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium cursor-pointer hover:bg-white/30 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-center gap-16">
          {portalStats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-sky-600">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Listings */}
      <section className="max-w-6xl mx-auto w-full px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">热门房源推荐</h2>
          <span className="text-sm text-sky-600 cursor-pointer hover:text-sky-700 font-medium">查看全部 →</span>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className={`h-40 bg-gradient-to-br ${room.bg} flex items-center justify-center relative`}>
                <span className="absolute top-3 left-3 bg-black/40 text-white text-xs px-3 py-1 rounded-full font-medium">
                  {room.type}
                </span>
                <span className="text-5xl">{room.emoji}</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{room.title}</h3>
                <p className="text-xs text-slate-500 mb-3">{room.location}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {room.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-medium">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-sky-600">
                    ¥{room.price}<span className="text-xs text-slate-400 font-normal">/月</span>
                  </span>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold">
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 py-8 text-center">
        <p className="text-slate-500 text-sm mb-2">© 2026 雅阁租房系统 · 让每一次租房都值得信赖</p>
        <Link href="/" className="text-slate-600 text-xs hover:text-slate-400 transition-colors">
          ← 返回首页
        </Link>
      </footer>
    </div>
  );
}
