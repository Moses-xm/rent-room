import { Calendar, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';

/* ─── 静态数据（后续替换为 API） ──────────────────────────── */
const stats = [
  { label: '总房源数', value: '18,482', delta: '8.2%',  up: true,  icon: 'building' },
  { label: '在租房源', value: '6,204',  delta: '12.4%', up: true,  icon: 'order'    },
  { label: '本月营收', value: '¥2.84M', delta: '18.6%', up: true,  icon: 'wallet'   },
  { label: '注册用户', value: '12,438', delta: '3.2%',  up: false, icon: 'users'    },
] as const;

const tops = [
  { name: '朝阳门 SOHO 一居精装南向',  fav: 384, score: 92.4 },
  { name: '万科翡翠书院 · 两居整租',   fav: 312, score: 88.6 },
  { name: '中海玺园 · 一居精装',       fav: 268, score: 80.1 },
  { name: '保利春天里 · 主卧合租',     fav: 124, score: 56.3 },
  { name: '朗诗未来街区 · 两居',       fav: 108, score: 48.0 },
];

const orders = [
  { user: '王小明', room: '朝阳门 SOHO 一居',  amt: 8500,  t: '2 分钟前',  s: '已支付', sk: 'success' },
  { user: '李娜',   room: '保利春天里 主卧',   amt: 3200,  t: '12 分钟前', s: '已支付', sk: 'success' },
  { user: '陈浩',   room: '万科翡翠书院 两居', amt: 11200, t: '34 分钟前', s: '待支付', sk: 'warning' },
  { user: '赵敏',   room: '中海玺园 一居',     amt: 9600,  t: '1 小时前',  s: '已支付', sk: 'success' },
  { user: '孙琪',   room: '朗诗未来街区 两居', amt: 7800,  t: '3 小时前',  s: '已退款', sk: 'danger'  },
] as const;

/* ─── 自定义图标（匹配设计稿 stroke 风格） ────────────────── */
function IconBuilding({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V6.5L12 3l8 3.5V21"/><path d="M4 21h16M9 10h.01M12 10h.01M15 10h.01M9 14h.01M12 14h.01M15 14h.01M10 21v-4h4v4"/>
    </svg>
  );
}
function IconOrder({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3.5" width="16" height="17" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>
    </svg>
  );
}
function IconWallet({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14h2"/>
    </svg>
  );
}
function IconUsers({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8.5" r="3.2"/><path d="M3 19c.8-3 3.2-4.6 6-4.6s5.2 1.6 6 4.6"/><circle cx="17" cy="9.5" r="2.6"/><path d="M16.5 14.4c2 .1 3.7 1.4 4.5 3.6"/>
    </svg>
  );
}

const statIcons = {
  building: IconBuilding,
  order:    IconOrder,
  wallet:   IconWallet,
  users:    IconUsers,
} as const;

/* ─── 营收折线图 ──────────────────────────────────────────── */
function RevenueChart() {
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const data   = [180, 220, 260, 310, 290, 360, 420, 510, 560, 620, 680, 720];
  const W = 600, H = 220, PT = 30, PB = 30, PL = 36, PR = 16;
  const max = 800;
  const pts = data.map((v, i) => [
    PL + (i * (W - PL - PR)) / (data.length - 1),
    H - PB - (v / max) * (H - PT - PB),
  ]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts[pts.length-1][0].toFixed(1)},${H-PB} L${pts[0][0].toFixed(1)},${H-PB} Z`;
  const ticks = [0, 200, 400, 600, 800];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#8B7355" stopOpacity=".18"/>
          <stop offset="100%" stopColor="#8B7355" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {ticks.map(t => {
        const y = H - PB - (t / max) * (H - PT - PB);
        return (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#F2F2F2"/>
            <text x={PL - 8} y={y + 3.5} fontSize="10" textAnchor="end" fill="#D8D8D8" fontFamily="DM Sans, system-ui">{t}</text>
          </g>
        );
      })}

      <path d={area} fill="url(#rev-fill)"/>
      <path d={path} stroke="#8B7355" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y}
          r={i === 8 ? 4 : 2.5}
          fill={i === 8 ? '#8B7355' : '#fff'}
          stroke="#8B7355"
          strokeWidth={i === 8 ? 2 : 1.5}
        />
      ))}

      {/* 9月 tooltip */}
      <g transform={`translate(${(pts[8][0] - 44).toFixed(1)}, ${(pts[8][1] - 52).toFixed(1)})`}>
        <rect x="0" y="0" width="88" height="36" rx="6" fill="#1A1814"/>
        <text x="44" y="14" textAnchor="middle" fill="#B5B5B5" fontSize="9.5" fontFamily="DM Sans, system-ui">9 月营收</text>
        <text x="44" y="28" textAnchor="middle" fill="#fff" fontSize="12.5" fontWeight="600" fontFamily="DM Sans, system-ui">¥560,000</text>
      </g>

      {months.map((m, i) => (
        <text key={m} x={pts[i][0]} y={H - 10} textAnchor="middle" fontSize="10" fill="#B5B5B5" fontFamily="DM Sans, system-ui">{m}</text>
      ))}
    </svg>
  );
}

/* ─── 房源类型环形图 ──────────────────────────────────────── */
function TypeDonut() {
  const segments = [
    { label: '整租', pct: 62, color: '#8B7355' },
    { label: '合租', pct: 26, color: '#C4A878' },
    { label: '短租', pct: 12, color: '#E2D3B0' },
  ];
  const C = 2 * Math.PI * 70;
  let acc = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
        <svg viewBox="0 0 180 180" width="180" height="180">
          {segments.map((d, i) => {
            const el = (
              <circle key={i} cx="90" cy="90" r="70" fill="none"
                stroke={d.color} strokeWidth="22"
                strokeDasharray={`${((d.pct / 100) * C).toFixed(2)} ${C}`}
                strokeDashoffset={(-acc).toFixed(2)}
                transform="rotate(-90 90 90)"
              />
            );
            acc += (d.pct / 100) * C;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-(family-name:--typeface-display) text-h1 font-emphasis text-text leading-none tabular-nums">6,204</div>
            <div className="text-tiny text-text-muted mt-0.5">在租总数</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {segments.map(d => (
          <div key={d.label} className="flex items-center gap-2.5 text-body">
            <span className="w-2 h-2 rounded-xs shrink-0" style={{ background: d.color }}/>
            <span className="flex-1 text-text-2">{d.label}</span>
            <span className="font-medium text-text tabular-nums">{d.pct}%</span>
          </div>
        ))}
        <div className="border-t border-border-subtle pt-3 space-y-2">
          <div className="flex justify-between text-body-sm">
            <span className="text-text-muted">环比上月</span>
            <span className="font-medium text-success">+ 8.4%</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-text-muted">空置率</span>
            <span className="font-medium text-text-2">5.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            数据看板
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            实时业务指标 · 截至 {today}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="h-8.5 px-3.5 text-body rounded-sm font-medium flex items-center gap-1.5 bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors">
            <Calendar size={13} /> 本月 <ChevronDown size={12} />
          </button>
          <button className="h-8.5 px-3.5 text-body rounded-sm font-medium flex items-center gap-1.5 bg-primary text-white hover:bg-primary-dark transition-colors">
            <Plus size={14} strokeWidth={2.5} /> 快速创建
          </button>
        </div>
      </div>

      {/* ── 统计卡 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, delta, up, icon }) => {
          const StatIcon = statIcons[icon];
          return (
            <div key={label} className="bg-card border border-border rounded p-[20px_22px]">
              <div className="flex justify-between items-center text-xs text-text-muted font-emphasis tracking-[.02em]">
                <span>{label}</span>
                <span className="w-7.5 h-7.5 rounded-sm bg-primary-tint text-primary grid place-items-center shrink-0">
                  <StatIcon size={15} />
                </span>
              </div>
              <div className="font-(family-name:--typeface-display) text-stat font-emphasis text-text tracking-tight mt-3 leading-none tabular-nums">
                {value}
              </div>
              <div className="mt-2.5 text-caption text-text-muted flex items-center gap-1.5">
                <span className={`font-semibold tabular-nums ${up ? 'text-success' : 'text-danger'}`}>
                  {up ? '↑' : '↓'} {delta}
                </span>
                较上月
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 图表区 ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* 营收趋势 */}
        <div className="col-span-2 bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 flex items-center justify-between border-b border-border-subtle">
            <div>
              <div className="text-h4 font-heading text-text tracking-tight">营收趋势</div>
              <div className="text-xs text-text-muted mt-0.75">过去 12 个月 · 单位：千元</div>
            </div>
            <div className="flex gap-1">
              {['本年', '近半年', '近一月'].map((l, i) => (
                <button key={l} className={`h-7 px-2.5 text-xs rounded-sm transition-colors ${
                  i === 0
                    ? 'bg-primary-tint text-primary-dark font-semibold'
                    : 'text-text-muted hover:text-text hover:bg-surface-2'
                }`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="px-5.5 py-4">
            <RevenueChart />
          </div>
        </div>

        {/* 房源类型分布 */}
        <div className="col-span-1 bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 border-b border-border-subtle">
            <div className="text-h4 font-heading text-text tracking-tight">房源类型分布</div>
            <div className="text-xs text-text-muted mt-0.75">当前在租结构</div>
          </div>
          <div className="px-5.5 py-5">
            <TypeDonut />
          </div>
        </div>
      </div>

      {/* ── 列表区 ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* 收藏量 Top 5 */}
        <div className="bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 flex items-center justify-between border-b border-border-subtle">
            <div>
              <div className="text-h4 font-heading text-text tracking-tight">收藏量 Top 5</div>
              <div className="text-xs text-text-muted mt-0.75">最受欢迎的房源</div>
            </div>
            <button className="text-xs text-primary hover:text-primary-dark transition-colors flex items-center gap-0.5">
              查看全部 <ChevronRight size={12} />
            </button>
          </div>
          <div className="px-5.5 py-2">
            {tops.map((t, i) => (
              <div key={t.name} className={`flex items-center gap-3 py-3 ${i < tops.length - 1 ? 'border-b border-dashed border-border-subtle' : ''}`}>
                <span
                  className="w-6 h-6 text-tiny font-semibold grid place-items-center shrink-0 font-(family-name:--typeface-display)"
                  style={{
                    color: i < 3 ? 'var(--color-primary)' : 'var(--color-text-disabled)',
                    borderBottom: `1px solid ${i < 3 ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  }}
                >
                  0{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-body font-emphasis text-text truncate">{t.name}</div>
                  <div className="text-tiny text-text-muted mt-0.5">评分 {t.score} · {t.fav} 收藏</div>
                </div>
                <div className="w-17.5 shrink-0">
                  <div className="h-1 bg-surface-2 rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 最新订单 */}
        <div className="bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 flex items-center justify-between border-b border-border-subtle">
            <div>
              <div className="text-h4 font-heading text-text tracking-tight">最新订单</div>
              <div className="text-xs text-text-muted mt-0.75">实时支付记录</div>
            </div>
            <button className="text-xs text-primary hover:text-primary-dark transition-colors flex items-center gap-0.5">
              查看全部 <ChevronRight size={12} />
            </button>
          </div>
          <div className="px-5.5 py-2">
            {orders.map((o, i) => (
              <div key={i} className={`flex items-center gap-3 py-3 ${i < orders.length - 1 ? 'border-b border-dashed border-border-subtle' : ''}`}>
                <div className="w-7.5 h-7.5 rounded-full shrink-0 grid place-items-center bg-primary-tint text-primary-dark text-xs font-semibold border border-border">
                  {o.user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body font-emphasis text-text truncate">{o.user} · {o.room}</div>
                  <div className="text-tiny text-text-muted mt-0.5">{o.t}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-body font-semibold text-text tabular-nums">¥{o.amt.toLocaleString()}</div>
                  <div className="mt-1">
                    <StatusPill variant={o.sk as 'success' | 'warning' | 'danger'}>{o.s}</StatusPill>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
