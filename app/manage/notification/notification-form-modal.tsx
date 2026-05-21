'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Link as LinkIcon } from 'lucide-react';
import { Modal } from '@/components/Modal';
import FilterSelect from '@/components/FilterSelect';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { renderNotificationContent } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type NotificationFormData = { isRead: boolean };

export type EditableNotification = {
  id: number;
  type: number;
  title: string;
  content: string;
  relatedType: string | null;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
  user: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
};

export type ModalState = null | { mode: 'edit'; item: EditableNotification };

type Props = {
  state: ModalState;
  onClose: () => void;
  onSaved: (data: NotificationFormData, id: number) => Promise<void>;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const TYPE_LABEL: Record<number, string> = { 1: '新预约', 2: '预约取消', 3: '预约完成' };
const TYPE_STYLE: Record<number, string> = {
  1: 'bg-sky-50 text-sky-600',
  2: 'bg-rose-50 text-rose-600',
  3: 'bg-emerald-50 text-emerald-600',
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function NotificationFormModal({ state, onClose, onSaved }: Props) {
  const [isRead, setIsRead] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!state) return;
    setIsRead(state.item.isRead);
    setIsSubmitting(false);
  }, [state]);

  if (!state) return null;

  const { item } = state;

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaved({ isRead }, item.id);
      onClose();
    } catch {
      // request() 已通过 toast 处理错误
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open>
      <div className="relative flex w-full max-w-md flex-col overflow-hidden bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">

        {/* ── 头部 ── */}
        <div className="flex items-start justify-between border-b border-border-subtle px-6 py-5">
          <div className="pr-4">
            <h2 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-tight">
              通知详情
            </h2>
            <p className="text-body-sm text-text-muted mt-1">查看通知内容，修改已读状态。</p>
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

        {/* ── 内容 ── */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="space-y-4 px-6 py-5">

            {/* 接收用户 */}
            <div>
              <p className="text-body-sm text-text-muted mb-1.5">接收用户</p>
              {item.user ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full grid place-items-center shrink-0
                                  bg-primary-tint text-primary-dark text-xs font-semibold border border-border overflow-hidden">
                    {item.user.avatar
                      ? <img src={resolveUploadedFileUrl(item.user.avatar)} alt={item.user.username} className="w-full h-full object-cover" />
                      : (item.user.nickname || item.user.username).charAt(0).toUpperCase()
                    }
                  </div>
                  <div>
                    <p className="text-body font-emphasis text-text leading-none">{item.user.username}</p>
                    {item.user.nickname && <p className="text-tiny text-text-muted mt-0.5">{item.user.nickname}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-body text-text-muted">—</p>
              )}
            </div>

            {/* 通知类型 + 标题 */}
            <div>
              <p className="text-body-sm text-text-muted mb-1.5">类型 / 标题</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium shrink-0 ${TYPE_STYLE[item.type] ?? 'bg-slate-100 text-slate-500'}`}>
                  {TYPE_LABEL[item.type] ?? '未知'}
                </span>
                <span className="text-body font-emphasis text-text">{item.title}</span>
              </div>
            </div>

            {/* 通知内容 */}
            <div>
              <p className="text-body-sm text-text-muted mb-1.5">通知内容</p>
              <p className="text-body text-text bg-surface border border-border rounded-sm px-3 py-2.5 leading-relaxed">
                {renderNotificationContent(item.content)}
              </p>
            </div>

            {/* 关联记录 */}
            {item.relatedType && item.relatedId && (
              <div>
                <p className="text-body-sm text-text-muted mb-1.5">关联记录</p>
                <div className="flex items-center gap-1.5 text-body text-primary">
                  <LinkIcon size={13} />
                  <span className="font-emphasis capitalize">{item.relatedType}</span>
                  <span className="font-mono text-text-muted">#{item.relatedId}</span>
                </div>
              </div>
            )}

            {/* 已读状态（可编辑） */}
            <div>
              <p className="text-body-sm font-emphasis text-text-2 mb-1.5">已读状态</p>
              <FilterSelect
                value={String(isRead)}
                onChange={(v) => setIsRead(v === 'true')}
                clearable={false}
                placeholder="请选择"
                className="w-full"
                options={[
                  { value: 'true',  label: '已读' },
                  { value: 'false', label: '未读' },
                ]}
              />
            </div>

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
              disabled={isSubmitting}
              className="h-8.5 px-3.5 text-body rounded-sm font-medium
                         bg-primary text-white hover:bg-primary-dark transition-colors
                         flex items-center gap-2 cursor-pointer
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              保存修改
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
