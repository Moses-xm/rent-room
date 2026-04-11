'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LockKeyhole,
  Save,
  Upload,
  UserRound,
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { resolveUploadedFileUrl, isManagedUploadPath } from '@/lib/upload-path';
import {
  clearManageToken,
  MANAGE_HOME_PATH,
  MANAGE_LOGIN_PATH,
  setManageProfile,
} from '@/utils/manage-auth';
import { request } from '@/utils/request';

type ManageProfileResponse = {
  success: boolean;
  message?: string;
  data: {
    username: string;
    avatar?: string | null;
  };
};

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

  useEffect(() => {
    currentAvatarRef.current = avatar;
  }, [avatar]);

  useEffect(() => {
    let cancelled = false;

    request<ManageProfileResponse>('/manage/profile')
      .then((response) => {
        if (cancelled) return;

        const nextAvatar = normalizeAvatarPath(response.data.avatar);
        savedAvatarRef.current = nextAvatar;
        currentAvatarRef.current = nextAvatar;
        setUsername(response.data.username);
        setAvatar(nextAvatar);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : '个人资料加载失败');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      const transientAvatar = normalizeAvatarPath(currentAvatarRef.current);

      if (
        transientAvatar &&
        transientAvatar !== normalizeAvatarPath(savedAvatarRef.current) &&
        isManagedUploadPath(transientAvatar)
      ) {
        void request('/upload/avatar', {
          method: 'DELETE',
          json: { path: transientAvatar },
        }).catch((cleanupError) => {
          console.error('Failed to clean up transient avatar:', cleanupError);
        });
      }
    };
  }, []);

  const deleteUploadedAvatar = async (avatarPath: string) => {
    await request('/upload/avatar', {
      method: 'DELETE',
      json: { path: avatarPath },
    });
  };

  const cleanupTransientAvatar = async (
    avatarPath: string,
    preservedAvatarPath?: string,
  ) => {
    const normalizedAvatarPath = normalizeAvatarPath(avatarPath);
    const normalizedSavedAvatar = normalizeAvatarPath(savedAvatarRef.current);
    const normalizedPreservedAvatar = normalizeAvatarPath(preservedAvatarPath);

    if (!normalizedAvatarPath) return;
    if (!isManagedUploadPath(normalizedAvatarPath)) return;
    if (normalizedAvatarPath === normalizedSavedAvatar) return;
    if (
      normalizedPreservedAvatar &&
      normalizedAvatarPath === normalizedPreservedAvatar
    ) {
      return;
    }

    try {
      await deleteUploadedAvatar(normalizedAvatarPath);
    } catch (error) {
      console.error('Failed to delete transient avatar:', error);
    }
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

      const result = await request<UploadResponse>('/upload/avatar', {
        method: 'POST',
        formData,
      });

      if (!result.success || !result.data?.path) {
        throw new Error(result.message || '头像上传失败');
      }

      await cleanupTransientAvatar(previousAvatar, result.data.path);
      currentAvatarRef.current = result.data.path;
      setAvatar(result.data.path);
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
    const currentAvatar = normalizeAvatarPath(avatar);
    setIsCleaningAvatar(true);

    try {
      await cleanupTransientAvatar(currentAvatar);
      currentAvatarRef.current = '';
      setAvatar('');
      setUploadError('');
    } finally {
      setIsCleaningAvatar(false);
    }
  };

  const validate = () => {
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword && !trimmedConfirmPassword) {
      return true;
    }

    if (trimmedPassword.length < 6) {
      toast.error('新密码至少需要 6 位');
      return false;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      toast.error('两次输入的密码不一致');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    const nextPassword = password.trim();
    const shouldLogoutAfterSave = Boolean(nextPassword);
    setSaving(true);

    try {
      const response = await request<ManageProfileResponse>('/manage/profile', {
        method: 'PUT',
        json: {
          avatar,
          ...(shouldLogoutAfterSave ? { password: nextPassword } : {}),
        },
      });

      const nextAvatar = normalizeAvatarPath(response.data.avatar);
      const nextProfile = nextAvatar
        ? { username: response.data.username, avatar: nextAvatar }
        : { username: response.data.username };

      savedAvatarRef.current = nextAvatar;
      currentAvatarRef.current = nextAvatar;
      setUsername(response.data.username);
      setAvatar(nextAvatar);
      setPassword('');
      setConfirmPassword('');
      setManageProfile(nextProfile);

      if (shouldLogoutAfterSave) {
        toast.success('密码已更新，请重新登录');
        clearManageToken();
        router.replace(MANAGE_LOGIN_PATH);
        return;
      }

      toast.success(response.message || '个人资料已更新');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '个人资料更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(MANAGE_HOME_PATH);
  };

  if (loading) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="space-y-2">
            <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
            <div className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Toaster position="top-right" richColors />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            在这里维护当前管理员的头像与登录密码，保存后顶栏信息会立即同步更新。
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary">
          <UserRound className="h-4 w-4" />
          当前账号：{username}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">头像信息</h2>
              <p className="text-sm leading-6 text-slate-500">
                支持上传新的管理员头像，也可以清空头像，顶栏会自动回退为用户名首字母。
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col gap-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-start">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                  {avatarPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreviewUrl}
                      alt="头像预览"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-2xl font-bold text-white">
                      {username.trim().charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isUploading || isCleaningAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUploading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {isUploading ? '上传中...' : '上传头像'}
                    </button>

                    {avatar ? (
                      <button
                        type="button"
                        disabled={isUploading || isCleaningAvatar}
                        onClick={handleClearAvatar}
                        className="text-sm font-medium text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isCleaningAvatar ? '清理中...' : '清空头像'}
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

                  <p className="text-xs leading-5 text-slate-500">
                    支持 JPG、PNG、WEBP、GIF 等常见图片格式，建议文件不超过
                    5MB。
                  </p>
                  {uploadError ? (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="mb-5 block text-sm font-medium text-slate-700"
                >
                  用户名
                </label>
                <input
                  id="username"
                  value={username}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  当前版本暂不开放用户名自助修改，如需调整可在管理员管理页处理。
                </p>
              </div>

              <div>
                <label
                  htmlFor="avatar"
                  className="mb-5 block text-sm font-medium text-slate-700"
                >
                  头像地址
                </label>
                <div className="relative">
                  <input
                    id="avatar"
                    value={avatar}
                    onChange={(event) => setAvatar(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100"
                    placeholder="可直接填写历史头像路径或完整图片地址"
                  />
                  <ImagePlus className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">安全设置</h2>
              <p className="text-sm leading-6 text-slate-500">
                如需修改登录密码，请输入新密码并重复确认；留空则保持当前密码不变。
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="mb-5 block text-sm font-medium text-slate-700"
                >
                  新密码
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100 ${showPassword ? 'tracking-normal' : 'tracking-[-0.18em]'}`}
                    placeholder="请输入新的登录密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-5 block text-sm font-medium text-slate-700"
                >
                  确认新密码
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-100 ${showConfirmPassword ? 'tracking-normal' : 'tracking-[-0.18em]'}`}
                    placeholder="请再次输入新的登录密码"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                <div className="mb-2 flex items-center gap-2 font-medium text-slate-700">
                  <LockKeyhole className="h-4 w-4 text-primary" />
                  密码更新提示
                </div>
                <p>为了保证账户安全，建议使用不少于 6 位的新密码，并定期更换。</p>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={saving || isUploading || isCleaningAvatar}
            onClick={handleCancel}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving || isUploading || isCleaningAvatar}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-100 transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? '保存中...' : '保存更改'}
          </button>
        </div>
      </form>
    </div>
  );
}
