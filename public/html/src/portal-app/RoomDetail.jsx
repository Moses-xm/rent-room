/* 雅阁租房 · 用户平台 · 房源详情 */

function PortalRoomDetail({ id, user, currentCity, onCity }) {
  const { ROOMS, ROOM_THUMBS, COMMUNITIES } = window.PORTAL_DATA;
  const r = ROOMS.find(x => x.id === id) || ROOMS[0];
  const c = COMMUNITIES.find(x => x.id === r.communityId);
  const similar = ROOMS.filter(x => x.id !== r.id).slice(0, 4);

  const [imgTab, setImgTab] = React.useState('室内');
  const [tab, setTab] = React.useState('info');
  const [showRent, setShowRent] = React.useState(false);

  // 设施 icon 映射
  const facIcons = {
    '冰箱':PI.Fridge,'洗衣机':PI.Washer,'热水器':PI.Stove,'宽带':PI.Wifi,'沙发':PI.Sofa,'油烟机':PI.Stove,'燃气灶':PI.Stove,'可做饭':PI.Stove,'电视':PI.TV,'空调':PI.AirCon,'衣柜':PI.Sofa,'床':PI.Bed,'卫生间':PI.Stove,'智能门锁':PI.Settings,'阳台':PI.Photo,'暖气':PI.Stove,
  };
  const allFacilities = ['冰箱','洗衣机','热水器','宽带','沙发','油烟机','燃气灶','可做饭','电视','空调','衣柜','床','卫生间','智能门锁','阳台','暖气'];

  return (
    <Shell active="" user={user} currentCity={currentCity} onCity={onCity}>
      <div className="container" style={{ padding: '20px 0 40px' }}>
        {/* 面包屑 */}
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}>
          <a style={{ color: 'var(--ink-3)' }} href="#/">{currentCity}雅阁</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <a style={{ color: 'var(--ink-3)' }} href="#/search">{currentCity}租房</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <a style={{ color: 'var(--ink-3)' }}>{r.district}租房</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <a style={{ color: 'var(--ink-3)' }}>{r.area}租房</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <a style={{ color: 'var(--ink-3)' }}>{r.community}</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-2)' }}>{r.community}租房</span>
        </div>

        {/* 标题区 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, lineHeight: 1.4, color: 'var(--ink)' }}>
              {r.title}
              {r.anxuan && <span className="badge-anxuan" style={{ marginLeft: 10, verticalAlign: '4px' }}>安选</span>}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 18 }}>
              <span className="num" style={{ color: 'var(--price)', fontSize: 28, fontWeight: 700 }}>
                {r.price.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400 }}>元/月</span>
              </span>
              <span style={{ width: 1, height: 24, background: 'var(--line)' }}/>
              <span style={{ fontSize: 18 }}>{r.layout}</span>
              <span style={{ width: 1, height: 24, background: 'var(--line)' }}/>
              <span style={{ fontSize: 18 }}>{r.size.toFixed(2)}<span style={{ fontSize: 13, color: 'var(--ink-3)' }}>平方米</span></span>
              <span className="tag tag-ora">{r.type}</span>
              <span className="tag tag-pri">{r.orient}</span>
              <span className="tag tag-pri">{r.subway}</span>
            </div>
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--price)', fontSize: 13 }}>
            <PI.Alert style={{ width: 16, height: 16 }}/> 举报
          </button>
        </div>

        {/* —— 图集 + 中介卡 —— */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
          {/* 图集 */}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['室内图', 8, PI.Photo],['户型图', 0, PI.Map],['环境图', 0, PI.Bed],['周边地图', null, PI.Pin]].map(([l, n, I], i) => (
                <button key={l} onClick={() => setImgTab(l)} style={{
                  padding: '14px 0', borderRadius: 4, fontSize: 13,
                  background: imgTab === l ? '#fff' : 'var(--bg)',
                  border: imgTab === l ? '1px solid var(--primary)' : '1px solid var(--line)',
                  color: imgTab === l ? 'var(--primary)' : 'var(--ink-3)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <I style={{ width: 22, height: 22 }}/>
                  <span>{l}{n !== null ? ` (${n})` : ''}</span>
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', height: 460, borderRadius: 4, background: ROOM_THUMBS[r.photo], overflow: 'hidden' }}>
              <button style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, background: 'rgba(0,0,0,.3)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <PI.ChevL style={{ width: 22, height: 22 }}/>
              </button>
              <button style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, background: 'rgba(0,0,0,.3)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <PI.Chev style={{ width: 22, height: 22 }}/>
              </button>
              <div style={{ position: 'absolute', left: 18, bottom: 0, transform: 'translateY(50%)', writingMode: 'vertical-rl', fontSize: 11, color: 'var(--ink-4)' }}>环境图片</div>
              <div style={{ position: 'absolute', right: 18, bottom: 0, transform: 'translateY(50%)', writingMode: 'vertical-rl', fontSize: 11, color: 'var(--ink-4)' }}>室内图片</div>
            </div>
          </div>

          {/* 中介卡 */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: 24 }}>
            <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', margin: '0 auto 10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, border: '2px solid var(--primary)' }}>{r.agent[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{r.agent}</div>
            </div>

            <div style={{ background: 'linear-gradient(90deg, #FFF7E5, #FEEBC8)', padding: '14px 16px', borderRadius: 4, margin: '16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#B8770A', fontWeight: 600 }}>租房神奇分 <span className="num" style={{ fontSize: 18 }}>{r.agentScore}.0</span> 分</div>
                <div style={{ fontSize: 11.5, color: '#A88848', marginTop: 3 }}>超过全城 {Math.floor(r.agentScore / 10)}% 的经纪人</div>
              </div>
              <PI.Verified style={{ width: 36, height: 36, color: '#D89A2D' }}/>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 16 }}>
              {[['良好', '服务能力'], ['优秀', '房源信息'], ['一般', '专业能力']].map(([s, l]) => (
                <div key={l}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s === '优秀' ? 'var(--primary)' : (s === '良好' ? '#B8770A' : 'var(--ink-3)') }}>{s}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.85 }}>
              <div>公司：杭州嘉扬房地产营销...</div>
              <div>门店：嘉扬房产下沙店</div>
              <div>公司执照编码 91330114MA2KMDUPXE</div>
            </div>

            <button className="btn btn-line btn-block btn-lg" style={{ marginTop: 16 }}>
              <PI.Wechat style={{ width: 16, height: 16 }}/> 微信扫码联系
            </button>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }}>
                <PI.Heart style={{ width: 15, height: 15 }}/> 收藏
              </button>
              <button className="btn btn-ghost" style={{ flex: 1 }}>预约看房</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setShowRent(true)}>立即租房</button>
            </div>
          </div>
        </div>

        {/* —— Tab 区 —— */}
        <div style={{ background: 'var(--primary)', color: '#fff', display: 'flex', gap: 0, marginBottom: 0 }}>
          {[['info','房源信息'],['around','小区周边'],['similar','推荐房源']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '16px 38px', fontSize: 15,
              background: tab === k ? 'rgba(255,255,255,.12)' : 'transparent',
              color: '#fff', fontWeight: tab === k ? 600 : 500,
              borderBottom: tab === k ? '3px solid #fff' : '3px solid transparent',
            }}>{l}</button>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderTop: 0, padding: 28 }}>
          {tab === 'info' && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>房屋信息</h3>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>房屋编码：{r.id}5148685，更新时间：{r.publishedAt}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 22 }}>
                <span className="num" style={{ color: 'var(--price)', fontSize: 30, fontWeight: 700 }}>{r.price.toLocaleString()}<span style={{ fontSize: 14, fontWeight: 400 }}>元/月</span></span>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{r.payment}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 40px', fontSize: 14 }}>
                {[
                  ['户型', r.layout + '2卫'],
                  ['朝向', r.orient],
                  ['装修', r.decoration],
                  ['合租户型', '1室1厅1卫'],
                  ['房间朝向', r.orient],
                  ['类型', '普通住宅'],
                  ['合租面积', r.size.toFixed(2) + '平方米'],
                  ['楼层', `${r.floor}(共${r.totalFloor}层)`],
                  ['小区', <a key="c" href={`#/community/${r.communityId}`} style={{ color: '#2A6FDB' }}>{r.community} ({r.area})</a>],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <span style={{ width: 90, color: 'var(--ink-3)' }}>{k}：</span>
                    <span style={{ flex: 1, color: 'var(--ink-2)', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* —— 配套 —— */}
              <h3 style={{ margin: '36px 0 18px', fontSize: 22, fontWeight: 600, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>房屋配套</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '24px 20px' }}>
                {allFacilities.map(f => {
                  const on = r.facilities.includes(f);
                  const I = facIcons[f] || PI.Settings;
                  return (
                    <div key={f} style={{ textAlign: 'center', opacity: on ? 1 : .35 }}>
                      <I style={{ width: 36, height: 36, color: on ? 'var(--ink-2)' : 'var(--ink-4)' }}/>
                      <div style={{ fontSize: 13, color: on ? 'var(--ink-2)' : 'var(--ink-4)', marginTop: 6 }}>{f}</div>
                    </div>
                  );
                })}
              </div>

              {/* —— 概况 —— */}
              <h3 style={{ margin: '36px 0 18px', fontSize: 22, fontWeight: 600, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>房源概况</h3>
              <div style={{ fontSize: 14, lineHeight: 2, color: 'var(--ink-2)' }}>{r.desc}</div>

              {/* —— 出租要求 —— */}
              <h3 style={{ margin: '36px 0 18px', fontSize: 22, fontWeight: 600, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>出租要求</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 40px', fontSize: 14 }}>
                {[
                  ['付款方式', r.payment],
                  ['看房时间', '提前联系经纪人预约'],
                  ['入住时间', '随时入住'],
                  ['最短租期', '3 个月'],
                  ['可短租', '是'],
                  ['是否养宠', '面议'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span style={{ width: 90, color: 'var(--ink-3)' }}>{k}：</span>
                    <span style={{ color: 'var(--ink-2)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'around' && (
            <div>
              <h3 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 600 }}>小区周边</h3>
              <div style={{ height: 380, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                <FakeMap/>
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 16, lineHeight: 1.8 }}>
                <strong>{c?.name}</strong> 位于 {c?.address}，附近配套齐全：
                <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
                  {[['🚇 1 号线 高沙路站', '380 m'],['🏥 中医院', '900 m'],['🏫 浙江工商大学', '600 m'],['🛒 联华超市', '180 m'],['🍜 麦当劳', '350 m']].map(([n, d]) => (
                    <span key={n} style={{ padding: '6px 14px', background: 'var(--bg)', borderRadius: 999, fontSize: 12.5 }}>{n} <span style={{ color: 'var(--ink-3)' }}>{d}</span></span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'similar' && (
            <div>
              <h3 style={{ margin: '0 0 18px', fontSize: 22, fontWeight: 600 }}>推荐房源</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
                {similar.map(s => <RoomCard key={s.id} room={s}/>)}
              </div>
            </div>
          )}
        </div>

        {/* —— "看了又看" —— */}
        <div style={{ background: '#fff', border: '1px solid var(--line)', padding: 28, marginTop: 20 }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 20, fontWeight: 600 }}>看了又看</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {similar.map(s => <RoomCard key={s.id} room={s}/>)}
          </div>
        </div>
      </div>

      {showRent && <RentModal room={r} onClose={() => setShowRent(false)} user={user}/>}
    </Shell>
  );
}

function RentModal({ room, onClose, user }) {
  const [months, setMonths] = React.useState(12);
  const [start, setStart] = React.useState(new Date().toISOString().slice(0,10));

  if (!user) {
    return (
      <div className="modal-mask" onClick={onClose}>
        <div className="modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-title">提示</div>
            <button className="modal-close" onClick={onClose}><PI.X/></button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '32px 26px' }}>
            <div style={{ fontSize: 15, marginBottom: 22 }}>请先登录后再进行租房操作</div>
            <a className="btn btn-primary" href="#/login" onClick={onClose}>立即登录</a>
          </div>
        </div>
      </div>
    );
  }

  const total = room.price * months + room.deposit;
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">立即租房</div>
          <button className="modal-close" onClick={onClose}><PI.X/></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 14, padding: 14, background: 'var(--bg)', borderRadius: 4 }}>
            <div style={{ width: 88, height: 66, borderRadius: 4, background: window.PORTAL_DATA.ROOM_THUMBS[room.photo] }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{room.layout} · {room.size}㎡ · {room.payment}</div>
            </div>
            <div className="num" style={{ color: 'var(--price)', fontSize: 18, fontWeight: 700 }}>{room.price}<span style={{ fontSize: 11, fontWeight: 400 }}>/月</span></div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="label">租期 <span className="hint">最短 3 个月</span></div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[3, 6, 12, 24].map(m => (
                <button key={m} onClick={() => setMonths(m)} style={{
                  flex: 1, height: 40, borderRadius: 4, fontSize: 14, fontWeight: 600,
                  background: months === m ? 'var(--primary-light)' : '#fff',
                  border: months === m ? '1.5px solid var(--primary)' : '1px solid var(--line)',
                  color: months === m ? 'var(--primary)' : 'var(--ink-2)',
                }}>{m} 个月</button>
              ))}
            </div>
          </div>

          <div className="row row-2" style={{ marginTop: 16 }}>
            <div>
              <div className="label">开始日期</div>
              <input className="input" type="date" value={start} onChange={e => setStart(e.target.value)}/>
            </div>
            <div>
              <div className="label">结束日期 <span className="hint">系统自动计算</span></div>
              <input className="input" value={(() => {
                const d = new Date(start);
                d.setMonth(d.getMonth() + months);
                return d.toISOString().slice(0,10);
              })()} disabled/>
            </div>
          </div>

          <div style={{ marginTop: 20, padding: 16, background: '#FFF8F2', borderRadius: 4, fontSize: 13 }}>
            {[
              ['首期房租', '¥' + (room.price * months).toLocaleString()],
              ['押金', '¥' + room.deposit.toLocaleString()],
              ['平台服务费', '¥0 (零中介费)'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--ink-3)' }}>{k}</span>
                <span className="num">{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--ink-5)', paddingTop: 10, marginTop: 6 }}>
              <span style={{ fontSize: 14 }}>本次需支付</span>
              <span className="num" style={{ color: 'var(--price)', fontSize: 22, fontWeight: 700 }}>¥{total.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="label">支付密码 <span className="req">*</span></div>
            <input className="input" type="password" placeholder="请输入 6 位支付密码"/>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>
              钱包余额 <span className="num" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>¥12,840.00</span> · <a style={{ color: 'var(--primary)' }}>充值</a>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary">确认支付 ¥{total.toLocaleString()}</button>
        </div>
      </div>
    </div>
  );
}

window.PortalRoomDetail = PortalRoomDetail;
window.RentModal = RentModal;
