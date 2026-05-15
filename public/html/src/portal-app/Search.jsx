/* 雅阁租房 · 用户平台 · 搜索结果页（区域找房 / 地铁找房） */

function PortalSearch({ user, currentCity, onCity, params = {} }) {
  const { ROOMS, DISTRICTS, SUBWAY, PRICE_RANGES, BEDROOMS, ROOM_THUMBS } = window.PORTAL_DATA;
  const [locTab, setLocTab] = React.useState(params.mode === 'subway' ? 'subway' : 'district');
  const [filters, setFilters] = React.useState({
    district: params.district || null,
    subway:   params.subway   || null,
    price:    params.price    || null,
    bedroom:  params.bedroom  || null,
    type:     params.type     || null,
  });
  const [resultTab, setResultTab] = React.useState('全部');
  const [sort, setSort] = React.useState('默认排序');

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: f[k] === v ? null : v }));
  const clearAll = () => setFilters({ district: null, subway: null, price: null, bedroom: null, type: null });

  // 已选 chips
  const chips = [];
  if (filters.district) chips.push({ k: 'district', label: filters.district });
  if (filters.subway)   chips.push({ k: 'subway',   label: filters.subway });
  if (filters.price)    chips.push({ k: 'price',    label: filters.price });
  if (filters.bedroom)  chips.push({ k: 'bedroom',  label: filters.bedroom });
  if (filters.type)     chips.push({ k: 'type',     label: filters.type });

  return (
    <Shell active={locTab === 'subway' ? 'subway' : 'district'} user={user} currentCity={currentCity} onCity={onCity}>
      <div className="container" style={{ padding: '20px 0 40px' }}>
        {/* 面包屑 */}
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '0 0 14px' }}>
          <a href="#/" style={{ color: 'var(--ink-3)' }}>{currentCity}房产网</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-2)' }}>{currentCity}租房</span>
          {filters.district && <><span style={{ margin: '0 6px' }}>{'>'}</span><span style={{ color: 'var(--ink-2)' }}>{filters.district}租房</span></>}
        </div>

        {/* —— 筛选区 —— */}
        <div className="filter-card">
          {/* 位置：区域 / 地铁 切换 */}
          <div className="filter-row">
            <div className="filter-label">位置</div>
            <div style={{ width: '100%' }}>
              <div className="filter-tab">
                <span className={'filter-tab-item ' + (locTab === 'district' ? 'is-active' : '')} onClick={() => setLocTab('district')}>区域</span>
                <span className={'filter-tab-item ' + (locTab === 'subway'   ? 'is-active' : '')} onClick={() => setLocTab('subway')}>地铁</span>
              </div>
              <div className="filter-options" style={{ marginTop: 4 }}>
                <span className={'opt ' + (!filters[locTab] ? 'is-active' : '')} onClick={() => setFilters(f => ({ ...f, [locTab]: null }))}>全部</span>
                {(locTab === 'district' ? DISTRICTS : SUBWAY).map(d => (
                  <span key={d} className={'opt ' + (filters[locTab] === d ? 'is-active' : '')} onClick={() => setF(locTab, d)}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 租金 */}
          <div className="filter-row">
            <div className="filter-label">租金</div>
            <div className="filter-options">
              <span className={'opt ' + (!filters.price ? 'is-active' : '')} onClick={() => setFilters(f => ({ ...f, price: null }))}>全部</span>
              {PRICE_RANGES.map(p => (
                <span key={p} className={'opt ' + (filters.price === p ? 'is-active' : '')} onClick={() => setF('price', p)}>{p}</span>
              ))}
              <span className="range-input">
                <input type="number" placeholder=""/>
                <span style={{ color: 'var(--ink-4)' }}>—</span>
                <input type="number" placeholder=""/>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>元</span>
              </span>
            </div>
          </div>

          {/* 房型 */}
          <div className="filter-row">
            <div className="filter-label">房型</div>
            <div className="filter-options">
              <span className={'opt ' + (!filters.bedroom ? 'is-active' : '')} onClick={() => setFilters(f => ({ ...f, bedroom: null }))}>全部</span>
              {BEDROOMS.map(b => (
                <span key={b} className={'opt ' + (filters.bedroom === b ? 'is-active' : '')} onClick={() => setF('bedroom', b)}>{b}</span>
              ))}
            </div>
          </div>

          {/* 类型 */}
          <div className="filter-row">
            <div className="filter-label">类型</div>
            <div className="filter-options">
              <span className={'opt ' + (!filters.type ? 'is-active' : '')} onClick={() => setFilters(f => ({ ...f, type: null }))}>全部</span>
              {['整租','合租/单间'].map(t => (
                <span key={t} className={'opt ' + (filters.type === t ? 'is-active' : '')} onClick={() => setF('type', t)}>{t}</span>
              ))}
            </div>
          </div>

          {/* 更多 */}
          <div className="filter-row" style={{ borderBottom: 0 }}>
            <div className="filter-label">更多</div>
            <div className="filter-extra">
              <select className="select">
                <option>房屋类型</option><option>普通住宅</option><option>公寓</option><option>别墅</option>
              </select>
              <select className="select">
                <option>朝向</option><option>朝南</option><option>朝北</option><option>南北通透</option>
              </select>
              <label><input type="checkbox"/> 近地铁</label>
              <label><input type="checkbox"/> 电梯房</label>
              <label><input type="checkbox"/> 展示租金段中的被推荐房源</label>
            </div>
          </div>

          {/* 已选 chips */}
          {chips.length > 0 && (
            <div className="filter-chips">
              <span>已选：</span>
              {chips.map(c => (
                <span key={c.k} className="filter-chip">
                  {c.label}
                  <span className="x" onClick={() => setF(c.k, c.label)}>✕</span>
                </span>
              ))}
              <span className="filter-clear" onClick={clearAll}>清空</span>
            </div>
          )}
        </div>

        {/* —— 结果区 —— */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'flex-start' }}>
          <div>
            {/* 二级 tabs */}
            <div className="result-tabs">
              {['全部','视频看房','实拍真房','经纪人房源','个人房源','公寓','VR看房'].map(t => (
                <button key={t} className={'result-tab ' + (resultTab === t ? 'is-active' : '')} onClick={() => setResultTab(t)}>{t}</button>
              ))}
            </div>
            <div className="result-meta">
              <span>为您找到 {currentCity}附近租房 <span className="num" style={{ color: 'var(--price)', fontWeight: 700 }}>{ROOMS.length}</span> 套</span>
              <div className="sort-tabs">
                {['默认排序','最新','价格↑','价格↓','面积↑'].map(s => (
                  <span key={s} className={'sort-tab ' + (sort === s ? 'is-active' : '')} onClick={() => setSort(s)}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* 房源列表 */}
            <div style={{ background: '#fff' }}>
              {ROOMS.map(r => <RoomListItem key={r.id} room={r}/>)}
            </div>

            {/* 分页 */}
            <div className="pagination">
              <button className="page-btn" disabled>‹</button>
              {[1,2,3,4,5,'…',64].map((p, i) => (
                <button key={i} className={'page-btn ' + (p === 1 ? 'is-active' : '')}>{p}</button>
              ))}
              <button className="page-btn">›</button>
            </div>
          </div>

          {/* —— 右侧栏 —— */}
          <aside>
            <div className="sidebar-card">
              <div className="sidebar-title">《租房风险须知》</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.8 }}>
                租房前请仔细核对房源信息<br/>
                <a href="#" style={{ color: 'var(--primary)' }}>查看详情 ›</a>
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-title">
                热推房源 <span className="badge-hot" style={{ marginLeft: 4 }}>hot</span>
              </div>
              {ROOMS.slice(0, 3).map(r => (
                <a key={r.id} href={`#/room/${r.id}`} className="hot-room">
                  <div className="hot-room-img" style={{ background: ROOM_THUMBS[r.photo] }}/>
                  <div className="hot-room-title">{r.title.slice(0, 18)}</div>
                  <div className="hot-room-info">
                    <span className="meta">{r.area} · {r.layout}</span>
                    <span className="pr">{r.price}<span style={{ fontSize: 11, fontWeight: 400 }}>/月</span></span>
                  </div>
                </a>
              ))}
            </div>

            <div className="sidebar-card" style={{ background: 'var(--primary-light)', border: '1px solid rgba(37,213,160,.3)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>📢 委托找房</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: 12 }}>
                告诉我们您的需求，专属顾问 1 对 1 帮您挑选房源
              </div>
              <button className="btn btn-primary btn-sm btn-block">立即委托</button>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

function RoomListItem({ room }) {
  const { ROOM_THUMBS } = window.PORTAL_DATA;
  return (
    <div className="room-item">
      <a className="room-thumb" href={`#/room/${room.id}`} style={{ background: ROOM_THUMBS[room.photo] }}>
        <span className="photo-count">8 张</span>
      </a>

      <div className="room-body">
        <div className="room-title">
          <a className="title-text" href={`#/room/${room.id}`}>{room.title}</a>
          {room.anxuan && <span className="badge-anxuan">安选</span>}
        </div>
        <div className="room-meta">
          {room.layout}<span className="sep">|</span>
          {room.size}平米<span className="sep">|</span>
          {room.floor}(共{room.totalFloor}层)
        </div>
        <div className="room-region">
          <a href={`#/community/${room.communityId}`}>{room.community}</a>
          <span className="sep">·</span>
          <a>{room.district}</a>
          <span className="sep">·</span>
          <a>{room.area}</a>
          <span className="sep">·</span>
          <a>{room.street}</a>
        </div>
        <div className="room-tags">
          {room.tags.slice(0, 5).map(t => <span key={t} className="tag">{t}</span>)}
          {room.subway && <span className="tag">距{room.subway}-{room.community.slice(0,4)}站{room.subwayDist}</span>}
        </div>
        <div className="room-agent">
          <PI.User style={{ width: 14, height: 14 }}/>
          {room.agent}
        </div>
      </div>

      <div className="room-price">
        <div>
          <span className="num num-price">{room.price.toLocaleString()}</span>
          <span className="unit">元/月</span>
        </div>
      </div>
    </div>
  );
}

window.PortalSearch = PortalSearch;
window.RoomListItem = RoomListItem;
