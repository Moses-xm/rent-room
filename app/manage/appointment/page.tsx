'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, CalendarCheck, CheckCheck, X, Home, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { request } from '@/utils/request';
import DataTable, { type Column } from '@/components/DataTable';
import AppLoading from '@/components/AppLoading';
import ConfirmDialog from '@/components/ConfirmDialog';
import Pagination from '@/components/Pagination';
import FilterSelect from '@/components/FilterSelect';
import AppointmentFormModal, {
  type ModalState,
  type AppointmentFormData,
} from './appointment-form-modal';
import { fmtDateTime } from '@/utils/format';
import { APPOINTMENT_STATUS_OPTIONS } from '@/utils/constants';

/* ─── Types ───────────────────────────────────────────────────────────────── */
type AppointmentItem = {
  id: number;
  userId: number;
  roomId: number;
  landlordId: number;
  appointmentTime: string;
  status: number;
  remark: string | null;
  createdAt: string;
  user: { id: number; username: string; nickname: string | null } | null;
  room: { id: number; name: string; roomCode: string } | null;
  landlord: { id: number; username: string; nickname: string | null } | null;
};

type AppointmentsResponse = {
  success: boolean;
  data: AppointmentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ─── Status pill ─────────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<number, string> = {
  1: 'bg-sky-50 text-sky-600',
  2: 'bg-emerald-50 text-emerald-600',
  3: 'bg-rose-50 text-rose-600',
  4: 'bg-slate-100 text-slate-500',
};
const STATUS_LABEL: Record<number, string> = { 1: '待看房', 2: '已完成', 3: '已取消', 4: '已过期' };

function StatusPill({ status }: { status: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium ${STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {STATUS_LABEL[status] ?? '未知'}
    </span>
  );
}

/* ─── Fetch helper ────────────────────────────────────────────────────────── */
async function fetchAppointments(params: {
  page: number; limit: number; search?: string; status?: string;
}) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  return request<AppointmentsResponse>(`/manage/appointment?${qs.toString()}`);
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AppointmentPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [list, setList] = useState<AppointmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<AppointmentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchAppointments({ page, limit: pageSize, search: debouncedQuery || undefined, status: statusFilter || undefined })
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
  }, [page, pageSize, debouncedQuery, statusFilter, refreshKey]);

  const handlePageChange = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));
  const handlePageSizeChange = (s: number) => { setPageSize(s); setPage(1); };

  const handleSaved = async (data: AppointmentFormData, editingId?: number) => {
    if (editingId) {
      await request(`/manage/appointment/${editingId}`, { method: 'PUT', json: data });
      toast.success('预约记录修改成功');
    } else {
      await request('/manage/appointment', { method: 'POST', json: data });
      toast.success('预约记录创建成功');
      setPage(1);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleQuickStatus = async (item: AppointmentItem, newStatus: 2 | 3) => {
    const label = newStatus === 2 ? '已完成' : '已取消';
    try {
      await request(`/manage/appointment/${item.id}`, { method: 'PATCH', json: { status: newStatus } });
      toast.success(`预约已标记为${label}`);
      setRefreshKey((k) => k + 1);
    } catch {
      // request() 已处理 toast 错误
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await request(`/manage/appointment/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      toast.success('预约记录删除成功');
      if (list.length === 1 && page > 1) setPage((p) => p - 1);
      else setRefreshKey((k) => k + 1);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasFilter = !!(debouncedQuery.trim() || statusFilter);

  /* ─── Column definitions ──────────────────────────────────────────────── */
  const columns = useMemo<Column<AppointmentItem>[]>(() => [
    {
      key: 'user',
      label: '租客',
      render: (item) => item.user ? (
        <Link href={`/manage/user/${item.user.id}`} className="flex items-center gap-2.5 group/user w-fit">
          <div className="w-8 h-8 rounded-full grid place-items-center shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border overflow-hidden">
            {(item.user.nickname || item.user.username).trim().charAt(0).toUpperCase()}
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
      key: 'room',
      label: '房源',
      render: (item) => item.room ? (
        <Link href={`/manage/room/${item.room.id}`} className="flex items-center gap-2.5 group/room w-fit">
          <div className="w-8 h-8 rounded shrink-0 bg-surface border border-border flex items-center justify-center">
            <Home size={13} className="text-text-muted" />
          </div>
          <div>
            <p className="text-body font-emphasis text-text group-hover/room:text-primary leading-none line-clamp-1 transition-colors max-w-[130px]">
              {item.room.name}
            </p>
            <p className="text-tiny text-text-muted font-mono mt-0.5">{item.room.roomCode}</p>
          </div>
        </Link>
      ) : <span className="text-body-sm text-text-muted">—</span>,
    },
    {
      key: 'landlord',
      label: '房东',
      render: (item) => item.landlord ? (
        <Link href={`/manage/user/${item.landlord.id}`} className="flex items-center gap-2 group/landlord w-fit">
          <div className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-surface border border-border text-text-muted">
            <UserRound size={13} />
          </div>
          <div>
            <p className="text-body-sm font-emphasis text-text group-hover/landlord:text-primary leading-none transition-colors">
              {item.landlord.username}
            </p>
            {item.landlord.nickname && <p className="text-tiny text-text-muted mt-0.5">{item.landlord.nickname}</p>}
          </div>
        </Link>
      ) : <span className="text-body-sm text-text-muted">—</span>,
    },
    {
      key: 'appointmentTime',
      label: '预约时间',
      tdClassName: 'font-mono',
      render: (item) => fmtDateTime(item.appointmentTime),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center',
      render: (item) => <StatusPill status={item.status} />,
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end items-center gap-0.5">
          {item.status === 1 && (
            <>
              <button
                onClick={() => handleQuickStatus(item, 2)}
                title="标记已完成"
                className="w-8 h-8 rounded-sm grid place-items-center
                           text-text-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <CheckCheck size={15} />
              </button>
              <button
                onClick={() => handleQuickStatus(item, 3)}
                title="取消预约"
                className="w-8 h-8 rounded-sm grid place-items-center
                           text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </>
          )}
          <button
            onClick={() => setModalState({ mode: 'edit', appointment: item })}
            title="编辑预约"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            title="删除预约"
            className="w-8 h-8 rounded-sm grid place-items-center
                       text-text-muted hover:text-danger hover:bg-danger-bg transition-colors cursor-pointer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], []);

  /* ─── Mobile card action button style ────────────────────────────────── */
  const cardBtnCls = 'w-8 h-8 rounded-sm grid place-items-center text-text-muted transition-colors active:scale-95 cursor-pointer';

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            预约管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            查看和管理用户的看房预约记录。
          </div>
        </div>
        <button
          onClick={() => setModalState({ mode: 'add' })}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium
                     bg-primary text-white hover:bg-primary-dark transition-colors
                     flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} />
          新增预约
        </button>
      </div>

      {/* ── 筛选区 ── */}
      <div className="py-3.5 flex items-center gap-2.5 flex-wrap">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
          <input
            type="text"
            placeholder="搜索租客/房东/房源名称或编号"
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
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          placeholder="全部状态"
          className="w-full sm:w-36"
          options={APPOINTMENT_STATUS_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        />
      </div>

      {/* ── 移动端卡片列表（< md）── */}
      <div className="md:hidden space-y-3">
        {!hasLoadedOnce ? (
          <AppLoading variant="card" rows={4} actionCount={2} />
        ) : list.length === 0 ? (
          <div className="bg-card border border-border rounded shadow-sm py-20 flex flex-col items-center gap-3 opacity-40">
            <CalendarCheck size={36} className="text-text-disabled" />
            <p className="text-body text-text-muted">
              {hasFilter ? '未找到符合条件的预约记录' : '暂无预约记录'}
            </p>
          </div>
        ) : (
          list.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded shadow-sm overflow-hidden">
              {/* 房源行 */}
              <Link
                href={item.room ? `/manage/room/${item.room.id}` : '#'}
                className="flex items-center gap-3 px-4 pt-4 pb-3 group/room"
              >
                <div className="w-10 h-10 rounded shrink-0 bg-surface border border-border flex items-center justify-center">
                  <Home size={15} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-emphasis text-text group-hover/room:text-primary transition-colors leading-none line-clamp-1">
                    {item.room?.name ?? '—'}
                  </p>
                  <p className="text-tiny text-text-muted font-mono mt-0.5">{item.room?.roomCode ?? ''}</p>
                </div>
                <StatusPill status={item.status} />
              </Link>

              <div className="mx-4 border-t border-border" />

              {/* 租客 + 房东 行 */}
              <div className="flex items-center gap-3 px-4 py-3">
                <Link href={item.user ? `/manage/user/${item.user.id}` : '#'} className="flex items-center gap-2 group/user flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-primary-tint text-primary-dark text-xs font-semibold border border-border">
                    {(item.user?.nickname || item.user?.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-body-sm font-emphasis text-text group-hover/user:text-primary transition-colors truncate">
                    {item.user?.username ?? '—'}
                  </span>
                </Link>
                <span className="text-tiny text-text-muted shrink-0">→ 房东</span>
                <Link href={item.landlord ? `/manage/user/${item.landlord.id}` : '#'} className="flex items-center gap-2 group/landlord flex-1 min-w-0 justify-end">
                  <span className="text-body-sm font-emphasis text-text group-hover/landlord:text-primary transition-colors truncate">
                    {item.landlord?.username ?? '—'}
                  </span>
                  <div className="w-7 h-7 rounded-full grid place-items-center shrink-0 bg-surface border border-border text-text-muted">
                    <UserRound size={13} />
                  </div>
                </Link>
              </div>

              <div className="mx-4 border-t border-border" />

              {/* 预约时间 + 操作按钮 */}
              <div className="flex items-center gap-2 px-4 py-2.5">
                <p className="text-tiny text-text-muted font-mono flex-1">
                  预约于 {fmtDateTime(item.appointmentTime)}
                </p>
                <div className="flex items-center gap-0.5 shrink-0">
                  {item.status === 1 && (
                    <>
                      <button
                        onClick={() => handleQuickStatus(item, 2)}
                        title="标记已完成"
                        className={`${cardBtnCls} hover:text-emerald-600 hover:bg-emerald-50`}
                      >
                        <CheckCheck size={16} />
                      </button>
                      <button
                        onClick={() => handleQuickStatus(item, 3)}
                        title="取消预约"
                        className={`${cardBtnCls} hover:text-danger hover:bg-danger-bg`}
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setModalState({ mode: 'edit', appointment: item })}
                    title="编辑"
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
          emptyIcon={<CalendarCheck size={36} className="text-text-disabled" />}
          emptyText={hasFilter ? '未找到符合条件的预约记录' : '暂无预约记录'}
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

      <AppointmentFormModal
        state={modalState}
        onClose={() => setModalState(null)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="确认删除预约记录？"
        description={
          deleteTarget ? (
            <>
              用户{' '}
              <span className="font-semibold text-text">{deleteTarget.user?.username ?? `ID:${deleteTarget.userId}`}</span>{' '}
              对房源{' '}
              <span className="font-semibold text-text">{deleteTarget.room?.name ?? `ID:${deleteTarget.roomId}`}</span>{' '}
              的预约记录将被永久删除，此操作不可撤销。
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
