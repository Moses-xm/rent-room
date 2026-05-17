'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Search, Home, User, Building2, Calendar,
  FileText, ChevronDown, X, Eye, CreditCard, CheckCircle2,
} from 'lucide-react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { Modal } from '@/components/Modal';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import { fmtDate } from '@/utils/format';
import type { ContractItem } from './page';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type UserOption = { id: number; username: string; nickname: string | null; avatar: string | null; wallet: number; identity: number };
type RoomOption = {
  id: number; name: string; roomCode: string; cover: string;
  price: number; pledge: number; pay: number; minTenancy: number;
  publisher: { id: number; username: string; nickname: string | null; avatar: string | null };
  community: { name: string; district: string };
};
type Period = { start: string; end: string };

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function generatePeriods(onlineTime: Date, offlineTime: Date, payMonths: number): Period[] {
  const periods: Period[] = [];
  let current = new Date(onlineTime);
  while (current < offlineTime) {
    const end = addMonths(current, payMonths);
    periods.push({ start: current.toISOString(), end: end.toISOString() });
    current = end;
  }
  return periods;
}

/* ─── Searchable dropdown ─────────────────────────────────────────────────── */
function SearchDropdown<T extends { id: number }>({
  label, placeholder, options, value, onSelect, onClear, renderOption, renderSelected, searchKey,
  disabled,
}: {
  label: string;
  placeholder: string;
  options: T[];
  value: T | null;
  onSelect: (item: T) => void;
  onClear: () => void;
  renderOption: (item: T) => React.ReactNode;
  renderSelected: (item: T) => React.ReactNode;
  searchKey: (item: T) => string;
  disabled?: boolean;
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => options.filter((o) => searchKey(o).toLowerCase().includes(search.toLowerCase())),
    [options, search, searchKey],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <label className="block text-body-sm font-emphasis text-text mb-1.5">{label}</label>
      {value ? (
        <div className="flex items-center justify-between h-11 px-3 border border-primary bg-primary-tint rounded-xl">
          <div className="flex-1 min-w-0">{renderSelected(value)}</div>
          {!disabled && (
            <button onClick={onClear} className="shrink-0 ml-2 w-5 h-5 rounded-full bg-slate-200 grid place-items-center hover:bg-slate-300 transition-colors cursor-pointer">
              <X size={11} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between h-11 px-3 border border-border rounded-xl text-text-muted hover:border-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-card"
        >
          <span className="text-body">{placeholder}</span>
          <ChevronDown size={14} className="opacity-60" />
        </button>
      )}

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                autoFocus
                type="text"
                placeholder="搜索..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-surface border border-border rounded-lg text-body-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-body-sm text-text-muted">无匹配结果</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item); setOpen(false); setSearch(''); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  {renderOption(item)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Contract Preview ─────────────────────────────────────────────────────── */
function ContractPreview({
  room, tenant, onlineTime, tenancy, isEdit, editingContract,
}: {
  room: RoomOption | null;
  tenant: UserOption | null;
  onlineTime: string;
  tenancy: number;
  isEdit: boolean;
  editingContract: ContractItem | null;
}) {
  if (!room || !tenant || !onlineTime || !tenancy) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Eye size={32} className="text-text-disabled mb-3" />
        <p className="text-body text-text-muted">填写左侧信息后，合同预览将在此处显示</p>
      </div>
    );
  }

  // 追加 T00:00:00（无 Z）以解析为本地午夜，避免纯日期字符串被 JS 解析为 UTC 导致跨时区差一天
  const onlineDate  = new Date(onlineTime + 'T00:00:00');
  const offlineDate = addMonths(onlineDate, tenancy);
  const pledgeAmount = room.price * room.pledge;
  const fee = room.price * room.pay;
  const totalAmount = pledgeAmount + fee;
  const allPeriods = generatePeriods(onlineDate, offlineDate, room.pay);
  const totalPeriods = allPeriods.length;

  const paidCount = isEdit && editingContract
    ? (JSON.parse(editingContract.paidPeriod) as Period[]).length
    : 1;
  const paidPeriods   = allPeriods.slice(0, paidCount);
  const payingPeriods = allPeriods.slice(paidCount);

  return (
    <div className="space-y-4">
      {/* 合同头部 */}
      <div className="bg-gradient-to-br from-primary-tint to-blue-50 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-primary" />
          <h3 className="text-body font-semibold text-primary">租赁合同预览</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-body-sm">
          <div className="col-span-2">
            <p className="text-text-muted mb-0.5">房源</p>
            <p className="font-emphasis text-text">{room.name}</p>
            <p className="text-tiny text-text-muted font-mono">{room.roomCode}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5">租客</p>
            <p className="font-emphasis text-text">{tenant.nickname || tenant.username}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5">房东</p>
            <p className="font-emphasis text-text">{room.publisher.nickname || room.publisher.username}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5">开始时间</p>
            <p className="font-mono text-text">{fmtDate(onlineDate.toISOString())}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5">结束时间</p>
            <p className="font-mono text-primary font-medium">{fmtDate(offlineDate.toISOString())}</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5">租期</p>
            <p className="text-text font-medium">{tenancy} 个月</p>
          </div>
          <div>
            <p className="text-text-muted mb-0.5">付款方式</p>
            <p className="text-text">押 {room.pledge} 付 {room.pay}</p>
          </div>
        </div>
      </div>

      {/* 费用明细 */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-body-sm font-semibold text-text">费用明细</p>
        <div className="space-y-2 text-body-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">押金（{room.pledge} 个月）</span>
            <span className="font-mono font-medium text-text">¥{pledgeAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">每期房租（{room.pay} 个月 × ¥{room.price.toFixed(0)}/月）</span>
            <span className="font-mono font-medium text-text">¥{fee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">总期数</span>
            <span className="text-text">{totalPeriods} 期</span>
          </div>
          <div className="h-px bg-border" />
          {!isEdit && (
            <div className="flex justify-between text-body font-semibold">
              <span className="text-text">首次付款合计</span>
              <span className="font-mono text-primary">¥{totalAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 期限明细 */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <p className="text-body-sm font-semibold text-text mb-3">期限明细</p>
        <div className="space-y-1.5">
          {paidPeriods.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-body-sm">
              <span className={`w-5 h-5 rounded-full grid place-items-center shrink-0 ${isEdit ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <CheckCircle2 size={12} className={isEdit ? 'text-emerald-600' : 'text-amber-500'} />
              </span>
              <span className="text-text-muted">第 {i + 1} 期</span>
              <span className="font-mono text-text ml-auto">{fmtDate(p.start)} ~ {fmtDate(p.end)}</span>
              <span className={`text-tiny px-1.5 py-0.5 rounded shrink-0 ${isEdit ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                {isEdit ? '已付' : '应付'}
              </span>
            </div>
          ))}
          {payingPeriods.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-body-sm">
              <span className="w-5 h-5 rounded-full bg-slate-100 grid place-items-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
              </span>
              <span className="text-text-muted">第 {paidPeriods.length + i + 1} 期</span>
              <span className="font-mono text-text ml-auto">{fmtDate(p.start)} ~ {fmtDate(p.end)}</span>
              <span className="text-tiny bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded shrink-0">待付</span>
            </div>
          ))}
        </div>
      </div>

      {/* 付款提示（仅新建） */}
      {!isEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <CreditCard size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-body-sm font-semibold text-amber-700">创建合同即视为完成签约</p>
              <p className="text-body-sm text-amber-600 mt-0.5">
                创建后将立即从租客钱包扣除押金 ¥{pledgeAmount.toFixed(2)} + 首期房租 ¥{fee.toFixed(2)}，
                合计 <strong>¥{totalAmount.toFixed(2)}</strong>，并将款项转入房东钱包。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Pay dialog ──────────────────────────────────────────────────────────── */
function PayDialog({
  open, pledgeAmount, fee, tenantName,
  onConfirm, onClose,
}: {
  open: boolean;
  pledgeAmount: number;
  fee: number;
  tenantName: string;
  onConfirm: (payCode: string) => Promise<void>;
  onClose: () => void;
}) {
  const [payCode, setPayCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (payCode.length !== 6) { toast.error('请输入 6 位支付密码'); return; }
    setLoading(true);
    try { await onConfirm(payCode); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div
        className="relative flex w-full max-w-sm flex-col overflow-hidden bg-card rounded-2xl shadow-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <div className="w-10 h-10 rounded-full bg-primary-tint grid place-items-center">
            <CreditCard size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-h3 font-heading text-text">确认付款</h3>
            <p className="text-caption text-text-muted">为租客 {tenantName} 完成签约付款</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
        <div className="bg-surface border border-border rounded-xl p-4 space-y-2 text-body-sm">
          <div className="flex justify-between"><span className="text-text-muted">押金</span><span className="font-mono">¥{pledgeAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">首期房租</span><span className="font-mono">¥{fee.toFixed(2)}</span></div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-body font-semibold">
            <span className="text-text">合计</span>
            <span className="font-mono text-primary">¥{(pledgeAmount + fee).toFixed(2)}</span>
          </div>
        </div>
        <div>
        <label className="block text-body-sm font-emphasis text-text mb-2">租客支付密码</label>
        <input
          type="password"
          maxLength={6}
          inputMode="numeric"
          autoFocus
          placeholder="请输入租客 6 位支付密码"
          value={payCode}
          onChange={(e) => setPayCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full h-11 px-3 border border-border rounded-xl text-body outline-none
                     transition-[border-color,box-shadow] focus:border-primary
                     focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                     placeholder:text-text-muted tracking-[0.5em] text-center"
        />
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 h-10 border border-border rounded-xl text-body text-text hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer">取消</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 h-10 bg-primary text-white rounded-xl text-body font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? '处理中...' : '确认创建合同'}
          </button>
        </div>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Props ───────────────────────────────────────────────────────────────── */
type Props = {
  title: string;
  subtitle: string;
  backHref: string;
  isEdit?: boolean;
  editingContract?: ContractItem | null;
};

/* ─── Main Form ───────────────────────────────────────────────────────────── */
export default function ContractForm({ title, subtitle, backHref, isEdit = false, editingContract = null }: Props) {
  const router = useRouter();

  const [users,       setUsers]       = useState<UserOption[]>([]);
  const [rooms,       setRooms]       = useState<RoomOption[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomOption | null>(null);
  const [tenancy,      setTenancy]      = useState('');
  const [onlineTime,   setOnlineTime]   = useState('');
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);

  // 编辑模式：只有 onlineTime 可改
  const isReadOnly = isEdit && editingContract?.status === 2;

  // 预计算
  const tenancyNum   = parseInt(tenancy) || 0;
  const payMonths    = selectedRoom?.pay ?? 1;
  const minTenancy   = selectedRoom?.minTenancy ?? 1;
  const isValidTen   = tenancyNum >= minTenancy && tenancyNum % payMonths === 0;
  const offlineDate  = onlineTime && tenancyNum ? addMonths(new Date(onlineTime + 'T00:00:00'), tenancyNum) : null;
  const pledgeAmount = selectedRoom ? selectedRoom.price * selectedRoom.pledge : 0;
  const fee          = selectedRoom ? selectedRoom.price * selectedRoom.pay : 0;

  /* ── Load options ── */
  useEffect(() => {
    const roomsUrl = isEdit && editingContract?.roomId
      ? `/manage/contract/options/rooms?includeRoomId=${editingContract.roomId}`
      : '/manage/contract/options/rooms';
    Promise.all([
      request<{ success: boolean; data: UserOption[] }>('/manage/contract/options/users'),
      request<{ success: boolean; data: RoomOption[] }>(roomsUrl),
    ]).then(([ur, rr]) => {
      if (ur.success) setUsers(ur.data ?? []);
      if (rr.success) setRooms(rr.data ?? []);
    }).catch(console.error).finally(() => setLoadingOpts(false));
  }, []);

  /* ── Hydrate edit mode ── */
  useEffect(() => {
    if (!isEdit || !editingContract || loadingOpts) return;
    const u = users.find((u) => u.id === editingContract.userId) ?? null;
    const r = rooms.find((r) => r.id === editingContract.roomId) ?? null;
    setSelectedUser(u);
    setSelectedRoom(r);
    setTenancy(String(editingContract.tenancy));
    setOnlineTime(editingContract.onlineTime.substring(0, 10));
  }, [isEdit, editingContract, loadingOpts, users, rooms]);

  /* ── Submit handlers ── */
  const handleCreate = useCallback(async (payCode: string) => {
    if (!selectedUser || !selectedRoom || !isValidTen || !onlineTime) return;
    setSubmitting(true);
    try {
      const res = await request<{ success: boolean; data?: { id: number } }>(
        '/manage/contract',
        {
          method: 'POST',
          json: { userId: selectedUser.id, roomId: selectedRoom.id, tenancy: tenancyNum, onlineTime, payCode },
        },
      );
      if (res.success && res.data?.id) {
        toast.success('合同创建成功');
        setPayDialogOpen(false);
        router.push(`/manage/contract/${res.data.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedUser, selectedRoom, isValidTen, onlineTime, tenancyNum, router]);

  const handleEdit = useCallback(async () => {
    if (!editingContract || !onlineTime) return;
    setSubmitting(true);
    try {
      await request(`/manage/contract/${editingContract.id}`, { method: 'PUT', json: { onlineTime } });
      toast.success('合同开始时间修改成功');
      router.push(`/manage/contract/${editingContract.id}`);
    } finally {
      setSubmitting(false);
    }
  }, [editingContract, onlineTime, router]);

  const userSearchKey = useCallback(
    (u: UserOption) => `${u.username} ${u.nickname ?? ''} ${u.id}`,
    [],
  );
  const roomSearchKey = useCallback(
    (r: RoomOption) => `${r.name} ${r.roomCode} ${r.community.name}`,
    [],
  );

  if (loadingOpts) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 skeleton-shimmer rounded-sm" />
          <div className="w-40 h-4 skeleton-shimmer rounded" />
        </div>
        <div className="w-32 h-7 skeleton-shimmer rounded" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-20 h-4 skeleton-shimmer rounded" />
                <div className="w-full h-11 skeleton-shimmer rounded-xl" />
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-full h-64 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── 面包屑 ── */}
      <div className="flex items-center gap-1.5 text-body-sm min-w-0">
        <button
          onClick={() => router.back()}
          title="返回"
          className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <span className="text-text-disabled shrink-0">/</span>
        <Link href={backHref} className="text-text-muted hover:text-text transition-colors shrink-0">
          合同管理
        </Link>
        <ChevronRight size={13} className="text-text-disabled shrink-0" />
        <span className="text-text font-emphasis truncate">{title}</span>
      </div>

      {/* ── 标题 ── */}
      <div>
        <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">{title}</h1>
        <p className="text-body text-text-muted mt-1.5">{subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-start">
        {/* ── Left: Form ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">

          {/* 租客选择 */}
          <SearchDropdown
            label="租客"
            placeholder="选择租客（搜索用户名或昵称）"
            options={users}
            value={selectedUser}
            disabled={isEdit}
            onSelect={setSelectedUser}
            onClear={() => setSelectedUser(null)}
            searchKey={userSearchKey}
            renderOption={(u) => (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary-tint text-primary-dark text-xs font-semibold grid place-items-center shrink-0 border border-border overflow-hidden">
                  {u.avatar
                    ? <img src={resolveUploadedFileUrl(u.avatar)} alt={u.username} className="w-full h-full object-cover" />
                    : (u.nickname || u.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-body-sm font-medium text-text">{u.username}</p>
                  <p className="text-tiny text-text-muted">余额 ¥{u.wallet.toFixed(2)} · {u.nickname ?? '无昵称'}</p>
                </div>
                <span className="ml-auto text-tiny bg-primary-tint text-primary px-1.5 py-0.5 rounded shrink-0">
                  {u.identity === 2 ? '房东' : '租客'}
                </span>
              </div>
            )}
            renderSelected={(u) => (
              <div className="flex items-center gap-2">
                <User size={14} className="text-primary shrink-0" />
                <span className="text-body-sm font-emphasis text-text">{u.username}</span>
                {u.nickname && <span className="text-tiny text-text-muted">（{u.nickname}）</span>}
                <span className="text-tiny text-text-muted ml-auto">余额 ¥{u.wallet.toFixed(2)}</span>
              </div>
            )}
          />

          {/* 房源选择 */}
          <SearchDropdown
            label="房源"
            placeholder="选择房源（搜索名称或编号）"
            options={rooms}
            value={selectedRoom}
            disabled={isEdit}
            onSelect={setSelectedRoom}
            onClear={() => { setSelectedRoom(null); setTenancy(''); }}
            searchKey={roomSearchKey}
            renderOption={(r) => (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded shrink-0 bg-surface border border-border overflow-hidden flex items-center justify-center">
                  {r.cover
                    ? <img src={resolveUploadedFileUrl(r.cover)} alt={r.name} className="w-full h-full object-cover" />
                    : <Home size={13} className="text-text-muted" />}
                </div>
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-text truncate">{r.name}</p>
                  <p className="text-tiny text-text-muted font-mono">{r.roomCode} · ¥{r.price}/月 · 押{r.pledge}付{r.pay} · 最短{r.minTenancy}月</p>
                </div>
              </div>
            )}
            renderSelected={(r) => (
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-primary shrink-0" />
                <span className="text-body-sm font-emphasis text-text truncate">{r.name}</span>
                <span className="text-tiny text-text-muted ml-auto shrink-0">¥{r.price}/月</span>
              </div>
            )}
          />

          {/* 房源信息预览（选中后展示） */}
          {selectedRoom && (
            <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <p className="text-body-sm font-semibold text-text">房源 & 房东信息</p>
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-lg shrink-0 bg-surface border border-border overflow-hidden flex items-center justify-center">
                  {selectedRoom.cover
                    ? <img src={resolveUploadedFileUrl(selectedRoom.cover)} alt={selectedRoom.name} className="w-full h-full object-cover" />
                    : <Home size={20} className="text-text-muted" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1 text-body-sm">
                  <p className="font-emphasis text-text truncate">{selectedRoom.name}</p>
                  <p className="text-text-muted">{selectedRoom.community.name} · {selectedRoom.community.district}</p>
                  <p className="font-mono text-text-muted text-tiny">{selectedRoom.roomCode}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-body-sm">
                <div className="text-center p-2 bg-card rounded-lg border border-border">
                  <p className="text-text-muted text-tiny mb-0.5">月租</p>
                  <p className="font-mono font-medium text-text">¥{selectedRoom.price.toFixed(0)}</p>
                </div>
                <div className="text-center p-2 bg-card rounded-lg border border-border">
                  <p className="text-text-muted text-tiny mb-0.5">押付方式</p>
                  <p className="font-medium text-text">押{selectedRoom.pledge}付{selectedRoom.pay}</p>
                </div>
                <div className="text-center p-2 bg-card rounded-lg border border-border">
                  <p className="text-text-muted text-tiny mb-0.5">最短租期</p>
                  <p className="font-medium text-text">{selectedRoom.minTenancy}个月</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-border">
                <div className="w-6 h-6 rounded-full bg-primary-tint text-primary-dark text-xs font-semibold grid place-items-center shrink-0 border border-border overflow-hidden">
                  {selectedRoom.publisher.avatar
                    ? <img src={resolveUploadedFileUrl(selectedRoom.publisher.avatar)} alt={selectedRoom.publisher.username} className="w-full h-full object-cover" />
                    : (selectedRoom.publisher.nickname || selectedRoom.publisher.username).charAt(0).toUpperCase()}
                </div>
                <p className="text-body-sm text-text-muted">房东：<span className="font-emphasis text-text">{selectedRoom.publisher.username}</span></p>
              </div>
            </div>
          )}

          {/* 租期 */}
          <div>
            <label className="block text-body-sm font-emphasis text-text mb-1.5">
              租期（月）
              {selectedRoom && (
                <span className="text-text-muted font-normal ml-2">
                  最短 {minTenancy} 个月，必须是 {payMonths} 的整数倍
                </span>
              )}
            </label>
            {selectedRoom && (
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.from({ length: 4 }, (_, i) => {
                  const m = Math.max(minTenancy, payMonths) + i * payMonths;
                  return (
                    <button
                      key={m}
                      disabled={isEdit}
                      onClick={() => setTenancy(String(m))}
                      className={`px-3 h-8 rounded-lg border text-body-sm transition-colors cursor-pointer disabled:cursor-not-allowed
                        ${tenancyNum === m ? 'border-primary bg-primary-tint text-primary font-medium' : 'border-border text-text-muted hover:border-primary hover:text-primary'}`}
                    >
                      {m} 月
                    </button>
                  );
                })}
              </div>
            )}
            <input
              type="number"
              min={minTenancy}
              step={payMonths}
              disabled={isEdit}
              placeholder={selectedRoom ? `输入月数（最少 ${minTenancy} 个月）` : '请先选择房源'}
              value={tenancy}
              onChange={(e) => setTenancy(e.target.value)}
              className={`w-full h-11 px-3 border rounded-xl text-body outline-none transition-[border-color,box-shadow]
                ${tenancy && !isValidTen ? 'border-red-400' : 'border-border focus:border-primary'}
                focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                placeholder:text-text-muted disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed`}
            />
            {tenancy && !isValidTen && selectedRoom && (
              <p className="text-caption text-red-500 mt-1">
                租期不能少于 {minTenancy} 个月，且必须是 {payMonths} 的整数倍
              </p>
            )}
          </div>

          {/* 开始时间 */}
          <div>
            <label className="block text-body-sm font-emphasis text-text mb-1.5">开始租房时间</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="date"
                value={onlineTime}
                onChange={(e) => setOnlineTime(e.target.value)}
                className="w-full h-11 pl-9 pr-3 border border-border rounded-xl text-body outline-none
                           transition-[border-color,box-shadow] focus:border-primary
                           focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                           text-text bg-card disabled:bg-surface disabled:text-text-muted disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* 结束时间（只读） */}
          {offlineDate && isValidTen && (
            <div>
              <label className="block text-body-sm font-emphasis text-text mb-1.5">结束时间（自动计算）</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="date"
                  value={offlineDate.toISOString().substring(0, 10)}
                  readOnly
                  className="w-full h-11 pl-9 pr-3 border border-border rounded-xl text-body outline-none bg-surface text-text-muted cursor-not-allowed"
                />
              </div>
              <p className="text-caption text-text-muted mt-1">根据开始时间和租期自动计算，不可手动修改</p>
            </div>
          )}

          {/* 操作按钮 */}
          {!isReadOnly && (
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()} className="flex-1 h-11 border border-border rounded-xl text-body text-text hover:bg-surface-2 transition-colors flex items-center justify-center cursor-pointer">取消</button>
              {isEdit ? (
                <button
                  onClick={handleEdit}
                  disabled={submitting || !onlineTime}
                  className="flex-1 h-11 bg-primary text-white rounded-xl text-body font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? '保存中...' : '保存修改'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!selectedUser) { toast.error('请选择租客'); return; }
                    if (!selectedRoom) { toast.error('请选择房源'); return; }
                    if (!isValidTen)   { toast.error(`租期必须 ≥ ${minTenancy} 且为 ${payMonths} 的倍数`); return; }
                    if (!onlineTime)   { toast.error('请选择开始日期'); return; }
                    setPayDialogOpen(true);
                  }}
                  disabled={submitting}
                  className="flex-1 h-11 bg-primary text-white rounded-xl text-body font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText size={15} />
                  创建合同
                </button>
              )}
            </div>
          )}

          {isReadOnly && (
            <div className="bg-slate-50 border border-border rounded-xl p-4 text-center text-body-sm text-text-muted">
              合同已完成，内容不可修改。
            </div>
          )}
        </div>

        {/* ── Right: Preview ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 lg:sticky lg:top-6">
          <div className="flex items-center gap-2 mb-5">
            <Eye size={16} className="text-text-muted" />
            <h2 className="text-body font-semibold text-text">合同预览</h2>
          </div>
          <ContractPreview
            room={selectedRoom}
            tenant={selectedUser}
            onlineTime={onlineTime}
            tenancy={tenancyNum}
            isEdit={isEdit}
            editingContract={editingContract}
          />
        </div>
      </div>

      {/* 付款确认弹窗 */}
      <PayDialog
        open={payDialogOpen}
        pledgeAmount={pledgeAmount}
        fee={fee}
        tenantName={selectedUser?.username ?? ''}
        onConfirm={handleCreate}
        onClose={() => setPayDialogOpen(false)}
      />
    </div>
  );
}
