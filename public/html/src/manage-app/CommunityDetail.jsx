/* 雅阁租房 · 管理后台 · 小区详情页 */

function CommunityDetail({ id }) {
  const community = (window.SEED_COMMUNITIES || []).find(c => c.id === id) || (window.SEED_COMMUNITIES || [])[0];
  if (!community) return <Shell active="communities" crumbs={['控制台','小区']}><div className="empty">小区不存在</div></Shell>;

  const rooms = (window.SEED_ROOMS || []).filter(r => r.communityId === community.id).slice(0, 6);

  return (
    <Shell active="communities" crumbs={['控制台','业务管理',<a key="b" href="#/communities">小区管理</a>, community.name]}>
      <div className="page-head">
        <div>
          <a href="#/communities" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>‹ 返回小区列表</a>
          <h1 className="page-title" style={{ marginTop: 6 }}>{community.name}</h1>
          <div className="page-subtitle">
            <span className="num">{community.id}</span>
            <span style={{ margin: '0 8px', color: 'var(--ink-5)' }}>·</span>
            <span className="tag">{community.district}</span>
            <span style={{ margin: '0 8px', color: 'var(--ink-5)' }}>·</span>
            <span className={'pill ' + (community.status === 'active' ? 'pill-ok' : 'pill-warn')}>{community.status === 'active' ? '已上架' : '待审核'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost"><Icon.Edit/> 编辑</button>
          <a className="btn btn-primary" href={'#/rooms?community=' + community.id}><Icon.Plus/> 在此小区新增房源</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-head"><div className="card-title">小区位置</div></div>
          <div style={{ padding: 0 }}>
            <MapPicker lat={community.lat} lng={community.lng} onPick={() => {}}/>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            <div className="kv"><span className="k">详细地址</span><span className="v" style={{ textAlign: 'right' }}>{community.address}</span></div>
            <div className="kv"><span className="k">坐标 (Lat / Lng)</span><span className="v num">{community.lat}, {community.lng}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">小区档案</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
              {[['总房源', community.total],['可租', community.available],['空置率', ((community.available / community.total) * 100).toFixed(1) + '%']].map(([l,v]) => (
                <div key={l} style={{ background: 'var(--bg)', borderRadius: 6, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l}</div>
                  <div className="num" style={{ fontFamily: 'var(--typeface-display)', fontSize: 24, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="kv"><span className="k">开发商</span><span className="v">{community.dev}</span></div>
            <div className="kv"><span className="k">建成年份</span><span className="v num">{community.built}</span></div>
            <div className="kv"><span className="k">所在区域</span><span className="v">{community.district}</span></div>
            <div className="kv"><span className="k">负责人</span><span className="v">{community.manager}</span></div>
            <div className="kv"><span className="k">创建时间</span><span className="v num">{community.createdAt}</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <div className="card-title">小区下房源</div>
            <div className="card-sub">展示该小区已发布的房源（最多 6 条）</div>
          </div>
          <a className="btn-text" href={'#/rooms?community=' + community.id}>查看全部 <Icon.Chev style={{ width: 12, height: 12 }}/></a>
        </div>
        <div className="card-body">
          {rooms.length === 0 ? (
            <div className="empty">
              <div className="empty-title">暂无房源</div>
              <div className="empty-sub">点击右上角“在此小区新增房源”创建第一套</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {rooms.map(r => (
                <a key={r.id} href={`#/rooms/${r.id}`} className="room-mini-card">
                  <div className="room-mini-thumb" style={{ background: r.thumb }}>
                    <span className={'pill ' + (r.status === 'rented' ? 'pill-mute' : 'pill-ok')} style={{ position: 'absolute', top: 8, left: 8 }}>{r.status === 'rented' ? '已出租' : '在租中'}</span>
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 3 }}>{r.layout} · {r.area}㎡ · {r.floor}</div>
                    <div className="num" style={{ marginTop: 6, fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>¥{r.price.toLocaleString()}<span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>/月</span></div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

window.CommunityDetail = CommunityDetail;
