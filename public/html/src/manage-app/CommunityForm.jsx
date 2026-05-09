/* 雅阁租房 · 管理后台 · 小区表单（含地图选址） */

const DISTRICTS = ['朝阳区','海淀区','昌平区','通州区','丰台区','大兴区','西城区','东城区','石景山区'];

/* ========== 地图选址组件（SVG 模拟） ========== */
function MapPicker({ lat, lng, onPick }) {
  // 模拟地图：用 SVG 画街区网格 + 河流 + 公园 + 道路
  // 经纬度范围: 39.70 ~ 40.10 / 116.20 ~ 116.70
  const W = 560, H = 320;
  const LAT_MIN = 39.70, LAT_MAX = 40.10;
  const LNG_MIN = 116.20, LNG_MAX = 116.70;

  const px = (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * W;
  const py = H - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN) * H;

  const handleClick = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top)  / rect.height) * H;
    const newLng = LNG_MIN + (x / W) * (LNG_MAX - LNG_MIN);
    const newLat = LAT_MIN + ((H - y) / H) * (LAT_MAX - LAT_MIN);
    // 模拟反向地理编码：返回最近的「地点」
    const places = [
      { name: '朝阳区朝阳门外大街',      lng: 116.434, lat: 39.927, district: '朝阳区' },
      { name: '海淀区永丰路 38 号',       lng: 116.231, lat: 40.064, district: '海淀区' },
      { name: '朝阳区东三环北路 8 号',   lng: 116.461, lat: 39.951, district: '朝阳区' },
      { name: '昌平区回龙观西大街 100 号',lng: 116.339, lat: 40.073, district: '昌平区' },
      { name: '通州区运河西大街 56 号',  lng: 116.661, lat: 39.910, district: '通州区' },
      { name: '丰台区南四环西路 188 号', lng: 116.319, lat: 39.838, district: '丰台区' },
      { name: '大兴区黄村兴海路 15 号',  lng: 116.341, lat: 39.726, district: '大兴区' },
    ];
    let nearest = places[0];
    let min = Infinity;
    places.forEach(p => {
      const d = Math.hypot(p.lng - newLng, p.lat - newLat);
      if (d < min) { min = d; nearest = p; }
    });
    onPick({
      lat: +newLat.toFixed(4),
      lng: +newLng.toFixed(4),
      address: '北京市' + nearest.name,
      district: nearest.district,
    });
  };

  return (
    <div className="map-picker">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} onClick={handleClick} style={{ cursor: 'crosshair', display: 'block' }}>
        {/* 底色 */}
        <rect width={W} height={H} fill="#F5F2EC"/>
        {/* 街区网格 */}
        <g stroke="#E6DFD0" strokeWidth="0.5" fill="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={'v' + i} x1={i * 50} y1="0" x2={i * 50} y2={H}/>
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={'h' + i} x1="0" y1={i * 50} x2={W} y2={i * 50}/>
          ))}
        </g>
        {/* 公园 */}
        <ellipse cx="180" cy="120" rx="55" ry="40" fill="#DCE8D6" opacity=".8"/>
        <text x="180" y="124" textAnchor="middle" fontSize="10" fill="#7A8A6E" fontFamily="DM Sans">朝阳公园</text>
        <ellipse cx="420" cy="200" rx="40" ry="30" fill="#DCE8D6" opacity=".8"/>
        <text x="420" y="204" textAnchor="middle" fontSize="10" fill="#7A8A6E" fontFamily="DM Sans">奥森公园</text>
        {/* 河流 */}
        <path d="M 0 240 Q 140 220 260 250 T 560 230" stroke="#C5D9E8" strokeWidth="14" fill="none" opacity=".7"/>
        <path d="M 0 240 Q 140 220 260 250 T 560 230" stroke="#A8C4D8" strokeWidth="1" fill="none" opacity=".4"/>
        {/* 主要道路 */}
        <g stroke="#FFFFFF" strokeWidth="6" fill="none" opacity=".95">
          <line x1="0" y1="160" x2={W} y2="160"/>
          <line x1="280" y1="0" x2="280" y2={H}/>
        </g>
        <g stroke="#E2D8C2" strokeWidth="0.6" fill="none" strokeDasharray="3 4">
          <line x1="0" y1="160" x2={W} y2="160"/>
          <line x1="280" y1="0" x2="280" y2={H}/>
        </g>
        <text x="10" y="156" fontSize="9" fill="#A8997D" fontFamily="DM Sans">长安街</text>
        <text x="284" y="14" fontSize="9" fill="#A8997D" fontFamily="DM Sans">中轴路</text>
        {/* 标记点 */}
        {lat && lng && (
          <g transform={`translate(${px}, ${py})`}>
            <circle r="22" fill="#8B7355" opacity=".15"/>
            <circle r="12" fill="#8B7355" opacity=".25"/>
            <path d="M 0 -22 C -8 -22 -14 -16 -14 -8 C -14 0 0 12 0 12 C 0 12 14 0 14 -8 C 14 -16 8 -22 0 -22 Z"
                  fill="#8B7355" stroke="#fff" strokeWidth="1.6"/>
            <circle cx="0" cy="-10" r="4" fill="#fff"/>
          </g>
        )}
        {/* 操作提示 */}
        <g transform="translate(12, 12)">
          <rect width="170" height="26" rx="13" fill="#FFFFFF" opacity=".92"/>
          <text x="14" y="17" fontSize="11" fill="#3F3F3F" fontFamily="DM Sans" fontWeight="500">点击地图选择小区位置</text>
        </g>
      </svg>
    </div>
  );
}

/* ========== 小区表单弹窗 ========== */
function CommunityFormModal({ title, initial, onClose, onSubmit }) {
  const [form, setForm] = React.useState({
    name:     initial?.name     || '',
    district: initial?.district || '朝阳区',
    address:  initial?.address  || '',
    lat:      initial?.lat      || 39.927,
    lng:      initial?.lng      || 116.434,
    total:    initial?.total    || '',
    dev:      initial?.dev      || '',
    built:    initial?.built    || '',
    manager:  initial?.manager  || '',
    status:   initial?.status   || 'active',
    desc:     initial?.desc     || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onPickFromMap = ({ lat, lng, address, district }) => {
    setForm(f => ({ ...f, lat, lng, address, district }));
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" style={{ width: 760 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            <div className="modal-sub">完善小区基本信息后，可在「房源管理」中关联此小区。</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.X/></button>
        </div>

        <div className="modal-body">
          {/* —— 基本信息 —— */}
          <div className="form-section-title">基本信息</div>
          <div className="row row-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">小区名称 <span className="req">*</span></label>
              <input className="input" placeholder="例如 万科翡翠书院" value={form.name} onChange={e => set('name', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">所在区域 <span className="req">*</span></label>
              <select className="select" value={form.district} onChange={e => set('district', e.target.value)}>
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="row row-3" style={{ marginTop: 16 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">开发商</label>
              <input className="input" placeholder="例如 万科地产" value={form.dev} onChange={e => set('dev', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">建成年份</label>
              <input className="input" placeholder="2018" value={form.built} onChange={e => set('built', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">总房源数</label>
              <input className="input" placeholder="386" value={form.total} onChange={e => set('total', e.target.value)}/>
            </div>
          </div>

          <div className="form-divider"/>

          {/* —— 地理位置 —— */}
          <div className="form-section-title">
            地理位置
            <span className="form-section-hint">点击地图选取，地址 / 经纬度将自动填充</span>
          </div>
          <MapPicker lat={form.lat} lng={form.lng} onPick={onPickFromMap}/>

          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">详细地址 <span className="req">*</span></label>
            <input className="input" placeholder="例如 北京市朝阳区朝阳门外大街乙 12 号"
                   value={form.address} onChange={e => set('address', e.target.value)}/>
          </div>

          <div className="row row-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">纬度 (Lat)</label>
              <input className="input num" value={form.lat} onChange={e => set('lat', e.target.value)} readOnly style={{ background: 'var(--bg)', cursor: 'not-allowed' }}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">经度 (Lng)</label>
              <input className="input num" value={form.lng} onChange={e => set('lng', e.target.value)} readOnly style={{ background: 'var(--bg)', cursor: 'not-allowed' }}/>
            </div>
          </div>

          <div className="form-divider"/>

          {/* —— 管理 —— */}
          <div className="form-section-title">运营信息</div>
          <div className="row row-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">负责人</label>
              <input className="input" placeholder="姓名" value={form.manager} onChange={e => set('manager', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">上架状态</label>
              <div className="choice-group">
                {[['active','已上架'],['pending','待审核']].map(([k,l]) => (
                  <label key={k} className={'choice' + (form.status === k ? ' is-active' : '')}>
                    <input type="radio" checked={form.status === k} onChange={() => set('status', k)}/>{l}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
            <label className="label">小区简介 <span className="hint">展示在用户端小区详情页</span></label>
            <textarea className="textarea" rows="3" placeholder="周边配套、物业服务、交通情况等"
                      value={form.desc} onChange={e => set('desc', e.target.value)}/>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={() => onSubmit(form)}>{initial ? '保存修改' : '创建小区'}</button>
        </div>
      </div>
    </div>
  );
}

window.CommunityFormModal = CommunityFormModal;
window.MapPicker = MapPicker;
