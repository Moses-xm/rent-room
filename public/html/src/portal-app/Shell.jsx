/* 雅阁租房 · 用户平台 · Shell (header + green nav + footer) */

const PORTAL_NAV = [
  { key: 'district', label: '区域找房', hash: '#/search?mode=district' },
  { key: 'subway',   label: '地铁找房', hash: '#/search?mode=subway' },
  { key: 'map',      label: '地图找房', hash: '#/map' },
  { key: 'community',label: '小区',     hash: '#/communities' },
];

function PHeader({ user, onCity, currentCity = '杭州' }) {
  const [showCity, setShowCity] = React.useState(false);
  return (
    <header className="p-header">
      <div className="p-header-inner">
        <a className="p-logo" href="#/">
          <span className="p-logo-mark">雅</span>
          <span className="p-logo-text">雅阁租房</span>
          <span className="p-logo-sub">{currentCity}</span>
        </a>

        <div className="p-search">
          <input placeholder="请输入小区名称、地址..."/>
          <button className="p-search-btn">搜索</button>
        </div>

        <a className="p-map-btn" href="#/map">
          <PI.Pin style={{ width: 16, height: 16 }}/> 地图找房
        </a>
      </div>

      {/* 公告条 + 用户区 */}
      <div style={{ background: '#FAFAFA', borderTop: '1px solid #F4F4F4' }}>
        <div className="p-header-inner" style={{ padding: '8px 0', height: 36 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span><PI.Shield style={{ width: 13, height: 13, display: 'inline', verticalAlign: '-2px', marginRight: 4, color: 'var(--primary)' }}/>真房源 · 实勘照片 · 房东直发</span>
            <span style={{ color: 'var(--ink-4)' }}>|</span>
            <span>客服热线 400-880-1234</span>
          </div>
          <div className="p-user-area">
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowCity(!showCity)} style={{ color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <PI.Pin style={{ width: 12, height: 12 }}/> {currentCity} <PI.ChevD style={{ width: 11, height: 11 }}/>
              </button>
              {showCity && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowCity(false)}/>
                  <div style={{ position: 'absolute', top: 28, right: 0, width: 380, background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: 14, boxShadow: 'var(--shadow-lg)', zIndex: 50 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>切换城市</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {window.PORTAL_DATA.CITIES.map(c => (
                        <button key={c} onClick={() => { setShowCity(false); onCity && onCity(c); }} style={{
                          padding: '6px 0', borderRadius: 3, fontSize: 13,
                          background: c === currentCity ? 'var(--primary-light)' : 'transparent',
                          color: c === currentCity ? 'var(--primary)' : 'var(--ink-2)',
                          fontWeight: c === currentCity ? 600 : 400,
                        }}>{c}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="p-user-divider">|</span>
            {user ? (
              <>
                <a href="#/profile/info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>{user.name[0]}</div>
                  {user.name}
                </a>
                <span className="p-user-divider">|</span>
                <a href="#/profile/collection"><PI.Heart style={{ width: 13, height: 13, display: 'inline', verticalAlign: '-2px' }}/> 我的收藏</a>
              </>
            ) : (
              <>
                <a href="#/login">登录</a>
                <span className="p-user-divider">|</span>
                <a href="#/register">注册</a>
              </>
            )}
            <span className="p-user-divider">|</span>
            <a>APP 下载</a>
            <a>帮助中心</a>
          </div>
        </div>
      </div>
    </header>
  );
}

function PNav({ active, user, onPublishClick }) {
  const [showPublishDD, setShowPublishDD] = React.useState(false);

  return (
    <nav className="p-nav">
      <div className="p-nav-inner">
        <a href="#/" className={active === 'home' ? 'is-active' : ''}>首页</a>
        {PORTAL_NAV.map(n => (
          <a key={n.key} href={n.hash} className={active === n.key ? 'is-active' : ''}>{n.label}</a>
        ))}
        <a
          style={{ position: 'relative' }}
          className={active === 'publish' ? 'is-active' : ''}
          onClick={(e) => {
            e.preventDefault();
            if (!user || !user.verified) {
              onPublishClick && onPublishClick();
            } else {
              setShowPublishDD(!showPublishDD);
            }
          }}
          onMouseEnter={() => user && user.verified && setShowPublishDD(true)}
          onMouseLeave={() => setShowPublishDD(false)}
        >
          我要出租 <PI.ChevD style={{ width: 12, height: 12, marginLeft: 4, opacity: .8 }}/>
          {showPublishDD && user && user.verified && (
            <div className="p-publish-dropdown">
              <a href="#/publish/community"><PI.Plus style={{ width: 14, height: 14, marginRight: 6 }}/>创建小区</a>
              <a href="#/publish/room"><PI.Plus style={{ width: 14, height: 14, marginRight: 6 }}/>创建房源</a>
              <a href="#/profile/rooms"><PI.Edit style={{ width: 14, height: 14, marginRight: 6 }}/>修改房源</a>
            </div>
          )}
        </a>
      </div>
    </nav>
  );
}

function PFooter() {
  return (
    <footer className="p-footer">
      <div className="p-footer-inner">
        <div className="p-footer-top">
          <div className="p-footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>雅</span>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>雅阁租房</span>
            </div>
            <div style={{ lineHeight: 1.8 }}>专注真房源 · 100% 实勘照片<br/>客服热线 <span style={{ color: '#fff', fontWeight: 600 }}>400-880-1234</span><br/>周一至周日 9:00 - 22:00</div>
          </div>
          {[
            ['寻找房源', ['整租','合租','地图找房','热门小区','地铁周边','公寓']],
            ['出租房源', ['免费发布','房东工具','签约管理','收款流水']],
            ['关于雅阁', ['品牌故事','加入我们','商务合作','媒体中心']],
            ['帮助中心', ['新手指南','常见问题','投诉建议','服务条款']],
          ].map(([t, items]) => (
            <div key={t} className="p-footer-col">
              <h4>{t}</h4>
              {items.map(i => <a key={i} href="#">{i}</a>)}
            </div>
          ))}
        </div>
        <div className="p-footer-bot">
          <span>© 2026 雅阁租房 · 京 ICP 备 12345678 号 · 沪公网安备 31011502000123 号</span>
          <span>友情链接 · 网站地图 · 联系我们</span>
        </div>
      </div>
    </footer>
  );
}

function Shell({ active, user, currentCity, onCity, children }) {
  const [showAuthGate, setShowAuthGate] = React.useState(false);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PHeader user={user} currentCity={currentCity} onCity={onCity}/>
      <PNav active={active} user={user} onPublishClick={() => setShowAuthGate(true)}/>
      <div style={{ flex: 1 }}>
        {children}
      </div>
      <PFooter/>
      {showAuthGate && <AuthGateModal user={user} onClose={() => setShowAuthGate(false)}/>}
    </div>
  );
}

/* 实名认证提示弹窗 */
function AuthGateModal({ user, onClose }) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">提示</div>
          <button className="modal-close" onClick={onClose}><PI.X/></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 26px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <PI.Shield style={{ width: 32, height: 32 }}/>
          </div>
          {!user ? (
            <>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>请先登录</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 22 }}>
                发布房源需要登录并完成实名认证（成为房东）后才能操作，登录后即可继续。
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <a className="btn btn-ghost" onClick={onClose}>取消</a>
                <a className="btn btn-primary" href="#/login" onClick={onClose}>立即登录</a>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>需要完成实名认证</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.7, marginBottom: 22 }}>
                您当前为「普通用户」身份，发布房源需要先认证为「房东」。<br/>
                上传身份证 + 房屋所有权证明，1-2 个工作日完成审核。
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-ghost" onClick={onClose}>稍后再说</button>
                <a className="btn btn-primary" href="#/profile/info?auth=1" onClick={onClose}>去认证</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.Shell = Shell;
window.PHeader = PHeader;
window.PNav = PNav;
window.PFooter = PFooter;
window.AuthGateModal = AuthGateModal;
