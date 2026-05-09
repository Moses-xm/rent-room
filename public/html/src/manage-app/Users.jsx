/* 雅阁租房 · 管理后台 · 用户管理 */

const SEED_USERS = [
  { id: 'U10241', name: '王小明', phone: '138 0013 8000', email: 'wang@example.com', role: '租客', status: 'active',  city: '北京', regAt: '2024-12-15', orders: 4 },
  { id: 'U10242', name: '李娜',   phone: '139 0014 5021', email: 'lina@example.com', role: '租客', status: 'active',  city: '上海', regAt: '2024-12-12', orders: 7 },
  { id: 'U10243', name: '张伟',   phone: '186 1122 3344', email: 'zhang@example.com', role: '房东', status: 'active',  city: '北京', regAt: '2024-11-30', orders: 2 },
  { id: 'U10244', name: '陈浩',   phone: '135 8888 0099', email: 'chen@example.com',  role: '租客', status: 'pending', city: '深圳', regAt: '2024-11-28', orders: 0 },
  { id: 'U10245', name: '刘洋',   phone: '152 0066 1010', email: 'liu@example.com',   role: '房东', status: 'active',  city: '广州', regAt: '2024-11-22', orders: 14 },
  { id: 'U10246', name: '赵敏',   phone: '177 5566 7788', email: 'zhao@example.com',  role: '租客', status: 'banned',  city: '上海', regAt: '2024-11-10', orders: 1 },
  { id: 'U10247', name: '孙琪',   phone: '180 2233 4455', email: 'sun@example.com',   role: '租客', status: 'active',  city: '杭州', regAt: '2024-11-05', orders: 3 },
  { id: 'U10248', name: '周林',   phone: '155 7788 9911', email: 'zhou@example.com',  role: '房东', status: 'pending', city: '北京', regAt: '2024-10-28', orders: 0 },
  { id: 'U10249', name: '吴亮',   phone: '189 1010 2020', email: 'wu@example.com',    role: '租客', status: 'active',  city: '成都', regAt: '2024-10-20', orders: 5 },
  { id: 'U10250', name: '郑爽',   phone: '199 3344 5566', email: 'zheng@example.com', role: '租客', status: 'active',  city: '武汉', regAt: '2024-10-15', orders: 2 },
];

const STATUS_MAP = {
  active:  { label: '正常',   pill: 'pill-ok' },
  pending: { label: '待审核', pill: 'pill-warn' },
  banned:  { label: '已禁用', pill: 'pill-danger' },
};

function Users() {
  const [users, setUsers]       = React.useState(SEED_USERS);
  const [query, setQuery]       = React.useState('');
  const [role, setRole]         = React.useState('all');
  const [status, setStatus]     = React.useState('all');
  const [selected, setSelected] = React.useState(new Set());
  const [page, setPage]         = React.useState(1);
  const pageSize = 8;

  // —— 弹窗状态 ——
  const [createOpen,  setCreateOpen]  = React.useState(false);
  const [editTarget,  setEditTarget]  = React.useState(null);
  const [deleteTarget,setDeleteTarget]= React.useState(null);
  const [viewTarget,  setViewTarget]  = React.useState(null);

  const filtered = users.filter(u => {
    if (query && !(u.name.includes(query) || u.phone.includes(query) || u.email.includes(query) || u.id.includes(query))) return false;
    if (role !== 'all' && u.role !== role) return false;
    if (status !== 'all' && u.status !== status) return false;
    return true;
  });
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const stats = {
    total: users.length,
    tenant: users.filter(u => u.role === '租客').length,
    landlord: users.filter(u => u.role === '房东').length,
    pending: users.filter(u => u.status === 'pending').length,
  };

  const toggleAll = () => {
    if (paged.every(u => selected.has(u.id))) {
      const next = new Set(selected);
      paged.forEach(u => next.delete(u.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      paged.forEach(u => next.add(u.id));
      setSelected(next);
    }
  };
  const toggle = id => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const onSubmitCreate = (form) => {
    const id = 'U' + (10250 + users.length + 1);
    setUsers([{ ...form, id, regAt: new Date().toISOString().slice(0,10), orders: 0 }, ...users]);
    setCreateOpen(false);
  };
  const onSubmitEdit = (form) => {
    setUsers(users.map(u => u.id === editTarget.id ? { ...u, ...form } : u));
    setEditTarget(null);
  };
  const onConfirmDelete = () => {
    setUsers(users.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <Shell active="users" crumbs={['控制台', '业务管理', '用户管理']}>
      <div className="page-head">
        <div>
          <h1 className="page-title">用户管理</h1>
          <div className="page-subtitle">管理平台所有用户 · 共 {users.length.toLocaleString()} 名用户</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost"><Icon.Filter/> 导出</button>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            <Icon.Plus/> 新增用户
          </button>
        </div>
      </div>

      {/* —— 表格 —— */}
      <div className="card">
        <div className="table-toolbar">
          <div className="input-with-icon" style={{ width: 260 }}>
            <Icon.Search className="ic"/>
            <input className="input"
                   placeholder="搜索姓名 / 手机 / 邮箱 / ID"
                   value={query}
                   onChange={e => { setQuery(e.target.value); setPage(1); }}/>
          </div>

          <div className="filter-set">
            <select className="select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }} style={{ width: 110 }}>
              <option value="all">全部身份</option>
              <option value="租客">租客</option>
              <option value="房东">房东</option>
            </select>
            <select className="select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 120 }}>
              <option value="all">全部状态</option>
              <option value="active">正常</option>
              <option value="pending">待审核</option>
              <option value="banned">已禁用</option>
            </select>
          </div>

          <div style={{ flex: 1 }}/>

          {selected.size > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--ink-3)' }}>
              <span>已选 <b className="num" style={{ color: 'var(--gold)' }}>{selected.size}</b> 项</span>
              <button className="btn btn-sm btn-ghost">批量审核</button>
              <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>批量删除</button>
            </div>
          ) : (
            <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>共 {total} 条</span>
          )}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <span className={'checkbox' + (paged.length > 0 && paged.every(u => selected.has(u.id)) ? ' is-checked' : '')}
                        onClick={toggleAll}/>
                </th>
                <th>用户</th>
                <th>用户ID</th>
                <th>身份</th>
                <th>城市</th>
                <th>注册时间</th>
                <th style={{ textAlign: 'right' }}>订单</th>
                <th>状态</th>
                <th className="col-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(u => (
                <tr key={u.id}>
                  <td>
                    <span className={'checkbox' + (selected.has(u.id) ? ' is-checked' : '')}
                          onClick={() => toggle(u.id)}/>
                  </td>
                  <td>
                    <div className="cell-user">
                      <div className="av">{u.name[0]}</div>
                      <div>
                        <div className="name">{u.name}</div>
                        <div className="sub">{u.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num" style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{u.id}</td>
                  <td><span className={'tag'} style={{ background: u.role === '房东' ? 'var(--gold-tint)' : 'var(--bg-2)', color: u.role === '房东' ? 'var(--gold-2)' : 'var(--ink-2)', borderColor: u.role === '房东' ? '#E2D3B0' : 'var(--line)' }}>{u.role}</span></td>
                  <td style={{ color: 'var(--ink-2)' }}>{u.city}</td>
                  <td className="num" style={{ color: 'var(--ink-3)', fontSize: 12.5 }}>{u.regAt}</td>
                  <td className="num" style={{ textAlign: 'right', fontWeight: 500 }}>{u.orders}</td>
                  <td><span className={'pill ' + STATUS_MAP[u.status].pill}>{STATUS_MAP[u.status].label}</span></td>
                  <td className="col-actions">
                    <button className="icon-btn" title="查看"  onClick={() => setViewTarget(u)}><Icon.Eye/></button>
                    <button className="icon-btn" title="编辑"  onClick={() => setEditTarget(u)}><Icon.Edit/></button>
                    <button className="icon-btn danger" title="删除" onClick={() => setDeleteTarget(u)}><Icon.Trash/></button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan="9">
                  <div className="empty">
                    <div className="empty-title">没有匹配的用户</div>
                    <div className="empty-sub">尝试更改筛选条件或搜索关键词</div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div>
            显示 <span className="num">{(page - 1) * pageSize + 1}</span>
            – <span className="num">{Math.min(page * pageSize, total)}</span> 共 <span className="num">{total}</span> 条
          </div>
          <div className="pagination-pages">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={'page-btn' + (page === i + 1 ? ' is-active' : '')} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            每页
            <select className="select" style={{ width: 64, height: 28 }} defaultValue="8">
              <option>8</option><option>20</option><option>50</option>
            </select>
            条
          </div>
        </div>
      </div>

      {/* —— 弹窗 —— */}
      {createOpen   && <UserFormModal title="新增用户"  onClose={() => setCreateOpen(false)} onSubmit={onSubmitCreate}/>}
      {editTarget   && <UserFormModal title="编辑用户"  initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={onSubmitEdit}/>}
      {deleteTarget && <DeleteConfirm user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={onConfirmDelete}/>}
      {viewTarget   && <UserDrawer    user={viewTarget}   onClose={() => setViewTarget(null)} onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}/>}
    </Shell>
  );
}

/* ==================== 增 / 改 表单弹窗 ==================== */
function UserFormModal({ title, initial, onClose, onSubmit }) {
  const [form, setForm] = React.useState({
    name:   initial?.name   || '',
    phone:  initial?.phone  || '',
    email:  initial?.email  || '',
    role:   initial?.role   || '租客',
    city:   initial?.city   || '北京',
    status: initial?.status || 'active',
    note:   initial?.note   || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{title}</div>
            <div className="modal-sub">{initial ? '修改用户基本信息后保存即可生效。' : '填写新用户的基本信息，创建后将发送验证短信。'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.X/></button>
        </div>

        <div className="modal-body">
          <div className="row row-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">姓名 <span className="req">*</span></label>
              <input className="input" placeholder="请输入用户姓名" value={form.name} onChange={e => set('name', e.target.value)}/>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">手机号 <span className="req">*</span></label>
              <input className="input" placeholder="138 0000 0000" value={form.phone} onChange={e => set('phone', e.target.value)}/>
            </div>
          </div>

          <div className="field" style={{ marginTop: 16 }}>
            <label className="label">邮箱 <span className="hint">用于接收通知</span></label>
            <input className="input" placeholder="user@example.com" value={form.email} onChange={e => set('email', e.target.value)}/>
          </div>

          <div className="field">
            <label className="label">用户身份 <span className="req">*</span></label>
            <div className="choice-group">
              {['租客','房东'].map(r => (
                <label key={r} className={'choice' + (form.role === r ? ' is-active' : '')}>
                  <input type="radio" name="role" checked={form.role === r} onChange={() => set('role', r)}/>
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div className="row row-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">所在城市</label>
              <select className="select" value={form.city} onChange={e => set('city', e.target.value)}>
                {['北京','上海','广州','深圳','杭州','成都','武汉'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">账号状态</label>
              <div className="choice-group">
                {[['active','正常'],['pending','待审核'],['banned','已禁用']].map(([k,l]) => (
                  <label key={k} className={'choice' + (form.status === k ? ' is-active' : '')}>
                    <input type="radio" name="status" checked={form.status === k} onChange={() => set('status', k)}/>
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="field" style={{ marginTop: 16, marginBottom: 0 }}>
            <label className="label">备注 <span className="hint">仅管理员可见</span></label>
            <textarea className="textarea" rows="3" placeholder="可填写身份补充说明、备注信息等" value={form.note} onChange={e => set('note', e.target.value)}/>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={() => onSubmit(form)}>{initial ? '保存修改' : '创建用户'}</button>
        </div>
      </div>
    </div>
  );
}

/* ==================== 删除确认弹窗 ==================== */
function DeleteConfirm({ user, onClose, onConfirm }) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal confirm" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon"><Icon.Alert style={{ width: 22, height: 22 }}/></div>
        <div className="confirm-title">确认删除该用户？</div>
        <div className="confirm-msg">
          您即将删除用户「<b style={{ color: 'var(--ink)' }}>{user.name}</b>」（ID: <span className="num">{user.id}</span>）。
          删除后该用户的关联订单、合同、收藏数据将无法恢复。
        </div>
        <div className="confirm-foot">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  );
}

/* ==================== 详情抽屉（查看） ==================== */
function UserDrawer({ user, onClose, onEdit }) {
  return (
    <>
      <div className="drawer-mask" onClick={onClose}/>
      <div className="drawer">
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--line-2)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="modal-title">用户详情</div>
            <div className="modal-sub">ID: <span className="num">{user.id}</span></div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon.X/></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottom: '1px solid var(--line-2)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gold-tint)', color: 'var(--gold-2)', display: 'grid', placeItems: 'center', fontFamily: 'var(--typeface-display)', fontSize: 24, fontWeight: 500 }}>{user.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{user.name}</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={'pill ' + STATUS_MAP[user.status].pill}>{STATUS_MAP[user.status].label}</span>
                <span className="tag">{user.role}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onEdit}><Icon.Edit/> 编辑</button>
          </div>

          <div style={{ paddingTop: 16 }}>
            <div className="kv"><span className="k">手机号</span><span className="v num">{user.phone}</span></div>
            <div className="kv"><span className="k">邮箱</span><span className="v">{user.email}</span></div>
            <div className="kv"><span className="k">所在城市</span><span className="v">{user.city}</span></div>
            <div className="kv"><span className="k">注册时间</span><span className="v num">{user.regAt}</span></div>
            <div className="kv"><span className="k">最近登录</span><span className="v">3 小时前</span></div>
          </div>

          <div className="divider"/>

          <div className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>账户数据</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[['订单数', user.orders], ['收藏数', 12], ['钱包余额', '¥820']].map(([l, v]) => (
              <div key={l} style={{ background: 'var(--gold-tint-2)', borderRadius: 6, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l}</div>
                <div className="num" style={{ fontFamily: 'var(--typeface-display)', fontSize: 22, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>

          <div className="divider"/>

          <div className="card-title" style={{ fontSize: 13, marginBottom: 8 }}>最近订单</div>
          {[
            ['#OD20247', '朝阳门 SOHO 一居', '已完成', '2024-12-08'],
            ['#OD20198', '万科翡翠书院 两居', '进行中', '2024-11-22'],
            ['#OD20155', '中海玺园 一居',     '已退款', '2024-10-30'],
          ].map(([oid, room, st, t]) => (
            <div key={oid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px dashed var(--line-2)', fontSize: 12.5 }}>
              <div>
                <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{room}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }} className="num">{oid} · {t}</div>
              </div>
              <span className="tag">{st}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--line-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>关闭</button>
          <button className="btn btn-primary" onClick={onEdit}>编辑信息</button>
        </div>
      </div>
    </>
  );
}

window.Users = Users;
