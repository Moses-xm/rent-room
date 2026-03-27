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
    `w-full rounded-xl border px-4 py-3 text-sm leading-6 tracking-normal bg-white shadow-sm outline-none transition-all ${err
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
            <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold text-slate-900">
                            {editingId ? "编辑管理员信息" : "添加新管理员"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {editingId
                                ? "更新管理员账号资料与登录状态。"
                                : "填写基础信息后即可创建新的管理员账号。"}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-6 overflow-y-auto px-7 py-7">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">用户名</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                className={inputCls(errors.username)}
                                placeholder="如：admin-user"
                            />
                            {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">账号状态</label>
                            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {form.isActive ? "账号已启用" : "账号已禁用"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {form.isActive
                                            ? "启用后可正常登录并使用管理功能。"
                                            : "禁用后该账号将无法继续登录。"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-slate-300'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-700">头像地址</label>
                            <input
                                type="url"
                                value={form.avatar}
                                onChange={e => setForm({ ...form, avatar: e.target.value })}
                                className={inputCls()}
                                placeholder="https://example.com/avatar.png"
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">
                                登录密码
                                {editingId && <span className="ml-1 text-xs font-normal text-slate-400">(留空不修改)</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className={inputCls(errors.password) + " pr-12"}
                                    placeholder={editingId ? "不修改请留空" : "请输入登录密码"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
                                >
                                    {showPw ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500">
                                {editingId ? "如果不需要修改密码，可保持为空。" : "请设置管理员账号的登录密码。"}
                            </p>
                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors">
                            取消
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-600 active:scale-95 disabled:opacity-50">
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            {editingId ? "保存管理员信息" : "确认创建账号"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
