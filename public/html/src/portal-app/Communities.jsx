/* 雅阁租房 · 用户平台 · 小区列表 + 小区详情 */

function PortalCommunities({ user, currentCity, onCity }) {
  const { COMMUNITIES, DISTRICTS, ROOM_THUMBS } = window.PORTAL_DATA;
  const [district, setDistrict] = React.useState(null);
  const [sort, setSort] = React.useState('默认排序');
  const list = COMMUNITIES.filter(c => !district || c.district === district);

  return (
    <Shell active="community" user={user} currentCity={currentCity} onCity={onCity}>
      <div className="container" style={{ padding: '20px 0 40px' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}>
          <a href="#/" style={{ color: 'var(--ink-3)' }}>{currentCity}房产网</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-2)' }}>{currentCity}小区</span>
        </div>

        {/* —— 筛选 —— */}
        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-label">区域</div>
            <div className="filter-options">
              <span className={'opt ' + (!district ? 'is-active' : '')} onClick={() => setDistrict(null)}>全部</span>
              {DISTRICTS.map(d => (
                <span key={d} className={'opt ' + (district === d ? 'is-active' : '')} onClick={() => setDistrict(d)}>{d}</span>
              ))}
            </div>
          </div>
          <div className="filter-row" style={{ borderBottom: 0 }}>
            <div className="filter-label">均价</div>
            <div className="filter-options">
              {['全部','1000以下','1000-2000','2000-3000','3000-5000','5000-8000','8000以上'].map(p => (
                <span key={p} className={'opt ' + (p === '全部' ? 'is-active' : '')}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="result-meta">
          <span>共找到 <span className="num" style={{ color: 'var(--price)', fontWeight: 700 }}>{list.length}</span> 个小区</span>
          <div className="sort-tabs">
            {['默认排序','均价↑','均价↓','在租数↑'].map(s => (
              <span key={s} className={'sort-tab ' + (sort === s ? 'is-active' : '')} onClick={() => setSort(s)}>{s}</span>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff' }}>
          {list.map((c, i) => (
            <a key={c.id} href={`#/community/${c.id}`} style={{
              display: 'flex', gap: 22, padding: 24,
              borderBottom: '1px solid var(--line)', transition: 'box-shadow .15s',
            }}>
              <div style={{ width: 220, height: 165, borderRadius: 4, background: ROOM_THUMBS[i % ROOM_THUMBS.length], flexShrink: 0 }}/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 8 }}>
                  <PI.Pin style={{ width: 13, height: 13, display: 'inline', verticalAlign: '-2px', marginRight: 3 }}/>
                  {c.address}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>
                  {c.type} · 建成 {c.year} 年 · 共 {c.total} 户
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <span className="tag tag-pri">{c.district}</span>
                  <span className="tag">{c.area}</span>
                </div>
              </div>
              <div style={{ width: 160, textAlign: 'right' }}>
                <div className="num" style={{ color: 'var(--price)', fontSize: 26, fontWeight: 700 }}>
                  {c.avg.toLocaleString()}
                  <span style={{ color: 'var(--ink-3)', fontSize: 13, fontWeight: 400 }}> 元/月</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>均价 (近 30 天)</div>
                <div style={{ fontSize: 13, marginTop: 14, color: 'var(--primary)', fontWeight: 600 }}>
                  在租 <span className="num" style={{ fontSize: 18 }}>{Math.floor(Math.random() * 50 + 12)}</span> 套
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="pagination">
          <button className="page-btn" disabled>‹</button>
          {[1,2,3,4,5,'…',12].map((p, i) => (
            <button key={i} className={'page-btn ' + (p === 1 ? 'is-active' : '')}>{p}</button>
          ))}
          <button className="page-btn">›</button>
        </div>
      </div>
    </Shell>
  );
}

/* —— 小区详情 —— */
function PortalCommunityDetail({ id, user, currentCity, onCity }) {
  const { COMMUNITIES, ROOMS, ROOM_THUMBS } = window.PORTAL_DATA;
  const c = COMMUNITIES.find(x => x.id === id) || COMMUNITIES[0];
  const rooms = ROOMS.filter(r => r.communityId === c.id);

  return (
    <Shell active="community" user={user} currentCity={currentCity} onCity={onCity}>
      <div className="container" style={{ padding: '20px 0 40px' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 16 }}>
          <a href="#/" style={{ color: 'var(--ink-3)' }}>{currentCity}房产网</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <a href="#/communities" style={{ color: 'var(--ink-3)' }}>{currentCity}小区</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <a style={{ color: 'var(--ink-3)' }}>{c.district}小区</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-2)' }}>{c.name}</span>
        </div>

        {/* —— 头部信息 —— */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 28 }}>
          <div style={{ background: ROOM_THUMBS[0], height: 320, borderRadius: 4, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 14, right: 14, padding: '4px 12px', background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 12, borderRadius: 2 }}>1 / 12</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: 24 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{c.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <PI.Pin style={{ width: 13, height: 13 }}/>{c.address}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <span className="tag tag-pri">{c.district}</span>
              <span className="tag">{c.area}</span>
              <span className="tag">{c.type}</span>
            </div>

            <div style={{ marginTop: 22, padding: '18px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--price)' }}>{c.avg.toLocaleString()}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>元/月均价</div>
              </div>
              <div>
                <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{rooms.length}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>套在租</div>
              </div>
              <div>
                <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{c.total}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>总户数</div>
              </div>
            </div>

            <div style={{ marginTop: 18, fontSize: 13 }}>
              {[['建成年代', c.year + ' 年'], ['物业类型', c.type], ['绿化率', '35%'], ['容积率', '2.2'], ['物业费', '4.5 元 / ㎡']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px dashed var(--line-2)' }}>
                  <span style={{ color: 'var(--ink-3)' }}>{k}</span>
                  <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* —— Tabs —— */}
        <div style={{ background: '#fff', border: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--primary)' }}>
            {[`在租房源 (${rooms.length})`, '小区介绍', '周边配套', '价格走势'].map((t, i) => (
              <button key={t} style={{
                padding: '14px 30px', fontSize: 15, fontWeight: 500,
                background: i === 0 ? 'var(--primary)' : 'transparent',
                color: i === 0 ? '#fff' : 'var(--ink-2)',
                fontWeight: i === 0 ? 600 : 500,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ padding: '24px 24px 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
              {rooms.length === 0 ? (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="empty"><div className="empty-title">暂无在租房源</div><div className="empty-sub">您可以收藏小区，有新房源时通知您</div></div>
                </div>
              ) : (
                rooms.map(r => <RoomCard key={r.id} room={r}/>)
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

window.PortalCommunities = PortalCommunities;
window.PortalCommunityDetail = PortalCommunityDetail;
