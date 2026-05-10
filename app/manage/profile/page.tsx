'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ImagePlus, Loader2, LockKeyhole, Save, Upload, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { resolveUploadedFileUrl, isManagedUploadPath } from '@/lib/upload-path';
import { clearManageToken, MANAGE_HOME_PATH, MANAGE_LOGIN_PATH, setManageProfile } from '@/utils/manage-auth';
import { request } from '@/utils/request';

type ManageProfileResponse = {
  success: boolean;
  message?: string;
  data: { username: string; avatar?: string | null };
};

type UploadResponse = {
  success: boolean;
  message?: string;
  data?: { path: string };
};

function normalizeAvatarPath(value: string | null | undefined) {
  return value?.trim() ?? '';
}

/* ─── 共享样式 ────────────────────────────────────────────── */
const inputCls =
  'w-full h-[36px] px-3 border border-border rounded-sm bg-card text-text text-body outline-none ' +
  'transition-[border-color,box-shadow] hover:border-text-disabled placeholder:text-text-subtle ' +
  'focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]';

const inputReadonlyCls =
  'w-full h-[36px] px-3 border border-border-subtle rounded-sm bg-surface text-text-muted text-body outline-none cursor-default';

const labelCls = 'block text-body-sm font-emphasis text-text-2 mb-1.5';
const hintCls = 'text-caption text-text-muted leading-relaxed mt-1.5';

/* ─── Page ────────────────────────────────────────────────── */
export default function ManageProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaningAvatar, setIsCleaningAvatar] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const savedAvatarRef = useRef('');
  const currentAvatarRef = useRef('');

  const avatarPreviewUrl = resolveUploadedFileUrl(avatar);

  useEffect(() => { currentAvatarRef.current = avatar; }, [avatar]);

  useEffect(() => {
    let cancelled = false;
    request<ManageProfileResponse>('/manage/profile')
      .then((res) => {
        if (cancelled) return;
        const nextAvatar = normalizeAvatarPath(res.data.avatar);
        savedAvatarRef.current = nextAvatar;
        currentAvatarRef.current = nextAvatar;
        setUsername(res.data.username);
        setAvatar(nextAvatar);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : '个人资料加载失败');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      const transient = normalizeAvatarPath(currentAvatarRef.current);
      if (transient && transient !== normalizeAvatarPath(savedAvatarRef.current) && isManagedUploadPath(transient)) {
        void request('/upload/avatar', { method: 'DELETE', json: { path: transient } }).catch(console.error);
      }
    };
  }, []);

  const deleteUploadedAvatar = (path: string) =>
    request('/upload/avatar', { method: 'DELETE', json: { path } });

  const cleanupTransientAvatar = async (avatarPath: string, preservedAvatarPath?: string) => {
    const norm = normalizeAvatarPath(avatarPath);
    if (!norm || !isManagedUploadPath(norm)) return;
    if (norm === normalizeAvatarPath(savedAvatarRef.current)) return;
    if (preservedAvatarPath && norm === normalizeAvatarPath(preservedAvatarPath)) return;
    try { await deleteUploadedAvatar(norm); } catch (err) { console.error(err); }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previousAvatar = normalizeAvatarPath(avatar);
    setUploadError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await request<UploadResponse>('/upload/avatar', { method: 'POST', formData });
      if (!result.success || !result.data?.path) throw new Error(result.message || '头像上传失败');
      await cleanupTransientAvatar(previousAvatar, result.data.path);
      currentAvatarRef.current = result.data.path;
      setAvatar(result.data.path);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '头像上传失败');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleClearAvatar = async () => {
    const cur = normalizeAvatarPath(avatar);
    setIsCleaningAvatar(true);
    try { await cleanupTransientAvatar(cur); currentAvatarRef.current = ''; setAvatar(''); setUploadError(''); }
    finally { setIsCleaningAvatar(false); }
  };

  const validate = () => {
    const pw = password.trim();
    const cpw = confirmPassword.trim();
    if (!pw && !cpw) return true;
    if (pw.length < 6) { toast.error('新密码至少需要 6 位'); return false; }
    if (pw !== cpw) { toast.error('两次输入的密码不一致'); return false; }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    const nextPassword = password.trim();
    const shouldLogout = Boolean(nextPassword);
    setSaving(true);
    try {
      const res = await request<ManageProfileResponse>('/manage/profile', {
        method: 'PUT',
        json: { avatar, ...(shouldLogout ? { password: nextPassword } : {}) },
      });
      const nextAvatar = normalizeAvatarPath(res.data.avatar);
      savedAvatarRef.current = nextAvatar;
      currentAvatarRef.current = nextAvatar;
      setUsername(res.data.username);
      setAvatar(nextAvatar);
      setPassword('');
      setConfirmPassword('');
      setManageProfile(nextAvatar ? { username: res.data.username, avatar: nextAvatar } : { username: res.data.username });
      if (shouldLogout) {
        toast.success('密码已更新，请重新登录');
        clearManageToken();
        router.replace(MANAGE_LOGIN_PATH);
        return;
      }
      toast.success(res.message || '个人资料已更新');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '个人资料更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) { router.back(); return; }
    router.push(MANAGE_HOME_PATH);
  };

  const busy = saving || isUploading || isCleaningAvatar;

  /* ── 加载骨架 ── */
  if (loading) {
    return (
      <div className="space-y-5">
        {/* header */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-32 rounded skeleton-shimmer" />
            <div className="h-4 w-64 rounded skeleton-shimmer opacity-60" />
          </div>
          <div className="h-7 w-20 rounded skeleton-shimmer opacity-50 shrink-0" />
        </div>
        {/* cards */}
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          {/* avatar card */}
          <div className="bg-card border border-border rounded shadow-sm">
            <div className="px-5.5 py-4.5 border-b border-border-subtle space-y-1.5">
              <div className="h-5 w-24 rounded skeleton-shimmer" />
              <div className="h-3 w-56 rounded skeleton-shimmer opacity-50" />
            </div>
            <div className="px-5.5 py-5 space-y-4">
              <div className="rounded-sm border border-dashed border-border bg-surface p-4 flex items-start gap-4">
                <div className="w-15 h-15 rounded-full skeleton-shimmer-warm shrink-0" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-7 w-24 rounded-sm skeleton-shimmer" />
                  <div className="h-3 w-48 rounded skeleton-shimmer opacity-50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-70" />
                <div className="h-9 w-full rounded-sm skeleton-shimmer opacity-40" />
                <div className="h-3 w-52 rounded skeleton-shimmer opacity-30" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-70" />
                <div className="h-9 w-full rounded-sm skeleton-shimmer opacity-40" />
              </div>
            </div>
          </div>
          {/* security card */}
          <div className="bg-card border border-border rounded shadow-sm">
            <div className="px-5.5 py-4.5 border-b border-border-subtle space-y-1.5">
              <div className="h-5 w-24 rounded skeleton-shimmer" />
              <div className="h-3 w-48 rounded skeleton-shimmer opacity-50" />
            </div>
            <div className="px-5.5 py-5 space-y-4">
              <div className="space-y-1.5">
                <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-70" />
                <div className="h-9 w-full rounded-sm skeleton-shimmer opacity-40" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3.5 w-20 rounded skeleton-shimmer opacity-70" />
                <div className="h-9 w-full rounded-sm skeleton-shimmer opacity-40" />
              </div>
              <div className="h-20 w-full rounded-sm skeleton-shimmer opacity-30" />
            </div>
          </div>
        </div>
        {/* buttons */}
        <div className="flex justify-end gap-2">
          <div className="h-8.5 w-16 rounded-sm skeleton-shimmer opacity-50" />
          <div className="h-8.5 w-24 rounded-sm skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            个人资料
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            维护当前管理员的头像与登录密码，保存后顶栏信息立即同步。
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-sm bg-primary-tint px-3 py-1.5 text-body-sm font-medium text-primary-dark shrink-0">
          <UserRound size={13} />
          {username}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">

          {/* ── 头像信息卡 ── */}
          <div className="bg-card border border-border rounded shadow-sm">
            <div className="px-5.5 py-4.5 border-b border-border-subtle">
              <div className="font-(family-name:--typeface-display) text-h3 font-heading text-text flex items-baseline gap-2.5">
                <span className="inline-block w-0.75 h-3.5 rounded-sm bg-primary translate-y-0.5 shrink-0" />
                头像信息
              </div>
              <div className="text-xs text-text-muted mt-0.75">
                支持上传新头像，顶栏会自动同步；清空后回退为用户名首字母。
              </div>
            </div>
            <div className="px-5.5 py-5 space-y-4">
              {/* 预览 + 上传 */}
              <div className="flex items-start gap-4 rounded-sm border border-dashed border-border bg-surface p-4">
                <div className="w-15 h-15 rounded-full shrink-0 grid place-items-center overflow-hidden bg-primary-tint text-primary-dark border border-border text-[18px] font-semibold">
                  {avatarPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreviewUrl} alt="头像预览" className="h-full w-full object-cover" />
                  ) : (
                    username.trim().charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploading || isCleaningAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-3 text-body-sm rounded-sm font-medium
                                 bg-card border border-border text-text-2
                                 hover:bg-surface-2 transition-colors
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center gap-1.5"
                    >
                      {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {isUploading ? '上传中…' : '上传头像'}
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        disabled={isUploading || isCleaningAvatar}
                        onClick={handleClearAvatar}
                        className="text-body-sm text-text-muted hover:text-text transition-colors disabled:opacity-40"
                      >
                        {isCleaningAvatar ? '清理中…' : '清空头像'}
                      </button>
                    )}
                  </div>
                  <p className="text-caption text-text-muted">支持 JPG、PNG、WEBP、GIF，建议不超过 5 MB。</p>
                  {uploadError && <p className="text-caption text-danger">{uploadError}</p>}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarUpload} className="hidden" />

              {/* 用户名（只读） */}
              <div>
                <label htmlFor="username" className={labelCls}>用户名</label>
                <input id="username" value={username} readOnly className={inputReadonlyCls} />
                <p className={hintCls}>当前版本暂不开放用户名自助修改，如需调整可在管理员管理页处理。</p>
              </div>

              {/* 头像地址 */}
              <div>
                <label htmlFor="avatar" className={labelCls}>头像地址</label>
                <div className="relative">
                  <input
                    id="avatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className={`${inputCls} pr-9`}
                    placeholder="可直接填写历史头像路径或完整图片地址"
                  />
                  <ImagePlus className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled" size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* ── 安全设置卡 ── */}
          <div className="bg-card border border-border rounded shadow-sm">
            <div className="px-5.5 py-4.5 border-b border-border-subtle">
              <div className="font-(family-name:--typeface-display) text-h3 font-heading text-text flex items-baseline gap-2.5">
                <span className="inline-block w-0.75 h-3.5 rounded-sm bg-primary translate-y-0.5 shrink-0" />
                安全设置
              </div>
              <div className="text-xs text-text-muted mt-0.75">
                修改登录密码后需重新登录；留空则保持当前密码不变。
              </div>
            </div>
            <div className="px-5.5 py-5 space-y-4">
              {/* 新密码 */}
              <div>
                <label htmlFor="password" className={labelCls}>新密码</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls} pr-10 ${showPassword ? '' : 'tracking-[-0.15em]'}`}
                    placeholder="请输入新的登录密码"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                    {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              {/* 确认密码 */}
              <div>
                <label htmlFor="confirmPassword" className={labelCls}>确认新密码</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputCls} pr-10 ${showConfirmPassword ? '' : 'tracking-[-0.15em]'}`}
                    placeholder="请再次输入新的登录密码"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                    {showConfirmPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              {/* 提示框 */}
              <div className="rounded-sm bg-surface border border-border-subtle px-4 py-3 text-body-sm text-text-muted">
                <div className="flex items-center gap-2 font-medium text-text-2 mb-1">
                  <LockKeyhole size={13} className="text-primary" />
                  密码更新提示
                </div>
                建议使用不少于 6 位的新密码，并定期更换以保障账户安全。
              </div>
            </div>
          </div>
        </div>

        {/* ── 底部按钮 ── */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={handleCancel}
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
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? '保存中…' : '保存更改'}
          </button>
        </div>
      </form>
    </div>
  );
}
