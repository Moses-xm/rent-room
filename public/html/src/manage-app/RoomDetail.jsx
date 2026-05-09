/* 雅阁租房 · 管理后台 · 房源详情 */

function RoomDetail({ id }) {
  const r = (window.SEED_ROOMS || []).find(x => x.id === id) || (window.SEED_ROOMS || [])[0];
  if (!r) return <Shell active="rooms" crumbs={['控制台','房源']}><div className="empty">房源不存在</div></Shell>;
  const status = window.ROOM_STATUS[r.status];
  const community = (window.SEED_COMMUNITIES || []).find(c => c.id === r.communityId);
  const facilities = ['空调','洗衣机','冰箱','热水器','宽带 / WiFi','床','衣柜','沙发','书桌','燃气灶','油烟机','飘窗'];
  const tags = ['南北通透','精装修','拎包入住','近地铁'];

  return (
    <Shell active="rooms" crumbs={['控制台','业务管理',<a key="b" href="#/rooms">房源管理</a>, r.id]}>
      <div className="page-head">
        <div>
          <a href="#/rooms" style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>‹ 返回房源列表</a>
          <h1 className="page-title" style={{ marginTop: 6, fontSize: 26 }}>{r.title}</h1>
          <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="num">{r.id}</span>
            <span style={{ color: 'var(--ink-5)' }}>·</span>
            <a href={`#/communities/${r.communityId}`} style={{ color: 'var(--gold)' }}>{r.community}</a>
            <span style={{ color: 'var(--ink-5)' }}>·</span>
            <span className={'pill ' + status.pill}>{status.label}</span>
            <span className="tag" style={{ marginLeft: 4 }}>{r.type}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost"><Icon.Eye/> 用户端预览</button>
          <button className="btn btn-ghost" style={{ color: 'var(--danger)' }}><Icon.Trash/> 下架</button>
          <button className="btn btn-primary"><Icon.Edit/> 编辑房源</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* —— 图集 —— */}
        <div className="card">
          <div style={{ height: 380, background: r.thumb, borderRadius: 'var(--radius) var(--radius) 0 0', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 4 }}>1 / 8</div>
          </div>
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: 1, borderRadius: 4, background: r.thumb, opacity: i === 0 ? 1 : .55, border: i === 0 ? '2px solid var(--gold)' : 'none' }}/>
            ))}
          </div>
        </div>

        {/* —— 关键信息 —— */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 16, borderBottom: '1px solid var(--line-2)' }}>
              <span className="num" style={{ fontFamily: 'var(--typeface-display)', fontSize: 38, fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>¥{r.price.toLocaleString()}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>/月</span>
              <span style={{ flex: 1 }}/>
              <span className="tag">{r.payment || '押一付三'}</span>
            </div>

            <div style={{ paddingTop: 14 }}>
              <div className="kv"><span className="k">户型</span><span className="v">{r.layout}</span></div>
              <div className="kv"><span className="k">面积</span><span className="v num">{r.area} ㎡</span></div>
              <div className="kv"><span className="k">楼层</span><span className="v">{r.floor}</span></div>
              <div className="kv"><span className="k">朝向</span><span className="v">{r.orient}</span></div>
              <div className="kv"><span className="k">装修</span><span className="v">精装</span></div>
              <div className="kv"><span className="k">电梯</span><span className="v">有</span></div>
              <div className="kv"><span className="k">押金</span><span className="v num">¥{(r.deposit || r.price * 2).toLocaleString()}</span></div>
              <div className="kv"><span className="k">最短租期</span><span className="v">6 个月</span></div>
              <div className="kv"><span className="k">可入住</span><span className="v num">{r.createdAt}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* —— 描述 + 设施 —— */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head"><div className="card-title">房源描述</div></div>
            <div className="card-body" style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--ink-2)' }}>
              <p style={{ margin: 0 }}>该房源位于 {r.community}，是一套精装修的{r.layout}，建筑面积 {r.area} 平方米，{r.orient}向采光极佳。屋内家私家电齐全，可拎包入住。</p>
              <p>小区物业完善，周边商超、地铁、医院、学校等配套设施一应俱全，生活便利。{r.floor}，视野开阔，干扰少。</p>
              <p style={{ margin: 0 }}>欢迎诚租客户咨询看房，可短租可长租，押付方式可议。</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {tags.map(t => <span key={t} className="tag" style={{ background: 'var(--gold-tint)', color: 'var(--gold-2)', borderColor: '#E2D3B0' }}>#{t}</span>)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">配套设施</div></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {facilities.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-2)' }}>
                    <span style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--gold-tint)', color: 'var(--gold)', display: 'grid', placeItems: 'center' }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">小区位置</div></div>
            <div style={{ padding: 0 }}>
              {community ? <MapPicker lat={community.lat} lng={community.lng} onPick={() => {}}/> : <div className="empty">未关联小区</div>}
            </div>
            <div className="card-body" style={{ paddingTop: 12 }}>
              <div className="kv"><span className="k">详细地址</span><span className="v" style={{ textAlign: 'right' }}>{community?.address}</span></div>
            </div>
          </div>
        </div>

        {/* —— 房东 + 数据 —— */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head"><div className="card-title">房东信息</div></div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gold-tint)', color: 'var(--gold-2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--typeface-display)', fontSize: 22, fontWeight: 500 }}>{r.owner[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{r.owner}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>认证房东 · 服务好评 4.8</div>
                </div>
                <button className="btn btn-ghost btn-sm">查看资料</button>
              </div>
              <div className="divider"/>
              <div className="kv"><span className="k">联系电话</span><span className="v num">138 0000 0000</span></div>
              <div className="kv"><span className="k">名下房源</span><span className="v num">8 套</span></div>
              <div className="kv"><span className="k">入驻时间</span><span className="v num">2023-04-12</span></div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">房源数据</div></div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {[['浏览量', '1,284'],['收藏', '92'],['咨询', '14'],['预约看房', '6']].map(([l, v]) => (
                  <div key={l} style={{ background: 'var(--bg)', borderRadius: 6, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l}</div>
                    <div className="num" style={{ fontFamily: 'var(--typeface-display)', fontSize: 22, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><div className="card-title">操作记录</div></div>
            <div className="card-body" style={{ paddingTop: 4 }}>
              {[
                ['创建房源', '张伟', '2024-12-08 10:24'],
                ['上架', '系统', '2024-12-08 11:00'],
                ['修改租金 ¥8800 → ¥8500', '李洁', '2024-12-09 15:32'],
                ['新增预约', '王小明', '2024-12-12 09:18'],
              ].map(([act, who, t], i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px dashed var(--line-2)' : 'none' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: i === 0 ? 'var(--gold)' : 'var(--ink-5)', marginTop: 6 }}/>
                  <div style={{ flex: 1, fontSize: 12.5 }}>
                    <div style={{ color: 'var(--ink)' }}>{act}</div>
                    <div className="num" style={{ color: 'var(--ink-3)', fontSize: 11.5, marginTop: 2 }}>{who} · {t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

window.RoomDetail = RoomDetail;
