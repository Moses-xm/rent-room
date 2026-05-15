/* 雅阁租房 · 用户平台 · 个人中心 */

const PROFILE_NAV = [
  { k: 'info',        label: '个人资料', icon: 'User'     },
  { k: 'rooms',       label: '我发布的房源', icon: 'Bed'  },
  { k: 'collection',  label: '我的收藏', icon: 'Heart'    },
  { k: 'appointment', label: '我的预约', icon: 'Calendar' },
  { k: 'contract',    label: '我的合同', icon: 'Doc'      },
  { k: 'order',       label: '我的订单', icon: 'Bill'     },
];

function ProfileShell({ active, user, currentCity, onCity, children, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F4F8F2' }}>
      {/* 顶部精简栏 */}
      <header style={{ background: 'var(--primary)', color: '#fff' }}>
        <div className="container" style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
            <span style={{ width: 34, height: 34, borderRadius: 6, background: '#fff', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 19 }}>雅</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>雅阁租房</span>
            <span style={{ paddingLeft: 14, marginLeft: 4, borderLeft: '1px solid rgba(255,255,255,.3)', fontSize: 16, fontWeight: 500 }}>用户中心</span>
          </a>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 13, padding: '5px 10px', borderRadius: 3 }}>
            <PI.Logout style={{ width: 16, height: 16 }}/> 退出
          </button>
        </div>
      </header>

      {/* 头像 banner */}
      <div style={{
        background: 'linear-gradient(180deg, #DCF2E0 0%, #F4F8F2 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 叶子装饰 */}
        <svg width="120" height="40" viewBox="0 0 120 40" style={{ position: 'absolute', right: 200, top: 30, opacity: .5 }}>
          <path d="M10 25 Q 30 5 60 15 Q 90 25 110 10" fill="none" stroke="#8AC890" strokeWidth="1.4"/>
          <ellipse cx="80" cy="14" rx="11" ry="5" fill="#A8D8AE" transform="rotate(-20 80 14)"/>
          <ellipse cx="30" cy="22" rx="9" ry="4" fill="#A8D8AE" transform="rotate(15 30 22)"/>
        </svg>
        <svg width="140" height="60" viewBox="0 0 140 60" style={{ position: 'absolute', right: 60, top: 12, opacity: .55 }}>
          <path d="M10 40 Q 50 10 90 25 Q 110 32 130 18" fill="none" stroke="#8AC890" strokeWidth="1.4"/>
          <ellipse cx="50" cy="22" rx="14" ry="6" fill="#A8D8AE" transform="rotate(-15 50 22)"/>
          <ellipse cx="100" cy="30" rx="12" ry="5" fill="#A8D8AE" transform="rotate(20 100 30)"/>
          <ellipse cx="20" cy="40" rx="10" ry="4" fill="#A8D8AE" transform="rotate(40 20 40)"/>
        </svg>

        <div className="container" style={{ padding: '24px 0', display: 'flex', alignItems: 'center', gap: 18, position: 'relative' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#fff', padding: 3, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #B8D8B8, #8AC890)', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 700, color: '#fff' }}>
              {user?.name?.[0] || '?'}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              {getGreeting()}，{user?.name || '未登录'}
              <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-grid', placeItems: 'center' }}>Y</span>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: '#06AE56', color: '#fff', display: 'inline-grid', placeItems: 'center', fontSize: 11 }}>W</span>
              {user?.verified && <span className="badge-anxuan" style={{ marginLeft: 6 }}>✓ 房东认证</span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8 }}>
              账户名：<span style={{ color: 'var(--ink-2)' }}>{user?.username}</span>
              <span style={{ margin: '0 14px', color: 'var(--ink-5)' }}>|</span>
              {user?.verified ? '房东' : '用户'}
              <span style={{ margin: '0 14px', color: 'var(--ink-5)' }}>|</span>
              上次登录：<span className="num">{user?.lastLogin}</span>
            </div>
          </div>
          <button className="btn btn-line">修改资料 ›</button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container" style={{ padding: '24px 0 48px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18, alignItems: 'flex-start' }}>
        <aside>
          <div style={{ background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
            {PROFILE_NAV.map(n => {
              const I = PI[n.icon];
              const on = active === n.k;
              return (
                <a key={n.k} href={`#/profile/${n.k}`} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 22px',
                  color: on ? 'var(--primary)' : 'var(--ink-2)',
                  background: on ? 'var(--primary-light)' : 'transparent',
                  fontSize: 14, fontWeight: on ? 600 : 500,
                  borderLeft: on ? '3px solid var(--primary)' : '3px solid transparent',
                  paddingLeft: on ? 19 : 22,
                }}>
                  <I style={{ width: 18, height: 18 }}/> {n.label}
                </a>
              );
            })}
          </div>
          <div style={{ background: '#fff', borderRadius: 4, padding: 18, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              <PI.Settings style={{ width: 16, height: 16, color: 'var(--primary)' }}/> 小工具
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 18 }}>
              <a style={{ color: 'var(--ink-2)' }}>估房价</a>
              <span style={{ color: 'var(--ink-5)' }}>|</span>
              <a style={{ color: 'var(--ink-2)' }}>房贷计算器</a>
            </div>
          </div>
          <a style={{ display: 'block', textAlign: 'center', background: '#fff', borderRadius: 4, padding: '14px', marginTop: 12, fontSize: 13, color: 'var(--ink-3)' }}>注销账号</a>
        </aside>

        <main>
          {children}
        </main>
      </div>

      {/* 简化页脚 */}
      <div style={{ background: '#2C2D2E', color: '#999', padding: '20px 0', fontSize: 12, textAlign: 'center' }}>
        © 2026 雅阁租房 · 客服热线 400-880-1234
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

/* —— 个人资料 —— */
function ProfileInfo({ user, currentCity, onCity, onLogout, onVerify }) {
  const [showVerify, setShowVerify] = React.useState(false);
  React.useEffect(() => {
    if (window.location.hash.includes('auth=1')) setShowVerify(true);
  }, []);

  return (
    <ProfileShell active="info" user={user} currentCity={currentCity} onCity={onCity} onLogout={onLogout}>
      <div style={{ background: '#fff', borderRadius: 4 }}>
        <div style={{ background: 'var(--primary-light)', padding: '14px 24px', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: 'var(--primary)', fontWeight: 600 }}>个人资料</h2>
        </div>

        <div style={{ padding: '24px 30px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PI.User style={{ width: 16, height: 16 }}/> 基本账号资料
          </div>

          {[
            { l: '头像',     v: <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #B8D8B8, #8AC890)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>{user?.name?.[0]}</div>, a: '修改' },
            { l: '账号',     v: user?.username, a: null },
            { l: '昵称',     v: user?.name, a: '修改' },
            { l: '邮箱',     v: user?.email || '暂无提供', a: '绑定' },
            { l: '手机',     v: user?.phone, a: '修改' },
            { l: '密码',     v: '已设置 · 建议每 90 天更换一次', a: '修改' },
          ].map(({ l, v, a }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '18px 0', borderBottom: '1px dashed var(--line)' }}>
              <span style={{ width: 80, fontSize: 13.5, color: 'var(--ink-3)' }}>{l}</span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)' }}>{v}</span>
              {a && <button style={{ padding: '6px 18px', border: '1px solid var(--line)', borderRadius: 3, fontSize: 12.5, color: 'var(--primary)', background: 'var(--primary-bg)' }}>{a}</button>}
            </div>
          ))}

          <div style={{ fontSize: 15, fontWeight: 600, margin: '30px 0 16px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PI.Shield style={{ width: 16, height: 16 }}/> 扩充账号资料
          </div>
          {[
            { l: '真实姓名', v: user?.verified ? '沈*阳 (已认证)' : '未认证', a: user?.verified ? '已认证' : '去认证', click: () => setShowVerify(true) },
            { l: '身份证号', v: user?.verified ? '1101**********0312' : '未认证', a: null },
            { l: '所在城市', v: currentCity, a: '修改' },
            { l: '生日',     v: '1995-03-22', a: '修改' },
            { l: '性别',     v: '男', a: '修改' },
          ].map(({ l, v, a, click }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '18px 0', borderBottom: i < 4 ? '1px dashed var(--line)' : 'none' }}>
              <span style={{ width: 80, fontSize: 13.5, color: 'var(--ink-3)' }}>{l}</span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)' }}>{v}</span>
              {a && <button onClick={click} style={{ padding: '6px 18px', border: '1px solid var(--line)', borderRadius: 3, fontSize: 12.5, color: a === '已认证' ? 'var(--primary)' : 'var(--primary)', background: a === '已认证' ? 'var(--primary-light)' : 'var(--primary-bg)' }}>{a}</button>}
            </div>
          ))}
        </div>
      </div>
      {showVerify && <VerifyModal onClose={() => setShowVerify(false)} onDone={() => onVerify && onVerify()}/>}
    </ProfileShell>
  );
}

/* —— 我的房源 —— */
function ProfileRooms({ user, currentCity, onCity, onLogout }) {
  const { ROOMS, ROOM_THUMBS } = window.PORTAL_DATA;
  const mine = ROOMS.slice(0, 4);
  const [tab, setTab] = React.useState('all');

  return (
    <ProfileShell active="rooms" user={user} currentCity={currentCity} onCity={onCity} onLogout={onLogout}>
      <div style={{ background: '#fff', borderRadius: 4 }}>
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>我发布的房源</h2>
            <a className="btn btn-primary" href="#/publish/room">
              <PI.Plus style={{ width: 16, height: 16 }}/> 发布新房源
            </a>
          </div>
          <div style={{ display: 'flex', gap: 28, borderBottom: '2px solid transparent' }}>
            {[['all','全部 8'],['pub','发布中 6'],['draft','草稿 1'],['rent','已出租 1']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '12px 0', fontSize: 14,
                color: tab === k ? 'var(--primary)' : 'var(--ink-2)',
                borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1, fontWeight: tab === k ? 600 : 500,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {mine.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', gap: 18, padding: '18px 0', borderBottom: i < mine.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ width: 140, height: 105, borderRadius: 4, background: ROOM_THUMBS[r.photo], flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <a href={`#/room/${r.id}`} style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</a>
                  {i === 0 && <span className="tag tag-pri">发布中</span>}
                  {i === 1 && <span className="tag tag-blue">审核中</span>}
                  {i === 2 && <span className="tag tag-pri">发布中</span>}
                  {i === 3 && <span className="tag tag-ora">已出租</span>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 8 }}>
                  {r.layout} · {r.size}㎡ · {r.community}
                </div>
                <div style={{ display: 'flex', gap: 18, fontSize: 12, color: 'var(--ink-3)' }}>
                  <span><PI.Eye style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px', marginRight: 3 }}/>{r.views}</span>
                  <span><PI.Heart style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px', marginRight: 3 }}/>{r.favs}</span>
                  <span>发布于 {r.publishedAt}</span>
                </div>
              </div>
              <div style={{ width: 140, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="num" style={{ color: 'var(--price)', fontSize: 22, fontWeight: 700 }}>
                  {r.price}<span style={{ fontSize: 12, fontWeight: 400 }}>/月</span>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <a href={`#/publish/room?edit=${r.id}`} className="btn btn-ghost btn-sm">编辑</a>
                  <button className="btn btn-ghost btn-sm">{i === 3 ? '重新发布' : '撤回'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProfileShell>
  );
}

/* —— 我的收藏 —— */
function ProfileCollection({ user, currentCity, onCity, onLogout }) {
  const { ROOMS, ROOM_THUMBS } = window.PORTAL_DATA;
  const favs = ROOMS.slice(0, 6);

  return (
    <ProfileShell active="collection" user={user} currentCity={currentCity} onCity={onCity} onLogout={onLogout}>
      <div style={{ background: '#fff', borderRadius: 4, padding: '20px 24px' }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 600 }}>我的收藏 <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 6 }}>共 12 套</span></h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {favs.map(r => (
            <div key={r.id} style={{ border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{ aspectRatio: '4/3', background: ROOM_THUMBS[r.photo], position: 'relative' }}>
                <button style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'grid', placeItems: 'center', color: 'var(--price)' }}>
                  <PI.HeartFill style={{ width: 14, height: 14 }}/>
                </button>
              </div>
              <div style={{ padding: 12 }}>
                <a href={`#/room/${r.id}`} style={{ fontSize: 13.5, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.title}</a>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{r.layout} · {r.size}㎡ · {r.area}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10 }}>
                  <span className="num" style={{ color: 'var(--price)', fontWeight: 700, fontSize: 17 }}>{r.price.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400 }}>/月</span></span>
                  <a className="btn btn-line btn-sm">预约</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProfileShell>
  );
}

/* —— 我的预约 —— */
function ProfileAppointment({ user, currentCity, onCity, onLogout }) {
  const [tab, setTab] = React.useState('pending');
  const apps = [
    { name: '高沙路地铁口 高沙小区', date: '2026-05-18', time: '14:30', state: 'pending', agent: '刘涛',  phone: '138****6677', addr: '钱塘区 学源街' },
    { name: '万科翡翠书院 两居整租', date: '2026-05-12', time: '10:00', state: 'done',    agent: '王伟',  phone: '139****3344', addr: '海淀区 永丰' },
    { name: '保利春天里 主卧合租',   date: '2026-05-04', time: '16:00', state: 'cancel',  agent: '陈飞',  phone: '136****9988', addr: '丰台区 西四环' },
  ];
  return (
    <ProfileShell active="appointment" user={user} currentCity={currentCity} onCity={onCity} onLogout={onLogout}>
      <div style={{ background: '#fff', borderRadius: 4 }}>
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 600 }}>我的预约</h2>
          <div style={{ display: 'flex', gap: 28 }}>
            {[['pending','待看房 4'],['done','已看房 7'],['cancel','已取消 1']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '10px 0', fontSize: 14,
                color: tab === k ? 'var(--primary)' : 'var(--ink-2)',
                borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1, fontWeight: tab === k ? 600 : 500,
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {apps.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0', borderBottom: i < apps.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ width: 84, textAlign: 'center', padding: '14px 0', background: a.state === 'pending' ? 'var(--primary-light)' : 'var(--bg)', borderRadius: 4 }}>
                <div className="num" style={{ fontSize: 11, color: a.state === 'pending' ? 'var(--primary)' : 'var(--ink-3)', fontWeight: 600 }}>{a.date.slice(5)}</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 700, color: a.state === 'pending' ? 'var(--primary)' : 'var(--ink)' }}>{a.time}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</span>
                  {a.state === 'pending' && <span className="tag tag-pri">待看房</span>}
                  {a.state === 'done'    && <span className="tag" style={{ background: '#F0F0F0' }}>已看房</span>}
                  {a.state === 'cancel'  && <span className="tag" style={{ background: '#F0F0F0' }}>已取消</span>}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', display: 'flex', gap: 18 }}>
                  <span><PI.Pin style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px', marginRight: 3 }}/>{a.addr}</span>
                  <span><PI.User style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-1px', marginRight: 3 }}/>{a.agent} · {a.phone}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm">查看房源</button>
                {a.state === 'pending' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--price)' }}>取消预约</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProfileShell>
  );
}

/* —— 我的合同 —— */
function ProfileContract({ user, currentCity, onCity, onLogout }) {
  const cs = [
    { name: '高沙路地铁口 高沙小区', code: 'HT-2026-001284', start: '2026-03-15', end: '2027-03-14', monthly: 1100, paid: 3, total: 12, state: 'active' },
    { name: '保利春天里 主卧合租',   code: 'HT-2025-009912', start: '2025-09-01', end: '2026-02-28', monthly: 3200, paid: 6, total: 6,  state: 'finished' },
  ];

  return (
    <ProfileShell active="contract" user={user} currentCity={currentCity} onCity={onCity} onLogout={onLogout}>
      <div style={{ background: '#fff', borderRadius: 4, padding: '20px 24px' }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 600 }}>我的合同 <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 6 }}>在租 1 份 / 已结束 1 份</span></h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {cs.map(c => (
            <div key={c.code} style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{c.name}</span>
                    {c.state === 'active' ? <span className="tag tag-pri">在租</span> : <span className="tag">已结束</span>}
                  </div>
                  <div className="num" style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>合同编号 {c.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--price)' }}>{c.monthly.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)' }}>/月</span></div>
                  <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{c.start} ~ {c.end}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                  <span>付款进度</span>
                  <span className="num"><b style={{ color: 'var(--primary)' }}>{c.paid}</b> / {c.total} 期已付</span>
                </div>
                <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${c.paid/c.total*100}%`, height: '100%', background: c.state === 'active' ? 'var(--primary)' : 'var(--ink-4)' }}/>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 16 }}>
                {Array.from({ length: c.total }).map((_, j) => {
                  const paid = j < c.paid, due = j === c.paid;
                  return (
                    <div key={j} style={{
                      padding: '7px 0', textAlign: 'center', borderRadius: 3, fontSize: 11.5,
                      background: paid ? 'var(--primary-light)' : (due ? '#FFF7E5' : 'var(--bg)'),
                      color: paid ? 'var(--primary)' : (due ? '#B8770A' : 'var(--ink-4)'),
                      fontWeight: 500,
                    }}>第 {j+1} 期 {paid ? '✓' : (due ? '待付' : '')}</div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px dashed var(--line)', paddingTop: 14 }}>
                <button className="btn btn-ghost btn-sm">查看合同</button>
                {c.state === 'active' && (
                  <>
                    <button className="btn btn-ghost btn-sm">申请退房</button>
                    <button className="btn btn-ghost btn-sm">续租</button>
                    <button className="btn btn-primary btn-sm">支付下一期</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProfileShell>
  );
}

/* —— 我的订单 —— */
function ProfileOrder({ user, currentCity, onCity, onLogout }) {
  const [tab, setTab] = React.useState('all');
  const orders = [
    { date: '2026-05-08', time: '12:42', desc: '高沙路地铁口 · 第 3 期房租', amount: 1100, type: 'pay' },
    { date: '2026-04-08', time: '09:18', desc: '高沙路地铁口 · 第 2 期房租', amount: 1100, type: 'pay' },
    { date: '2026-03-15', time: '14:30', desc: '高沙路地铁口 · 押金 + 首期', amount: 2200, type: 'pay' },
    { date: '2026-03-12', time: '20:01', desc: '保利春天里 主卧合租 · 收租金', amount: 3200, type: 'in' },
    { date: '2026-02-25', time: '11:48', desc: '钱包充值', amount: 5000, type: 'in' },
  ];

  return (
    <ProfileShell active="order" user={user} currentCity={currentCity} onCity={onCity} onLogout={onLogout}>
      <div style={{ background: '#fff', borderRadius: 4 }}>
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>我的订单</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <PI.Wallet style={{ width: 16, height: 16, color: 'var(--primary)' }}/>
            余额 <span className="num" style={{ fontWeight: 700, color: 'var(--ink)' }}>¥12,840.00</span>
            <button className="btn btn-primary btn-sm">充值</button>
          </div>
        </div>
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', gap: 28 }}>
            {[['all','全部 24'],['pay','支出 18'],['in','收入 6']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: '12px 0', fontSize: 14,
                color: tab === k ? 'var(--primary)' : 'var(--ink-2)',
                borderBottom: tab === k ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1, fontWeight: tab === k ? 600 : 500,
              }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          {orders.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: i < orders.length - 1 ? '1px dashed var(--line)' : 'none' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', marginRight: 14,
                background: o.type === 'pay' ? 'var(--price-light)' : 'var(--primary-light)',
                color: o.type === 'pay' ? 'var(--price)' : 'var(--primary)',
                display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700,
              }}>{o.type === 'pay' ? '−' : '+'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{o.desc}</div>
                <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 3 }}>{o.date} {o.time}</div>
              </div>
              <div className="num" style={{ fontSize: 16, fontWeight: 700, color: o.type === 'pay' ? 'var(--ink)' : 'var(--primary)' }}>
                {o.type === 'pay' ? '−' : '+'}¥{o.amount.toLocaleString()}
              </div>
              <div style={{ marginLeft: 18, fontSize: 12, color: 'var(--primary)' }}>· 成功</div>
            </div>
          ))}
        </div>
      </div>
    </ProfileShell>
  );
}

window.ProfileInfo = ProfileInfo;
window.ProfileRooms = ProfileRooms;
window.ProfileCollection = ProfileCollection;
window.ProfileAppointment = ProfileAppointment;
window.ProfileContract = ProfileContract;
window.ProfileOrder = ProfileOrder;
