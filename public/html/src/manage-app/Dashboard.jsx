/* 雅阁租房 · 管理后台 · Dashboard */

function StatCard({ label, value, icon, delta, deltaDir = 'up', sub }) {
  const I = Icon[icon];
  return (
    <div className="stat">
      <div className="stat-label">
        <span>{label}</span>
        <span className="stat-icon"><I style={{ width: 16, height: 16 }}/></span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-meta">
        {delta && (
          <span className={'stat-delta ' + deltaDir}>
            {deltaDir === 'up' ? '↑' : '↓'} {delta}
          </span>
        )}
        <span>{sub || '较上月'}</span>
      </div>
    </div>
  );
}

/* —— 折线图 —— */
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
  const area = path + ` L${pts[pts.length-1][0].toFixed(1)},${H - PB} L${pts[0][0].toFixed(1)},${H - PB} Z`;
  const ticks = [0, 200, 400, 600, 800];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="spark">
      <defs>
        <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B7355" stopOpacity=".18"/>
          <stop offset="100%" stopColor="#8B7355" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ticks.map(t => {
        const y = H - PB - (t / max) * (H - PT - PB);
        return (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#F2EEE5"/>
            <text x={PL - 8} y={y + 3.5} fontSize="10" textAnchor="end" fill="#B5AFA4" fontFamily="DM Sans">{t}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#rev-fill)"/>
      <path d={path} stroke="#8B7355" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 8 ? 4 : 2.5}
                fill={i === 8 ? '#8B7355' : '#fff'} stroke="#8B7355" strokeWidth={i === 8 ? 2 : 1.5}/>
      ))}
      {/* tooltip on Sep */}
      <g transform={`translate(${pts[8][0] - 44}, ${pts[8][1] - 50})`}>
        <rect x="0" y="0" width="88" height="36" rx="6" fill="#1A1814"/>
        <text x="44" y="14" textAnchor="middle" fill="#B5AFA4" fontSize="9.5" fontFamily="DM Sans">9 月营收</text>
        <text x="44" y="28" textAnchor="middle" fill="#fff" fontSize="12.5" fontWeight="600" fontFamily="DM Sans">¥560,000</text>
      </g>
      {months.map((m, i) => (
        <text key={m} x={pts[i][0]} y={H - 10} textAnchor="middle" fontSize="10" fill="#B5AFA4" fontFamily="DM Sans">{m}</text>
      ))}
    </svg>
  );
}

/* —— 饼/环图 —— */
function TypeDonut() {
  const data = [
    { l: '整租', v: 62, c: '#8B7355' },
    { l: '合租', v: 26, c: '#C4A878' },
    { l: '短租', v: 12, c: '#E2D3B0' },
  ];
  let acc = 0;
  const C = 2 * Math.PI * 70;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 180, height: 180, flex: '0 0 180px' }}>
        <svg viewBox="0 0 180 180" width="180" height="180">
          {data.map((d, i) => {
            const seg = (
              <circle key={i} cx="90" cy="90" r="70" fill="none" stroke={d.c} strokeWidth="22"
                      strokeDasharray={`${((d.v / 100) * C).toFixed(2)} ${C}`}
                      strokeDashoffset={(-acc).toFixed(2)}
                      transform="rotate(-90 90 90)"/>
            );
            acc += (d.v / 100) * C;
            return seg;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--typeface-display)', fontSize: 26, fontWeight: 500, color: 'var(--ink)' }}>6,204</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>在租总数</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(d => (
          <div key={d.l} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.c }}/>
            <span style={{ flex: 1, color: 'var(--ink-2)' }}>{d.l}</span>
            <span className="num" style={{ fontWeight: 500, color: 'var(--ink)' }}>{d.v}%</span>
          </div>
        ))}
        <div className="divider"/>
        <div className="kv"><span className="k">环比上月</span><span className="v" style={{ color: 'var(--ok)' }}>+ 8.4%</span></div>
        <div className="kv"><span className="k">空置率</span><span className="v">5.2%</span></div>
      </div>
    </div>
  );
}

function Dashboard() {
  const tops = [
    { name: '朝阳门 SOHO 一居精装南向',  fav: 384, score: 92.4 },
    { name: '万科翡翠书院 · 两居整租',     fav: 312, score: 88.6 },
    { name: '中海玺园 · 一居精装',          fav: 268, score: 80.1 },
    { name: '保利春天里 · 主卧合租',        fav: 124, score: 56.3 },
    { name: '朗诗未来街区 · 两居',          fav: 108, score: 48.0 },
  ];
  const orders = [
    { user: '王小明', room: '朝阳门 SOHO 一居',  amt: 8500,  t: '2 分钟前',  s: '已支付', sk: 'ok' },
    { user: '李娜',   room: '保利春天里 主卧',    amt: 3200,  t: '12 分钟前', s: '已支付', sk: 'ok' },
    { user: '陈浩',   room: '万科翡翠书院 两居',  amt: 11200, t: '34 分钟前', s: '待支付', sk: 'warn' },
    { user: '赵敏',   room: '中海玺园 一居',      amt: 9600,  t: '1 小时前',  s: '已支付', sk: 'ok' },
    { user: '孙琪',   room: '朗诗未来街区 两居',  amt: 7800,  t: '3 小时前',  s: '已退款', sk: 'danger' },
  ];

  return (
    <Shell active="dashboard" crumbs={['控制台', '数据看板']}>
      <div className="page-head">
        <div>
          <h1 className="page-title">数据看板</h1>
          <div className="page-subtitle">实时业务指标 · 截至 {new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">
            <Icon.Calendar/> 本月
            <Icon.ChevD/>
          </button>
          <button className="btn btn-primary"><Icon.Plus/> 快速创建</button>
        </div>
      </div>

      {/* —— 统计卡 —— */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="总房源数"  value="18,482" icon="Building" delta="8.2%"  deltaDir="up"/>
        <StatCard label="在租房源"  value="6,204"  icon="Order"    delta="12.4%" deltaDir="up"/>
        <StatCard label="本月营收"  value="¥2.84M" icon="Wallet"   delta="18.6%" deltaDir="up"/>
        <StatCard label="注册用户"  value="12,438" icon="Users"    delta="3.2%"  deltaDir="down"/>
      </div>

      {/* —— 图表区 —— */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">营收趋势</div>
              <div className="card-sub">过去 12 个月 · 单位：千元</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['本年','近半年','近一月'].map((l, i) => (
                <button key={l} className="btn btn-sm" style={{
                  background: i === 0 ? 'var(--gold-tint)' : 'transparent',
                  color:      i === 0 ? 'var(--gold-2)'    : 'var(--ink-3)',
                  fontWeight: i === 0 ? 600 : 500,
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <RevenueChart/>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">房源类型分布</div>
              <div className="card-sub">当前在租结构</div>
            </div>
          </div>
          <div className="card-body">
            <TypeDonut/>
          </div>
        </div>
      </div>

      {/* —— 列表区 —— */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">收藏量 Top 5</div>
              <div className="card-sub">最受欢迎的房源</div>
            </div>
            <button className="btn-text">查看全部 <Icon.Chev style={{ width: 12, height: 12 }}/></button>
          </div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            {tops.map((t, i) => (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: i < tops.length - 1 ? '1px dashed var(--line-2)' : 'none',
              }}>
                <span className="num" style={{
                  width: 24, height: 24, fontSize: 11, fontWeight: 600,
                  display: 'grid', placeItems: 'center',
                  color: i < 3 ? 'var(--gold)' : 'var(--ink-4)',
                  borderBottom: '1px solid ' + (i < 3 ? 'var(--gold)' : 'var(--line)'),
                  fontFamily: 'var(--typeface-display)',
                }}>0{i+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>评分 {t.score} · {t.fav} 收藏</div>
                </div>
                <div style={{ width: 70 }}>
                  <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${t.score}%`, height: '100%', background: 'var(--gold)' }}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">最新订单</div>
              <div className="card-sub">实时支付记录</div>
            </div>
            <button className="btn-text">查看全部 <Icon.Chev style={{ width: 12, height: 12 }}/></button>
          </div>
          <div className="card-body" style={{ paddingTop: 4 }}>
            {orders.map((o, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: i < orders.length - 1 ? '1px dashed var(--line-2)' : 'none',
              }}>
                <div className="cell-user" style={{ flex: 1, minWidth: 0 }}>
                  <div className="av">{o.user[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="name" style={{ fontSize: 13 }}>{o.user} · {o.room}</div>
                    <div className="sub">{o.t}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>¥{o.amt.toLocaleString()}</div>
                  <span className={'pill pill-' + o.sk} style={{ marginTop: 4 }}>{o.s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

window.Dashboard = Dashboard;
