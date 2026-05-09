/* 雅阁租房 · 管理后台 · 路由入口 */

function App() {
  const [hash, setHash] = React.useState(window.location.hash || '#/dashboard');
  React.useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const segs = hash.replace(/^#\//, '').split('?')[0].split('/');
  const route = segs[0] || 'dashboard';
  const id    = segs[1];

  switch (route) {
    case 'dashboard':   return <Dashboard/>;
    case 'users':       return <Users/>;
    case 'communities': return id ? <CommunityDetail id={id}/> : <Communities/>;
    case 'rooms':       return id ? <RoomDetail id={id}/> : <Rooms/>;
    default:            return <Placeholder route={route}/>;
  }
}

function Placeholder({ route }) {
  const labels = {
    rooms: '房源管理', communities: '小区管理', orders: '订单管理',
    contracts: '合同管理', appointments: '预约管理',
    banners: '轮播管理', reviews: '评价管理', finance: '财务报表',
    settings: '系统设置',
  };
  const title = labels[route] || route;
  return (
    <Shell active={route} crumbs={['控制台', title]}>
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <div className="page-subtitle">该模块设计待补全</div>
        </div>
      </div>
      <div className="card">
        <div className="empty">
          <div className="empty-title">暂未设计 — {title}</div>
          <div className="empty-sub">本原型重点呈现 Dashboard 与用户管理。其他模块结构与此一致：页头 + 状态卡 + 表格 + 弹窗。</div>
          <div style={{ marginTop: 18 }}>
            <a className="btn btn-primary" href="#/dashboard">返回数据看板</a>
          </div>
        </div>
      </div>
    </Shell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
