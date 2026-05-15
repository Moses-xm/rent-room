'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { Plus, Search, Pencil, Trash2, Home, Globe, GlobeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import DataTable, { type Column } from '@/components/DataTable';
import Pagination from '@/components/Pagination';
import AppLoading from '@/components/AppLoading';
import { fmtDate } from '@/utils/format';
import { RENT_TYPE_OPTIONS, ROOM_TYPE_OPTIONS, DIRECTION_OPTIONS, MUNICIPALITY_PROVINCES } from '@/utils/constants';
import FilterSelect from '@/components/FilterSelect';
import { getManageCity, getManageProvince, MANAGE_CITY_CHANGED_EVENT } from '@/utils/manage-city';
import areaData from '@/localData/area.json';

/* ─── Area helpers (province / city / district cascade) ─────────────────── */
type AreaNode = { label: string; value: string; children?: AreaNode[] };
const AREA = areaData as AreaNode[];
const SPECIAL_KEYS = new Set(['市辖区', '县', '省直辖县级行政区划', '自治区直辖县级行政区划']);

const ALL_PROVINCES = AREA.map((p) => p.value);

const PROVINCE_OPTS = ALL_PROVINCES.map((p) => ({ value: p, label: p }));
const RENT_TYPE_OPTS = RENT_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));
const ROOM_TYPE_OPTS = ROOM_TYPE_OPTIONS.map((t) => ({ value: t, label: t }));
const DIRECTION_OPTS = DIRECTION_OPTIONS.map((d) => ({ value: d, label: d }));
const PUBLISHED_OPTS = [{ value: '1', label: '未发布' }, { value: '2', label: '已发布' }];
const RENTED_OPTS = [{ value: '1', label: '待出租' }, { value: '2', label: '已租出' }];

function getCities(province: string): string[] {
  if (!province || MUNICIPALITY_PROVINCES.has(province)) return [];
  const pNode = AREA.find((p) => p.value === province);
  return (pNode?.children ?? []).filter((c) => !SPECIAL_KEYS.has(c.value)).map((c) => c.value);
}

function getDistricts(province: string, city: string): string[] {
  if (!province) return [];
  const pNode = AREA.find((p) => p.value === province);
  if (!pNode) return [];
  if (MUNICIPALITY_PROVINCES.has(province)) {
    return (pNode.children ?? [])
      .filter((c) => SPECIAL_KEYS.has(c.value))
      .flatMap((c) => (c.children ?? []).map((d) => d.value));
  }
  if (!city) return [];
  const cNode = pNode.children?.find((c) => c.value === city);
  return (cNode?.children ?? []).map((d) => d.value);
}

/* ─── Types ───────────────────────────────────────────────────────────────── */
type CommunitySnap = { id: number; name: string; city: string; district: string };
type PublisherSnap = { id: number; username: string; nickname: string | null; realname: string | null };

type Room = {
  id: number;
  name: string;
  cmyId: number;
  rentType: number;
  roomType: string;
  direction: string;
  price: number;
  area: number;
  bedroom: number;
  parlour: number;
  bathroom: number;
  cover: string;
  roomCode: string;
  isPublished: number;
  isRented: number;
  publishTime: string | null;
  publisherId: number;
  createdAt: string;
  community: CommunitySnap | null;
  publisher: PublisherSnap | null;
};

type ListResponse = {
  success: boolean;
  data: Room[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type UserOption = { id: number; username: string; nickname: string | null };
type UserListResponse = { success: boolean; data: UserOption[]; total: number };

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function publishedPill(v: number) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-success-bg text-success font-medium">已发布</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-surface-2 text-text-muted font-medium">未发布</span>;
}

function rentedPill(v: number) {
  return v === 2
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-warning-bg text-warning font-medium">已租出</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-body-sm bg-primary-tint text-primary font-medium">待出租</span>;
}

function rentTypeLabel(v: number) {
  return RENT_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? '—';
}

/* ─── Desktop action buttons ─────────────────────────────────────────────── */
function ActionButtons({ room, toggling, onEdit, onDelete, onTogglePublish }: {
  room: Room;
  toggling: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const isPublished = room.isPublished === 2;
  return (
    <div className="flex items-center gap-1 justify-end">
      <button
        onClick={onTogglePublish}
        disabled={toggling}
        title={isPublished ? '取消发布' : '发布房源'}
        className={`h-6 px-2 rounded text-body-sm font-medium border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 ${
          isPublished
            ? 'border-border text-text-muted hover:border-text-disabled hover:text-text'
            : 'border-success/40 text-success bg-success-bg hover:bg-success hover:text-white hover:border-transparent'
        }`}
      >
        {isPublished ? '下架' : '上架'}
      </button>
      <button onClick={onEdit} title="编辑房源"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-primary transition-colors cursor-pointer">
        <Pencil size={15} />
      </button>
      <button onClick={onDelete} title="删除房源"
        className="w-8 h-8 rounded-sm grid place-items-center text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

/* ─── Mobile card ─────────────────────────────────────────────────────────── */
function MobileCard({ room, toggling, onDetail, onEdit, onDelete, onTogglePublish }: {
  room: Room;
  toggling: boolean;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const coverUrl = resolveUploadedFileUrl(room.cover);
  const isPublished = room.isPublished === 2;
  return (
    <div
      className="bg-card border border-border rounded-md shadow-sm overflow-hidden cursor-pointer"
      onClick={onDetail}
    >
      <div className="flex gap-3 p-3">
        {/* 封面 */}
        <div className="w-20 h-16 rounded-md shrink-0 overflow-hidden bg-surface self-start">
          {coverUrl
            ? <img src={coverUrl} alt={room.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Home size={18} className="text-text-disabled" /></div>
          }
        </div>

        {/* 内容 + 操作 */}
        <div className="flex-1 min-w-0 flex flex-col">
          <p className="text-body font-emphasis text-text truncate">{room.name}</p>
          <p className="text-caption text-text-muted mt-0.5 truncate">
            {room.community?.name ?? '—'} · {rentTypeLabel(room.rentType)} · {room.roomType}
          </p>

          {/* 底部行：状态 + 价格 + 操作按钮（右下角） */}
          <div className="flex items-center gap-1.5 mt-auto pt-1.5">
            {publishedPill(room.isPublished)}
            {room.isPublished === 2 && rentedPill(room.isRented)}
            <span className="text-caption text-text-muted ml-1">¥{room.price.toLocaleString()}</span>
            {/* 操作按钮 — 推到右下角 */}
            <div className="ml-auto flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onTogglePublish}
                disabled={toggling}
                title={isPublished ? '取消发布' : '发布房源'}
                className={`w-6 h-6 rounded-sm grid place-items-center transition-colors cursor-pointer disabled:opacity-40 ${
                  isPublished
                    ? 'text-success hover:bg-surface-2 hover:text-text-muted'
                    : 'text-text-muted hover:bg-success-bg hover:text-success'
                }`}
              >
                {isPublished ? <GlobeOff size={13} /> : <Globe size={13} />}
              </button>
              <button onClick={onEdit} title="编辑"
                className="w-6 h-6 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-primary transition-colors cursor-pointer">
                <Pencil size={13} />
              </button>
              <button onClick={onDelete} title="删除"
                className="w-6 h-6 rounded-sm grid place-items-center text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function RoomPage() {
  const router = useRouter();
  const [list, setList] = useState<Room[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 基础筛选
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isPublishedFilter, setIsPublishedFilter] = useState('');
  const [isRentedFilter, setIsRentedFilter] = useState('');
  const [publisherIdFilter, setPublisherIdFilter] = useState('');
  const [rentTypeFilter, setRentTypeFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');

  // 省市区级联筛选
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  // 顶栏城市对应的基准值（不算作"已筛选"状态）
  const [defaultProvince, setDefaultProvince] = useState('');
  const [defaultCity, setDefaultCity] = useState('');

  // 发布人下拉数据
  const [publishers, setPublishers] = useState<UserOption[]>([]);

  // 删除 / 快捷发布状态
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // 派生：级联选项
  const cityOptions = useMemo(() => getCities(filterProvince), [filterProvince]);
  const districtOptions = useMemo(() => {
    const apiCity = MUNICIPALITY_PROVINCES.has(filterProvince) ? filterProvince : filterCity;
    return getDistricts(filterProvince, apiCity);
  }, [filterProvince, filterCity]);

  const publisherOptions = useMemo(
    () => publishers.map((p) => ({
      value: String(p.id),
      label: p.nickname ? `${p.username} (${p.nickname})` : p.username,
    })),
    [publishers]
  );
  const cityFilterOpts = useMemo(() => cityOptions.map((c) => ({ value: c, label: c })), [cityOptions]);
  const districtFilterOpts = useMemo(() => districtOptions.map((d) => ({ value: d, label: d })), [districtOptions]);

  // 与基准省市对比，才算"已激活筛选"
  const hasFilters = !!(
    query ||
    filterProvince !== defaultProvince ||
    filterCity !== defaultCity ||
    filterDistrict ||
    publisherIdFilter || rentTypeFilter || roomTypeFilter || directionFilter ||
    isPublishedFilter || isRentedFilter
  );

  const clearFilters = () => {
    setQuery('');
    setFilterProvince(defaultProvince);
    setFilterCity(defaultCity);
    setFilterDistrict('');
    setPublisherIdFilter('');
    setRentTypeFilter('');
    setRoomTypeFilter('');
    setDirectionFilter('');
    setIsPublishedFilter('');
    setIsRentedFilter('');
    setPage(1);
  };

  // 从 localStorage 初始化省市（同步顶栏已选城市）
  useEffect(() => {
    const sync = () => {
      const province = getManageProvince();
      const city = MUNICIPALITY_PROVINCES.has(province) ? '' : getManageCity();
      setDefaultProvince(province);
      setDefaultCity(city);
      setFilterProvince(province);
      setFilterCity(city);
      setFilterDistrict('');
    };
    sync();
    window.addEventListener(MANAGE_CITY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(MANAGE_CITY_CHANGED_EVENT, sync);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // 加载发布人列表
  useEffect(() => {
    request<UserListResponse>('/manage/user?limit=200&page=1', { silent: true })
      .then((res) => { if (res.success) setPublishers(res.data); })
      .catch(() => {});
  }, []);

  const fetchList = useCallback(async () => {
    const apiCity = MUNICIPALITY_PROVINCES.has(filterProvince) ? filterProvince : filterCity;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedQuery,
        ...(isPublishedFilter ? { isPublished: isPublishedFilter } : {}),
        ...(isRentedFilter ? { isRented: isRentedFilter } : {}),
        ...(publisherIdFilter ? { publisherId: publisherIdFilter } : {}),
        ...(rentTypeFilter ? { rentType: rentTypeFilter } : {}),
        ...(roomTypeFilter ? { roomType: roomTypeFilter } : {}),
        ...(directionFilter ? { direction: directionFilter } : {}),
        ...(filterProvince ? { province: filterProvince } : {}),
        ...(apiCity ? { city: apiCity } : {}),
        ...(filterDistrict ? { district: filterDistrict } : {}),
      });
      const res = await request<ListResponse>(`/manage/room?${params}`);
      if (res.success) {
        setList(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [page, pageSize, debouncedQuery, isPublishedFilter, isRentedFilter, publisherIdFilter, rentTypeFilter, roomTypeFilter, directionFilter, filterProvince, filterCity, filterDistrict]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await request(`/manage/room/${deleteTarget.id}`, { method: 'DELETE' });
      toast.success(`已删除房源「${deleteTarget.name}」`);
      setDeleteTarget(null);
      fetchList();
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = useCallback(async (room: Room) => {
    setTogglingId(room.id);
    try {
      const newStatus = room.isPublished === 2 ? 1 : 2;
      await request(`/manage/room/${room.id}`, {
        method: 'PUT',
        json: {
          isPublished: newStatus,
          publishTime: newStatus === 2 ? new Date().toISOString() : null,
        },
      });
      toast.success(newStatus === 2 ? `已发布「${room.name}」` : `已下架「${room.name}」`);
      fetchList();
    } finally {
      setTogglingId(null);
    }
  }, [fetchList]);

  const columns = useMemo<Column<Room>[]>(() => [
    {
      key: 'cover',
      label: '封面',
      tdClassName: 'pr-2',
      thClassName: 'pr-2',
      render: (r) => {
        const url = resolveUploadedFileUrl(r.cover);
        return (
          <div className="w-14 h-10 rounded overflow-hidden bg-surface shrink-0">
            {url
              ? <img src={url} alt={r.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Home size={14} className="text-text-disabled" /></div>
            }
          </div>
        );
      },
    },
    {
      key: 'name',
      label: '房源',
      tdClassName: 'pl-2',
      thClassName: 'pl-2',
      render: (r) => (
        <div
          className="w-[180px] cursor-pointer group"
          onClick={() => router.push(`/manage/room/${r.id}`)}
        >
          <p className="text-body font-emphasis text-text truncate group-hover:text-primary transition-colors" title={r.name}>{r.name}</p>
          <p className="text-caption text-text-muted mt-0.5 font-mono">{r.roomCode}</p>
        </div>
      ),
    },
    {
      key: 'community',
      label: '小区',
      render: (r) => (
        <div className="w-[140px]">
          <p className="text-body text-text truncate" title={r.community?.name ?? ''}>{r.community?.name ?? '—'}</p>
          {r.community && (
            <p className="text-caption text-text-muted">{r.community.city} {r.community.district}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: '类型',
      render: (r) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <p className="text-body-sm text-text-2">{rentTypeLabel(r.rentType)}</p>
          <p className="text-caption text-text-muted">{r.roomType}</p>
        </div>
      ),
    },
    {
      key: 'direction',
      label: '朝向',
      render: (r) => <span className="text-body-sm text-text-2 whitespace-nowrap">{r.direction}</span>,
    },
    {
      key: 'publisher',
      label: '发布人',
      render: (r) => (
        <span className="text-body-sm text-text-2 whitespace-nowrap">
          {r.publisher?.username ?? '—'}
        </span>
      ),
    },
    {
      key: 'price',
      label: '价格',
      align: 'right',
      render: (r) => (
        <div className="text-right whitespace-nowrap">
          <p className="text-body font-emphasis text-text">¥{r.price.toLocaleString()}</p>
          <p className="text-caption text-text-muted">{r.area}㎡ · {r.bedroom}室{r.parlour}厅</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: '状态',
      align: 'center',
      render: (r) => (
        <div className="flex flex-col items-center gap-1">
          {publishedPill(r.isPublished)}
          {r.isPublished === 2 && rentedPill(r.isRented)}
        </div>
      ),
    },
    {
      key: 'publishTime',
      label: '发布时间',
      render: (r) => (
        <span className="text-body-sm text-text-muted font-mono whitespace-nowrap">
          {r.publishTime ? fmtDate(r.publishTime) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      align: 'right',

      render: (r) => (
        <ActionButtons
          room={r}
          toggling={togglingId === r.id}
          onEdit={() => router.push(`/manage/room/${r.id}/edit`)}
          onDelete={() => setDeleteTarget(r)}
          onTogglePublish={() => handleTogglePublish(r)}
        />
      ),
    },
  ], [router, togglingId, handleTogglePublish]);

  return (
    <div className="space-y-5">

      {/* ── 页面头部 ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
            房源管理
          </h1>
          <div className="text-body text-text-muted mt-1.5">
            管理所有租赁房源，跟踪发布与出租状态。
          </div>
        </div>
        <button
          onClick={() => router.push('/manage/room/new')}
          className="h-8.5 px-3.5 text-body rounded-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-end cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.5} />
          新建房源
        </button>
      </div>

      {/* ── 筛选区 ── */}
      <div className="flex items-center gap-2.5 flex-wrap">

        {/* 关键词搜索 */}
        <div className="relative w-full sm:w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={13} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="搜索房源名称或编号…"
            className="w-full h-8.5 pl-9 pr-3 border border-border rounded-sm bg-card text-text text-body outline-none
                       transition-[border-color,box-shadow] hover:border-text-disabled
                       focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]
                       placeholder:text-text-muted"
          />
        </div>

        {/* 发布人 */}
        <FilterSelect
          value={publisherIdFilter}
          onChange={(v) => { setPublisherIdFilter(v); setPage(1); }}
          options={publisherOptions}
          placeholder="全部发布人"
          className="min-w-36"
        />

        {/* 省份 */}
        <FilterSelect
          value={filterProvince}
          onChange={(v) => { setFilterProvince(v); setFilterCity(''); setFilterDistrict(''); setPage(1); }}
          options={PROVINCE_OPTS}
          placeholder="全部省份"
          className="min-w-32"
        />

        {/* 城市（始终显示，直辖市或未选省时禁用） */}
        <FilterSelect
          value={filterCity}
          disabled={cityOptions.length === 0}
          onChange={(v) => { setFilterCity(v); setFilterDistrict(''); setPage(1); }}
          options={cityFilterOpts}
          placeholder="全部城市"
          className="min-w-32"
        />

        {/* 区县（始终显示，未选省或未选城市时禁用） */}
        <FilterSelect
          value={filterDistrict}
          disabled={districtOptions.length === 0}
          onChange={(v) => { setFilterDistrict(v); setPage(1); }}
          options={districtFilterOpts}
          placeholder="全部区县"
          className="min-w-32"
        />

        {/* 租房类型 */}
        <FilterSelect
          value={rentTypeFilter}
          onChange={(v) => { setRentTypeFilter(v); setPage(1); }}
          options={RENT_TYPE_OPTS}
          placeholder="租房类型"
          className="min-w-28"
        />

        {/* 房屋类型 */}
        <FilterSelect
          value={roomTypeFilter}
          onChange={(v) => { setRoomTypeFilter(v); setPage(1); }}
          options={ROOM_TYPE_OPTS}
          placeholder="房屋类型"
          className="min-w-28"
        />

        {/* 房屋朝向 */}
        <FilterSelect
          value={directionFilter}
          onChange={(v) => { setDirectionFilter(v); setPage(1); }}
          options={DIRECTION_OPTS}
          placeholder="房屋朝向"
          className="min-w-28"
        />

        {/* 发布状态 */}
        <FilterSelect
          value={isPublishedFilter}
          onChange={(v) => { setIsPublishedFilter(v); setPage(1); }}
          options={PUBLISHED_OPTS}
          placeholder="全部状态"
          className="min-w-28"
        />

        {/* 出租状态 */}
        <FilterSelect
          value={isRentedFilter}
          onChange={(v) => { setIsRentedFilter(v); setPage(1); }}
          options={RENTED_OPTS}
          placeholder="全部租出"
          className="min-w-28"
        />

        {/* 重置按钮（有任意激活筛选时显示） */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 h-8.5 px-3 rounded-sm text-body-sm transition-all active:scale-95 whitespace-nowrap"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <X size={13} />
            重置
          </button>
        )}

        <span className="ml-auto text-body-sm text-text-muted tabular-nums">
          共 <span className="font-semibold text-text">{total}</span> 套房源
        </span>
      </div>

      {/* ── 桌面表格 ── */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={list}
          rowKey={(r) => r.id}
          loading={loading}
          hasLoaded={hasLoadedOnce}
          skeletonRows={6}
          emptyIcon={<Home size={36} />}
          emptyText={hasFilters ? '未找到符合条件的房源' : '暂无房源数据'}
          pagination={{
            page, pageSize, total, totalPages,
            onPageChange: setPage,
            onPageSizeChange: (s) => { setPageSize(s); setPage(1); },
          }}
        />
      </div>

      {/* ── 移动端卡片 ── */}
      <div className="md:hidden space-y-3">
        {!hasLoadedOnce ? (
          <AppLoading variant="card" rows={4} actionCount={3} />
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-text-muted">
            <Home size={36} className="opacity-25" />
            <p className="text-body">{hasFilters ? '未找到符合条件的房源' : '暂无房源数据'}</p>
          </div>
        ) : (
          list.map((room) => (
            <MobileCard
              key={room.id}
              room={room}
              toggling={togglingId === room.id}
              onDetail={() => router.push(`/manage/room/${room.id}`)}
              onEdit={() => router.push(`/manage/room/${room.id}/edit`)}
              onDelete={() => setDeleteTarget(room)}
              onTogglePublish={() => handleTogglePublish(room)}
            />
          ))
        )}
        {hasLoadedOnce && total > 0 && (
          <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </div>
        )}
      </div>

      {/* ── 删除确认 ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="删除房源"
        description={deleteTarget ? `确定要删除房源「${deleteTarget.name}」吗？此操作不可撤销。` : ''}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
