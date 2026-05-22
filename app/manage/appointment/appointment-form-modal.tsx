'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { Modal } from '@/components/Modal';
import FilterSelect from '@/components/FilterSelect';
import { request } from '@/utils/request';
import { APPOINTMENT_STATUS_OPTIONS } from '@/utils/constants';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type AppointmentFormData = {
  userId: number;
  roomId: number;
  appointmentTime: string; // ISO string
  status?: number;
  remark: string | null;
  userDeleted?: boolean;
  landlordDeleted?: boolean;
};

export type EditableAppointment = {
  id: number;
  userId: number;
  roomId: number;
  appointmentTime: string;
  status: number;
  remark: string | null;
  userDeleted: boolean;
  landlordDeleted: boolean;
  user: { id: number; username: string; nickname: string | null } | null;
  room: { id: number; name: string; roomCode: string } | null;
};

export type ModalState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; appointment: EditableAppointment };

type UserOption = { id: number; username: string; nickname: string | null };
type RoomOption = { id: number; name: string; roomCode: string };

type Props = {
  state: ModalState;
  onClose: () => void;
  onSaved: (data: AppointmentFormData, editingId?: number) => Promise<void>;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
}

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const inputCls =
  `w-full h-[36px] px-3 border border-border rounded-sm bg-card text-text text-body outline-none
   transition-[border-color,box-shadow]
   hover:border-text-disabled
   placeholder:text-text-subtle
   focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]`;

const labelCls = 'block text-body-sm font-emphasis text-text-2 mb-1.5';

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function AppointmentFormModal({ state, onClose, onSaved }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [status, setStatus] = useState('1');
  const [remark, setRemark] = useState('');
  const [userDeleted, setUserDeleted] = useState(false);
  const [landlordDeleted, setLandlordDeleted] = useState(false);
  const [errors, setErrors] = useState<{ userId?: string; roomId?: string; appointmentTime?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [userSearch, setUserSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  useEffect(() => {
    if (!state) return;

    setErrors({});
    setIsSubmitting(false);
    setUserSearch('');
    setRoomSearch('');

    if (state.mode === 'edit') {
      setSelectedUserId(state.appointment.userId);
      setSelectedRoomId(state.appointment.roomId);
      setAppointmentTime(isoToDatetimeLocal(state.appointment.appointmentTime));
      setStatus(String(state.appointment.status));
      setRemark(state.appointment.remark ?? '');
      setUserDeleted(state.appointment.userDeleted);
      setLandlordDeleted(state.appointment.landlordDeleted);
    } else {
      setSelectedUserId(null);
      setSelectedRoomId(null);
      setAppointmentTime('');
      setStatus('1');
      setRemark('');
      setUserDeleted(false);
      setLandlordDeleted(false);
    }

    setLoadingOptions(true);
    Promise.all([
      request<{ success: boolean; data: UserOption[] }>('/manage/user?limit=500'),
      request<{ success: boolean; data: RoomOption[] }>('/manage/room?limit=500'),
    ])
      .then(([uRes, rRes]) => {
        if (uRes.success) setUsers(uRes.data);
        if (rRes.success) setRooms(rRes.data);
      })
      .catch(console.error)
      .finally(() => setLoadingOptions(false));
  }, [state]);

  if (!state) return null;

  const isEdit = state.mode === 'edit';
  const editingId = isEdit ? state.appointment.id : undefined;

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.nickname?.toLowerCase().includes(q) ?? false);
  });

  const filteredRooms = rooms.filter((r) => {
    const q = roomSearch.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.roomCode.toLowerCase().includes(q);
  });

  const validate = () => {
    const e: typeof errors = {};
    if (!selectedUserId) e.userId = '请选择租客';
    if (!selectedRoomId) e.roomId = '请选择房源';
    if (!appointmentTime) e.appointmentTime = '请填写预约时间';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const data: AppointmentFormData = {
        userId: selectedUserId!,
        roomId: selectedRoomId!,
        appointmentTime: new Date(appointmentTime).toISOString(),
        remark: remark.trim() || null,
        ...(isEdit ? { status: parseInt(status), userDeleted, landlordDeleted } : {}),
      };
      await onSaved(data, editingId);
      onClose();
    } catch {
      // request() 已通过 toast 处理错误
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <Modal open={!!state}>
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">

        {/* ── 头部 ── */}
        <div className="flex items-start justify-between border-b border-border-subtle px-6 py-5">
          <div className="pr-4">
            <h2 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-tight">
              {isEdit ? '编辑预约' : '新增预约'}
            </h2>
            <p className="text-body-sm text-text-muted mt-1">
              {isEdit ? '修改预约记录的信息或状态。' : '手动为用户创建一条看房预约记录。'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7.5 h-7.5 rounded-sm grid place-items-center
                       text-text-muted hover:bg-surface-2 hover:text-text
                       transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── 表单 ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 space-y-5 overflow-y-auto px-6 py-5">

            {loadingOptions ? (
              <div className="flex items-center justify-center py-8 gap-2 text-text-muted">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-body">加载数据中…</span>
              </div>
            ) : (
              <>
                {/* ── 租客 ── */}
                <div className="space-y-1.5">
                  <label className={labelCls}>
                    租客（用户）<span className="text-danger">*</span>
                  </label>

                  {selectedUser && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-tint border border-primary/20 rounded-sm text-body-sm text-primary mb-2">
                      <span className="font-emphasis">{selectedUser.username}</span>
                      {selectedUser.nickname && (
                        <span className="text-text-muted">（{selectedUser.nickname}）</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(null)}
                        className="ml-auto text-text-muted hover:text-danger transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
                    <input
                      type="text"
                      placeholder="搜索用户名或昵称"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <div className="border border-border rounded-sm overflow-hidden max-h-32 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="py-4 text-center text-body-sm text-text-muted">无匹配用户</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setSelectedUserId(u.id); setErrors((e) => ({ ...e, userId: undefined })); }}
                          className={`w-full text-left px-3 py-2 text-body flex items-center gap-2 transition-colors cursor-pointer
                            ${selectedUserId === u.id ? 'bg-primary-tint text-primary' : 'hover:bg-surface-2 text-text'}`}
                        >
                          <span className="font-emphasis">{u.username}</span>
                          {u.nickname && <span className="text-text-muted text-body-sm">（{u.nickname}）</span>}
                          <span className="ml-auto text-tiny text-text-muted font-mono">ID:{u.id}</span>
                        </button>
                      ))
                    )}
                  </div>
                  {errors.userId && <p className="text-caption text-danger">{errors.userId}</p>}
                </div>

                {/* ── 房源 ── */}
                <div className="space-y-1.5">
                  <label className={labelCls}>
                    房源 <span className="text-danger">*</span>
                  </label>

                  {selectedRoom && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-tint border border-primary/20 rounded-sm text-body-sm text-primary mb-2">
                      <span className="font-emphasis truncate">{selectedRoom.name}</span>
                      <span className="text-text-muted font-mono shrink-0">{selectedRoom.roomCode}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRoomId(null)}
                        className="ml-auto shrink-0 text-text-muted hover:text-danger transition-colors cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
                    <input
                      type="text"
                      placeholder="搜索房源名称或编号"
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <div className="border border-border rounded-sm overflow-hidden max-h-32 overflow-y-auto">
                    {filteredRooms.length === 0 ? (
                      <div className="py-4 text-center text-body-sm text-text-muted">无匹配房源</div>
                    ) : (
                      filteredRooms.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setSelectedRoomId(r.id); setErrors((e) => ({ ...e, roomId: undefined })); }}
                          className={`w-full text-left px-3 py-2 text-body flex items-center gap-2 transition-colors cursor-pointer
                            ${selectedRoomId === r.id ? 'bg-primary-tint text-primary' : 'hover:bg-surface-2 text-text'}`}
                        >
                          <span className="font-emphasis truncate flex-1">{r.name}</span>
                          <span className="text-text-muted font-mono text-body-sm shrink-0">{r.roomCode}</span>
                        </button>
                      ))
                    )}
                  </div>
                  {errors.roomId && <p className="text-caption text-danger">{errors.roomId}</p>}
                </div>

                {/* ── 预约时间 + 状态（编辑模式） ── */}
                <div className={`grid gap-4 ${isEdit ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      预约时间 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={appointmentTime}
                      onChange={(e) => { setAppointmentTime(e.target.value); setErrors((ev) => ({ ...ev, appointmentTime: undefined })); }}
                      className={`${inputCls} ${errors.appointmentTime ? 'border-danger' : ''}`}
                    />
                    {errors.appointmentTime && <p className="text-caption text-danger">{errors.appointmentTime}</p>}
                  </div>

                  {isEdit && (
                    <div className="space-y-1.5">
                      <label className={labelCls}>预约状态</label>
                      <FilterSelect
                        value={status}
                        onChange={(v) => setStatus(v || '1')}
                        placeholder="选择状态"
                        clearable={false}
                        className="w-full"
                        options={APPOINTMENT_STATUS_OPTIONS.map((o) => ({
                          value: String(o.value),
                          label: o.label,
                        }))}
                      />
                    </div>
                  )}
                </div>

                {/* ── 备注 ── */}
                <div className="space-y-1.5">
                  <label className={labelCls}>备注（可选）</label>
                  <input
                    type="text"
                    placeholder="看房时间补充说明等"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* ── 代删操作（仅编辑模式）── */}
                {isEdit && (
                  <div className="space-y-2">
                    <label className={labelCls}>代为删除</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={userDeleted}
                          onChange={(e) => setUserDeleted(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                        />
                        <span className="text-body text-text group-hover:text-text transition-colors select-none">
                          帮租客删除（租客侧隐藏此记录）
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={landlordDeleted}
                          onChange={(e) => setLandlordDeleted(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                        />
                        <span className="text-body text-text group-hover:text-text transition-colors select-none">
                          帮房东删除（房东侧隐藏此记录）
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── 底部按钮 ── */}
          <div className="border-t border-border-subtle px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8.5 px-3.5 text-body rounded-sm font-medium
                         bg-card border border-border text-text-2
                         hover:bg-surface-2 transition-colors cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingOptions}
              className="h-8.5 px-3.5 text-body rounded-sm font-medium
                         bg-primary text-white hover:bg-primary-dark transition-colors
                         flex items-center gap-2 cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? '保存修改' : '创建预约'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
