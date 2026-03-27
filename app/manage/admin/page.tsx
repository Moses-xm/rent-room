"use client";

import { useEffect, useState } from "react";
import { request } from "@/utils/request";

type Admin = {
  id: number;
  username: string;
  password?: string;
  avatar?: string;
  created?: string;
  modified?: string;
};

export default function AdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Admin>>({});
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await request('/admin');
      if (res.success) {
        setAdmins(res.data);
      }
    } catch (e: any) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (admin?: Admin) => {
    setErrorMsg("");
    if (admin) {
      setFormData({ ...admin });
    } else {
      setFormData({ username: "", password: "", avatar: "" });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    setErrorMsg("");
    if (!formData.username || !formData.password) {
      setErrorMsg("用户名和密码不能为空");
      return;
    }

    const isEdit = !!formData.id;
    const path = isEdit ? `/admin/${formData.id}` : '/admin';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await request(path, {
        method,
        json: {
          username: formData.username,
          password: formData.password,
          avatar: formData.avatar,
        }
      });

      if (res.success) {
        setModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.message || "操作失败");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "网络请求异常");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("确定要删除这个管理员吗？(此操作不可逆)")) {
      try {
        const res = await request(`/admin/${id}`, { method: 'DELETE' });
        if (res.success) {
          loadData();
        } else {
          alert(res.message || "删除失败");
        }
      } catch (e: any) {
        alert(e.message || "网络请求异常");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">管理员列表</h1>
          <p className="text-slate-500 text-sm font-medium">维护系统管理人员的账号与权限</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm"
        >
          <span>＋</span> 添加管理员
        </button>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">数据加载中...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">头像 & 账号</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">修改时间</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase">创建时间</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-wider uppercase text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">暂无管理员数据</td>
                </tr>
              ) : admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">#{admin.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary font-bold text-xs uppercase overflow-hidden shrink-0">
                        {admin.avatar ? (
                          <img src={admin.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          admin.username.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{admin.username}</div>
                        <div className="text-xs text-slate-400 font-mono tracking-wider opacity-60">PWD: ****</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {admin.modified ? new Date(admin.modified).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {admin.created ? new Date(admin.created).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(admin)}
                        className="text-slate-400 hover:text-primary transition-colors text-sm font-medium px-2 py-1"
                      >
                        编辑
                      </button>
                      <button 
                        onClick={() => handleDelete(admin.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors text-sm font-medium px-2 py-1"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {formData.id ? "编辑管理员" : "添加管理员"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">账号用户名</label>
                <input 
                  type="text" 
                  autoFocus
                  maxLength={15}
                  value={formData.username || ''}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  placeholder="最长15位"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">登录密码</label>
                <input 
                  type="password" 
                  maxLength={15}
                  value={formData.password || ''}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  placeholder="最长15位"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">头像链接 (可选)</label>
                <input 
                  type="url" 
                  value={formData.avatar || ''}
                  onChange={e => setFormData({...formData, avatar: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-600 shadow-sm transition-colors"
              >
                {formData.id ? "保存修改" : "确认增加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
