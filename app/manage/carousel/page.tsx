'use client';

import { useEffect, useState } from 'react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { Plus, Pencil, Trash2, Images, ExternalLink, Eye, X, ArrowUpDown, Hash } from 'lucide-react';
import { toast } from 'sonner';
import CarouselFormModal, {
  type ModalState,
  type CarouselFormData,
} from './carousel-form-modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { fmtDate } from '@/utils/format';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CarouselItem = {
  id: number;
  image: string;
  path: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type SortMode = 'createdAt' | 'order';

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CarouselPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('createdAt');
  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<CarouselItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    request<{ success: boolean; data: CarouselItem[] }>(
      `/manage/carousel${sortMode === 'order' ? '?sort=order' : ''}`
    )
      .then((res) => {
        if (cancelled) return;
        if (res.success) setList(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setHasLoadedOnce(true);
        }
      });

    return () => { cancelled = true; };
  }, [refreshKey, sortMode]);

  useEffect(() => {
    if (!previewUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreviewUrl(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewUrl]);

  const handleSaved = async (data: CarouselFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/carousel/${editingId}`, { method: 'PUT', json: data });
      toast.success('轮播图修改成功');
    } else {
      await request('/manage/carousel', { method: 'POST', json: data });
      toast.success('轮播图创建成功');
    }
    setRefreshKey((k) => k + 1);
  };

  const handleTogglePublish = async (item: CarouselItem) => {
    if (togglingId === item.id) return;
    setTogglingId(item.id);
    try {
      await request(`/manage/carousel/${item.id}`, {
        method: 'PATCH',
        json: { published: !item.published },
        silent: true,
      });
      toast.success(item.published ? '已取消发布' : '发布成功');
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error('操作失败，请重试');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/carousel/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('轮播图删除成功');
      setRefreshKey((k) => k + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  /* ─── Skeleton ────────────────────────────────────────────────────────── */
  const SkeletonCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="aspect-2/1 skeleton-shimmer" />
          <div className="p-3 space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-3/4" />
            <div className="h-3.5 skeleton-shimmer rounded w-1/2" />
            <div className="h-3.5 skeleton-shimmer rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            轮播图管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            管理首页轮播图片及其点击跳转路径，共 {hasLoadedOnce ? list.length : '…'} 张。
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {/* 排序切换 */}
          <button
            onClick={() => setSortMode((m) => m === 'createdAt' ? 'order' : 'createdAt')}
            title={sortMode === 'createdAt' ? '当前：按创建时间降序，点击切换为自定义顺序' : '当前：按自定义顺序升序，点击切换为创建时间'}
            className={`h-8.5 px-3 text-body rounded-sm font-medium border transition-colors
                        flex items-center gap-1.5 cursor-pointer
                        ${sortMode === 'order'
                          ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                          : 'bg-card border-border text-text-2 hover:bg-surface-2'}`}
          >
            {sortMode === 'order' ? <Hash size={13} /> : <ArrowUpDown size={13} />}
            {sortMode === 'order' ? '自定义顺序' : '创建时间'}
          </button>
          <button
            onClick={() => setModalState({ mode: 'add' })}
            className="h-8.5 px-3.5 text-body rounded-sm font-medium
                       bg-primary text-white hover:bg-primary-dark transition-colors
                       flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={14} strokeWidth={2.5} />
            新增轮播图
          </button>
        </div>
      </div>

      {/* ── 卡片列表 ── */}
      {!hasLoadedOnce ? (
        <SkeletonCards />
      ) : list.length === 0 ? (
        <div className="bg-card border border-border rounded-lg shadow-sm py-24 flex flex-col items-center gap-3 opacity-40">
          <Images size={40} className="text-text-disabled" />
          <p className="text-body text-text-muted">暂无轮播图，点击右上角新增</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {list.map((item) => {
            const imageUrl = resolveUploadedFileUrl(item.image);
            const isToggling = togglingId === item.id;
            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg overflow-hidden shadow-sm
                           hover:shadow-md hover:border-border-2 transition-all duration-200"
              >
                {/* 图片区域：点击预览 */}
                <div
                  className="relative aspect-2/1 bg-surface overflow-hidden cursor-zoom-in"
                  onClick={() => imageUrl && setPreviewUrl(imageUrl)}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`轮播图 ${item.id}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Images size={32} className="text-text-disabled" />
                    </div>
                  )}

                  {/* 左上：顺序 */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-tiny font-mono bg-black/50 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Hash size={9} />
                      {item.sortOrder}
                    </span>
                  </div>

                  {/* 右上：发布状态 */}
                  <span
                    className={`absolute top-2 right-2 text-tiny font-medium px-1.5 py-0.5 rounded
                                ${item.published
                                  ? 'bg-success/90 text-white'
                                  : 'bg-black/50 text-white/70'}`}
                  >
                    {item.published ? '已发布' : '未发布'}
                  </span>
                </div>

                {/* 信息区 */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ExternalLink size={12} className="text-text-disabled shrink-0" />
                    <p className="text-body-sm text-text-2 truncate font-mono" title={item.path}>
                      {item.path}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-caption text-text-muted">创建 {fmtDate(item.createdAt)}</p>
                      <p className="text-caption text-text-muted">更新 {fmtDate(item.updatedAt)}</p>
                    </div>
                    {/* 操作按钮 */}
                    <div className="flex items-center gap-0.5">
                      {/* 快捷发布/取消发布 */}
                      <button
                        role="switch"
                        aria-checked={item.published}
                        onClick={() => handleTogglePublish(item)}
                        disabled={isToggling}
                        title={item.published ? '点击取消发布' : '点击发布'}
                        className="flex items-center gap-1.5 px-1 h-7 rounded-sm
                                   hover:bg-surface-2 transition-colors
                                   cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span
                          className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent
                                      transition-colors duration-200
                                      ${item.published ? 'bg-success' : 'bg-border'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow
                                        transform transition-transform duration-200
                                        ${item.published ? 'translate-x-3' : 'translate-x-0'}`}
                          />
                        </span>
                        <span className={`text-tiny font-medium ${item.published ? 'text-success' : 'text-text-muted'}`}>
                          {item.published ? '已发布' : '未发布'}
                        </span>
                      </button>
                      <button
                        onClick={() => imageUrl && setPreviewUrl(imageUrl)}
                        title="预览"
                        className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => setModalState({ mode: 'edit', item })}
                        title="编辑"
                        className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        title="删除"
                        className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 图片 Lightbox ── */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-sm bg-white/10 hover:bg-white/20
                       grid place-items-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <img
            src={previewUrl}
            alt="轮播图预览"
            className="max-w-[90vw] max-h-[85vh] rounded-sm object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <CarouselFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除轮播图？"
        description={
          deleteTarget ? (
            <>
              轮播图{' '}
              <span className="font-semibold text-text">#{deleteTarget.id}</span>{' '}
              及其图片将被永久删除，此操作不可撤销。
            </>
          ) : undefined
        }
        confirmText="确认删除"
        cancelText="取消"
        loading={isDeleting}
        danger
        icon={<Trash2 size={32} />}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
