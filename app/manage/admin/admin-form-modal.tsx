'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, Loader2, Upload, ImagePlus } from 'lucide-react';
import {
  isManagedUploadPath,
  resolveUploadedFileUrl,
} from '@/lib/upload-path';
import { request } from '@/utils/request';

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
  | { mode: 'add' }
  | { mode: 'edit'; admin: EditableAdmin };

type Props = {
  state: ModalState;
  onClose: () => void;
  onSaved: (data: AdminFormData, editingId?: number) => Promise<void>;
};

const inputCls = (err?: string) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-sm leading-6 tracking-normal text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
    err
      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-100'
      : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary-100'
  }`;

const fieldWrapCls = 'space-y-2';
const labelCls = 'mb-2 block text-sm font-medium text-slate-700';
const hintCls = 'text-xs leading-5 text-slate-500';

type UploadResponse = {
  success: boolean;
  message?: string;
  data?: {
    path: string;
  };
};

function normalizeAvatarPath(value: string | null | undefined) {
  return value?.trim() ?? '';
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AdminFormModal({ state, onClose, onSaved }: Props) {
  const [form, setForm] = useState<AdminFormData>({
    username: '',
    password: '',
    avatar: '',
    isActive: true,
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AdminFormData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaningAvatar, setIsCleaningAvatar] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialAvatarRef = useRef('');

  useEffect(() => {
    if (!state) return;
    if (state.mode === 'edit') {
      const a = state.admin;
      initialAvatarRef.current = normalizeAvatarPath(a.avatar);
      setForm({
        username: a.username,
        avatar: a.avatar ?? '',
        isActive: a.isActive ?? true,
        password: '',
      });
    } else {
      initialAvatarRef.current = '';
      setForm({ username: '', password: '', avatar: '', isActive: true });
    }
    setErrors({});
    setIsSubmitting(false);
    setIsUploading(false);
    setIsCleaningAvatar(false);
    setUploadError('');
    setShowPw(false);
  }, [state]);

  if (!state) return null;

  const editingId = state.mode === 'edit' ? state.admin.id : undefined;

  const validate = () => {
    const e: Partial<Record<keyof AdminFormData, string>> = {};
    if (!form.username.trim()) e.username = '用户名不能为空';
    if (!editingId && !form.password?.trim()) e.password = '密码不能为空';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const avatarPreview = form.avatar.trim();
  const avatarPreviewUrl = resolveUploadedFileUrl(avatarPreview);

  const deleteUploadedAvatar = async (avatarPath: string) => {
    await request('/upload/avatar', {
      method: 'DELETE',
      json: { path: avatarPath },
      silent: true,
    });
  };

  const cleanupTransientAvatar = async (
    avatarPath: string,
    preservedAvatarPath?: string,
  ) => {
    const normalizedAvatarPath = normalizeAvatarPath(avatarPath);
    const normalizedInitialAvatar = normalizeAvatarPath(
      initialAvatarRef.current,
    );
    const normalizedPreservedAvatar = normalizeAvatarPath(preservedAvatarPath);

    if (!normalizedAvatarPath) return;
    if (!isManagedUploadPath(normalizedAvatarPath)) return;
    if (normalizedAvatarPath === normalizedInitialAvatar) return;
    if (
      normalizedPreservedAvatar &&
      normalizedAvatarPath === normalizedPreservedAvatar
    )
      return;

    try {
      await deleteUploadedAvatar(normalizedAvatarPath);
    } catch (error) {
      console.error('Failed to delete transient avatar:', error);
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previousAvatar = normalizeAvatarPath(form.avatar);
    setUploadError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await request<UploadResponse>('/upload/avatar', {
        method: 'POST',
        formData,
        silent: true,
      });

      if (!result.success || !result.data?.path) {
        throw new Error(result.message || '头像上传失败');
      }

      await cleanupTransientAvatar(previousAvatar, result.data.path);
      setForm((prev) => ({ ...prev, avatar: result.data!.path }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '头像上传失败');
    } finally {
      setIsUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleClearAvatar = async () => {
    const currentAvatar = normalizeAvatarPath(form.avatar);
    setIsCleaningAvatar(true);
    try {
      await cleanupTransientAvatar(currentAvatar);
      setForm((prev) => ({ ...prev, avatar: '' }));
    } finally {
      setIsCleaningAvatar(false);
    }
  };

  const handleClose = async () => {
    const currentAvatar = normalizeAvatarPath(form.avatar);
    setIsCleaningAvatar(true);
    try {
      await cleanupTransientAvatar(currentAvatar);
      onClose();
    } finally {
      setIsCleaningAvatar(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="space-y-2 pr-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingId ? '编辑管理员' : '新增管理员'}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              {editingId
                ? '更新管理员账号信息、头像地址和启用状态。'
                : '填写基础信息后即可创建新的管理员账号。'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isUploading || isCleaningAvatar}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-7">
            <div className={fieldWrapCls}>
              <label className={labelCls}>
                用户名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={inputCls(errors.username)}
                placeholder="请输入用户名"
              />
              {errors.username && (
                <p className="text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            <div className={fieldWrapCls}>
              <label className={labelCls}>账号状态</label>
              <div className="flex items-center gap-3 pt-0.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  aria-pressed={form.isActive}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className="text-sm text-slate-600">
                  {form.isActive ? '启用' : '禁用'}
                </span>
              </div>
              <p className={hintCls}>
                {form.isActive
                  ? '启用后可正常登录并使用管理功能。'
                  : '禁用后该账号将无法登录后台。'}
              </p>
            </div>

            <div className={fieldWrapCls}>
              <label className={labelCls}>头像地址</label>
              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    {avatarPreviewUrl ? (
                      <img
                        src={avatarPreviewUrl}
                        alt="头像预览"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isUploading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Upload size={16} />
                        )}
                        {isUploading ? '上传中...' : '上传本地图片'}
                      </button>
                      {form.avatar ? (
                        <button
                          type="button"
                          onClick={handleClearAvatar}
                          disabled={isUploading || isCleaningAvatar}
                          className="text-sm text-slate-400 transition hover:text-slate-600"
                        >
                          清空头像
                        </button>
                      ) : null}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />

                    <p className={hintCls}>
                      支持
                      JPG、PNG、WEBP、GIF等常见图片格式，建议尺寸不超过5MB。上传成功后会自动填入头像地址输入框。
                    </p>
                    {uploadError ? (
                      <p className="text-xs text-red-500">{uploadError}</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={form.avatar}
                    onChange={(e) =>
                      setForm({ ...form, avatar: e.target.value })
                    }
                    className={inputCls()}
                    placeholder="http:// 或 https:// 开头的图片 URL，或上传后返回的路径"
                  />
                  <p className={`${hintCls} mt-2`}>
                    仍然支持手动填写历史头像路径，最终都会写入数据库的
                    <span className="mx-1 font-mono text-[11px] text-slate-600">
                      avatar
                    </span>
                    字段。
                  </p>
                </div>
              </div>
            </div>

            <div className={fieldWrapCls}>
              <label className={labelCls}>
                登录密码
                {!editingId && <span className="ml-1 text-red-500">*</span>}
                {editingId && (
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    （留空则保持当前密码）
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={`${inputCls(errors.password)} pr-11 ${showPw ? 'tracking-normal' : 'tracking-[-0.18em]'}`}
                  placeholder={
                    editingId ? '如需修改密码，请输入新密码' : '请输入登录密码'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPw ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {!errors.password && (
                <p className={hintCls}>
                  {editingId
                    ? '仅在需要重置密码时填写新密码。'
                    : '建议使用不少于 6 位的高强度密码。'}
                </p>
              )}
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || isUploading || isCleaningAvatar}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading || isCleaningAvatar}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                确认
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
