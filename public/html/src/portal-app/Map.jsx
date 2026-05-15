/* 雅阁租房 · 用户平台 · 地图找房 */

function FakeMap() {
  // 模拟一张地图：道路 + 河流 + 公园 + 标签
  return (
    <svg viewBox="0 0 1000 800" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      {/* 底色 */}
      <rect width="1000" height="800" fill="#F0EEE6"/>
      {/* 钱塘江 */}
      <path d="M -50 580 Q 200 540 420 580 T 1060 540 L 1060 800 L -50 800 Z" fill="#B8D6E8" opacity=".75"/>
      <path d="M -50 580 Q 200 540 420 580 T 1060 540" stroke="#8AB8CE" strokeWidth="1" fill="none" opacity=".4"/>
      {/* 公园 */}
      <ellipse cx="280" cy="280" rx="130" ry="80" fill="#C8DDB0" opacity=".7"/>
      <text x="280" y="285" textAnchor="middle" fontSize="13" fill="#618D52" fontFamily="PingFang SC">西湖风景区</text>
      <ellipse cx="700" cy="160" rx="100" ry="55" fill="#C8DDB0" opacity=".7"/>
      <text x="700" y="165" textAnchor="middle" fontSize="12" fill="#618D52" fontFamily="PingFang SC">京杭大运河 杭州景区</text>
      <ellipse cx="850" cy="660" rx="120" ry="60" fill="#C8DDB0" opacity=".7"/>
      <text x="850" y="665" textAnchor="middle" fontSize="12" fill="#618D52" fontFamily="PingFang SC">湘湖国家旅游度假区</text>
      {/* 主要道路（白色） */}
      <g stroke="#FFFFFF" strokeWidth="11" fill="none">
        <path d="M 0 200 Q 200 195 400 220 T 1000 240"/>
        <path d="M 0 380 L 600 360 L 1000 380"/>
        <path d="M 0 480 L 1000 460"/>
        <path d="M 0 680 L 1000 700"/>
        <path d="M 200 0 L 200 800"/>
        <path d="M 480 0 L 480 800"/>
        <path d="M 760 0 L 760 800"/>
        <path d="M 920 0 L 920 800"/>
      </g>
      {/* 道路橙边（高速） */}
      <g stroke="#F2B95C" strokeWidth="3" fill="none">
        <path d="M 0 200 Q 200 195 400 220 T 1000 240"/>
        <path d="M 200 0 L 200 800"/>
        <path d="M 760 0 L 760 800"/>
      </g>
      {/* 街区方块 */}
      <g fill="#E8E2D4" opacity=".7">
        {Array.from({ length: 35 }).map((_, i) => {
          const x = (i % 7) * 140 + 40;
          const y = Math.floor(i / 7) * 90 + 50;
          return <rect key={i} x={x} y={y} width="80" height="50" rx="3"/>;
        })}
      </g>
      {/* 路名 */}
      <text x="10" y="194" fontSize="10" fill="#A8997D">绕城北线</text>
      <text x="10" y="476" fontSize="10" fill="#A8997D">文一路</text>
      <text x="10" y="676" fontSize="10" fill="#A8997D">钱塘江大桥</text>
      <text x="206" y="14" fontSize="10" fill="#A8997D">中河高架</text>
      <text x="766" y="14" fontSize="10" fill="#A8997D">秋石高架</text>
      {/* 地铁线 */}
      <g stroke="#2A6FDB" strokeWidth="2.5" fill="none" strokeDasharray="6 4" opacity=".7">
        <path d="M 100 100 Q 300 200 500 280 T 900 480"/>
      </g>
      <text x="500" y="270" fontSize="10" fill="#2A6FDB" fontWeight="600">1号线</text>
      {/* 地标 */}
      <g>
        <circle cx="500" cy="400" r="4" fill="#2A6FDB"/>
        <text x="510" y="395" fontSize="12" fill="#2A2A2A" fontFamily="PingFang SC" fontWeight="500">杭州市</text>
        <text x="510" y="408" fontSize="10" fill="#666" fontFamily="PingFang SC">上城区</text>

        <circle cx="380" cy="430" r="3.5" fill="#2A6FDB"/>
        <text x="358" y="450" fontSize="11" fill="#2A2A2A" fontFamily="PingFang SC">滨江</text>

        <circle cx="640" cy="630" r="3.5" fill="#2A6FDB"/>
        <text x="618" y="620" fontSize="11" fill="#2A2A2A" fontFamily="PingFang SC">萧山区</text>
      </g>
    </svg>
  );
}

function PortalMap({ user, currentCity, onCity }) {
  const { ROOMS, ROOM_THUMBS } = window.PORTAL_DATA;
  const [hovered, setHovered] = React.useState(null);
  const pins = [
    { x: 32, y: 18, count: 1832, name: '临平' },
    { x: 88, y: 38, count: 4286, name: '钱塘' },
    { x: 30, y: 40, count: 982,  name: '拱墅' },
    { x: 24, y: 56, count: 1244, name: '西湖' },
    { x: 38, y: 65, count: 2168, name: '上城' },
    { x: 50, y: 70, count: 1582, name: '滨江' },
    { x: 64, y: 80, count: 936,  name: '萧山' },
  ];

  return (
    <Shell active="map" user={user} currentCity={currentCity} onCity={onCity}>
      {/* 顶部紧凑搜索条 */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ padding: '8px 14px', fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <PI.Pin style={{ width: 14, height: 14, color: 'var(--primary)' }}/>{currentCity} <PI.ChevD style={{ width: 11, height: 11 }}/>
          </button>
          <div style={{ flex: 1, maxWidth: 480, display: 'flex', alignItems: 'center', border: '1.5px solid var(--primary)', borderRadius: 4, overflow: 'hidden' }}>
            <input placeholder="输入小区名或地标名开始找房" style={{ flex: 1, height: 36, border: 0, outline: 0, padding: '0 14px', fontSize: 14 }}/>
            <button style={{ height: 36, padding: '0 18px', background: 'var(--primary)', color: '#fff', fontSize: 14 }}>
              <PI.Search style={{ width: 16, height: 16 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['选择区域','租金','类型','房型','更多'].map(t => (
              <button key={t} style={{ padding: '8px 18px', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {t} <PI.ChevD style={{ width: 12, height: 12, color: 'var(--ink-4)' }}/>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <a href="#/search" style={{ fontSize: 13, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              列表
            </a>
          </div>
        </div>
      </div>

      {/* 主区：左列表 + 右地图 */}
      <div style={{ display: 'grid', gridTemplateColumns: '410px 1fr', height: 'calc(100vh - 240px)', minHeight: 600 }}>
        <div style={{ background: '#fff', borderRight: '1px solid var(--line)', overflowY: 'auto' }}>
          <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--ink-3)' }}>
            在地图内找到 <span className="num" style={{ color: 'var(--price)', fontWeight: 700 }}>225,434</span> 套在租房源
          </div>
          {ROOMS.map(r => (
            <a key={r.id} href={`#/room/${r.id}`} style={{ display: 'flex', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 120, height: 90, borderRadius: 4, background: ROOM_THUMBS[r.photo], flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>
                  {r.layout} · <span style={{ color: 'var(--ink-2)' }}>{r.type}</span> · {r.orient}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                  {r.district} · {r.area}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{r.community}</span>
                  <span className="num" style={{ color: 'var(--price)', fontWeight: 700, fontSize: 16 }}>{r.price.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400 }}>元/月</span></span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 地图 */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <FakeMap/>

          {/* 区域气泡 */}
          {pins.map((p, i) => (
            <div key={i}
                 onMouseEnter={() => setHovered(p.name)}
                 onMouseLeave={() => setHovered(null)}
                 style={{
              position: 'absolute',
              left: `${p.x}%`, top: `${p.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
            }}>
              <div style={{
                width: hovered === p.name ? 100 : 88,
                height: hovered === p.name ? 100 : 88,
                borderRadius: '50%',
                background: hovered === p.name ? 'rgba(56, 159, 90, .85)' : 'rgba(74, 175, 110, .8)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontWeight: 600,
                textAlign: 'center',
                lineHeight: 1.2,
                boxShadow: '0 4px 12px rgba(0,0,0,.15)',
                border: '2px solid rgba(255,255,255,.6)',
                transition: 'all .2s',
              }}>
                <div>
                  <div style={{ fontSize: 16 }}>{p.name}</div>
                  <div className="num" style={{ fontSize: 12, opacity: .9 }}>{p.count}</div>
                </div>
              </div>
            </div>
          ))}

          {/* 缩放控件 */}
          <div style={{ position: 'absolute', right: 20, bottom: 80, display: 'flex', flexDirection: 'column' }}>
            <button style={{ width: 36, height: 36, background: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)', borderRadius: '4px 4px 0 0', fontSize: 18, color: 'var(--ink-2)', display: 'grid', placeItems: 'center' }}>+</button>
            <button style={{ width: 36, height: 36, background: '#fff', boxShadow: 'var(--shadow-sm)', borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', borderRadius: '0 0 4px 4px', fontSize: 18, color: 'var(--ink-2)', display: 'grid', placeItems: 'center' }}>−</button>
          </div>

          {/* 比例尺 */}
          <div style={{ position: 'absolute', right: 28, bottom: 28, fontSize: 11, color: 'var(--ink-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 40, height: 4, borderLeft: '1px solid var(--ink-3)', borderRight: '1px solid var(--ink-3)', borderBottom: '1px solid var(--ink-3)' }}/>
              5 公里
            </div>
          </div>

          {/* 测距按钮 */}
          <button style={{ position: 'absolute', right: 20, bottom: 160, width: 48, height: 48, borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M4 4h16v8H4zM4 12v4l8 4 8-4v-4M4 6v2M8 4v2M12 4v2M16 4v2M20 6v2"/></svg>
          </button>
        </div>
      </div>
    </Shell>
  );
}

window.PortalMap = PortalMap;
window.FakeMap = FakeMap;
