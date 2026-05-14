'use client';

import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { FONT_FAMILY } from '@/utils/constants';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type FacilityFormData = {
  name: string;
  icon: string;
};

export type EditableFacility = {
  id: number;
  name: string;
  icon: string;
};

export type ModalState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; facility: EditableFacility };

type Props = {
  state: ModalState;
  onClose: () => void;
  onSaved: (data: FacilityFormData, editingId?: number) => Promise<void>;
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

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function FacilityFormModal({ state, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FacilityFormData>({ name: '', icon: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FacilityFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!state) return;
    if (state.mode === 'edit') {
      setForm({ name: state.facility.name, icon: state.facility.icon });
    } else {
      setForm({ name: '', icon: '' });
    }
    setErrors({});
    setIsSubmitting(false);
  }, [state]);

  if (!state) return null;

  const editingId = state.mode === 'edit' ? state.facility.id : undefined;

  const validate = () => {
    const e: Partial<Record<keyof FacilityFormData, string>> = {};
    if (!form.name.trim()) e.name = '设施名称不能为空';
    if (!form.icon.trim()) e.icon = '设施图标不能为空';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
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
    <Modal open={!!state}>
      <div className="relative flex w-full max-w-110 flex-col overflow-hidden bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">

        {/* ── 头部 ── */}
        <div className="flex items-start justify-between border-b border-border-subtle px-6 py-5">
          <div className="pr-4">
            <h2 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-tight">
              {editingId ? '编辑设施' : '新增设施'}
            </h2>
            <p className="text-body-sm text-text-muted mt-1">
              {editingId ? '修改房屋设施的名称和图标。' : '填写设施名称和 iconfont 图标类名。'}
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

            {/* 设施名称 */}
            <div className="space-y-1.5">
              <label className={labelCls}>
                设施名称 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls(errors.name)}
                placeholder="如：空调、冰箱"
              />
              {errors.name && <p className="text-caption text-danger">{errors.name}</p>}
            </div>

            {/* 图标类名 */}
            <div className="space-y-1.5">
              <label className={labelCls}>
                图标类名 <span className="text-danger">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className={`flex-1 ${inputCls(errors.icon)}`}
                  placeholder="如：icon-kongtiao"
                />
                {form.icon.trim() && (
                  <div className="w-9 h-9 shrink-0 rounded-sm border border-border bg-surface grid place-items-center">
                    <i className={`${FONT_FAMILY} ${form.icon.trim()} text-lg text-text-2`} />
                  </div>
                )}
              </div>
              {errors.icon ? (
                <p className="text-caption text-danger">{errors.icon}</p>
              ) : (
                <p className={hintCls}>填写 iconfont 字体图标的类名，如 <code className="text-text bg-surface px-1 rounded">icon-kongtiao</code>。</p>
              )}
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
                         hover:bg-surface-2 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8.5 px-3.5 text-body rounded-sm font-medium
                         bg-primary text-white hover:bg-primary-dark transition-colors
                         flex items-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              {editingId ? '保存修改' : '创建设施'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
