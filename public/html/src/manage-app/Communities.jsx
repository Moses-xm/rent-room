/* 雅阁租房 · 管理后台 · 小区管理（列表 + 增删改查 + 地图选址） */

const SEED_COMMUNITIES = [
  { id: 'C1001', name: '朝阳门 SOHO',       district: '朝阳区', address: '北京市朝阳区朝阳门外大街乙 12 号',  lat: 39.927, lng: 116.434, total: 386, available: 24, dev: '潘石屹地产',       built: 2008, manager: '张伟', createdAt: '2024-08-12', status: 'active'  },
  { id: 'C1002', name: '万科翡翠书院',       district: '海淀区', address: '北京市海淀区永丰路 38 号',         lat: 40.064, lng: 116.231, total: 524, available: 41, dev: '万科地产',         built: 2018, manager: '李洁', createdAt: '2024-08-08', status: 'active'  },
  { id: 'C1003', name: '中海玺园',           district: '朝阳区', address: '北京市朝阳区东三环北路 8 号',     lat: 39.951, lng: 116.461, total: 268, available: 12, dev: '中海地产',         built: 2015, manager: '刘洋', createdAt: '2024-07-30', status: 'active'  },
  { id: 'C1004', name: '保利春天里',         district: '昌平区', address: '北京市昌平区回龙观西大街 100 号', lat: 40.073, lng: 116.339, total: 642, available: 88, dev: '保利地产',         built: 2012, manager: '陈浩', createdAt: '2024-07-15', status: 'active'  },
  { id: 'C1005', name: '朗诗未来街区',       district: '通州区', address: '北京市通州区运河西大街 56 号',    lat: 39.910, lng: 116.661, total: 412, available: 36, dev: '朗诗地产',         built: 2020, manager: '王磊', createdAt: '2024-07-10', status: 'active'  },
  { id: 'C1006', name: '远洋天著',           district: '丰台区', address: '北京市丰台区南四环西路 188 号',   lat: 39.838, lng: 116.319, total: 308, available:  9, dev: '远洋地产',         built: 2017, manager: '赵敏', createdAt: '2024-07-02', status: 'pending' },
  { id: 'C1007', name: '龙湖时代天街',       district: '昌平区', address: '北京市昌平区西三旗 2 号',         lat: 40.060, lng: 116.366, total: 480, available: 47, dev: '龙湖地产',         built: 2019, manager: '孙琪', createdAt: '2024-06-28', status: 'active'  },
  { id: 'C1008', name: '金地格林小镇',       district: '大兴区', address: '北京市大兴区黄村兴海路 15 号',    lat: 39.726, lng: 116.341, total: 226, available: 18, dev: '金地集团',         built: 2010, manager: '周林', createdAt: '2024-06-22', status: 'active'  },
];

function Communities() {
  const [list, setList]         = React.useState(SEED_COMMUNITIES);
  const [query, setQuery]       = React.useState('');
  const [district, setDistrict] = React.useState('all');
  const [status, setStatus]     = React.useState('all');
  const [page, setPage]         = React.useState(1);
  const pageSize = 8;

  const [createOpen, setCreateOpen]   = React.useState(false);
  const [editTarget, setEditTarget]   = React.useState(null);
  const [deleteTarget, setDeleteTarget] = React.useState(null);

  const filtered = list.filter(c => {
    if (query && !(c.name.includes(query) || c.address.includes(query) || c.id.includes(query))) return false;
    if (district !== 'all' && c.district !== district) return false;
    if (status   !== 'all' && c.status   !== status)   return false;
    return true;
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const onSubmitCreate = form => {
    const id = 'C' + (1008 + list.length + 1);
    setList([{ ...form, id, createdAt: new Date().toISOString().slice(0,10), available: 0 }, ...list]);
    setCreateOpen(false);
  };
  const onSubmitEdit = form => {
    setList(list.map(c => c.id === editTarget.id ? { ...c, ...form } : c));
    setEditTarget(null);
  };
  const onConfirmDelete = () => {
    setList(list.filter(c => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <Shell active="communities" crumbs={['控制台', '业务管理', '小区管理']}>
      <div className="page-head">
        <div>
          <h1 className="page-title">小区管理</h1>
          <div className="page-subtitle">维护平台小区库 · 共 {list.length.toLocaleString()} 个小区</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost"><Icon.Filter/> 导出</button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Icon.Plus/> 新增小区
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="input-with-icon" style={{ width: 280 }}>
            <Icon.Search className="ic"/>
            <input className="input"
                   placeholder="搜索小区名称 / 地址 / ID"
                   value={query}
                   onChange={e => { setQuery(e.target.value); setPage(1); }}/>
          </div>
          <div className="filter-set">
            <select className="select" value={district} onChange={e => { setDistrict(e.target.value); setPage(1); }} style={{ width: 110 }}>
              <option value="all">全部区域</option>
              {['朝阳区','海淀区','昌平区','通州区','丰台区','大兴区'].map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 110 }}>
              <option value="all">全部状态</option>
              <option value="active">已上架</option>
              <option value="pending">待审核</option>
            </select>
          </div>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>共 {total} 条</span>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>小区名称</th>
                <th>区域</th>
                <th>地址</th>
                <th style={{ textAlign: 'right' }}>总房源</th>
                <th style={{ textAlign: 'right' }}>可租</th>
                <th>建成年份</th>
                <th>状态</th>
                <th>创建时间</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--ink)' }}>
                      <a href={`#/communities/${c.id}`}>{c.name}</a>
                    </div>
                    <div className="num" style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{c.id} · {c.dev}</div>
                  </td>
                  <td><span className="tag">{c.district}</span></td>
                  <td style={{ maxWidth: 240, color: 'var(--ink-2)', fontSize: 12.5 }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</span>
                  </td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{c.total}</td>
                  <td className="num" style={{ textAlign: 'right', color: c.available > 0 ? 'var(--ok)' : 'var(--ink-3)', fontWeight: 600 }}>{c.available}</td>
                  <td className="num" style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{c.built}</td>
                  <td><span className={'pill ' + (c.status === 'active' ? 'pill-ok' : 'pill-warn')}>{c.status === 'active' ? '已上架' : '待审核'}</span></td>
                  <td className="num" style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{c.createdAt}</td>
                  <td className="col-actions">
                    <a className="icon-btn" title="详情" href={`#/communities/${c.id}`}><Icon.Eye/></a>
                    <button className="icon-btn" title="编辑" onClick={() => setEditTarget(c)}><Icon.Edit/></button>
                    <button className="icon-btn danger" title="删除" onClick={() => setDeleteTarget(c)}><Icon.Trash/></button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan="9">
                  <div className="empty">
                    <div className="empty-title">暂无匹配的小区</div>
                    <div className="empty-sub">尝试更改筛选条件，或点击右上角“新增小区”创建</div>
                  </div>
                </td></tr>
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

      {createOpen   && <CommunityFormModal title="新增小区" onClose={() => setCreateOpen(false)} onSubmit={onSubmitCreate}/>}
      {editTarget   && <CommunityFormModal title="编辑小区" initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={onSubmitEdit}/>}
      {deleteTarget && (
        <div className="modal-mask" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><Icon.Alert style={{ width: 22, height: 22 }}/></div>
            <div className="confirm-title">确认删除该小区？</div>
            <div className="confirm-msg">
              您即将删除小区「<b style={{ color: 'var(--ink)' }}>{deleteTarget.name}</b>」，
              该小区下的 <b className="num" style={{ color: 'var(--danger)' }}>{deleteTarget.total}</b> 套房源将变为孤立状态，请先迁移或下架后再删除。
            </div>
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

window.Communities = Communities;
window.SEED_COMMUNITIES = SEED_COMMUNITIES;
