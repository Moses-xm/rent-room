'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { toast } from 'sonner';
import {
  ArrowLeft, ChevronRight, Pencil, Eye, EyeOff, User, Phone,
  MapPin, Wallet, ShieldCheck, Calendar, RefreshCw,
} from 'lucide-react';
import { StatusPill } from '@/components/StatusPill';
import UserFormModal, { type ModalState, type UserFormData } from '../user-form-modal';
import { fmtDateTime } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type UserDetail = {
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
  province?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  wallet: number;
  payCode: string;
  createdAt: string;
  updatedAt: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name?.trim().charAt(0).toUpperCase() || '?';
}

function getGenderLabel(g: number) {
  return g === 1 ? '男' : g === 2 ? '女' : '不愿透露';
}

/* ─── Field row ───────────────────────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-3 border-b border-border-subtle last:border-0">
      <span className="text-body-sm text-text-muted pt-px">{label}</span>
      <span className="text-body text-text">{children}</span>
    </div>
  );
}

/* ─── Section card ────────────────────────────────────────────────────────── */
function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
        <span className="text-text-disabled">{icon}</span>
        <span className="text-body-sm font-emphasis text-text-2">{title}</span>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [showPayCode, setShowPayCode] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request<{ success: boolean; data: UserDetail }>(`/manage/user/${userId}`);
      if (res.success) setUser(res.data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleSaved = async (data: UserFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/user/${editingId}`, { method: 'PUT', json: data });
      toast.success('用户信息修改成功');
      await fetchUser();
    }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-4">
        {/* breadcrumb + action */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-sm skeleton-shimmer opacity-50 shrink-0" />
            <div className="h-4 w-44 rounded skeleton-shimmer opacity-50" />
          </div>
          <div className="h-8 w-20 rounded-sm skeleton-shimmer shrink-0" />
        </div>
        {/* profile card */}
        <div className="bg-card border border-border rounded-md shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full skeleton-shimmer-warm shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-28 rounded skeleton-shimmer" />
                <div className="h-5 w-14 rounded-full skeleton-shimmer opacity-70" />
                <div className="h-5 w-12 rounded-full skeleton-shimmer opacity-70" />
              </div>
              <div className="h-3.5 w-40 rounded skeleton-shimmer opacity-50" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-12 rounded skeleton-shimmer opacity-50" />
                <div className="h-4 w-16 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
        {/* two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {[6, 3].map((fieldCount, i) => (
              <div key={i} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                  <div className="h-4 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="px-5 divide-y divide-border-subtle">
                  {Array.from({ length: fieldCount }).map((_, j) => (
                    <div key={j} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                      <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                      <div className={`h-3.5 rounded skeleton-shimmer ${j % 2 === 0 ? 'w-24' : 'w-32'}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[2, 2].map((fieldCount, i) => (
              <div key={i} className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                  <div className="h-4 w-20 rounded skeleton-shimmer" />
                </div>
                <div className="px-5 divide-y divide-border-subtle">
                  {Array.from({ length: fieldCount }).map((_, j) => (
                    <div key={j} className="grid grid-cols-[7rem_1fr] gap-3 py-3">
                      <div className="h-3.5 w-14 rounded skeleton-shimmer opacity-50" />
                      <div className="h-3.5 w-20 rounded skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="h-16 rounded-md skeleton-shimmer opacity-30" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <User size={40} className="opacity-25" />
        <p className="text-body">用户不存在或已被删除</p>
        <button
          onClick={() => router.push('/manage/user')}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors"
        >
          返回用户管理
        </button>
      </div>
    );
  }

  const avatarUrl = resolveUploadedFileUrl(user.avatar ?? '');
  const displayName = user.nickname || user.username;
  const locationParts = [user.province, user.city, user.district, user.address].filter(Boolean);

  return (
    <div className="space-y-4">

      {/* ── 面包屑 + 操作 ── */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1.5 text-body-sm min-w-0">
          <button
            onClick={() => router.back()}
            title="返回"
            className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={17} />
          </button>
          <span className="text-text-disabled shrink-0">/</span>
          <Link href="/manage/user" className="text-text-muted hover:text-text transition-colors shrink-0">
            用户管理
          </Link>
          <ChevronRight size={13} className="text-text-disabled shrink-0" />
          <span className="text-text font-emphasis truncate">{displayName}</span>
        </nav>
        <button
          onClick={() => setModalState({ mode: 'edit', user })}
          className="h-8 px-3 text-body-sm rounded-sm font-medium
                     bg-primary text-white hover:bg-primary-dark transition-colors
                     flex items-center gap-1.5 shrink-0"
        >
          <Pencil size={12} strokeWidth={2.5} />
          编辑信息
        </button>
      </div>

      {/* ── 用户 profile 卡片 ── */}
      <div className="bg-card border border-border rounded-md shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full grid place-items-center overflow-hidden shrink-0 bg-primary-tint text-primary-dark text-lg font-semibold border border-border">
            {avatarUrl
              ? <img src={avatarUrl} alt={user.username} className="h-full w-full object-cover" />
              : initials(displayName)
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[17px] font-semibold text-text leading-tight">{displayName}</span>
              <StatusPill variant={user.identity === 2 ? 'warning' : 'info'}>
                {user.identity === 2 ? '房东' : '普通用户'}
              </StatusPill>
              <StatusPill variant={user.isActive ? 'success' : 'muted'}>
                {user.isActive ? '正常' : '停用'}
              </StatusPill>
            </div>
            <p className="text-body-sm text-text-muted font-mono mt-0.5">
              @{user.username}
              <span className="mx-2 text-text-disabled">·</span>
              UID {user.id}
            </p>
          </div>
        </div>

        {/* 快速指标行 */}
        <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-caption text-text-muted mb-0.5">真实姓名</p>
            <p className="text-body text-text font-medium">{user.realname || '—'}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-0.5">性别</p>
            <p className="text-body text-text font-medium">{getGenderLabel(user.gender)}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-0.5">钱包余额</p>
            <p className="text-body text-text font-medium font-mono">¥ {user.wallet.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-0.5">注册时间</p>
            <p className="text-body text-text font-medium font-mono">{fmtDateTime(user.createdAt).slice(0, 10)}</p>
          </div>
        </div>
      </div>

      {/* ── 两栏布局 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 左栏（主要信息）*/}
        <div className="lg:col-span-2 space-y-4">

          {/* 基本信息 */}
          <Section title="基本信息" icon={<User size={14} />}>
            <Field label="用户名">{user.username}</Field>
            <Field label="昵称">{user.nickname || '—'}</Field>
            <Field label="真实姓名">{user.realname || '—'}</Field>
            <Field label="性别">{getGenderLabel(user.gender)}</Field>
            <Field label="身份">
              <StatusPill variant={user.identity === 2 ? 'warning' : 'info'}>
                {user.identity === 2 ? '房东' : '普通用户'}
              </StatusPill>
            </Field>
            <Field label="账号状态">
              <StatusPill variant={user.isActive ? 'success' : 'muted'}>
                {user.isActive ? '正常使用' : '已停用'}
              </StatusPill>
            </Field>
          </Section>

          {/* 联系方式 */}
          <Section title="联系方式" icon={<Phone size={14} />}>
            <Field label="手机号">
              <span className="font-mono">{user.phone || '—'}</span>
            </Field>
            <Field label="邮箱">
              <span className="font-mono">{user.email || '—'}</span>
            </Field>
            <Field label="所在地区">
              {locationParts.length > 0
                ? <span className="flex items-center gap-1.5"><MapPin size={12} className="text-text-muted shrink-0" />{locationParts.join(' ')}</span>
                : '—'
              }
            </Field>
          </Section>

        </div>

        {/* 右栏（账户 & 时间）*/}
        <div className="space-y-4">

          {/* 账户信息 */}
          <Section title="账户信息" icon={<Wallet size={14} />}>
            <Field label="钱包余额">
              <span className="font-mono font-medium">¥ {user.wallet.toFixed(2)}</span>
            </Field>
            <Field label="支付密码">
              <span className="flex items-center gap-2">
                <span className="font-mono tracking-widest">
                  {showPayCode ? user.payCode : '••••••'}
                </span>
                <button
                  onClick={() => setShowPayCode((v) => !v)}
                  className="text-text-disabled hover:text-text-muted transition-colors"
                  title={showPayCode ? '隐藏' : '查看'}
                >
                  {showPayCode ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </span>
            </Field>
          </Section>

          {/* 时间记录 */}
          <Section title="时间记录" icon={<Calendar size={14} />}>
            <Field label="注册时间">
              <span className="font-mono text-body-sm">{fmtDateTime(user.createdAt)}</span>
            </Field>
            <Field label="最后修改">
              <span className="flex items-center gap-1.5 font-mono text-body-sm">
                <RefreshCw size={11} className="text-text-muted shrink-0" />
                {fmtDateTime(user.updatedAt)}
              </span>
            </Field>
          </Section>

          {/* 账号安全提示 */}
          <div className="bg-surface border border-border-subtle rounded-md px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={15} className="text-text-disabled mt-px shrink-0" />
              <p className="text-caption text-text-muted leading-relaxed">
                支付密码仅在用户进行钱包相关操作时使用，管理员可在编辑页修改。
              </p>
            </div>
          </div>

        </div>
      </div>

      <UserFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
