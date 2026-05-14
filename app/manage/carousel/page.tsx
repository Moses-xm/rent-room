'use client';

import { useEffect, useState } from 'react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { Plus, Pencil, Trash2, Images, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import CarouselFormModal, {
  type ModalState,
  type CarouselFormData,
} from './carousel-form-modal';
import ConfirmDialog from '@/components/ConfirmDialog';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CarouselItem = {
  id: number;
  image: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CarouselPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<CarouselItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    request<{ success: boolean; data: CarouselItem[] }>('/manage/carousel')
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
  }, [refreshKey]);

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
          <div className="aspect-[2/1] skeleton-shimmer" />
          <div className="p-3 space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-3/4" />
            <div className="h-3.5 skeleton-shimmer rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <Toaster position="top-right" richColors />

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
          <button
            onClick={() => setModalState({ mode: 'add' })}
            className="h-8.5 px-3.5 text-body rounded-sm font-medium
                       bg-primary text-white hover:bg-primary-dark transition-colors
                       flex items-center justify-center gap-2"
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
            return (
              <div
                key={item.id}
                className="group bg-card border border-border rounded-lg overflow-hidden shadow-sm
                           hover:shadow-md hover:border-border-2 transition-all duration-200"
              >
                {/* 图片预览 */}
                <div className="relative aspect-[2/1] bg-surface overflow-hidden">
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
                  {/* 悬浮操作遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setModalState({ mode: 'edit', item })}
                      title="编辑"
                      className="w-9 h-9 rounded-sm bg-white/90 hover:bg-white grid place-items-center
                                 text-text transition-colors shadow"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="删除"
                      className="w-9 h-9 rounded-sm bg-white/90 hover:bg-white grid place-items-center
                                 text-danger transition-colors shadow"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {/* ID 标签 */}
                  <span className="absolute top-2 left-2 text-tiny font-mono bg-black/50 text-white px-1.5 py-0.5 rounded">
                    #{item.id}
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
                    <p className="text-caption text-text-muted">
                      创建于 {fmtDate(item.createdAt)}
                    </p>
                    {/* 移动端操作按钮（hover 遮罩在移动端不可用） */}
                    <div className="flex sm:hidden items-center gap-0.5">
                      <button
                        onClick={() => setModalState({ mode: 'edit', item })}
                        title="编辑"
                        className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        title="删除"
                        className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
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
