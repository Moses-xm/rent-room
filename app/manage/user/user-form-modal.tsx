'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { X, Eye, EyeOff, Loader2, Upload, ImagePlus } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { isManagedUploadPath, resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type UserFormData = {
  username: string;
  password?: string;
  avatar: string;
  phone: string;
  nickname: string;
  realname: string;
  gender: number;
  identity: number;
  isActive: boolean;
  email: string;
  wallet: number;
  payCode: string;
};

export type EditableUser = {
  id: number;
  username: string;
  avatar?: string | null;
  phone?: string | null;
  nickname?: string | null;
  realname?: string | null;
  gender: number;
  identity: number;
  isActive: boolean;
  email?: string | null;
  wallet: number;
  payCode: string;
};

export type ModalState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; user: EditableUser };

type Props = {
  state: ModalState;
  onClose: () => void;
  onSaved: (data: UserFormData, editingId?: number) => Promise<void>;
};

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const inputCls = (err?: string) =>
  `w-full h-[36px] px-3 border rounded-sm bg-card text-text text-body outline-none
   transition-[border-color,box-shadow]
   hover:border-text-disabled
   placeholder:text-text-subtle ${
     err
       ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_15%,transparent)]'
       : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
   }`;

const labelCls = 'block text-body-sm font-emphasis text-text-2 mb-1.5';
const hintCls = 'text-caption text-text-muted leading-relaxed';

type UploadResponse = {
  success: boolean;
  message?: string;
  data?: { path: string };
};

function normalizeAvatarPath(value: string | null | undefined) {
  return value?.trim() ?? '';
}

const DEFAULT_FORM: UserFormData = {
  username: '',
  password: '',
  avatar: '',
  phone: '',
  nickname: '',
  realname: '',
  gender: 3,
  identity: 1,
  isActive: true,
  email: '',
  wallet: 0,
  payCode: '000000',
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function UserFormModal({ state, onClose, onSaved }: Props) {
  const [form, setForm] = useState<UserFormData>(DEFAULT_FORM);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaningAvatar, setIsCleaningAvatar] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialAvatarRef = useRef('');

  useEffect(() => {
    if (!state) return;
    if (state.mode === 'edit') {
      const u = state.user;
      initialAvatarRef.current = normalizeAvatarPath(u.avatar);
      setForm({
        username: u.username,
        password: '',
        avatar: u.avatar ?? '',
        phone: u.phone ?? '',
        nickname: u.nickname ?? '',
        realname: u.realname ?? '',
        gender: u.gender,
        identity: u.identity,
        isActive: u.isActive,
        email: u.email ?? '',
        wallet: u.wallet,
        payCode: u.payCode,
      });
    } else {
      initialAvatarRef.current = '';
      setForm(DEFAULT_FORM);
    }
    setErrors({});
    setIsSubmitting(false);
    setIsUploading(false);
    setIsCleaningAvatar(false);
    setUploadError('');
    setShowPw(false);
  }, [state]);

  if (!state) return null;

  const isAdd = state.mode === 'add';
  const editingId = state.mode === 'edit' ? state.user.id : undefined;

  const validate = () => {
    const e: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.username.trim()) e.username = '用户名不能为空';
    if (isAdd && !form.password?.trim()) e.password = '密码不能为空';
    if (form.wallet < 0) e.wallet = '钱包余额不能为负';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const avatarPreviewUrl = resolveUploadedFileUrl(form.avatar.trim());

  const deleteUploadedAvatar = async (avatarPath: string) => {
    await request('/upload/avatar', { method: 'DELETE', json: { path: avatarPath }, silent: true });
  };

  const cleanupTransientAvatar = async (avatarPath: string, preservedAvatarPath?: string) => {
    const norm = normalizeAvatarPath(avatarPath);
    const initial = normalizeAvatarPath(initialAvatarRef.current);
    const preserved = normalizeAvatarPath(preservedAvatarPath);
    if (!norm) return;
    if (!isManagedUploadPath(norm)) return;
    if (norm === initial) return;
    if (preserved && norm === preserved) return;
    try { await deleteUploadedAvatar(norm); } catch (err) { console.error(err); }
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
      const result = await request<UploadResponse>('/upload/avatar', { method: 'POST', formData, silent: true });
      if (!result.success || !result.data?.path) throw new Error(result.message || '头像上传失败');
      await cleanupTransientAvatar(previousAvatar, result.data.path);
      setForm((prev) => ({ ...prev, avatar: result.data!.path }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '头像上传失败');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleClearAvatar = async () => {
    const currentAvatar = normalizeAvatarPath(form.avatar);
    setIsCleaningAvatar(true);
    try { await cleanupTransientAvatar(currentAvatar); setForm((prev) => ({ ...prev, avatar: '' })); }
    finally { setIsCleaningAvatar(false); }
  };

  const handleClose = async () => {
    const currentAvatar = normalizeAvatarPath(form.avatar);
    setIsCleaningAvatar(true);
    try { await cleanupTransientAvatar(currentAvatar); onClose(); }
    finally { setIsCleaningAvatar(false); }
  };

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try { await onSaved(form, editingId); onClose(); }
    catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const busy = isSubmitting || isUploading || isCleaningAvatar;

  const genderOptions = [
    { value: 1, label: '男' },
    { value: 2, label: '女' },
    { value: 3, label: '不愿透露' },
  ];

  const identityOptions = [
    { value: 1, label: '普通用户' },
    { value: 2, label: '房东' },
  ];

  return (
    <Modal open={!!state}>
      <div className="relative flex w-full max-w-140 flex-col overflow-hidden bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">

        {/* ── 头部 ── */}
        <div className="flex items-start justify-between border-b border-border-subtle px-6 py-5">
          <div className="pr-4">
            <h2 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-tight">
              {isAdd ? '新建用户' : '编辑用户信息'}
            </h2>
            <p className="text-body-sm text-text-muted mt-1">
              {isAdd ? '填写基础信息后即可创建新用户账号。' : '修改用户的基础资料、身份与账号状态。'}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={busy}
            className="w-7.5 h-7.5 rounded-sm grid place-items-center
                       text-text-muted hover:bg-surface-2 hover:text-text
                       transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── 表单 ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-5">

            {/* 用户名 */}
            <div className="space-y-1.5">
              <label className={labelCls}>
                用户名 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={inputCls(errors.username)}
                placeholder="请输入用户名"
              />
              {errors.username && <p className="text-caption text-danger">{errors.username}</p>}
            </div>

            {/* 头像 */}
            <div className="space-y-1.5">
              <label className={labelCls}>头像</label>
              <div className="flex items-start gap-3 rounded-sm border border-dashed border-border bg-surface p-4">
                <div className="w-13 h-13 rounded-full shrink-0 grid place-items-center overflow-hidden bg-primary-tint text-primary-dark border border-border">
                  {avatarPreviewUrl ? (
                    <img src={avatarPreviewUrl} alt="头像预览" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus size={18} className="text-text-disabled" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-3 text-body-sm rounded-sm font-medium
                                 bg-card border border-border text-text-2
                                 hover:bg-surface-2 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center gap-1.5"
                    >
                      {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {isUploading ? '上传中…' : '上传图片'}
                    </button>
                    {form.avatar && (
                      <button
                        type="button"
                        onClick={handleClearAvatar}
                        disabled={isUploading || isCleaningAvatar}
                        className="text-body-sm text-text-muted hover:text-text transition-colors disabled:opacity-40"
                      >
                        清空
                      </button>
                    )}
                  </div>
                  <p className={hintCls}>支持 JPG、PNG、WEBP、GIF，建议不超过 5 MB。</p>
                  {uploadError && <p className="text-caption text-danger">{uploadError}</p>}
                </div>
              </div>
              <input
                type="text"
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                className={inputCls()}
                placeholder="或粘贴图片 URL"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* 昵称 + 真实姓名 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>昵称</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                  className={inputCls()}
                  placeholder="用户昵称"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>真实姓名</label>
                <input
                  type="text"
                  value={form.realname}
                  onChange={(e) => setForm({ ...form, realname: e.target.value })}
                  className={inputCls()}
                  placeholder="真实姓名"
                />
              </div>
            </div>

            {/* 手机号 + 邮箱 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>手机号</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls()}
                  placeholder="手机号码"
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls()}
                  placeholder="电子邮箱"
                />
              </div>
            </div>

            {/* 性别 + 身份 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>性别</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: Number(e.target.value) })}
                  className={`${inputCls()} cursor-pointer`}
                >
                  {genderOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>身份</label>
                <select
                  value={form.identity}
                  onChange={(e) => setForm({ ...form, identity: Number(e.target.value) })}
                  className={`${inputCls()} cursor-pointer`}
                >
                  {identityOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 账号状态 */}
            <div className="space-y-1.5">
              <label className={labelCls}>账号状态</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  aria-pressed={form.isActive}
                  className={`relative inline-flex h-5.5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    form.isActive ? 'bg-primary' : 'bg-text-disabled'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      form.isActive ? 'translate-x-4.5' : 'translate-x-0.75'
                    }`}
                  />
                </button>
                <span className="text-body text-text-2">
                  {form.isActive ? '启用' : '禁用'}
                </span>
              </div>
              <p className={hintCls}>
                {form.isActive ? '启用后用户可正常登录使用平台功能。' : '禁用后该用户将无法登录平台。'}
              </p>
            </div>

            {/* 钱包余额 + 支付密码 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>钱包余额（元）</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.wallet}
                  onChange={(e) => setForm({ ...form, wallet: parseFloat(e.target.value) || 0 })}
                  className={inputCls(errors.wallet)}
                  placeholder="0.00"
                />
                {errors.wallet && <p className="text-caption text-danger">{errors.wallet}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>支付密码</label>
                <input
                  type="text"
                  value={form.payCode}
                  onChange={(e) => setForm({ ...form, payCode: e.target.value })}
                  className={inputCls()}
                  placeholder="6 位数字密码"
                  maxLength={10}
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <label className={labelCls}>
                {isAdd ? '登录密码' : '重置密码'}
                {isAdd
                  ? <span className="ml-1 text-danger">*</span>
                  : <span className="ml-1 text-caption font-normal text-text-muted">（留空则保持当前密码）</span>
                }
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${inputCls(errors.password)} pr-10 ${showPw ? '' : 'tracking-[-0.15em]'}`}
                  placeholder={isAdd ? '请输入登录密码' : '如需重置密码，请输入新密码'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPw ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
              {errors.password
                ? <p className="text-caption text-danger">{errors.password}</p>
                : <p className={hintCls}>{isAdd ? '建议使用不少于 6 位的高强度密码。' : '仅在需要重置密码时填写新密码。'}</p>
              }
            </div>

          </div>

          {/* ── 底部按钮 ── */}
          <div className="border-t border-border-subtle px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="h-8.5 px-3.5 text-body rounded-sm font-medium
                         bg-card border border-border text-text-2
                         hover:bg-surface-2 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-8.5 px-3.5 text-body rounded-sm font-medium
                         bg-primary text-white hover:bg-primary-dark transition-colors
                         flex items-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              {isAdd ? '创建账号' : '保存修改'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
