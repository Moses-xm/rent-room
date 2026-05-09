import { TrendingUp, Home, Users, Wrench, type LucideIcon } from 'lucide-react';

/* ─── 统计卡数据 ──────────────────────────────────────────── */
const stats: {
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  up: boolean | null;
  Icon: LucideIcon;
}[] = [
  { label: '本月总收入',    value: '¥ 124,500', change: '↑ 12%', changeLabel: '较上月', up: true,  Icon: TrendingUp },
  { label: '在租房源',      value: '83 / 100',  change: '83%',   changeLabel: '利用率', up: null,  Icon: Home       },
  { label: '本月新增租客',  value: '12 人',     change: '↑ 4%',  changeLabel: '较上月', up: true,  Icon: Users      },
  { label: '待处理报修',    value: '3 单',      change: '2 单',  changeLabel: '紧急',   up: false, Icon: Wrench     },
];

const recentEvents = [
  { name: '王先生',  room: '阳光上城 3 栋 201', time: '1 小时前' },
  { name: '李女士',  room: '碧桂园豪华独栋',     time: '3 小时前' },
  { name: '陈杰',    room: 'CBD 中心一室',        time: '5 小时前' },
  { name: '张明',    room: '朝阳精品两居室',      time: '昨天'     },
  { name: '刘晓红',  room: '海淀温馨合租',        time: '昨天'     },
];

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ── 页面头部 ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-[32px] font-medium tracking-tight text-text leading-[1.1] m-0">
            控制台
          </h1>
          <div className="text-[13px] text-text-muted mt-[6px]">
            欢迎回来，这里是您的房源租赁数据概览。
          </div>
        </div>
      </div>

      {/* ── 统计卡 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, changeLabel, up, Icon }) => (
          <div
            key={label}
            className="bg-card border border-border rounded p-[20px_22px]"
          >
            <div className="flex justify-between items-center text-[12px] text-text-muted font-medium tracking-[.02em]">
              <span>{label}</span>
              <span className="w-[30px] h-[30px] rounded-sm bg-primary-tint text-primary grid place-items-center shrink-0">
                <Icon size={15} />
              </span>
            </div>
            <div className="font-(family-name:--typeface-display) text-[32px] font-medium text-text tracking-tight mt-3 leading-none tabular-nums">
              {value}
            </div>
            <div className="mt-[10px] text-[11.5px] text-text-muted flex items-center gap-[6px]">
              <span
                className={`font-semibold tabular-nums ${
                  up === true
                    ? 'text-success'
                    : up === false
                    ? 'text-danger'
                    : 'text-text-2'
                }`}
              >
                {change}
              </span>
              {changeLabel}
            </div>
          </div>
        ))}
      </div>

      {/* ── 图表 + 动态 ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* 营收趋势占位 */}
        <div className="col-span-2 bg-card border border-border rounded shadow-sm flex flex-col">
          <div className="px-[22px] py-[18px] flex items-center justify-between border-b border-border-subtle">
            <div>
              <div className="text-[14.5px] font-semibold text-text tracking-tight">月度营收趋势</div>
              <div className="text-[12px] text-text-muted mt-[3px]">近 7 个月收入汇总</div>
            </div>
            <select className="h-[28px] px-2 border border-border rounded-sm bg-card text-text-2 text-[12.5px] outline-none focus:border-primary">
              <option>今年</option>
              <option>去年</option>
            </select>
          </div>
          <div className="flex-1 px-[22px] py-5 min-h-[280px] flex flex-col">
            <div className="flex-1 border border-dashed border-border-subtle rounded-sm bg-surface flex flex-col items-center justify-end overflow-hidden relative">
              {/* 模拟柱状图 */}
              <div className="absolute bottom-0 w-full px-10 flex items-end justify-between h-[160px] opacity-60 pb-0">
                {[40, 60, 45, 80, 55, 90, 75].map((h, j) => (
                  <div
                    key={j}
                    className="w-7 bg-primary-tint rounded-t-sm border border-primary-tint-2"
                    style={{ height: `${h}%`, backgroundColor: 'var(--color-primary-tint)', borderColor: 'var(--color-primary-200)' }}
                  />
                ))}
              </div>
              <span className="relative z-10 mb-8 text-[12.5px] text-text-muted">
                营收图表占位区（可接入 ECharts / Recharts）
              </span>
            </div>
          </div>
        </div>

        {/* 最新动态 */}
        <div className="col-span-1 bg-card border border-border rounded shadow-sm flex flex-col">
          <div className="px-[22px] py-[18px] flex items-center justify-between border-b border-border-subtle">
            <div className="text-[14.5px] font-semibold text-text tracking-tight">最新动态</div>
            <button className="text-[12px] text-primary hover:text-primary-dark transition-colors">
              查看全部
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-[22px] py-4 space-y-4">
            {recentEvents.map((ev, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-[28px] h-[28px] rounded-full shrink-0 grid place-items-center bg-primary-tint text-primary-dark text-[11px] font-semibold border border-border">
                  {ev.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-text leading-snug">
                    {ev.name} 已签约
                  </div>
                  <div className="text-[11.5px] text-text-muted mt-0.5 truncate">{ev.room}</div>
                  <div className="text-[11px] text-text-disabled mt-0.5">{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
