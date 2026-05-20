'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, Pencil, Trash2, Bell, BookOpen, BookOpenCheck, X } from 'lucide-react';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';
import NotificationFormModal, {
  type ModalState,
  type NotificationFormData,
} from './notification-form-modal';
import { fmtDateTime } from '@/utils/format';
import { NOTIFICATION_TYPE_OPTIONS, NOTIFICATION_READ_OPTIONS, DEFAULT_PAGE_SIZE } from '@/utils/constants';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type NotificationItem = {
  id: number;
  userId: number;
  type: number;
  title: string;
  content: string;
  relatedType: string | null;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
  user: { id: number; username: string; nickname: string | null; avatar: string | null } | null;
};

type NotificationsResponse = {
  success: boolean;
  data: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Type pill ───────────────────────────────────────────────────────────── */
const TYPE_STYLE: Record<number, string> = {
  1: 'bg-sky-50 text-sky-600',
  2: 'bg-rose-50 text-rose-600',
  3: 'bg-emerald-50 text-emerald-600',
};
const TYPE_LABEL: Record<number, string> = { 1: '新预约', 2: '预约取消', 3: '预约完成' };

function TypePill({ type }: { type: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium ${TYPE_STYLE[type] ?? 'bg-slate-100 text-slate-500'}`}>
      {TYPE_LABEL[type] ?? '未知'}
    </span>
  );
}

function ReadBadge({ isRead }: { isRead: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium ${isRead ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
      {isRead ? '已读' : '未读'}
    </span>
  );
}

const RELATED_TYPE_LABEL: Record<string, string> = {
  contract:    '合同',
  appointment: '预约',
  order:       '订单',
};

function relatedHref(relatedType: string, relatedId: number): string | null {
  if (relatedType === 'contract') return `/manage/contract/${relatedId}`;
  return null;
}

function RelatedCell({ relatedType, relatedId }: { relatedType: string | null; relatedId: number | null }) {
  if (!relatedType || !relatedId) return <span className="text-body-sm text-text-muted">—</span>;
  const label = RELATED_TYPE_LABEL[relatedType] ?? relatedType;
  const href  = relatedHref(relatedType, relatedId);
  if (href) {
    return (
      <Link href={href} className="inline-flex items-center gap-1 text-body-sm font-mono text-primary hover:underline underline-offset-2">
        {label} <span className="font-semibold">#{relatedId}</span>
      </Link>
    );
  }
  return (
    <span className="text-body-sm text-text-muted font-mono">
      {label} <span className="text-text">#{relatedId}</span>
    </span>
  );
}

/* ─── Fetch helper ────────────────────────────────────────────────────────── */
async function fetchNotifications(params: {
  page: number; limit: number; search?: string;
  type?: string; isRead?: string; userId?: number;
}) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search)           qs.set('search', params.search);
  if (params.type)             qs.set('type',   params.type);
  if (params.isRead !== undefined && params.isRead !== '') qs.set('isRead', params.isRead);
  if (params.userId)           qs.set('userId', String(params.userId));
  return request<NotificationsResponse>(`/manage/notification?${qs.toString()}`);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function NotificationPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [isReadFilter, setIsReadFilter] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchNotifications({
      page,
      limit: pageSize,
      search: debouncedQuery || undefined,
      type: typeFilter || undefined,
      isRead: isReadFilter,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setList(res.data);
          setTotal(res.total);
          setTotalPages(res.totalPages);
          if (res.totalPages > 0 && page > res.totalPages) setPage(res.totalPages);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) { setLoading(false); setHasLoadedOnce(true); }
      });

    return () => { cancelled = true; };
  }, [page, pageSize, debouncedQuery, typeFilter, isReadFilter, refreshKey]);

  const handlePageChange     = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); };

  const handleSaved = async (data: NotificationFormData, id: number) => {
    await request(`/manage/notification/${id}`, { method: 'PUT', json: data });
    toast.success('通知状态更新成功');
    setRefreshKey((k) => k + 1);
  };

  const handleQuickRead = async (item: NotificationItem) => {
    try {
      await request(`/manage/notification/${item.id}`, { method: 'PUT', json: { isRead: !item.isRead } });
      toast.success(item.isRead ? '已标记为未读' : '已标记为已读');
      setRefreshKey((k) => k + 1);
    } catch {
      // request() 已处理 toast 错误
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/notification/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('通知记录删除成功');
      if (list.length === 1 && page > 1) setPage((p) => p - 1);
      else setRefreshKey((k) => k + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasFilter = !!(debouncedQuery.trim() || typeFilter || isReadFilter);

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('');
    setIsReadFilter('');
    setPage(1);
  };

  /* ─── Column definitions ──────────────────────────────────────────────── */
  const columns = useMemo<Column<NotificationItem>[]>(() => [
    {
      key: 'user',
      label: '接收用户',
      render: (item) => item.user ? (
        <Link href={`/manage/user/${item.user.id}`} className="flex items-center gap-2.5 group/user w-fit">
          <div className="w-8 h-8 rounded-full grid place-items-center shrink-0
                          bg-primary-tint text-primary-dark text-xs font-semibold border border-border overflow-hidden">
            {item.user.avatar
              ? <img src={resolveUploadedFileUrl(item.user.avatar)} alt={item.user.username} className="w-full h-full object-cover" />
              : (item.user.nickname || item.user.username).charAt(0).toUpperCase()
            }
          </div>
          <div>
            <p className="text-body font-emphasis text-text group-hover/user:text-primary leading-none transition-colors">
              {item.user.username}
            </p>
            {item.user.nickname && <p className="text-tiny text-text-muted mt-0.5">{item.user.nickname}</p>}
          </div>
        </Link>
      ) : <span className="text-body-sm text-text-muted">—</span>,
    },
    {
      key: 'type',
      label: '类型',
      align: 'center',
      render: (item) => <TypePill type={item.type} />,
    },
    {
      key: 'title',
      label: '标题 / 内容',
      render: (item) => (
        <button
          type="button"
          onClick={() => setModalState({ mode: 'edit', item })}
          className="max-w-64 text-left group/title cursor-pointer"
        >
          <p className="text-body font-emphasis text-text leading-none truncate group-hover/title:text-primary transition-colors">
            {item.title}
          </p>
          <p className="text-tiny text-text-muted mt-0.5 truncate">{item.content}</p>
        </button>
      ),
    },
    {
      key: 'relatedId',
      label: '关联',
      render: (item) => <RelatedCell relatedType={item.relatedType} relatedId={item.relatedId} />,
    },
    {
      key: 'isRead',
      label: '已读',
      align: 'center',
      render: (item) => <ReadBadge isRead={item.isRead} />,
    },
    {
      key: 'createdAt',
      label: '创建时间',
      tdClassName: 'font-mono',
      render: (item) => fmtDateTime(item.createdAt),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end items-center gap-0.5">
          <button
            onClick={() => handleQuickRead(item)}
            title={item.isRead ? '标记为未读' : '标记为已读'}
            className={`w-8 h-8 rounded-sm grid place-items-center transition-colors cursor-pointer
              ${item.isRead
                ? 'text-text-muted hover:text-amber-600 hover:bg-amber-50'
                : 'text-text-muted hover:text-emerald-600 hover:bg-emerald-50'}`}
          >
            {item.isRead ? <BookOpen size={15} /> : <BookOpenCheck size={15} />}
          </button>
          <button
            onClick={() => setModalState({ mode: 'edit', item })}
            title="查看/编辑"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            title="删除通知"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const cardBtnCls = 'w-8 h-8 rounded-sm grid place-items-center text-text-muted transition-colors active:scale-95 cursor-pointer';

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            通知管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            查看和管理系统发送给用户的通知记录。
          </div>
        </div>
      </div>

      {/* ── 筛选区 ── */}
      <div className="py-3.5 flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
          <input
            type="text"
            placeholder="搜索标题/内容/用户名"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="w-full h-8.5 pl-9 pr-3 border border-border rounded-sm
                       bg-card text-text text-body outline-none
                       transition-[border-color,box-shadow]
                       hover:border-text-disabled
                       focus:border-primary
                       focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                       placeholder:text-text-muted"
          />
        </div>
        <FilterSelect
          value={typeFilter}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
          placeholder="全部类型"
          className="w-full sm:w-36"
          options={NOTIFICATION_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        />
        <FilterSelect
          value={isReadFilter}
          onChange={(v) => { setIsReadFilter(v); setPage(1); }}
          placeholder="全部状态"
          className="w-full sm:w-32"
          options={NOTIFICATION_READ_OPTIONS}
        />
        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 h-8.5 px-3 rounded-sm text-body-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <X size={13} />
            重置
          </button>
        )}
      </div>

      {/* ── 移动端卡片列表（< md）── */}
      <div className="md:hidden space-y-3">
        {!hasLoadedOnce ? (
          <AppLoading variant="card" rows={4} actionCount={2} />
        ) : list.length === 0 ? (
          <div className="bg-card border border-border rounded shadow-sm py-20 flex flex-col items-center gap-3 opacity-40">
            <Bell size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">
              {hasFilter ? '未找到符合条件的通知记录' : '暂无通知记录'}
            </p>
          </div>
        ) : (
          list.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded shadow-sm overflow-hidden">
              {/* 头部：用户 + 类型 + 已读状态 */}
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                {item.user ? (
                  <Link href={`/manage/user/${item.user.id}`} className="flex items-center gap-2.5 group/user flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full grid place-items-center shrink-0
                                    bg-primary-tint text-primary-dark text-xs font-semibold border border-border overflow-hidden">
                      {item.user.avatar
                        ? <img src={resolveUploadedFileUrl(item.user.avatar)} alt={item.user.username} className="w-full h-full object-cover" />
                        : (item.user.nickname || item.user.username).charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-body font-emphasis text-text group-hover/user:text-primary transition-colors leading-none truncate">
                        {item.user.username}
                      </p>
                      {item.user.nickname && <p className="text-tiny text-text-muted mt-0.5">{item.user.nickname}</p>}
                    </div>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  <TypePill type={item.type} />
                  <ReadBadge isRead={item.isRead} />
                </div>
              </div>

              <div className="mx-4 border-t border-border" />

              {/* 标题 + 内容（可点击展开详情） */}
              <button
                type="button"
                onClick={() => setModalState({ mode: 'edit', item })}
                className="w-full text-left px-4 py-3 hover:bg-surface transition-colors cursor-pointer"
              >
                <p className="text-body font-emphasis text-text leading-none">{item.title}</p>
                <p className="text-body-sm text-text-muted mt-1 line-clamp-2 leading-relaxed">{item.content}</p>
              </button>

              <div className="mx-4 border-t border-border" />

              {/* 关联 */}
              {item.relatedType && item.relatedId && (
                <>
                  <div className="mx-4 border-t border-border" />
                  <div className="px-4 py-2.5">
                    <RelatedCell relatedType={item.relatedType} relatedId={item.relatedId} />
                  </div>
                </>
              )}

              {/* 时间 + 操作 */}
              <div className="flex items-center gap-2 px-4 py-2.5">
                <p className="text-tiny text-text-muted font-mono flex-1">
                  {fmtDateTime(item.createdAt)}
                </p>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleQuickRead(item)}
                    title={item.isRead ? '标记为未读' : '标记为已读'}
                    className={`${cardBtnCls} ${item.isRead ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-emerald-600 hover:bg-emerald-50'}`}
                  >
                    {item.isRead ? <BookOpen size={16} /> : <BookOpenCheck size={16} />}
                  </button>
                  <button
                    onClick={() => setModalState({ mode: 'edit', item })}
                    title="查看/编辑"
                    className={`${cardBtnCls} hover:bg-surface-2 hover:text-text`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    title="删除"
                    className={`${cardBtnCls} hover:text-danger hover:bg-danger-bg`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {hasLoadedOnce && total > 0 && (
          <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      {/* ── 桌面端表格（≥ md）── */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={list}
          rowKey={(r) => r.id}
          loading={loading}
          hasLoaded={hasLoadedOnce}
          skeletonRows={5}
          emptyIcon={<Bell size={36} className="text-text-disabled" />}
          emptyText={hasFilter ? '未找到符合条件的通知记录' : '暂无通知记录'}
          pagination={{
            page,
            pageSize,
            total,
            totalPages,
            onPageChange: handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
        />
      </div>

      <NotificationFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除通知记录？"
        description={
          deleteTarget ? (
            <>
              用户{' '}
              <span className="font-semibold text-text">{deleteTarget.user?.username ?? `ID:${deleteTarget.userId}`}</span>{' '}
              的通知「{deleteTarget.title}」将被永久删除，此操作不可撤销。
            </>
          ) : undefined
        }
        confirmText="确认删除"
        cancelText="取消"
        loading={isDeleting}
        danger
        icon={<Trash2 size={32} />}
        onClose={() => { if (!isDeleting) setDeleteTarget(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
