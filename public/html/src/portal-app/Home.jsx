/* 雅阁租房 · 用户平台 · 首页 */

function PortalHome({ user, currentCity, onCity }) {
  const { ROOMS, COMMUNITIES, ROOM_THUMBS } = window.PORTAL_DATA;
  const [searchType, setSearchType] = React.useState('整租');
  const featured = ROOMS.slice(0, 8);
  const hotCommunities = COMMUNITIES.slice(0, 4);

  return (
    <Shell active="home" user={user} currentCity={currentCity} onCity={onCity}>
      {/* ====== Hero ====== */}
      <section style={{
        background: 'linear-gradient(135deg, #E8FBF3 0%, #F5FCF8 50%, #FFFFFF 100%)',
        padding: '48px 0 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰圆圈 */}
        <div style={{ position: 'absolute', right: -100, top: -60, width: 360, height: 360, borderRadius: 180, background: 'radial-gradient(circle, rgba(37,213,160,.10), transparent 70%)' }}/>
        <div style={{ position: 'absolute', left: -80, bottom: -50, width: 280, height: 280, borderRadius: 140, background: 'radial-gradient(circle, rgba(37,213,160,.06), transparent 70%)' }}/>

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: '#fff', borderRadius: 999, fontSize: 12.5, color: 'var(--primary)', fontWeight: 600, boxShadow: '0 2px 8px rgba(37,213,160,.12)' }}>
              <PI.Shield style={{ width: 14, height: 14 }}/>
              真实房源 · 房东直发 · 零中介费
            </div>
            <h1 style={{ margin: '18px 0 8px', fontSize: 42, fontWeight: 800, letterSpacing: '-.01em', color: 'var(--ink)' }}>
              找一个，<span style={{ color: 'var(--primary)' }}>能久住的家</span>
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3)' }}>
              {currentCity}地区 286 万套实勘房源 · 4.8 ★ 租客评分
            </p>
          </div>

          {/* —— 大搜索框 —— */}
          <div style={{ maxWidth: 780, margin: '0 auto', background: '#fff', borderRadius: 6, boxShadow: '0 12px 32px rgba(37,213,160,.18)' }}>
            {/* 类型 tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
              {['整租','合租','小区','地图找房'].map(t => (
                <button key={t} onClick={() => setSearchType(t)} style={{
                  padding: '14px 22px', fontSize: 15, fontWeight: 600,
                  color: searchType === t ? 'var(--primary)' : 'var(--ink-3)',
                  borderBottom: searchType === t ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -1,
                }}>{t}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', padding: 12 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
                <PI.Search style={{ width: 18, height: 18, color: 'var(--ink-4)' }}/>
                <input
                  placeholder="输入小区、地铁站或商圈，如「金沙湖」"
                  style={{ flex: 1, border: 0, outline: 'none', fontSize: 15, height: 48 }}/>
              </div>
              <button className="btn btn-primary" style={{ height: 48, padding: '0 36px', fontSize: 16, borderRadius: 4 }}>
                开始找房
              </button>
            </div>
          </div>

          {/* —— 快捷入口 —— */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
            {[
              ['#/search?bedroom=一室','一居室'],
              ['#/search?bedroom=二室','两居室'],
              ['#/search?priceMin=2000&priceMax=3000','2-3千'],
              ['#/search?priceMin=3000&priceMax=5000','3-5千'],
              ['#/search?subway=1号线','1 号线沿线'],
              ['#/search?district=钱塘','钱塘区'],
              ['#/search?district=西湖','西湖区'],
              ['#/search?type=合租','合租优选'],
            ].map(([h, l]) => (
              <a key={l} href={h} style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 13,
                background: 'rgba(255,255,255,.85)', color: 'var(--ink-2)',
                border: '1px solid rgba(37,213,160,.2)',
                transition: 'all .15s',
              }}>{l}</a>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 数据条 ====== */}
      <section className="container" style={{ marginTop: -28, position: 'relative', zIndex: 2 }}>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: 'var(--shadow)', padding: '20px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            ['286 万', '在租房源', '#25D5A0'],
            ['82 万', '认证房东', '#FE6E47'],
            ['4.8 ★', '租客评分', '#FFB547'],
            ['零', '中介费用', '#2A6FDB'],
          ].map(([n, l, c]) => (
            <div key={l} style={{ textAlign: 'center', borderRight: '1px solid var(--line)', position: 'relative' }}>
              <div className="num" style={{ fontSize: 26, fontWeight: 800, color: c }}>{n}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== 精选房源 ====== */}
      <section className="container" style={{ paddingTop: 48 }}>
        <SectionHeader title="精选房源" sub="编辑团队精选 · 房东实勘 · 24 小时内上线" cta="查看更多 →" ctaHref="#/search"/>

        {/* 房型分类条 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', padding: 6, borderRadius: 4, border: '1px solid var(--line)' }}>
          {['全部','整租','合租','公寓','短租','视频看房'].map((t, i) => (
            <button key={t} style={{
              padding: '7px 18px', borderRadius: 3, fontSize: 13.5,
              background: i === 0 ? 'var(--primary)' : 'transparent',
              color: i === 0 ? '#fff' : 'var(--ink-2)',
              fontWeight: i === 0 ? 600 : 500,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {featured.map(r => <RoomCard key={r.id} room={r}/>)}
        </div>
      </section>

      {/* ====== 热门小区 ====== */}
      <section className="container" style={{ paddingTop: 56 }}>
        <SectionHeader title="热门小区" sub="基于近 30 天浏览与收藏" cta="更多小区 →" ctaHref="#/communities"/>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {hotCommunities.map((c, i) => (
            <a key={c.id} href={`#/community/${c.id}`} style={{ display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', transition: 'all .15s' }}
               onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
               onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ aspectRatio: '16/10', background: ROOM_THUMBS[i % ROOM_THUMBS.length], position: 'relative' }}>
                <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 11, borderRadius: 2 }}>{c.district}</div>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
                  <PI.Pin style={{ width: 11, height: 11, display: 'inline', verticalAlign: '-1px', marginRight: 2 }}/>
                  {c.area} · {c.address.slice(5, 18)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
                  <div className="num" style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{Math.floor(Math.random() * 50 + 10)}</span>
                    <span style={{ color: 'var(--ink-3)', marginLeft: 2 }}>套在租</span>
                  </div>
                  <div>
                    <span className="num" style={{ color: 'var(--price)', fontSize: 16, fontWeight: 700 }}>{c.avg.toLocaleString()}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 2 }}>元/月起</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ====== 服务承诺 ====== */}
      <section className="container" style={{ paddingTop: 60 }}>
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6, padding: '32px 36px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }}>
          {[
            ['真实房源', '所有房源经平台实勘审核', PI.Shield],
            ['零中介费', '直连房东，平台不抽佣', PI.Verified],
            ['押付灵活', '支持押一付一、押一付三', PI.Bill],
            ['极速签约', '在线签约，3 天入住', PI.Calendar],
          ].map(([t, d, I], i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <I style={{ width: 22, height: 22 }}/>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.6 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function SectionHeader({ title, sub, cta, ctaHref }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-.01em', position: 'relative', paddingLeft: 14 }}>
          <span style={{ position: 'absolute', left: 0, top: 5, bottom: 5, width: 4, background: 'var(--primary)', borderRadius: 2 }}/>
          {title}
        </h2>
        <p style={{ margin: '6px 0 0 14px', fontSize: 13, color: 'var(--ink-3)' }}>{sub}</p>
      </div>
      {cta && <a href={ctaHref} style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>{cta}</a>}
    </div>
  );
}

function RoomCard({ room }) {
  const { ROOM_THUMBS } = window.PORTAL_DATA;
  return (
    <a href={`#/room/${room.id}`} style={{ display: 'block', background: '#fff', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--line)', transition: 'all .15s' }}
       onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
       onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ aspectRatio: '4/3', background: ROOM_THUMBS[room.photo], position: 'relative' }}>
        {room.anxuan && (
          <div style={{ position: 'absolute', top: 8, left: 8, background: '#fff', color: 'var(--primary)', fontSize: 11, padding: '2px 8px', borderRadius: 2, fontWeight: 500 }}>
            安选
          </div>
        )}
        <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.4)', color: '#fff', display: 'grid', placeItems: 'center' }}>
          <PI.Heart style={{ width: 14, height: 14 }}/>
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink)' }}>{room.title}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
          {room.layout} · {room.size}㎡ · {room.area}
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {room.tags.slice(0, 3).map(t => <span key={t} className="tag" style={{ fontSize: 11 }}>{t}</span>)}
        </div>
        <div className="num" style={{ color: 'var(--price)', fontWeight: 700, fontSize: 18 }}>
          {room.price.toLocaleString()}<span style={{ fontSize: 12, fontWeight: 400 }}>元/月</span>
        </div>
      </div>
    </a>
  );
}

window.PortalHome = PortalHome;
window.RoomCard = RoomCard;
window.SectionHeader = SectionHeader;
