'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { X, Loader2, Upload, ImagePlus } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { isManagedUploadPath, resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type CarouselFormData = {
  image: string;
  path: string;
};

export type EditableCarousel = {
  id: number;
  image: string;
  path: string;
};

export type ModalState =
  | null
  | { mode: 'add' }
  | { mode: 'edit'; item: EditableCarousel };

type Props = {
  state: ModalState;
  onClose: () => void;
  onSaved: (data: CarouselFormData, editingId?: number) => Promise<void>;
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

function normalizePath(value: string | null | undefined) {
  return value?.trim() ?? '';
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function CarouselFormModal({ state, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CarouselFormData>({ image: '', path: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof CarouselFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCleaningImage, setIsCleaningImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialImageRef = useRef('');

  useEffect(() => {
    if (!state) return;
    if (state.mode === 'edit') {
      initialImageRef.current = normalizePath(state.item.image);
      setForm({ image: state.item.image, path: state.item.path });
    } else {
      initialImageRef.current = '';
      setForm({ image: '', path: '' });
    }
    setErrors({});
    setIsSubmitting(false);
    setIsUploading(false);
    setIsCleaningImage(false);
    setUploadError('');
  }, [state]);

  if (!state) return null;

  const editingId = state.mode === 'edit' ? state.item.id : undefined;

  const validate = () => {
    const e: Partial<Record<keyof CarouselFormData, string>> = {};
    if (!form.image.trim()) e.image = '请上传轮播图图片';
    if (!form.path.trim()) e.path = '跳转路径不能为空';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const imagePreviewUrl = resolveUploadedFileUrl(form.image.trim());

  const deleteUploadedImage = async (imagePath: string) => {
    await request('/upload/avatar', { method: 'DELETE', json: { path: imagePath }, silent: true });
  };

  const cleanupTransientImage = async (imagePath: string, preservedPath?: string) => {
    const norm = normalizePath(imagePath);
    const initial = normalizePath(initialImageRef.current);
    const preserved = normalizePath(preservedPath);
    if (!norm) return;
    if (!isManagedUploadPath(norm)) return;
    if (norm === initial) return;
    if (preserved && norm === preserved) return;
    try { await deleteUploadedImage(norm); } catch (err) { console.error(err); }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previousImage = normalizePath(form.image);
    setUploadError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await request<UploadResponse>('/upload/avatar', { method: 'POST', formData, silent: true });
      if (!result.success || !result.data?.path) throw new Error(result.message || '图片上传失败');
      await cleanupTransientImage(previousImage, result.data.path);
      setForm((prev) => ({ ...prev, image: result.data!.path }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleClearImage = async () => {
    const current = normalizePath(form.image);
    setIsCleaningImage(true);
    try { await cleanupTransientImage(current); setForm((prev) => ({ ...prev, image: '' })); }
    finally { setIsCleaningImage(false); }
  };

  const handleClose = async () => {
    const current = normalizePath(form.image);
    setIsCleaningImage(true);
    try { await cleanupTransientImage(current); onClose(); }
    finally { setIsCleaningImage(false); }
  };

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try { await onSaved(form, editingId); onClose(); }
    catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  const busy = isSubmitting || isUploading || isCleaningImage;

  return (
    <Modal open={!!state}>
      <div className="relative flex w-full max-w-120 flex-col overflow-hidden bg-card rounded-lg shadow-lg animate-in zoom-in-95 duration-200">

        {/* ── 头部 ── */}
        <div className="flex items-start justify-between border-b border-border-subtle px-6 py-5">
          <div className="pr-4">
            <h2 className="font-(family-name:--typeface-display) text-h2 font-heading text-text leading-tight">
              {editingId ? '编辑轮播图' : '新增轮播图'}
            </h2>
            <p className="text-body-sm text-text-muted mt-1">
              {editingId ? '修改图片或跳转链接。' : '上传图片并设置点击后的跳转路径。'}
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

            {/* 图片上传 */}
            <div className="space-y-1.5">
              <label className={labelCls}>
                轮播图片 <span className="text-danger">*</span>
              </label>

              {/* 预览大图 */}
              {imagePreviewUrl ? (
                <div className="relative w-full aspect-[2/1] rounded-sm overflow-hidden border border-border bg-surface">
                  <img
                    src={imagePreviewUrl}
                    alt="轮播图预览"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    disabled={isUploading || isCleaningImage}
                    className="absolute top-2 right-2 w-7 h-7 rounded-sm bg-black/50 hover:bg-black/70
                               grid place-items-center text-white transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className="w-full aspect-[2/1] rounded-sm border-2 border-dashed border-border
                             bg-surface flex flex-col items-center justify-center gap-2
                             cursor-pointer hover:border-primary hover:bg-primary-tint/30
                             transition-colors"
                >
                  <ImagePlus size={28} className="text-text-disabled" />
                  <p className="text-body-sm text-text-muted">点击上传轮播图</p>
                  <p className="text-caption text-text-disabled">建议尺寸 16:9，JPG/PNG/WEBP，≤ 5 MB</p>
                </div>
              )}

              {/* 上传按钮区 */}
              <div className="flex items-center gap-2 flex-wrap">
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
                  {isUploading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  {isUploading ? '上传中…' : '选择图片'}
                </button>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className={`flex-1 min-w-0 ${inputCls(errors.image)}`}
                  placeholder="或粘贴图片 URL"
                />
              </div>
              {uploadError && <p className="text-caption text-danger">{uploadError}</p>}
              {errors.image && <p className="text-caption text-danger">{errors.image}</p>}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* 跳转路径 */}
            <div className="space-y-1.5">
              <label className={labelCls}>
                跳转路径 <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
                className={inputCls(errors.path)}
                placeholder="如 /portal/search?type=1"
              />
              {errors.path ? (
                <p className="text-caption text-danger">{errors.path}</p>
              ) : (
                <p className={hintCls}>点击轮播图后跳转的页面路径，支持站内路径或完整 URL。</p>
              )}
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
              {editingId ? '保存修改' : '创建轮播图'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
