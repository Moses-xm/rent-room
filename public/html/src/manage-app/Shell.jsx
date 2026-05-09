/* 雅阁租房 · 管理后台 · 外壳：左侧栏 + 顶栏 */

const NAV = [
  { group: '概览', items: [
    { key: 'dashboard', label: '数据看板', icon: 'Dashboard', hash: '#/dashboard' },
  ]},
  { group: '业务管理', items: [
    { key: 'users',       label: '用户管理', icon: 'Users',     hash: '#/users', badge: '12' },
    { key: 'rooms',       label: '房源管理', icon: 'Building',  hash: '#/rooms' },
    { key: 'communities', label: '小区管理', icon: 'Pin',       hash: '#/communities' },
    { key: 'orders',      label: '订单管理', icon: 'Order',     hash: '#/orders' },
    { key: 'contracts',   label: '合同管理', icon: 'Doc',       hash: '#/contracts' },
    { key: 'appointments',label: '预约管理', icon: 'Calendar',  hash: '#/appointments' },
  ]},
  { group: '运营', items: [
    { key: 'banners',  label: '轮播管理', icon: 'Megaphone', hash: '#/banners' },
    { key: 'reviews',  label: '评价管理', icon: 'Heart',     hash: '#/reviews' },
    { key: 'finance',  label: '财务报表', icon: 'Wallet',    hash: '#/finance' },
  ]},
  { group: '系统', items: [
    { key: 'settings', label: '系统设置', icon: 'Gear',   hash: '#/settings' },
  ]},
];

function Sidebar({ active }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">雅</div>
        <div>
          <div className="sidebar-brand-name">雅阁</div>
          <div className="sidebar-brand-sub">Yage · Admin</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(g => (
          <div key={g.group}>
            <div className="sidebar-section">{g.group}</div>
            {g.items.map(it => {
              const I = Icon[it.icon];
              const isActive = it.key === active;
              return (
                <a key={it.key} href={it.hash}
                   className={'nav-item' + (isActive ? ' is-active' : '')}>
                  <I className="ic"/>
                  <span>{it.label}</span>
                  {it.badge ? <span className="nav-item-badge">{it.badge}</span> : null}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">A</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sidebar-footer-name">Admin</div>
          <div className="sidebar-footer-role">超级管理员</div>
        </div>
        <button className="icon-btn" title="退出登录"><Icon.Logout/></button>
      </div>
    </aside>
  );
}

function Topbar({ crumbs = [] }) {
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="topbar-spacer"/>

      <div className="topbar-actions">
        <button className="topbar-btn" title="通知">
          <Icon.Bell style={{ width: 17, height: 17 }}/>
          <span className="dot"/>
        </button>
      </div>

      <div className="topbar-divider"/>

      <CitySelector/>

      <div className="topbar-divider"/>

      <UserMenu/>
    </header>
  );
}

function CitySelector() {
  const [open, setOpen] = React.useState(false);
  const [city, setCity] = React.useState('杭州市');
  const regions = [
    ['华北东北', ['北京市','天津市','大连市','石家庄市','哈尔滨市','沈阳市','太原市','长春市','威海市','潍坂市','呼和浩特市','包头市']],
    ['华东地区', ['上海市','杭州市','苏州市','南京市','无锡市','济南市','青岛市','昆山市','宁波市','南昌市','福州市','合肥市','徐州市','淄博市']],
    ['华南地区', ['深圳市','广州市','佛山市','三亚市','惠州市','东莞市','海口市','珠海市','中山市','厦门市']],
    ['西部地区', ['成都市','重庆市','西安市','昆明市','贵阳市','兰州市','乌鲁木齐','拉萨']],
  ];
  return (
    <div className="popover-anchor">
      <button className="topbar-user" onClick={() => setOpen(o => !o)} style={{ gap: 8 }}>
        <Icon.Pin style={{ width: 14, height: 14, color: 'var(--gold)' }}/>
        <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{city}</span>
        <Icon.ChevD style={{ width: 14, height: 14, opacity: .55, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}/>
      </button>
      {open && (
        <>
          <div className="popover-mask" onClick={() => setOpen(false)}/>
          <div className="popover popover-city">
            {regions.map(([reg, list]) => (
              <div key={reg} className="city-region">
                <div className="city-region-label">{reg}</div>
                <div className="city-list">
                  {list.map(c => (
                    <button key={c} className={'city-chip' + (c === city ? ' is-active' : '')}
                            onClick={() => { setCity(c); setOpen(false); }}>{c}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="city-popover-foot">
              <a href="#" onClick={e => e.preventDefault()}>更多城市 <Icon.Chev style={{ width: 12, height: 12 }}/></a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="popover-anchor">
      <button className="topbar-user" onClick={() => setOpen(o => !o)}>
        <div className="topbar-user-avatar">A</div>
        <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Admin</span>
        <Icon.ChevD style={{ width: 14, height: 14, opacity: .55, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}/>
      </button>
      {open && (
        <>
          <div className="popover-mask" onClick={() => setOpen(false)}/>
          <div className="popover popover-user">
            <div className="user-popover-head">
              <div className="av">A</div>
              <div style={{ minWidth: 0 }}>
                <div className="nm">Admin</div>
                <div className="em">admin@yage.com</div>
              </div>
            </div>
            <button className="popover-item">
              <Icon.Users className="ic"/> 个人资料
            </button>
            <button className="popover-item">
              <Icon.Gear className="ic"/> 账号设置
            </button>
            <button className="popover-item">
              <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4M12 17.5h.01"/></svg>
              帮助中心
            </button>
            <div className="popover-divider"/>
            <button className="popover-item danger">
              <Icon.Logout className="ic"/> 退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Shell({ active, crumbs, children }) {
  return (
    <div className="app">
      <Sidebar active={active}/>
      <div className="main">
        <Topbar crumbs={crumbs}/>
        <main className="page">
          {children}
        </main>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.Shell = Shell;
