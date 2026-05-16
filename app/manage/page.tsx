'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import { request } from '@/utils/request';

/* ─── Types ──────────────────────────────────────────────────── */
interface DashboardData {
  kpi: {
    totalRooms: number;
    totalRoomsDelta: { value: number; up: boolean };
    rentedRooms: number;
    rentedRoomsDelta: { value: number; up: boolean };
    monthRevenue: number;
    monthRevenueDelta: { value: number; up: boolean };
    totalUsers: number;
    totalUsersDelta: { value: number; up: boolean };
    activeContracts: number;
    pendingAppointments: number;
    vacancyRate: number;
  };
  revenueByMonth: Array<{ label: string; revenue: number }>;
  roomTypeStats: Array<{ label: string; count: number; pct: number }>;
  topRooms: Array<{ id: number; name: string; roomCode: string; collectionCount: number }>;
  latestOrders: Array<{
    id: number;
    type: number;
    fee: number | null;
    pledge: number | null;
    amount: number;
    payerUsername: string;
    payerNickname: string | null;
    roomName: string;
    roomCode: string;
    createdAt: string;
  }>;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtMoney(val: number): string {
  if (val >= 1e8) return `¥${(val / 1e8).toFixed(1)}亿`;
  if (val >= 1e4) return `¥${(val / 1e4).toFixed(1)}万`;
  return `¥${val.toLocaleString()}`;
}

function fmtMoneyFull(val: number): string {
  return `¥${val.toLocaleString()}`;
}

function niceMax(val: number): number {
  if (val === 0) return 5000;
  const mag = Math.pow(10, Math.floor(Math.log10(val)));
  return Math.ceil(val / mag) * mag * (val / mag > 5 ? 2 : 1);
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

const ORDER_TYPE_MAP: Record<number, { label: string; variant: 'accent' | 'success' | 'info' }> = {
  1: { label: '首期款', variant: 'accent' },
  2: { label: '续期款', variant: 'success' },
  3: { label: '押金退', variant: 'info' },
};

/* ─── Revenue chart ──────────────────────────────────────────── */
function RevenueChart({ data, labels }: { data: number[]; labels: string[] }) {
  const W = 600, H = 220, PT = 30, PB = 30, PL = 52, PR = 16;
  const maxVal = Math.max(...data);
  const maxY = niceMax(maxVal);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxY * f));

  const pts = data.map((v, i) => [
    PL + (i * (W - PL - PR)) / Math.max(data.length - 1, 1),
    H - PB - (maxY > 0 ? (v / maxY) : 0) * (H - PT - PB),
  ]);
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${pts[pts.length - 1][0].toFixed(1)},${H - PB} L${pts[0][0].toFixed(1)},${H - PB} Z`;

  // Find the index of the highest point for tooltip
  const peakIdx = data.indexOf(Math.max(...data));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <defs>
        <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B7355" stopOpacity=".18" />
          <stop offset="100%" stopColor="#8B7355" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map(t => {
        const y = H - PB - (maxY > 0 ? (t / maxY) : 0) * (H - PT - PB);
        const label = t >= 10000 ? `${(t / 10000).toFixed(t % 10000 === 0 ? 0 : 1)}万` : t.toString();
        return (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#F2F2F2" />
            <text x={PL - 8} y={y + 3.5} fontSize="10" textAnchor="end" fill="#D8D8D8" fontFamily="DM Sans, system-ui">{label}</text>
          </g>
        );
      })}

      <path d={areaD} fill="url(#rev-fill)" />
      <path d={pathD} stroke="#8B7355" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y}
          r={i === peakIdx && maxVal > 0 ? 4 : 2.5}
          fill={i === peakIdx && maxVal > 0 ? '#8B7355' : '#fff'}
          stroke="#8B7355"
          strokeWidth={i === peakIdx && maxVal > 0 ? 2 : 1.5}
        />
      ))}

      {/* Peak tooltip */}
      {maxVal > 0 && (
        <g transform={`translate(${Math.min(pts[peakIdx][0] - 44, W - PR - 88).toFixed(1)},${(pts[peakIdx][1] - 52).toFixed(1)})`}>
          <rect x="0" y="0" width="88" height="36" rx="6" fill="#1A1814" />
          <text x="44" y="14" textAnchor="middle" fill="#B5B5B5" fontSize="9.5" fontFamily="DM Sans, system-ui">{labels[peakIdx]} 营收</text>
          <text x="44" y="28" textAnchor="middle" fill="#fff" fontSize="12.5" fontWeight="600" fontFamily="DM Sans, system-ui">{fmtMoney(data[peakIdx])}</text>
        </g>
      )}

      {labels.map((m, i) => (
        <text key={m + i} x={pts[i][0]} y={H - 10} textAnchor="middle" fontSize="10" fill="#B5B5B5" fontFamily="DM Sans, system-ui">{m}</text>
      ))}
    </svg>
  );
}

/* ─── Donut chart ─────────────────────────────────────────────── */
const DONUT_COLORS = ['#8B7355', '#C4A878'];

function TypeDonut({
  segments,
  totalRented,
  activeContracts,
  pendingAppointments,
  vacancyRate,
  rentedRoomsDelta,
}: {
  segments: Array<{ label: string; count: number; pct: number }>;
  totalRented: number;
  activeContracts: number;
  pendingAppointments: number;
  vacancyRate: number;
  rentedRoomsDelta: { value: number; up: boolean };
}) {
  const C = 2 * Math.PI * 70;
  let acc = 0;
  const total = segments.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
        <svg viewBox="0 0 180 180" width="160" height="160">
          {total === 0 ? (
            <circle cx="90" cy="90" r="70" fill="none" stroke="#F2F2F2" strokeWidth="22" />
          ) : (
            segments.map((d, i) => {
              const dash = (d.pct / 100) * C;
              const el = (
                <circle key={i} cx="90" cy="90" r="70" fill="none"
                  stroke={DONUT_COLORS[i] ?? '#E2D3B0'} strokeWidth="22"
                  strokeDasharray={`${dash.toFixed(2)} ${C}`}
                  strokeDashoffset={(-acc).toFixed(2)}
                  transform="rotate(-90 90 90)"
                />
              );
              acc += dash;
              return el;
            })
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-(family-name:--typeface-display) text-h1 font-emphasis text-text leading-none tabular-nums">{totalRented}</div>
            <div className="text-tiny text-text-muted mt-0.5">在租总数</div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        {segments.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2.5 text-body">
            <span className="w-2 h-2 rounded-xs shrink-0" style={{ background: DONUT_COLORS[i] }} />
            <span className="flex-1 text-text-2">{d.label}</span>
            <span className="tabular-nums text-text-muted text-body-sm">{d.count} 套</span>
            <span className="font-medium text-text tabular-nums w-10 text-right">{d.pct}%</span>
          </div>
        ))}
        <div className="border-t border-border-subtle pt-2.5 space-y-2">
          <div className="flex justify-between text-body-sm">
            <span className="text-text-muted">本月新签</span>
            <span className={`font-medium ${rentedRoomsDelta.up ? 'text-success' : 'text-danger'}`}>
              {rentedRoomsDelta.up ? '+' : '-'}{rentedRoomsDelta.value}%
            </span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-text-muted">空置率</span>
            <span className="font-medium text-text-2">{vacancyRate}%</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-text-muted">进行中合同</span>
            <span className="font-medium text-text-2 tabular-nums">{activeContracts} 份</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-text-muted">待处理预约</span>
            <span className={`font-medium tabular-nums ${pendingAppointments > 0 ? 'text-warning' : 'text-text-2'}`}>{pendingAppointments} 条</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI icons ──────────────────────────────────────────────── */
function IconBuilding({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V6.5L12 3l8 3.5V21" /><path d="M4 21h16M9 10h.01M12 10h.01M15 10h.01M9 14h.01M12 14h.01M15 14h.01M10 21v-4h4v4" />
    </svg>
  );
}
function IconRented({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" />
    </svg>
  );
}
function IconWallet({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" />
    </svg>
  );
}
function IconUsers({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8.5" r="3.2" /><path d="M3 19c.8-3 3.2-4.6 6-4.6s5.2 1.6 6 4.6" /><circle cx="17" cy="9.5" r="2.6" /><path d="M16.5 14.4c2 .1 3.7 1.4 4.5 3.6" />
    </svg>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <div className="h-7 w-24 skeleton-shimmer rounded" />
          <div className="h-4 w-52 skeleton-shimmer rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-16 skeleton-shimmer rounded" />
              <div className="h-7.5 w-7.5 skeleton-shimmer rounded-sm" />
            </div>
            <div className="h-9 w-28 skeleton-shimmer rounded" />
            <div className="h-3.5 w-20 skeleton-shimmer rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 border-b border-border-subtle flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-20 skeleton-shimmer rounded" />
              <div className="h-3 w-32 skeleton-shimmer rounded" />
            </div>
          </div>
          <div className="px-5.5 py-4">
            <div className="h-55 skeleton-shimmer rounded" />
          </div>
        </div>
        <div className="md:col-span-1 bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 border-b border-border-subtle">
            <div className="h-4 w-24 skeleton-shimmer rounded mb-1.5" />
            <div className="h-3 w-20 skeleton-shimmer rounded" />
          </div>
          <div className="px-5.5 py-5 space-y-4">
            <div className="h-40 w-40 mx-auto skeleton-shimmer rounded-full" />
            {[0, 1].map(i => (
              <div key={i} className="h-4 skeleton-shimmer rounded" />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map(i => (
          <div key={i} className="bg-card border border-border rounded shadow-sm">
            <div className="px-5.5 py-4.5 border-b border-border-subtle">
              <div className="h-4 w-24 skeleton-shimmer rounded mb-1.5" />
              <div className="h-3 w-32 skeleton-shimmer rounded" />
            </div>
            <div className="px-5.5 py-2">
              {[0, 1, 2, 3, 4].map(j => (
                <div key={j} className="flex items-center gap-3 py-3 border-b border-dashed border-border-subtle last:border-0">
                  <div className="w-7.5 h-7.5 skeleton-shimmer rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 skeleton-shimmer rounded" />
                    <div className="h-3 w-1/2 skeleton-shimmer rounded" />
                  </div>
                  <div className="text-right space-y-1.5">
                    <div className="h-4 w-16 skeleton-shimmer rounded" />
                    <div className="h-3.5 w-12 skeleton-shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Period tabs ─────────────────────────────────────────────── */
const PERIODS = [
  { label: '近三月', months: 3 },
  { label: '近半年', months: 6 },
  { label: '本年', months: 12 },
] as const;

/* ─── Page ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<3 | 6 | 12>(12);

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    request<{ success: boolean; data: DashboardData }>('/manage/dashboard')
      .then(res => { if (res.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-muted gap-2">
        <div className="text-body">数据加载失败</div>
        <button
          onClick={() => { setLoading(true); request<{ success: boolean; data: DashboardData }>('/manage/dashboard').then(res => { if (res.success) setData(res.data); }).catch(() => {}).finally(() => setLoading(false)); }}
          className="text-caption text-primary hover:underline cursor-pointer"
        >
          点击重试
        </button>
      </div>
    );
  }

  const { kpi, revenueByMonth, roomTypeStats, topRooms, latestOrders } = data;

  const kpiCards = [
    {
      label: '总房源数',
      value: kpi.totalRooms.toLocaleString(),
      delta: kpi.totalRoomsDelta,
      icon: <IconBuilding size={15} />,
      hint: '本月新增对比',
    },
    {
      label: '在租房源',
      value: kpi.rentedRooms.toLocaleString(),
      delta: kpi.rentedRoomsDelta,
      icon: <IconRented size={15} />,
      hint: '本月新签对比',
    },
    {
      label: '本月营收',
      value: fmtMoney(kpi.monthRevenue),
      delta: kpi.monthRevenueDelta,
      icon: <IconWallet size={15} />,
      hint: '较上月',
    },
    {
      label: '注册用户',
      value: kpi.totalUsers.toLocaleString(),
      delta: kpi.totalUsersDelta,
      icon: <IconUsers size={15} />,
      hint: '本月新增对比',
    },
  ];

  // Slice revenue data by selected period
  const slicedRevenue = revenueByMonth.slice(-period);

  // Max collections for progress bar
  const maxCollections = Math.max(...topRooms.map(r => r.collectionCount), 1);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            数据看板
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            实时业务指标 · 截至 {today}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, delta, icon, hint }) => (
          <div key={label} className="bg-card border border-border rounded p-[20px_22px]">
            <div className="flex justify-between items-center text-xs text-text-muted font-emphasis tracking-[.02em]">
              <span>{label}</span>
              <span className="w-7.5 h-7.5 rounded-sm bg-primary-tint text-primary grid place-items-center shrink-0">
                {icon}
              </span>
            </div>
            <div className="font-(family-name:--typeface-display) text-stat font-emphasis text-text tracking-tight mt-3 leading-none tabular-nums">
              {value}
            </div>
            <div className="mt-2.5 text-caption text-text-muted flex items-center gap-1.5">
              {delta.value === 0 ? (
                <span className="font-semibold text-text-disabled tabular-nums">— 持平</span>
              ) : (
                <span className={`font-semibold tabular-nums ${delta.up ? 'text-success' : 'text-danger'}`}>
                  {delta.up ? '↑' : '↓'} {delta.value}%
                </span>
              )}
              <span>{hint}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Revenue trend */}
        <div className="md:col-span-2 bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 flex items-center justify-between border-b border-border-subtle">
            <div>
              <div className="text-h4 font-heading text-text tracking-tight">营收趋势</div>
              <div className="text-xs text-text-muted mt-0.75">
                {period === 12 ? '过去 12 个月' : period === 6 ? '近半年' : '近三个月'} · 单位：元
              </div>
            </div>
            <div className="flex gap-1">
              {PERIODS.map(({ label, months }) => (
                <button
                  key={label}
                  onClick={() => setPeriod(months)}
                  className={`h-7 px-2.5 text-xs rounded-sm transition-colors cursor-pointer ${
                    period === months
                      ? 'bg-primary-tint text-primary-dark font-semibold'
                      : 'text-text-muted hover:text-text hover:bg-surface-2'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5.5 py-4">
            {slicedRevenue.every(r => r.revenue === 0) ? (
              <div className="h-55 flex items-center justify-center text-body text-text-muted">
                暂无营收数据
              </div>
            ) : (
              <RevenueChart
                data={slicedRevenue.map(r => r.revenue)}
                labels={slicedRevenue.map(r => r.label)}
              />
            )}
          </div>
        </div>

        {/* Room type donut */}
        <div className="md:col-span-1 bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 border-b border-border-subtle">
            <div className="text-h4 font-heading text-text tracking-tight">房源类型分布</div>
            <div className="text-xs text-text-muted mt-0.75">全部房源结构</div>
          </div>
          <div className="px-5.5 py-5">
            <TypeDonut
              segments={roomTypeStats}
              totalRented={kpi.rentedRooms}
              activeContracts={kpi.activeContracts}
              pendingAppointments={kpi.pendingAppointments}
              vacancyRate={kpi.vacancyRate}
              rentedRoomsDelta={kpi.rentedRoomsDelta}
            />
          </div>
        </div>
      </div>

      {/* ── Lists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top rooms by collections */}
        <div className="bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 flex items-center justify-between border-b border-border-subtle">
            <div>
              <div className="text-h4 font-heading text-text tracking-tight">收藏量 Top 5</div>
              <div className="text-xs text-text-muted mt-0.75">最受关注的房源</div>
            </div>
            <Link
              href="/manage/collection"
              className="text-xs text-primary hover:text-primary-dark transition-colors flex items-center gap-0.5"
            >
              查看全部 <ChevronRight size={12} />
            </Link>
          </div>
          <div className="px-5.5 py-2">
            {topRooms.length === 0 ? (
              <div className="py-10 text-center text-body text-text-muted">暂无收藏数据</div>
            ) : (
              topRooms.map((r, i) => {
                const score = Math.round((r.collectionCount / maxCollections) * 100);
                return (
                  <div key={r.id} className={`flex items-center gap-3 py-3 ${i < topRooms.length - 1 ? 'border-b border-dashed border-border-subtle' : ''}`}>
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
                      <div className="text-body font-emphasis text-text truncate">{r.name}</div>
                      <div className="text-tiny text-text-muted mt-0.5">{r.roomCode} · {r.collectionCount} 次收藏</div>
                    </div>
                    <div className="w-17.5 shrink-0">
                      <div className="h-1 bg-surface-2 rounded overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Latest orders */}
        <div className="bg-card border border-border rounded shadow-sm">
          <div className="px-5.5 py-4.5 flex items-center justify-between border-b border-border-subtle">
            <div>
              <div className="text-h4 font-heading text-text tracking-tight">最新订单</div>
              <div className="text-xs text-text-muted mt-0.75">近期交易记录</div>
            </div>
            <Link
              href="/manage/order"
              className="text-xs text-primary hover:text-primary-dark transition-colors flex items-center gap-0.5"
            >
              查看全部 <ChevronRight size={12} />
            </Link>
          </div>
          <div className="px-5.5 py-2">
            {latestOrders.length === 0 ? (
              <div className="py-10 text-center text-body text-text-muted">暂无订单数据</div>
            ) : (
              latestOrders.map((o, i) => {
                const typeInfo = ORDER_TYPE_MAP[o.type] ?? { label: '其他', variant: 'muted' as const };
                const displayName = o.payerNickname || o.payerUsername;
                return (
                  <div key={o.id} className={`flex items-center gap-3 py-3 ${i < latestOrders.length - 1 ? 'border-b border-dashed border-border-subtle' : ''}`}>
                    <div className="w-7.5 h-7.5 rounded-full shrink-0 grid place-items-center bg-primary-tint text-primary-dark text-xs font-semibold border border-border">
                      {displayName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-body font-emphasis text-text">
                        <span className="truncate block sm:hidden">{displayName}</span>
                        <span className="truncate hidden sm:block">{displayName} · {o.roomName}</span>
                      </div>
                      <div className="text-tiny text-text-muted mt-0.5 truncate sm:hidden">{o.roomName}</div>
                      <div className="text-tiny text-text-muted mt-0.5">{relTime(o.createdAt)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-body font-semibold text-text tabular-nums">{fmtMoneyFull(o.amount)}</div>
                      <div className="mt-1">
                        <StatusPill variant={typeInfo.variant}>{typeInfo.label}</StatusPill>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
