/* 雅阁租房 · 管理后台 · 房源表单（多分节） */

const FACILITIES = [
  '空调','洗衣机','冰箱','热水器','电视','宽带 / WiFi','燃气灶','油烟机',
  '微波炉','床','衣柜','沙发','书桌','餐桌','飘窗','地暖','智能门锁','烘干机',
];
const TAGS = ['南北通透','精装修','拎包入住','近地铁','可短租','押一付三','可养宠','女生优先'];

function RoomFormModal({ title, initial, onClose, onSubmit }) {
  const communities = window.SEED_COMMUNITIES || [];
  const [form, setForm] = React.useState({
    title:        initial?.title        || '',
    communityId:  initial?.communityId  || communities[0]?.id || '',
    type:         initial?.type         || '整租',
    layout:       initial?.layout       || '1室1厅1卫',
    area:         initial?.area         || '',
    floor:        initial?.floor        || '',
    orient:       initial?.orient       || '南',
    decoration:   initial?.decoration   || '精装',
    elevator:     initial?.elevator     || '有',
    price:        initial?.price        || '',
    deposit:      initial?.deposit      || '',
    payment:      initial?.payment      || '押一付三',
    leaseMin:     initial?.leaseMin     || '6个月',
    availableAt:  initial?.availableAt  || new Date().toISOString().slice(0,10),
    facilities:   new Set(initial?.facilities || ['空调','洗衣机','冰箱','热水器','宽带 / WiFi','床','衣柜']),
    tags:         new Set(initial?.tags || ['南北通透','精装修']),
    images:       initial?.images       || [null, null, null, null, null],
    desc:         initial?.desc         || '',
    ownerName:    initial?.ownerName    || '',
    ownerPhone:   initial?.ownerPhone   || '',
    status:       initial?.status       || 'available',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSet = (k, v) => setForm(f => {
    const n = new Set(f[k]);
    n.has(v) ? n.delete(v) : n.add(v);
    return { ...f, [k]: n };
  });

  const community = communities.find(c => c.id === form.communityId);

  const handleSubmit = () => {
    onSubmit({
      ...form,
      community: community?.name || '',
      district:  community?.district || '',
      facilities: Array.from(form.facilities),
      tags:       Array.from(form.tags),
      area:       Number(form.area) || form.area,
      price:      Number(form.price) || form.price,
      deposit:    Number(form.deposit) || form.deposit,
      owner:      form.ownerName || '—',
    });
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" style={{ width: 880 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            <div className="modal-sub">填写完整的房源信息，完成后将在用户端展示</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.X/></button>
        </div>

        <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {/* —— 基本信息 —— */}
          <div className="form-section-title">基本信息</div>
          <div className="field">
            <label className="label">房源标题 <span className="req">*</span> <span className="hint">建议突出小区 + 户型 + 卖点</span></label>
            <input className="input" placeholder="例如：朝阳门 SOHO 一居精装南向 看花园"
                   value={form.title} onChange={e => set('title', e.target.value)}/>
          </div>
          <div className="row row-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">关联小区 <span className="req">*</span></label>
              <select className="select" value={form.communityId} onChange={e => set('communityId', e.target.value)}>
                {communities.map(c => <option key={c.id} value={c.id}>{c.name}（{c.district}）</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">出租方式 <span className="req">*</span></label>
              <div className="choice-group">
                {['整租','合租','短租'].map(t => (
                  <label key={t} className={'choice' + (form.type === t ? ' is-active' : '')}>
                    <input type="radio" checked={form.type === t} onChange={() => set('type', t)}/>{t}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-divider"/>

          {/* —— 房屋信息 —— */}
          <div className="form-section-title">房屋信息</div>
          <div className="row row-3">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">户型 <span className="req">*</span></label>
              <select className="select" value={form.layout} onChange={e => set('layout', e.target.value)}>
                {['1室1厅1卫','2室1厅1卫','2室2厅1卫','3室1厅1卫','3室2厅2卫','4室2厅2卫','LOFT复式','主卧合租','次卧合租'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">面积 (㎡) <span className="req">*</span></label>
              <input className="input num" placeholder="86" value={form.area} onChange={e => set('area', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">朝向</label>
              <select className="select" value={form.orient} onChange={e => set('orient', e.target.value)}>
                {['南','东','西','北','东南','西南','南北','东西'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="row row-3" style={{ marginTop: 16 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">楼层 <span className="req">*</span></label>
              <input className="input" placeholder="例如 8/18层" value={form.floor} onChange={e => set('floor', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">装修</label>
              <select className="select" value={form.decoration} onChange={e => set('decoration', e.target.value)}>
                {['毛坯','简装','精装','豪装'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">电梯</label>
              <div className="choice-group">
                {['有','无'].map(o => (
                  <label key={o} className={'choice' + (form.elevator === o ? ' is-active' : '')}>
                    <input type="radio" checked={form.elevator === o} onChange={() => set('elevator', o)}/>{o}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="form-divider"/>

          {/* —— 租金 —— */}
          <div className="form-section-title">租金信息</div>
          <div className="row row-3">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">月租金 (¥) <span className="req">*</span></label>
              <input className="input num" placeholder="8500" value={form.price} onChange={e => set('price', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">押金 (¥)</label>
              <input className="input num" placeholder="17000" value={form.deposit} onChange={e => set('deposit', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">付款方式</label>
              <select className="select" value={form.payment} onChange={e => set('payment', e.target.value)}>
                {['押一付一','押一付三','押二付一','押二付三','半年付','年付'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="row row-2" style={{ marginTop: 16 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">最短租期</label>
              <select className="select" value={form.leaseMin} onChange={e => set('leaseMin', e.target.value)}>
                {['1个月','3个月','6个月','12个月'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">可入住时间</label>
              <input type="date" className="input" value={form.availableAt} onChange={e => set('availableAt', e.target.value)}/>
            </div>
          </div>

          <div className="form-divider"/>

          {/* —— 房源图片 —— */}
          <div className="form-section-title">
            房源图片
            <span className="form-section-hint">建议 5–8 张，第一张为封面，最大 5MB</span>
          </div>
          <div className="upload-grid">
            {form.images.map((im, i) => (
              <div key={i} className={'upload-tile' + (im ? ' has-image' : '') + (i === 0 ? ' cover-mark' : '')}
                   style={im ? { background: im, backgroundSize: 'cover' } : {}}>
                {!im && (
                  <div style={{ textAlign: 'center' }}>
                    <Icon.Plus style={{ width: 18, height: 18, marginBottom: 4 }}/>
                    <div>{i === 0 ? '上传封面' : '添加图片'}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="form-divider"/>

          {/* —— 配套设施 —— */}
          <div className="form-section-title">配套设施</div>
          <div className="facility-grid">
            {FACILITIES.map(f => (
              <label key={f} className={'facility' + (form.facilities.has(f) ? ' is-on' : '')}>
                <input type="checkbox" checked={form.facilities.has(f)} onChange={() => toggleSet('facilities', f)}/>
                <span style={{ width: 14, height: 14, borderRadius: 3, border: '1.5px solid currentColor', display: 'inline-grid', placeItems: 'center', flex: '0 0 14px' }}>
                  {form.facilities.has(f) && <span style={{ width: 7, height: 4, borderLeft: '1.5px solid currentColor', borderBottom: '1.5px solid currentColor', transform: 'rotate(-45deg) translate(0px, -1px)' }}/>}
                </span>
                {f}
              </label>
            ))}
          </div>

          <div className="form-divider"/>

          {/* —— 房源标签 —— */}
          <div className="form-section-title">房源标签 <span className="form-section-hint">最多选 4 个，会展示在卡片上</span></div>
          <div className="choice-group">
            {TAGS.map(t => (
              <label key={t} className={'choice' + (form.tags.has(t) ? ' is-active' : '')}>
                <input type="checkbox" checked={form.tags.has(t)} onChange={() => toggleSet('tags', t)}/>{t}
              </label>
            ))}
          </div>

          <div className="form-divider"/>

          {/* —— 描述 —— */}
          <div className="form-section-title">房源描述</div>
          <div className="field">
            <textarea className="textarea" rows="4" placeholder="详细介绍房源亮点、周边交通、配套设施、入住须知等"
                      value={form.desc} onChange={e => set('desc', e.target.value)}/>
          </div>

          <div className="form-divider"/>

          {/* —— 房东信息 —— */}
          <div className="form-section-title">房东信息</div>
          <div className="row row-3">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">房东姓名 <span className="req">*</span></label>
              <input className="input" placeholder="姓名" value={form.ownerName} onChange={e => set('ownerName', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">联系电话 <span className="req">*</span></label>
              <input className="input num" placeholder="138 0000 0000" value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">上架状态</label>
              <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="available">立即上架</option>
                <option value="pending">待审核</option>
                <option value="offline">仅保存草稿</option>
              </select>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-ghost">保存草稿</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{initial ? '保存修改' : '发布房源'}</button>
        </div>
      </div>
    </div>
  );
}

window.RoomFormModal = RoomFormModal;
