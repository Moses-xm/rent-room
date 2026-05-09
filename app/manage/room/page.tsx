import { Search } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';

/* ─── Mock data ───────────────────────────────────────────── */
const tabs = [
  { label: '全部',   count: 128, key: 'all',      active: true  },
  { label: '待出租', count: 24,  key: 'vacant',   active: false },
  { label: '看房中', count: 16,  key: 'viewing',  active: false },
  { label: '签约中', count: 5,   key: 'signing',  active: false },
  { label: '已出租', count: 83,  key: 'occupied', active: false },
];

const mockData = [
  { id: 1, name: '阳光精品两居室', code: 'ROOM-001', client: 'Michael Yang', source: '直租',    date: '2026-03-25', loc: '朝阳区' },
  { id: 2, name: '温馨主卧合租',   code: 'ROOM-002', client: 'Monkey Wong',  source: '中介转租', date: '2026-03-25', loc: '海淀区' },
  { id: 3, name: 'CBD 豪华单间',   code: 'ROOM-003', client: 'Pangyu Song',  source: '直租',    date: '2026-03-25', loc: '静安区' },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

/* ─── Page ────────────────────────────────────────────────── */
export default function RoomPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-[32px] font-medium tracking-tight text-text leading-[1.1] m-0">
            房源管理
          </h1>
          <div className="text-[13px] text-text-muted mt-1.5">
            管理所有已发布租赁房源的状态信息，跟踪签约进度。
          </div>
        </div>
      </div>

      {/* ── 状态分组标签 ── */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm border cursor-pointer transition-colors text-[13px] ${
              tab.active
                ? 'bg-primary-tint border-primary text-primary font-semibold'
                : 'bg-card border-border text-text-2 hover:bg-surface-2'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[11.5px] font-semibold tabular-nums ${
                tab.active ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {tab.count}
            </span>
          </div>
        ))}
      </div>

      {/* ── 卡片：工具栏 + 表格 ── */}
      <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
        {/* 工具栏 */}
        <div className="flex items-center gap-2.5 px-4.5 py-3.5 border-b border-border-subtle flex-wrap">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
            <input
              type="text"
              placeholder="搜索房源名称或编号…"
              className="w-full h-8.5 pl-9 pr-3 border border-border rounded-sm
                         bg-card text-text text-[13px] outline-none
                         transition-[border-color,box-shadow]
                         hover:border-text-disabled
                         focus:border-primary
                         focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                         placeholder:text-text-subtle"
            />
          </div>
          <select className="h-8.5 px-3 border border-border rounded-sm bg-card text-text-2 text-[13px] outline-none focus:border-primary transition-colors min-w-35">
            <option>所有区域</option>
            <option>朝阳区</option>
            <option>海淀区</option>
            <option>静安区</option>
          </select>
          <span className="ml-auto text-[12.5px] text-text-muted tabular-nums">
            共 <span className="font-semibold text-text">{mockData.length}</span> 件房源
          </span>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr>
                <th className="text-left text-[11.5px] font-medium text-text-muted uppercase tracking-[.04em] px-4 py-2.5 bg-surface-2 border-t border-b border-border-subtle">房东 / 业主</th>
                <th className="text-left text-[11.5px] font-medium text-text-muted uppercase tracking-[.04em] px-4 py-2.5 bg-surface-2 border-t border-b border-border-subtle">房源名称</th>
                <th className="text-left text-[11.5px] font-medium text-text-muted uppercase tracking-[.04em] px-4 py-2.5 bg-surface-2 border-t border-b border-border-subtle">状态</th>
                <th className="text-left text-[11.5px] font-medium text-text-muted uppercase tracking-[.04em] px-4 py-2.5 bg-surface-2 border-t border-b border-border-subtle">发布时间</th>
                <th className="text-left text-[11.5px] font-medium text-text-muted uppercase tracking-[.04em] px-4 py-2.5 bg-surface-2 border-t border-b border-border-subtle">位置</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((row) => (
                <tr key={row.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3.5 border-b border-border-subtle align-middle text-text-2 text-[13px]">
                    <div className="flex items-center gap-3">
                      <div className="w-7.5 h-7.5 rounded-full shrink-0 grid place-items-center bg-surface-2 text-text-muted text-[11px] font-semibold border border-border">
                        {initials(row.client)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-text leading-none">{row.client}</p>
                        <p className="text-[11px] text-text-muted mt-0.5">{row.code} · {row.source}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 border-b border-border-subtle align-middle text-text-2 text-[13px]">
                    {row.name}
                  </td>
                  <td className="px-4 py-3.5 border-b border-border-subtle align-middle">
                    <StatusPill variant="accent">待出租</StatusPill>
                  </td>
                  <td className="px-4 py-3.5 border-b border-border-subtle align-middle text-text-2 text-[13px] font-mono">
                    {row.date}
                  </td>
                  <td className="px-4 py-3.5 border-b border-border-subtle align-middle text-text-2 text-[13px]">
                    {row.loc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页占位 */}
        <div className="flex items-center justify-between px-4.5 py-3.5 border-t border-border-subtle">
          <span className="text-[12.5px] text-text-muted">第 1 / 1 页</span>
          <div className="flex items-center gap-0.5">
            {['«', '‹', '1', '›', '»'].map((p, i) => (
              <button
                key={i}
                className={`min-w-7.5 h-7.5 rounded-sm text-[12.5px] transition-colors ${
                  p === '1'
                    ? 'font-semibold bg-primary text-white'
                    : 'text-text-2 hover:bg-surface-2'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
