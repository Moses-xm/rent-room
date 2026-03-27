"use client";

import { useEffect, useMemo, useState } from "react";
import { request } from "@/utils/request";
import {
    Plus, Search, Pencil, Trash2,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    X, ShieldCheck,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import AdminFormModal, { type ModalState, type AdminFormData } from "./admin-form-modal";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Admin = {
    id: number;
    username: string;
    avatar?: string | null;
    isActive: boolean;
    created: string;
    modified: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDateTime(iso: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
}

function initials(name: string) {
    if (!name) return "??";
    return name.trim().charAt(0).toUpperCase();
}

/* ─── API types ──────────────────────────────────────────────────────────── */
type AdminsResponse = { success: boolean; data: Admin[]; total: number; page: number; limit: number; totalPages: number };

type FetchParams = { page: number; limit: number; search?: string };

async function fetchAdmins(params: FetchParams): Promise<AdminsResponse> {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page));
    qs.set("limit", String(params.limit));
    if (params.search) qs.set("search", params.search);
    return request<AdminsResponse>(`/admin?${qs.toString()}`);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AdminPage() {
    const [modalState, setModalState] = useState<ModalState>(null);
    const [list, setList] = useState<Admin[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const [query, setQuery] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);

    const [debouncedQuery, setDebouncedQuery] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(t);
    }, [query]);

    const refreshData = () => {
        setLoading(true);
        fetchAdmins({ page, limit: pageSize, search: debouncedQuery || undefined })
            .then((res) => {
                if (res.success) {
                    setList(res.data);
                    setTotal(res.total);
                    setTotalPages(res.totalPages);
                }
            })
            .catch((err) => {
                console.error(err);
                toast.error("加载列表失败");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshData();
    }, [page, pageSize, debouncedQuery]);

    const safePage = Math.min(page, totalPages || 1);
    const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endIdx = Math.min(safePage * pageSize, total);

    const pageNums = useMemo(() => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else {
            pages.push(1);
            if (safePage > 3) pages.push("...");
            for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
            if (safePage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    }, [totalPages, safePage]);

    const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);

    const handleSaved = async (data: AdminFormData, editingId?: number) => {
        try {
            if (editingId) {
                await request(`/admin/${editingId}`, { method: "PUT", json: data });
                toast.success("信息已同步至云端");
            } else {
                await request("/admin", { method: "POST", json: data });
                toast.success("管理员账号创建成功");
            }
            refreshData();
        } catch (err: any) {
            toast.error(err.message || "同步失败");
            throw err;
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await request(`/admin/${deleteTarget.id}`, { method: "DELETE" });
            setDeleteTarget(null);
            refreshData();
            toast.success("账号已永久删除");
        } catch (err: any) {
            toast.error(err.message || "删除操作被阻止");
        }
    };

    const navBtn = "flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 cursor-pointer hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95 border border-transparent";

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Toaster position="top-right" richColors />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">员工管理</h1>
                    <p className="text-sm text-slate-500 mt-1">全局管理员账户维护，支持状态管控。所有的操作将被安全审计记录。</p>
                </div>
                <button 
                    onClick={() => setModalState({ mode: "add" })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-50 hover:bg-primary-600 transition-all active:scale-95"
                >
                    <Plus size={18} /> 新增管理员
                </button>
            </div>

            <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="输入关键词模糊检索..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setPage(1); }}
                    className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary-50 outline-none transition-all shadow-sm"
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">账号信息</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">状态</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">创建时间</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">最后修改</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">管理操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {list.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <ShieldCheck size={48} className="text-slate-300" />
                                            <p className="text-sm font-bold text-slate-500">
                                                {loading ? "检索中..." : "数据库中未匹配到相关管理员记录"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : list.map((admin) => (
                                <tr key={admin.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-50 text-primary font-bold overflow-hidden border-2 border-white shadow-sm ring-1 ring-primary-100">
                                                {admin.avatar ? (
                                                    <img src={admin.avatar} alt={admin.username} className="h-full w-full object-cover" />
                                                ) : initials(admin.username)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{admin.username}</p>
                                                <p className="text-[10px] text-slate-400 font-mono tracking-tighter opacity-70">UID:{admin.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${admin.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <div className={`h-1.5 w-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            {admin.isActive ? '正常工作' : '暂停服务'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 font-medium font-mono text-xs">
                                        {fmtDateTime(admin.created)}
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 font-medium font-mono text-xs">
                                        {fmtDateTime(admin.modified)}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end items-center gap-1.5">
                                            <button 
                                                onClick={() => setModalState({ mode: "edit", admin })}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-all active:scale-95"
                                                title="修改此账户"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteTarget(admin)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                                title="从系统抹除"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {total > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 bg-slate-50/30 border-t border-slate-100">
                        <div className="text-xs text-slate-400">
                            共检索到 <span className="text-slate-900 font-bold">{total}</span> 条记录
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => setPage(1)} disabled={safePage === 1} className={navBtn}><ChevronsLeft size={16} /></button>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className={navBtn}><ChevronLeft size={16} /></button>
                            <div className="flex items-center gap-1 mx-2">
                                {pageNums.map((p, i) => p === "..." ? (
                                    <span key={`e${i}`} className="text-slate-300 px-1 font-bold">...</span>
                                ) : (
                                    <button 
                                        key={p} 
                                        onClick={() => setPage(p as number)}
                                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                                            p === safePage 
                                                ? "bg-primary text-white border-primary shadow-lg shadow-primary-50" 
                                                : "text-slate-500 bg-white border-slate-200 hover:border-primary hover:text-primary"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className={navBtn}><ChevronRight size={16} /></button>
                            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} className={navBtn}><ChevronsRight size={16} /></button>
                        </div>
                    </div>
                )}
            </div>

            <AdminFormModal state={modalState} onClose={() => setModalState(null)} onSaved={handleSaved} />

            {deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95">
                        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                            <Trash2 size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-900">执行毁灭性操作？</h3>
                            <p className="text-sm text-slate-500">
                                管理员 <span className="font-bold text-slate-900">{deleteTarget.username}</span> 将被永久注销。数据一旦抹除，将无法在云端控制台找回！
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">冷静一下</button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 text-sm font-bold bg-red-500 text-white hover:bg-red-600 rounded-xl shadow-lg shadow-red-100 active:scale-95 transition-all">执行删除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
