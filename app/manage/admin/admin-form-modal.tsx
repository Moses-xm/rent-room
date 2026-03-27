"use client";

import { useEffect, useState } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type AdminFormData = {
    username: string;
    password?: string;
    avatar: string;
    isActive: boolean;
};

export type EditableAdmin = {
    id: number;
    username: string;
    avatar?: string | null;
    isActive: boolean;
    password?: string;
};

/** State-driven modal: null = closed, otherwise describes what to show */
export type ModalState =
    | null
    | { mode: "add" }
    | { mode: "edit"; admin: EditableAdmin };

type Props = {
    state: ModalState;
    onClose: () => void;
    onSaved: (data: AdminFormData, editingId?: number) => Promise<void>;
};

const inputCls = (err?: string) =>
    `w-full rounded-lg border px-4 py-2 text-sm bg-white shadow-sm outline-none transition-all ${err
        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-100"
        : "border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-100"}`;

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AdminFormModal({ state, onClose, onSaved }: Props) {
    const [form, setForm] = useState<AdminFormData>({ username: "", password: "", avatar: "", isActive: true });
    const [showPw, setShowPw] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof AdminFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!state) return;
        if (state.mode === "edit") {
            const a = state.admin;
            setForm({
                username: a.username,
                avatar: a.avatar ?? "",
                isActive: a.isActive ?? true,
                password: "",
            });
        } else {
            setForm({ username: "", password: "", avatar: "", isActive: true });
        }
        setErrors({});
        setIsSubmitting(false);
        setShowPw(false);
    }, [state]);

    if (!state) return null;

    const editingId = state.mode === "edit" ? state.admin.id : undefined;

    const validate = () => {
        const e: Partial<Record<keyof AdminFormData, string>> = {};
        if (!form.username.trim()) e.username = "用户名不能为空";
        if (!editingId && !form.password?.trim()) e.password = "密码不能为空";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            await onSaved(form, editingId);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">
                        {editingId ? "编辑管理员" : "添加人员"}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">管理员用户名</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            className={inputCls(errors.username)}
                            placeholder="如：admin-user"
                        />
                        {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">账号状态</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-dotted border-slate-300">
                           <button
                             type="button"
                             onClick={() => setForm({...form, isActive: !form.isActive})}
                             className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-slate-200'}`}
                           >
                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                           </button>
                           <span className={`text-sm font-bold ${form.isActive ? 'text-primary' : 'text-slate-400'}`}>
                             {form.isActive ? '已启用 (Active)' : '已禁用 (Disabled)'}
                           </span>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">头像地址</label>
                        <input
                            type="url"
                            value={form.avatar}
                            onChange={e => setForm({ ...form, avatar: e.target.value })}
                            className={inputCls()}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">
                            登录密码
                            {editingId && <span className="ml-1 text-xs font-normal text-slate-400">(留空不修改)</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                className={inputCls(errors.password) + " pr-11"}
                                placeholder="******"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 mt-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">取消</button>
                        <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-primary-600 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {editingId ? "保存修改" : "确认添加"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
