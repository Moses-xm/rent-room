'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Search } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { request } from '@/utils/request';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type CollectionFormData = {
  userId: number;
  roomId: number;
};

export type EditableCollection = {
  id: number;
  userId: number;
  roomId: number;
  user: { id: number; username: string; nickname: string | null } | null;
  room: { id: number; name: string; roomCode: string } | null;
};

export type ModalState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; collection: EditableCollection };

type UserOption = { id: number; username: string; nickname: string | null };
type RoomOption = { id: number; name: string; roomCode: string };

type Props = {
  state: ModalState;
  onClose: () => void;
  onSaved: (data: CollectionFormData, editingId?: number) => Promise<void>;
};

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const inputCls =
  `w-full h-[36px] px-3 border border-border rounded-sm bg-card text-text text-body outline-none
   transition-[border-color,box-shadow]
   hover:border-text-disabled
   placeholder:text-text-subtle
   focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]`;

const labelCls = 'block text-body-sm font-emphasis text-text-2 mb-1.5';

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function CollectionFormModal({ state, onClose, onSaved }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ userId?: string; roomId?: string }>({});
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
      setSelectedUserId(state.collection.userId);
      setSelectedRoomId(state.collection.roomId);
    } else {
      setSelectedUserId(null);
      setSelectedRoomId(null);
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

  const editingId = state.mode === 'edit' ? state.collection.id : undefined;

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      (u.nickname?.toLowerCase().includes(q) ?? false)
    );
  });

  const filteredRooms = rooms.filter((r) => {
    const q = roomSearch.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.roomCode.toLowerCase().includes(q);
  });

  const validate = () => {
    const e: typeof errors = {};
    if (!selectedUserId) e.userId = '请选择用户';
    if (!selectedRoomId) e.roomId = '请选择房源';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSaved({ userId: selectedUserId!, roomId: selectedRoomId! }, editingId);
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
      <div className="relative flex w-full max-w-110 flex-col overflow-hidden bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">

        {/* ── 头部 ── */}
        <div className="flex items-start justify-between border-b border-border-subtle px-6 py-5">
          <div className="pr-4">
            <h2 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-tight">
              {editingId ? '编辑收藏' : '新增收藏'}
            </h2>
            <p className="text-body-sm text-text-muted mt-1">
              {editingId ? '修改收藏关联的用户或房源。' : '为指定用户添加一条收藏记录。'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
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

            {loadingOptions ? (
              <div className="flex items-center justify-center py-8 gap-2 text-text-muted">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-body">加载数据中…</span>
              </div>
            ) : (
              <>
                {/* 用户 */}
                <div className="space-y-1.5">
                  <label className={labelCls}>
                    用户 <span className="text-danger">*</span>
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

                  <div className="border border-border rounded-sm overflow-hidden max-h-40 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="py-4 text-center text-body-sm text-text-muted">无匹配用户</div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setErrors((e) => ({ ...e, userId: undefined }));
                          }}
                          className={`w-full text-left px-3 py-2 text-body flex items-center gap-2 transition-colors cursor-pointer
                            ${selectedUserId === u.id
                              ? 'bg-primary-tint text-primary'
                              : 'hover:bg-surface-2 text-text'
                            }`}
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

                {/* 房源 */}
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

                  <div className="border border-border rounded-sm overflow-hidden max-h-40 overflow-y-auto">
                    {filteredRooms.length === 0 ? (
                      <div className="py-4 text-center text-body-sm text-text-muted">无匹配房源</div>
                    ) : (
                      filteredRooms.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setSelectedRoomId(r.id);
                            setErrors((e) => ({ ...e, roomId: undefined }));
                          }}
                          className={`w-full text-left px-3 py-2 text-body flex items-center gap-2 transition-colors cursor-pointer
                            ${selectedRoomId === r.id
                              ? 'bg-primary-tint text-primary'
                              : 'hover:bg-surface-2 text-text'
                            }`}
                        >
                          <span className="font-emphasis truncate flex-1">{r.name}</span>
                          <span className="text-text-muted font-mono text-body-sm shrink-0">{r.roomCode}</span>
                        </button>
                      ))
                    )}
                  </div>
                  {errors.roomId && <p className="text-caption text-danger">{errors.roomId}</p>}
                </div>
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
                         hover:bg-surface-2 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingOptions}
              className="h-8.5 px-3.5 text-body rounded-sm font-medium
                         bg-primary text-white hover:bg-primary-dark transition-colors
                         flex items-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              {editingId ? '保存修改' : '创建收藏'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
