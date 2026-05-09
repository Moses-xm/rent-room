/* 雅阁租房 · 管理后台 · 房源管理（列表 + 增删改查） */

const SEED_ROOMS = [
  { id: 'R20247', title: '朝阳门 SOHO 一居精装南向',     communityId: 'C1001', community: '朝阳门 SOHO',     district: '朝阳区', layout: '1室1厅1卫', area: 56,  floor: '12/26层',  orient: '南',   price: 8500,  deposit: 17000, type: '整租', status: 'available', owner: '张伟', createdAt: '2024-12-08', thumb: 'linear-gradient(135deg,#D4C5A8,#B8A37A)' },
  { id: 'R20248', title: '万科翡翠书院两居整租 全南向', communityId: 'C1002', community: '万科翡翠书院',   district: '海淀区', layout: '2室1厅1卫', area: 86,  floor: '8/18层',   orient: '南',   price: 11200, deposit: 22400, type: '整租', status: 'rented',    owner: '李洁', createdAt: '2024-12-05', thumb: 'linear-gradient(135deg,#C8B89A,#9F8A66)' },
  { id: 'R20249', title: '中海玺园 一居精装 看花园',    communityId: 'C1003', community: '中海玺园',       district: '朝阳区', layout: '1室1厅1卫', area: 62,  floor: '6/22层',   orient: '东南', price: 9600,  deposit: 19200, type: '整租', status: 'available', owner: '刘洋', createdAt: '2024-12-03', thumb: 'linear-gradient(135deg,#D8C9AB,#AB956F)' },
  { id: 'R20250', title: '保利春天里 主卧合租 飘窗',    communityId: 'C1004', community: '保利春天里',     district: '昌平区', layout: '主卧合租',  area: 18,  floor: '5/12层',   orient: '南',   price: 3200,  deposit: 3200,  type: '合租', status: 'available', owner: '陈浩', createdAt: '2024-12-01', thumb: 'linear-gradient(135deg,#CFC1A4,#A38E69)' },
  { id: 'R20251', title: '朗诗未来街区 两居 北欧风',     communityId: 'C1005', community: '朗诗未来街区',   district: '通州区', layout: '2室2厅1卫', area: 92,  floor: '14/22层',  orient: '南北', price: 7800,  deposit: 15600, type: '整租', status: 'rented',    owner: '王磊', createdAt: '2024-11-28', thumb: 'linear-gradient(135deg,#D2C2A1,#A89164)' },
  { id: 'R20252', title: '远洋天著 三居 全屋智能',       communityId: 'C1006', community: '远洋天著',       district: '丰台区', layout: '3室2厅2卫', area: 138, floor: '20/32层',  orient: '南',   price: 18800, deposit: 37600, type: '整租', status: 'pending',   owner: '赵敏', createdAt: '2024-11-25', thumb: 'linear-gradient(135deg,#CABB9D,#A38C66)' },
  { id: 'R20253', title: '龙湖时代天街 LOFT 复式',       communityId: 'C1007', community: '龙湖时代天街',   district: '昌平区', layout: 'LOFT复式',   area: 48,  floor: '15/30层',  orient: '南',   price: 6800,  deposit: 13600, type: '整租', status: 'available', owner: '孙琪', createdAt: '2024-11-22', thumb: 'linear-gradient(135deg,#D5C6A9,#AC966F)' },
  { id: 'R20254', title: '金地格林小镇 整租两居 板楼',  communityId: 'C1008', community: '金地格林小镇',   district: '大兴区', layout: '2室1厅1卫', area: 78,  floor: '4/6层',    orient: '南',   price: 5400,  deposit: 10800, type: '整租', status: 'available', owner: '周林', createdAt: '2024-11-20', thumb: 'linear-gradient(135deg,#C7B79A,#9D8762)' },
];

const ROOM_STATUS = {
  available: { label: '在租中',  pill: 'pill-ok' },
  rented:    { label: '已出租',  pill: 'pill-mute' },
  pending:   { label: '待审核',  pill: 'pill-warn' },
  offline:   { label: '已下架',  pill: 'pill-danger' },
};

function Rooms() {
  const [list, setList]     = React.useState(SEED_ROOMS);
  const [query, setQuery]   = React.useState('');
  const [type, setType]     = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [comm, setComm]     = React.useState('all');
  const [page, setPage]     = React.useState(1);
  const pageSize = 8;

  const [createOpen, setCreateOpen]     = React.useState(false);
  const [editTarget, setEditTarget]     = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  const filtered = list.filter(r => {
    if (query && !(r.title.includes(query) || r.id.includes(query) || r.community.includes(query))) return false;
    if (type   !== 'all' && r.type   !== type)   return false;
    if (status !== 'all' && r.status !== status) return false;
    if (comm   !== 'all' && r.communityId !== comm) return false;
    return true;
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onSubmitCreate = form => {
    const id = 'R' + (20254 + list.length + 1);
    setList([{ ...form, id, createdAt: new Date().toISOString().slice(0,10), thumb: 'linear-gradient(135deg,#D4C5A8,#B8A37A)' }, ...list]);
    setCreateOpen(false);
  };
  const onSubmitEdit = form => {
    setList(list.map(r => r.id === editTarget.id ? { ...r, ...form } : r));
    setEditTarget(null);
  };
  const onConfirmDelete = () => {
    setList(list.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <Shell active="rooms" crumbs={['控制台', '业务管理', '房源管理']}>
      <div className="page-head">
        <div>
          <h1 className="page-title">房源管理</h1>
          <div className="page-subtitle">维护平台所有房源信息 · 共 {list.length.toLocaleString()} 套房源</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost"><Icon.Filter/> 导出</button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Icon.Plus/> 新增房源
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="input-with-icon" style={{ width: 260 }}>
            <Icon.Search className="ic"/>
            <input className="input" placeholder="搜索房源标题 / ID / 小区"
                   value={query} onChange={e => { setQuery(e.target.value); setPage(1); }}/>
          </div>
          <div className="filter-set">
            <select className="select" value={comm} onChange={e => { setComm(e.target.value); setPage(1); }} style={{ width: 150 }}>
              <option value="all">全部小区</option>
              {(window.SEED_COMMUNITIES || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="select" value={type} onChange={e => { setType(e.target.value); setPage(1); }} style={{ width: 110 }}>
              <option value="all">全部类型</option>
              <option value="整租">整租</option>
              <option value="合租">合租</option>
            </select>
            <select className="select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 110 }}>
              <option value="all">全部状态</option>
              {Object.entries(ROOM_STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>共 {total} 条</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>房源</th>
                <th>所在小区</th>
                <th>户型 / 面积</th>
                <th>楼层 / 朝向</th>
                <th>类型</th>
                <th style={{ textAlign: 'right' }}>租金</th>
                <th>状态</th>
                <th>房东</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(r => (
                <tr key={r.id}>
                  <td style={{ minWidth: 240 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 56, height: 42, borderRadius: 4, flex: '0 0 56px', background: r.thumb }}/>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                          <a href={`#/rooms/${r.id}`}>{r.title}</a>
                        </div>
                        <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{r.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><a href={`#/communities/${r.communityId}`} style={{ color: 'var(--ink-2)' }}>{r.community}</a></td>
                  <td><div>{r.layout}</div><div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.area} ㎡</div></td>
                  <td><div>{r.floor}</div><div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{r.orient}向</div></td>
                  <td><span className="tag" style={{ background: r.type === '合租' ? 'var(--info-bg)' : 'var(--gold-tint)', color: r.type === '合租' ? 'var(--info)' : 'var(--gold-2)' }}>{r.type}</span></td>
                  <td className="num" style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>¥{r.price.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>/月</div>
                  </td>
                  <td><span className={'pill ' + ROOM_STATUS[r.status].pill}>{ROOM_STATUS[r.status].label}</span></td>
                  <td style={{ color: 'var(--ink-2)' }}>{r.owner}</td>
                  <td className="col-actions">
                    <a className="icon-btn" title="详情" href={`#/rooms/${r.id}`}><Icon.Eye/></a>
                    <button className="icon-btn" title="编辑" onClick={() => setEditTarget(r)}><Icon.Edit/></button>
                    <button className="icon-btn danger" title="删除" onClick={() => setDeleteTarget(r)}><Icon.Trash/></button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan="9"><div className="empty"><div className="empty-title">暂无匹配的房源</div><div className="empty-sub">尝试更改筛选条件</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div>显示 <span className="num">{(page - 1) * pageSize + 1}</span>– <span className="num">{Math.min(page * pageSize, total)}</span> 共 <span className="num">{total}</span> 条</div>
          <div className="pagination-pages">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={'page-btn' + (page === i + 1 ? ' is-active' : '')} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
      </div>

      {createOpen   && <RoomFormModal title="新增房源" onClose={() => setCreateOpen(false)} onSubmit={onSubmitCreate}/>}
      {editTarget   && <RoomFormModal title="编辑房源" initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={onSubmitEdit}/>}
      {deleteTarget && (
        <div className="modal-mask" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><Icon.Alert style={{ width: 22, height: 22 }}/></div>
            <div className="confirm-title">确认删除该房源？</div>
            <div className="confirm-msg">您即将删除「<b style={{ color: 'var(--ink)' }}>{deleteTarget.title}</b>」（ID: <span className="num">{deleteTarget.id}</span>）。该房源关联的预约、订单将解除。</div>
            <div className="confirm-foot">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="btn btn-danger" onClick={onConfirmDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

window.Rooms = Rooms;
window.SEED_ROOMS = SEED_ROOMS;
window.ROOM_STATUS = ROOM_STATUS;
