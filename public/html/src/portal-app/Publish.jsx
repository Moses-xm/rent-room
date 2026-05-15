/* 雅阁租房 · 用户平台 · 我要出租（创建小区 / 创建房源） */

function PublishCommunity({ user, currentCity, onCity }) {
  const [form, setForm] = React.useState({
    name: '', district: '钱塘', address: '', lat: 30.314, lng: 120.348,
    year: '', type: '普通住宅', total: '', desc: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // 模拟点击地图选择位置
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const lat = 30.4 - y * 0.3;
    const lng = 119.9 + x * 0.6;
    // 模拟反向地理编码
    const places = [
      { lng: 120.05, lat: 30.40, addr: '杭州市余杭区良渚街道', dist: '余杭' },
      { lng: 120.35, lat: 30.32, addr: '杭州市钱塘区下沙街道学源街', dist: '钱塘' },
      { lng: 120.27, lat: 30.19, addr: '杭州市萧山区市心北路', dist: '萧山' },
      { lng: 120.20, lat: 30.21, addr: '杭州市滨江区滨盛路', dist: '滨江' },
      { lng: 120.15, lat: 30.27, addr: '杭州市上城区延安路', dist: '上城' },
    ];
    let nearest = places[0], min = Infinity;
    places.forEach(p => {
      const d = Math.hypot(p.lng - lng, p.lat - lat);
      if (d < min) { min = d; nearest = p; }
    });
    setForm(f => ({ ...f, lat: +lat.toFixed(4), lng: +lng.toFixed(4), address: nearest.addr + ' ' + Math.floor(Math.random()*200+1) + ' 号', district: nearest.dist }));
  };

  return (
    <Shell active="publish" user={user} currentCity={currentCity} onCity={onCity}>
      <div className="container" style={{ padding: '20px 0 40px' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}>
          <a href="#/" style={{ color: 'var(--ink-3)' }}>首页</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-3)' }}>我要出租</span>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-2)' }}>创建小区</span>
        </div>

        {/* 步骤 */}
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: '20px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {['创建小区','发布房源','上架展示'].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: i === 0 ? 'var(--primary)' : '#F0F0F0',
                    color: i === 0 ? '#fff' : 'var(--ink-4)',
                    fontSize: 14, fontWeight: 700, display: 'grid', placeItems: 'center',
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? 'var(--ink)' : 'var(--ink-4)' }}>{s}</div>
                    {i === 0 && <div style={{ fontSize: 11.5, color: 'var(--primary)' }}>当前步骤</div>}
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: 'var(--line)', margin: '0 14px' }}/>}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: 36 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>创建小区</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8 }}>填写小区基本信息后，可在房源管理中关联此小区。</p>

          {/* 基本信息 */}
          <SectionTitle>基本信息</SectionTitle>
          <div className="row row-2">
            <div>
              <div className="label">小区名称 <span className="req">*</span></div>
              <input className="input" placeholder="例如 万科翡翠书院" value={form.name} onChange={e => set('name', e.target.value)}/>
            </div>
            <div>
              <div className="label">所在区域 <span className="req">*</span></div>
              <select className="select" value={form.district} onChange={e => set('district', e.target.value)}>
                {window.PORTAL_DATA.DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="row row-3" style={{ marginTop: 16 }}>
            <div>
              <div className="label">建成年份</div>
              <input className="input" placeholder="2018" value={form.year} onChange={e => set('year', e.target.value)}/>
            </div>
            <div>
              <div className="label">物业类型</div>
              <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                {['普通住宅','公寓','别墅','商住楼','高层住宅'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div className="label">总户数</div>
              <input className="input" placeholder="386" value={form.total} onChange={e => set('total', e.target.value)}/>
            </div>
          </div>

          {/* 地图选址 */}
          <SectionTitle>地理位置 <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 10 }}>点击地图选取，地址 / 经纬度将自动填充</span></SectionTitle>
          <div style={{ position: 'relative', height: 360, border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden', cursor: 'crosshair' }} onClick={handleMapClick}>
            <FakeMap/>
            {/* pin */}
            <div style={{
              position: 'absolute',
              left: `${((form.lng - 119.9) / 0.6) * 100}%`,
              top: `${((30.4 - form.lat) / 0.3) * 100}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
            }}>
              <svg width="36" height="42" viewBox="0 0 36 42">
                <path d="M18 0 C28 0 36 8 36 18 C36 30 18 42 18 42 C18 42 0 30 0 18 C0 8 8 0 18 0 Z" fill="var(--primary)" stroke="#fff" strokeWidth="2"/>
                <circle cx="18" cy="17" r="6" fill="#fff"/>
              </svg>
            </div>
            <div style={{ position: 'absolute', left: 14, top: 14, background: 'rgba(255,255,255,.95)', padding: '6px 12px', borderRadius: 999, fontSize: 12.5, color: 'var(--ink-2)', boxShadow: 'var(--shadow-sm)' }}>
              <PI.Pin style={{ width: 13, height: 13, color: 'var(--primary)', display: 'inline', verticalAlign: '-2px', marginRight: 4 }}/>
              点击地图选择小区位置
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="label">详细地址 <span className="req">*</span></div>
            <input className="input" placeholder="例如 北京市朝阳区朝阳门外大街乙 12 号" value={form.address} onChange={e => set('address', e.target.value)}/>
          </div>
          <div className="row row-2" style={{ marginTop: 14 }}>
            <div>
              <div className="label">纬度 (Lat)</div>
              <input className="input num" value={form.lat} readOnly style={{ background: 'var(--bg)' }}/>
            </div>
            <div>
              <div className="label">经度 (Lng)</div>
              <input className="input num" value={form.lng} readOnly style={{ background: 'var(--bg)' }}/>
            </div>
          </div>

          <SectionTitle>小区简介</SectionTitle>
          <textarea className="textarea" rows="4" placeholder="周边配套、物业服务、交通情况等" value={form.desc} onChange={e => set('desc', e.target.value)}/>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            <a className="btn btn-ghost" href="#/">取消</a>
            <button className="btn btn-primary" onClick={() => { alert('小区创建成功！'); window.location.hash = '#/publish/room'; }}>创建并发布房源 ›</button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function PublishRoom({ user, currentCity, onCity, editId }) {
  const { COMMUNITIES } = window.PORTAL_DATA;
  const editing = editId ? window.PORTAL_DATA.ROOMS.find(r => r.id === editId) : null;

  const [form, setForm] = React.useState(editing ? { ...editing,
    facilities: new Set(editing.facilities), tags: new Set(editing.tags),
  } : {
    title: '', communityId: COMMUNITIES[0].id, type: '整租',
    layout: '1室1厅1卫', size: '', floor: '', totalFloor: '', orient: '朝南',
    decoration: '精装修', elevator: '有',
    price: '', deposit: '', payment: '押1付3', leaseMin: '6 个月', availableAt: new Date().toISOString().slice(0,10),
    facilities: new Set(['冰箱','洗衣机','热水器','宽带','空调','床']),
    tags: new Set(['南北通透','精装']),
    images: [null, null, null, null, null],
    desc: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k, v) => setForm(f => {
    const n = new Set(f[k]); n.has(v) ? n.delete(v) : n.add(v); return { ...f, [k]: n };
  });

  const FACILITIES = ['冰箱','洗衣机','热水器','宽带','沙发','油烟机','燃气灶','可做饭','电视','空调','衣柜','床','卫生间','智能门锁','阳台','暖气'];
  const TAGS = ['南北通透','精装','拎包入住','近地铁','可短租','押1付1','可养宠','女生优先','视频看房','VR 看房'];

  return (
    <Shell active="publish" user={user} currentCity={currentCity} onCity={onCity}>
      <div className="container" style={{ padding: '20px 0 40px' }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}>
          <a href="#/" style={{ color: 'var(--ink-3)' }}>首页</a>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-3)' }}>我要出租</span>
          <span style={{ margin: '0 6px' }}>{'>'}</span>
          <span style={{ color: 'var(--ink-2)' }}>{editing ? '修改房源' : '创建房源'}</span>
        </div>

        {/* 步骤 */}
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: '20px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {['创建小区','发布房源','上架展示'].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: i === 0 ? 'var(--primary)' : (i === 1 ? 'var(--primary)' : '#F0F0F0'),
                    color: i <= 1 ? '#fff' : 'var(--ink-4)',
                    fontSize: 14, fontWeight: 700, display: 'grid', placeItems: 'center',
                  }}>{i < 1 ? '✓' : i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: i === 1 ? 600 : 500, color: i === 1 ? 'var(--ink)' : 'var(--ink-4)' }}>{s}</div>
                    {i === 1 && <div style={{ fontSize: 11.5, color: 'var(--primary)' }}>当前步骤</div>}
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: i === 0 ? 'var(--primary)' : 'var(--line)', margin: '0 14px' }}/>}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: 36 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>{editing ? '修改房源' : '发布房源'}</h2>

          <SectionTitle>基本信息</SectionTitle>
          <div style={{ marginBottom: 14 }}>
            <div className="label">房源标题 <span className="req">*</span> <span className="hint">建议突出小区 + 户型 + 卖点</span></div>
            <input className="input" placeholder="例如：高沙路地铁口 高沙小区 大学城旁 民水电 干湿分离 拎包即住" value={form.title} onChange={e => set('title', e.target.value)}/>
          </div>
          <div className="row row-2">
            <div>
              <div className="label">关联小区 <span className="req">*</span></div>
              <select className="select" value={form.communityId} onChange={e => set('communityId', e.target.value)}>
                {COMMUNITIES.map(c => <option key={c.id} value={c.id}>{c.name}（{c.district}）</option>)}
              </select>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 6 }}>找不到小区？<a href="#/publish/community" style={{ color: 'var(--primary)' }}>+ 创建新小区</a></div>
            </div>
            <div>
              <div className="label">出租方式 <span className="req">*</span></div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['整租','合租','短租'].map(t => (
                  <button key={t} type="button" onClick={() => set('type', t)} style={{
                    flex: 1, height: 38, borderRadius: 4, fontSize: 13.5,
                    background: form.type === t ? 'var(--primary-light)' : '#fff',
                    border: form.type === t ? '1.5px solid var(--primary)' : '1px solid var(--line)',
                    color: form.type === t ? 'var(--primary)' : 'var(--ink-2)',
                    fontWeight: form.type === t ? 600 : 500,
                  }}>{t}</button>
                ))}
              </div>
            </div>
          </div>

          <SectionTitle>房屋信息</SectionTitle>
          <div className="row row-3">
            <div>
              <div className="label">户型 <span className="req">*</span></div>
              <select className="select" value={form.layout} onChange={e => set('layout', e.target.value)}>
                {['1室1厅1卫','2室1厅1卫','2室2厅1卫','3室1厅1卫','3室2厅2卫','4室2厅2卫','LOFT复式','主卧合租','次卧合租'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <div className="label">面积 (㎡) <span className="req">*</span></div>
              <input className="input" placeholder="86" value={form.size} onChange={e => set('size', e.target.value)}/>
            </div>
            <div>
              <div className="label">朝向</div>
              <select className="select" value={form.orient} onChange={e => set('orient', e.target.value)}>
                {['朝南','朝东','朝西','朝北','东南','西南','南北','东西'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="row row-3" style={{ marginTop: 14 }}>
            <div>
              <div className="label">本房楼层 <span className="req">*</span></div>
              <select className="select" value={form.floor} onChange={e => set('floor', e.target.value)}>
                <option value="">请选择</option>
                {['低层','中层','高层'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div className="label">总楼层 <span className="req">*</span></div>
              <input className="input" placeholder="共 18 层" value={form.totalFloor} onChange={e => set('totalFloor', e.target.value)}/>
            </div>
            <div>
              <div className="label">装修 / 电梯</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="select" value={form.decoration} onChange={e => set('decoration', e.target.value)} style={{ flex: 1 }}>
                  {['毛坯','简装','精装','豪装','精装修'].map(o => <option key={o}>{o}</option>)}
                </select>
                <select className="select" value={form.elevator} onChange={e => set('elevator', e.target.value)} style={{ flex: 1 }}>
                  {['有','无'].map(o => <option key={o}>{o}电梯</option>)}
                </select>
              </div>
            </div>
          </div>

          <SectionTitle>租金信息</SectionTitle>
          <div className="row row-3">
            <div>
              <div className="label">月租金 (¥) <span className="req">*</span></div>
              <input className="input num" placeholder="1100" value={form.price} onChange={e => set('price', e.target.value)}/>
            </div>
            <div>
              <div className="label">押金 (¥)</div>
              <input className="input num" placeholder="1100" value={form.deposit} onChange={e => set('deposit', e.target.value)}/>
            </div>
            <div>
              <div className="label">付款方式</div>
              <select className="select" value={form.payment} onChange={e => set('payment', e.target.value)}>
                {['押1付1','押1付3','押2付1','押2付3','半年付','年付'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="row row-2" style={{ marginTop: 14 }}>
            <div>
              <div className="label">最短租期</div>
              <select className="select" value={form.leaseMin} onChange={e => set('leaseMin', e.target.value)}>
                {['1 个月','3 个月','6 个月','12 个月'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div className="label">可入住日期</div>
              <input className="input" type="date" value={form.availableAt} onChange={e => set('availableAt', e.target.value)}/>
            </div>
          </div>

          <SectionTitle>房源图片 <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 10 }}>建议 5-8 张，第一张为封面图</span></SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                aspectRatio: 1, border: '1.5px dashed var(--line)', borderRadius: 4,
                background: 'var(--bg)', display: 'grid', placeItems: 'center',
                color: 'var(--ink-3)', fontSize: 12, cursor: 'pointer', position: 'relative',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <PI.Plus style={{ width: 22, height: 22, marginBottom: 4 }}/>
                  <div>{i === 0 ? '上传封面' : '添加图片'}</div>
                </div>
                {i === 0 && <span style={{ position: 'absolute', top: 6, left: 6, padding: '1px 6px', background: 'var(--primary)', color: '#fff', fontSize: 11, borderRadius: 2 }}>封面</span>}
              </div>
            ))}
          </div>

          <SectionTitle>配套设施</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {FACILITIES.map(f => {
              const on = form.facilities.has(f);
              return (
                <label key={f} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 12px', border: '1px solid ' + (on ? 'var(--primary)' : 'var(--line)'),
                  borderRadius: 4, fontSize: 13, cursor: 'pointer',
                  background: on ? 'var(--primary-light)' : '#fff',
                  color: on ? 'var(--primary)' : 'var(--ink-2)',
                  fontWeight: on ? 600 : 500,
                }}>
                  <input type="checkbox" checked={on} onChange={() => toggle('facilities', f)} style={{ accentColor: 'var(--primary)' }}/>
                  {f}
                </label>
              );
            })}
          </div>

          <SectionTitle>房源标签 <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 10 }}>最多选 4 个</span></SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map(t => {
              const on = form.tags.has(t);
              return (
                <label key={t} style={{
                  padding: '7px 14px', border: '1px solid ' + (on ? 'var(--primary)' : 'var(--line)'),
                  borderRadius: 4, fontSize: 13, cursor: 'pointer',
                  background: on ? 'var(--primary-light)' : '#fff',
                  color: on ? 'var(--primary)' : 'var(--ink-2)',
                }}>
                  <input type="checkbox" checked={on} onChange={() => toggle('tags', t)} style={{ display: 'none' }}/>
                  {t}
                </label>
              );
            })}
          </div>

          <SectionTitle>房源描述</SectionTitle>
          <textarea className="textarea" rows="5" placeholder="详细介绍房源亮点、周边配套、入住须知等。详细的描述能帮您更快找到租客。" value={form.desc} onChange={e => set('desc', e.target.value)}/>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            <a className="btn btn-ghost" href="#/">取消</a>
            <button className="btn btn-ghost">存为草稿</button>
            <button className="btn btn-primary" onClick={() => { alert(editing ? '保存成功！' : '发布成功！'); window.location.hash = '#/profile/rooms'; }}>
              {editing ? '保存修改' : '保存并发布'}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ margin: '32px 0 16px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 4, height: 16, background: 'var(--primary)', borderRadius: 2 }}/>
      {children}
    </h3>
  );
}

window.PublishCommunity = PublishCommunity;
window.PublishRoom = PublishRoom;
window.SectionTitle = SectionTitle;
