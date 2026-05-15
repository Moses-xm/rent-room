'use client';

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, Upload, ImagePlus, Loader2, X, Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { isManagedUploadPath, resolveUploadedFileUrl } from '@/lib/upload-path';
import { request } from '@/utils/request';
import { getManageCity, getManageProvince } from '@/utils/manage-city';
import { getManageToken } from '@/utils/manage-auth';
import { FONT_FAMILY, MUNICIPALITY_PROVINCES, RENT_TYPE_OPTIONS, ROOM_TYPE_OPTIONS, DIRECTION_OPTIONS, LEVEL_OPTIONS, LIFT_OPTIONS } from '@/utils/constants';
import FilterSelect from '@/components/FilterSelect';
import areaData from '@/localData/area.json';

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type RoomFormData = {
  name: string;
  cmyId: string;
  rentType: string;
  minTenancy: string;
  bedroom: string;
  parlour: string;
  bathroom: string;
  roomType: string;
  direction: string;
  price: string;
  area: string;
  pledge: string;
  pay: string;
  floor: string;
  floors: string;
  level: string;
  lift: string;
  description: string;
  cover: string;
  images: string[];
  facilityIds: number[];
  publisherId: string;
  isPublished: string;
  publishTime: string;
  isRented: string;
};

type CommunityOption = {
  id: number;
  name: string;
  province: string;
  city: string;
  district: string;
  street: string | null;
  streetNumber: string | null;
  lng: number;
  lat: number;
};

type LandlordOption = {
  id: number;
  username: string;
  nickname: string | null;
  realname: string | null;
};

type FacilityOption = {
  id: number;
  name: string;
  icon: string;
};

type Props = {
  title: string;
  subtitle: string;
  initialData?: Partial<RoomFormData>;
  onSubmit: (data: RoomFormData) => Promise<void>;
  backHref: string;
  submitLabel: string;
};

/* ─── Markdown editor (SSR disabled) ─────────────────────────────────────── */
const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((m) => m.default), {
  ssr: false,
  loading: () => <div className="h-48 rounded-sm border border-border bg-surface skeleton-shimmer" />,
});

/* ─── Shared styles ───────────────────────────────────────────────────────── */
const inputCls = (err?: string) =>
  `w-full h-[36px] px-3 border rounded-sm bg-card text-text text-body outline-none
   transition-[border-color,box-shadow] hover:border-text-disabled placeholder:text-text-subtle ${
     err
       ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_15%,transparent)]'
       : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
   }`;

const numInputCls = (err?: string) =>
  `h-[36px] px-3 border rounded-sm bg-card text-text text-body outline-none w-20 text-center
   transition-[border-color,box-shadow] hover:border-text-disabled ${
     err
       ? 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-danger)_15%,transparent)]'
       : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
   }`;

const labelCls = 'block text-body-sm font-emphasis text-text-2 mb-1.5';
const errCls = 'text-caption text-danger mt-1';

const RENT_TYPE_FORM_OPTS = RENT_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));
const ROOM_TYPE_FORM_OPTS = ROOM_TYPE_OPTIONS.map((o) => ({ value: o, label: o }));
const DIRECTION_FORM_OPTS = DIRECTION_OPTIONS.map((o) => ({ value: o, label: o }));
const LEVEL_FORM_OPTS = LEVEL_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));
const LIFT_FORM_OPTS = LIFT_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));

/* ─── Default form ────────────────────────────────────────────────────────── */
const DEFAULT_FORM: RoomFormData = {
  name: '', cmyId: '', rentType: '1', minTenancy: '1',
  bedroom: '1', parlour: '1', bathroom: '1',
  roomType: '', direction: '', price: '', area: '',
  pledge: '1', pay: '1', floor: '1', floors: '1',
  level: '2', lift: '1',
  description: '', cover: '', images: [], facilityIds: [],
  publisherId: '', isPublished: '1', publishTime: '', isRented: '1',
};

/* ─── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
        <span className="text-body-sm font-emphasis text-text-2">{title}</span>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function RoomForm({ title, subtitle, initialData, onSubmit, backHref, submitLabel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<RoomFormData>({ ...DEFAULT_FORM, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof RoomFormData | string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tracks latest form state for cleanup closures (refs are stable across renders)
  const formRef = useRef(form);
  formRef.current = form;
  // Set to true on successful save so cleanup doesn't delete committed files
  const savedRef = useRef(false);

  // Province/city/district for community filtering
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  // Remote data
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [landlords, setLandlords] = useState<LandlordOption[]>([]);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Cover upload
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const initialCoverRef = useRef(initialData?.cover ?? '');

  // Images upload
  const [uploadingImages, setUploadingImages] = useState(false);
  const imagesInputRef = useRef<HTMLInputElement | null>(null);
  const initialImagesRef = useRef<string[]>(initialData?.images ?? []);

  const setField = <K extends keyof RoomFormData>(k: K, v: RoomFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  /* ── Area cascade for community filter ── */
  type AreaOption = { label: string; value: string };
  const provinces = useMemo<AreaOption[]>(
    () => (areaData as any[]).map((p) => ({ label: String(p.label), value: String(p.value) })),
    []
  );
  const cities = useMemo<AreaOption[]>(() => {
    if (!filterProvince) return [];
    const p = (areaData as any[]).find((x) => x.value === filterProvince);
    return p?.children?.map((c: any) => ({ label: String(c.label), value: String(c.value) })) ?? [];
  }, [filterProvince]);
  const districts = useMemo<AreaOption[]>(() => {
    if (!filterProvince || !filterCity) return [];
    const p = (areaData as any[]).find((x) => x.value === filterProvince);
    const c = p?.children?.find((x: any) => x.value === filterCity);
    return c?.children?.map((d: any) => ({ label: String(d.label), value: String(d.value) })) ?? [];
  }, [filterProvince, filterCity]);

  /* ── Fetch communities ── */
  const fetchCommunities = async (province: string, city: string, district: string) => {
    setLoadingCommunities(true);
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (province) params.set('province', province);
      if (city) params.set('city', city);
      if (district) params.set('district', district);
      const res = await request<{ success: boolean; data: CommunityOption[] }>(
        `/manage/community?${params}`, { silent: true }
      );
      if (res.success) setCommunities(res.data);
    } finally {
      setLoadingCommunities(false);
    }
  };

  /* ── Fetch landlords & facilities ── */
  const fetchLandlords = async () => {
    const res = await request<{ success: boolean; data: LandlordOption[] }>(
      '/manage/user?all=true&identity=2', { silent: true }
    );
    if (res.success) setLandlords(res.data);
  };

  const fetchFacilities = async () => {
    const res = await request<{ success: boolean; data: FacilityOption[] }>(
      '/manage/facility?all=true', { silent: true }
    );
    if (res.success) setFacilities(res.data);
  };

  /* ── Initial load ── */
  useEffect(() => {
    const province = getManageProvince();
    const city = getManageCity();
    const cityValue = MUNICIPALITY_PROVINCES.has(province) ? '市辖区' : city;
    setFilterProvince(province);
    setFilterCity(cityValue);
    fetchCommunities(province, cityValue, '');
    fetchLandlords();
    fetchFacilities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialData) return;
    setForm({ ...DEFAULT_FORM, ...initialData });
    initialCoverRef.current = initialData.cover ?? '';
    initialImagesRef.current = initialData.images ?? [];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Abandon cleanup: delete transient files when user leaves without saving ── */
  useEffect(() => {
    const deleteFiles = (keepalive: boolean) => {
      if (savedRef.current) return;
      const f = formRef.current;
      const token = getManageToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const cover = f.cover.trim();
      if (cover && isManagedUploadPath(cover) && cover !== initialCoverRef.current.trim()) {
        fetch('/api/upload/avatar', { method: 'DELETE', headers, body: JSON.stringify({ path: cover }), keepalive }).catch(() => {});
      }
      for (const img of f.images) {
        if (!initialImagesRef.current.includes(img) && isManagedUploadPath(img)) {
          fetch('/api/upload/pictures', { method: 'DELETE', headers, body: JSON.stringify({ path: img }), keepalive }).catch(() => {});
        }
      }
    };

    const onBeforeUnload = () => deleteFiles(true);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      deleteFiles(false); // soft-nav / component unmount
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const communityOptions = useMemo(
    () => communities.map((c) => ({ value: String(c.id), label: `${c.name} — ${c.district}` })),
    [communities]
  );
  const landlordOptions = useMemo(
    () => landlords.map((u) => ({
      value: String(u.id),
      label: u.username + (u.nickname ? ` · ${u.nickname}` : '') + (u.realname ? ` (${u.realname})` : ''),
    })),
    [landlords]
  );

  /* ── Selected community ── */
  const selectedCommunity = useMemo(
    () => communities.find((c) => String(c.id) === form.cmyId) ?? null,
    [communities, form.cmyId]
  );

  /* ── Cover upload logic ── */
  const coverPreviewUrl = resolveUploadedFileUrl(form.cover.trim());

  const deleteUploadedCover = async (path: string) => {
    await request('/upload/avatar', { method: 'DELETE', json: { path }, silent: true });
  };

  const cleanupTransientCover = async (path: string, preserved?: string) => {
    const norm = path.trim();
    if (!norm || !isManagedUploadPath(norm)) return;
    if (norm === initialCoverRef.current.trim()) return;
    if (preserved && norm === preserved) return;
    try { await deleteUploadedCover(norm); } catch (e) { console.error(e); }
  };

  const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const prevCover = form.cover.trim();
    setCoverUploadError('');
    setIsUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await request<{ success: boolean; message?: string; data?: { path: string } }>(
        '/upload/avatar', { method: 'POST', formData: fd, silent: true }
      );
      if (!res.success || !res.data?.path) throw new Error(res.message || '封面上传失败');
      await cleanupTransientCover(prevCover, res.data.path);
      setField('cover', res.data.path);
    } catch (err) {
      setCoverUploadError(err instanceof Error ? err.message : '封面上传失败');
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleClearCover = async () => {
    await cleanupTransientCover(form.cover.trim());
    setField('cover', '');
  };

  /* ── Images upload logic ── */
  const deleteUploadedPicture = async (path: string) => {
    await request('/upload/pictures', { method: 'DELETE', json: { path }, silent: true });
  };

  const handleImagesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await request<{ success: boolean; message?: string; data?: { path: string } }>(
          '/upload/pictures', { method: 'POST', formData: fd, silent: true }
        );
        if (res.success && res.data?.path) {
          uploaded.push(res.data.path);
        } else {
          toast.error(res.message || '部分图片上传失败');
        }
      }
      if (uploaded.length) {
        setField('images', [...form.images, ...uploaded]);
      }
    } finally {
      setUploadingImages(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveImage = async (path: string) => {
    const isInitial = initialImagesRef.current.includes(path);
    if (!isInitial && isManagedUploadPath(path)) {
      try { await deleteUploadedPicture(path); } catch (e) { console.error(e); }
    }
    setField('images', form.images.filter((p) => p !== path));
  };

  /* ── Cleanup on cancel ── */
  const handleCancel = async () => {
    // cleanup transient cover
    await cleanupTransientCover(form.cover.trim());
    // cleanup transient images
    for (const img of form.images) {
      if (!initialImagesRef.current.includes(img) && isManagedUploadPath(img)) {
        try { await deleteUploadedPicture(img); } catch (e) { console.error(e); }
      }
    }
    router.push(backHref);
  };

  /* ── Facility toggle ── */
  const toggleFacility = (id: number) => {
    const next = form.facilityIds.includes(id)
      ? form.facilityIds.filter((x) => x !== id)
      : [...form.facilityIds, id];
    setField('facilityIds', next);
  };

  /* ── Province/City/District filter change ── */
  const handleFilterProvinceChange = (v: string) => {
    setFilterProvince(v);
    setFilterCity('');
    setFilterDistrict('');
    setField('cmyId', '');
    fetchCommunities(v, '', '');
  };

  const handleFilterCityChange = (v: string) => {
    setFilterCity(v);
    setFilterDistrict('');
    setField('cmyId', '');
    fetchCommunities(filterProvince, v, '');
  };

  const handleFilterDistrictChange = (v: string) => {
    setFilterDistrict(v);
    setField('cmyId', '');
    fetchCommunities(filterProvince, filterCity, v);
  };

  /* ── Validation ── */
  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = '请输入房源名称';
    if (!form.cmyId) e.cmyId = '请选择所属小区';
    if (!form.rentType) e.rentType = '请选择租房类型';
    if (!form.roomType) e.roomType = '请选择房屋类型';
    if (!form.direction) e.direction = '请选择朝向';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = '请输入有效价格';
    if (!form.area || isNaN(Number(form.area)) || Number(form.area) <= 0) e.area = '请输入有效面积';
    if (!form.publisherId) e.publisherId = '请选择发布人';
    if (!form.cover.trim()) e.cover = '请上传房源封面';
    if (form.images.length === 0) e.images = '请至少上传一张房源图片';
    if (form.facilityIds.length === 0) e.facilityIds = '请至少选择一项设施';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
      savedRef.current = true; // prevent abandon-cleanup from deleting committed files
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || isUploadingCover || uploadingImages;

  return (
    <div className="space-y-5">

      {/* ── 面包屑 ── */}
      <div className="flex items-center gap-1.5 text-body-sm min-w-0">
        <button
          onClick={() => router.back()}
          title="返回"
          className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <span className="text-text-disabled shrink-0">/</span>
        <Link href="/manage/room" className="text-text-muted hover:text-text transition-colors shrink-0">
          房源管理
        </Link>
        <ChevronRight size={13} className="text-text-disabled shrink-0" />
        <span className="text-text font-emphasis truncate">{title}</span>
      </div>

      {/* ── 标题 ── */}
      <div>
        <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
          {title}
        </h1>
        <p className="text-body text-text-muted mt-1.5">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── 基础信息 ── */}
        <Section title="基础信息">
          {/* 房源名称 */}
          <div>
            <label className={labelCls}>房源名称 <span className="text-danger">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className={inputCls(errors.name)}
              placeholder="请输入房源名称，如：阳光精品两居室"
            />
            {errors.name && <p className={errCls}>{errors.name}</p>}
          </div>
        </Section>

        {/* ── 房源图片 ── */}
        <Section title="房源图片">
          {/* 封面 */}
          <div>
            <label className={labelCls}>房源封面 <span className="text-danger">*</span></label>
            <div className={`flex items-start gap-3 rounded-sm border border-dashed p-4 ${errors.cover ? 'border-danger bg-danger-bg/10' : 'border-border bg-surface'}`}>
              <div className="w-20 h-14 rounded-md shrink-0 grid place-items-center overflow-hidden bg-primary-tint border border-border">
                {coverPreviewUrl
                  ? <img src={coverPreviewUrl} alt="封面预览" className="h-full w-full object-cover" />
                  : <ImagePlus size={18} className="text-text-disabled" />
                }
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="h-7 px-3 text-body-sm rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {isUploadingCover ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {isUploadingCover ? '上传中…' : '上传封面'}
                  </button>
                  {form.cover && (
                    <button
                      type="button"
                      onClick={handleClearCover}
                      disabled={isUploadingCover}
                      className="text-body-sm text-text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      清除
                    </button>
                  )}
                </div>
                <p className="text-caption text-text-muted">支持 JPG、PNG、WEBP，建议 16:9 比例，不超过 5 MB。</p>
                {coverUploadError && <p className={errCls}>{coverUploadError}</p>}
              </div>
            </div>
            <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="hidden" />
            {errors.cover && <p className={errCls}>{errors.cover}</p>}
          </div>

          {/* 更多图片 */}
          <div>
            <label className={labelCls}>更多图片 <span className="text-danger">*</span></label>
            <p className="text-caption text-text-muted mb-3">支持上传多张图片，可单独删除。建议上传高质量图片，每张不超过 5 MB。</p>
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
                {form.images.map((path) => {
                  const url = resolveUploadedFileUrl(path);
                  return (
                    <div key={path} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-surface">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(path)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={uploadingImages}
                onClick={() => imagesInputRef.current?.click()}
                className="h-8 px-3 text-body-sm rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {uploadingImages ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {uploadingImages ? '上传中…' : '添加图片'}
              </button>
              <span className="text-caption text-text-muted">已上传 {form.images.length} 张</span>
            </div>
            <input ref={imagesInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImagesUpload} className="hidden" />
            {errors.images && <p className={errCls}>{errors.images}</p>}
          </div>
        </Section>

        {/* ── 小区选择 ── */}
        <Section title="所属小区">
          <p className="text-caption text-text-muted -mt-1">通过省市区筛选小区，选择后自动显示小区位置信息。</p>

          {/* 省 / 市 / 区 筛选 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>省份</label>
              <FilterSelect
                value={filterProvince}
                onChange={handleFilterProvinceChange}
                options={provinces}
                placeholder="全部省份"
                className="w-full"
              />
            </div>
            <div>
              <label className={labelCls}>城市</label>
              <FilterSelect
                value={filterCity}
                onChange={handleFilterCityChange}
                disabled={!filterProvince}
                options={cities}
                placeholder="全部城市"
                className="w-full"
              />
            </div>
            <div>
              <label className={labelCls}>区/县</label>
              <FilterSelect
                value={filterDistrict}
                onChange={handleFilterDistrictChange}
                disabled={!filterCity}
                options={districts}
                placeholder="全部区县"
                className="w-full"
              />
            </div>
          </div>

          {/* 小区选择 */}
          <div>
            <label className={labelCls}>所属小区 <span className="text-danger">*</span></label>
            <FilterSelect
              value={form.cmyId}
              onChange={(v) => setField('cmyId', v)}
              options={communityOptions}
              placeholder={loadingCommunities ? '加载中…' : `请选择小区（共 ${communities.length} 个）`}
              error={errors.cmyId}
              disabled={loadingCommunities}
              className="w-full"
            />
            {errors.cmyId && <p className={errCls}>{errors.cmyId}</p>}
          </div>

          {/* 小区预览 */}
          {selectedCommunity && (
            <div className="rounded-md border border-border bg-surface px-4 py-3 flex flex-col gap-1">
              <p className="text-body font-emphasis text-text">{selectedCommunity.name}</p>
              <p className="text-body-sm text-text-muted">
                {[selectedCommunity.province, selectedCommunity.city, selectedCommunity.district, selectedCommunity.street, selectedCommunity.streetNumber].filter(Boolean).join(' ')}
              </p>
              <p className="text-caption text-text-muted font-mono">
                经纬度：{selectedCommunity.lng.toFixed(6)}, {selectedCommunity.lat.toFixed(6)}
              </p>
            </div>
          )}
        </Section>

        {/* ── 租房信息 ── */}
        <Section title="租房信息">
          {/* 类型 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>租房类型 <span className="text-danger">*</span></label>
              <FilterSelect
                value={form.rentType}
                onChange={(v) => setField('rentType', v)}
                clearable={false}
                options={RENT_TYPE_FORM_OPTS}
                placeholder="请选择租房类型"
                error={errors.rentType}
                className="w-full"
              />
              {errors.rentType && <p className={errCls}>{errors.rentType}</p>}
            </div>
            <div>
              <label className={labelCls}>房屋类型 <span className="text-danger">*</span></label>
              <FilterSelect
                value={form.roomType}
                onChange={(v) => setField('roomType', v)}
                options={ROOM_TYPE_FORM_OPTS}
                placeholder="请选择"
                error={errors.roomType}
                className="w-full"
              />
              {errors.roomType && <p className={errCls}>{errors.roomType}</p>}
            </div>
          </div>

          {/* 户型 */}
          <div>
            <label className={labelCls}>户型 <span className="text-danger">*</span></label>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="number" min="0" max="10" value={form.bedroom} onChange={(e) => setField('bedroom', e.target.value)} className={numInputCls()} />
              <span className="text-body text-text-muted">室</span>
              <input type="number" min="0" max="10" value={form.parlour} onChange={(e) => setField('parlour', e.target.value)} className={numInputCls()} />
              <span className="text-body text-text-muted">厅</span>
              <input type="number" min="0" max="10" value={form.bathroom} onChange={(e) => setField('bathroom', e.target.value)} className={numInputCls()} />
              <span className="text-body text-text-muted">卫</span>
            </div>
          </div>

          {/* 面积 & 朝向 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>建筑面积（㎡）<span className="text-danger">*</span></label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={form.area} onChange={(e) => setField('area', e.target.value)} className={`${inputCls(errors.area)} flex-1`} placeholder="例：85" />
                <span className="text-body text-text-muted shrink-0">㎡</span>
              </div>
              {errors.area && <p className={errCls}>{errors.area}</p>}
            </div>
            <div>
              <label className={labelCls}>朝向 <span className="text-danger">*</span></label>
              <FilterSelect
                value={form.direction}
                onChange={(v) => setField('direction', v)}
                options={DIRECTION_FORM_OPTS}
                placeholder="请选择"
                error={errors.direction}
                className="w-full"
              />
              {errors.direction && <p className={errCls}>{errors.direction}</p>}
            </div>
          </div>

          {/* 价格 & 押付 */}
          <div>
            <label className={labelCls}>租金与押付 <span className="text-danger">*</span></label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)} className={`${numInputCls(errors.price)} w-28`} placeholder="月租金" />
                <span className="text-body text-text-muted shrink-0">元/月</span>
              </div>
              <span className="text-body text-text-disabled">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-body text-text-muted shrink-0">押</span>
                <input type="number" min="1" max="12" value={form.pledge} onChange={(e) => setField('pledge', e.target.value)} className={numInputCls()} />
                <span className="text-body text-text-muted shrink-0">付</span>
                <input type="number" min="1" max="12" value={form.pay} onChange={(e) => setField('pay', e.target.value)} className={numInputCls()} />
              </div>
            </div>
            {errors.price && <p className={errCls}>{errors.price}</p>}
          </div>

          {/* 楼层 */}
          <div>
            <label className={labelCls}>楼层信息</label>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-body text-text-muted shrink-0">第</span>
                <input type="number" min="1" max="200" value={form.floor} onChange={(e) => setField('floor', e.target.value)} className={numInputCls()} />
                <span className="text-body text-text-muted shrink-0">层，共</span>
                <input type="number" min="1" max="200" value={form.floors} onChange={(e) => setField('floors', e.target.value)} className={numInputCls()} />
                <span className="text-body text-text-muted shrink-0">层</span>
              </div>
              <FilterSelect
                value={form.level}
                onChange={(v) => setField('level', v)}
                clearable={false}
                options={LEVEL_FORM_OPTS}
                placeholder="楼层段"
                className="w-28"
              />
            </div>
          </div>

          {/* 电梯 & 最短租期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>电梯</label>
              <FilterSelect
                value={form.lift}
                onChange={(v) => setField('lift', v)}
                clearable={false}
                options={LIFT_FORM_OPTS}
                placeholder="请选择"
                className="w-full"
              />
            </div>
            <div>
              <label className={labelCls}>最短租期（月）</label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" max="120" value={form.minTenancy} onChange={(e) => setField('minTenancy', e.target.value)} className={`${inputCls()} flex-1`} placeholder="例：3" />
                <span className="text-body text-text-muted shrink-0">月</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── 发布信息 ── */}
        <Section title="发布信息">
          {/* 发布人 */}
          <div>
            <label className={labelCls}>发布人（房东）<span className="text-danger">*</span></label>
            <FilterSelect
              value={form.publisherId}
              onChange={(v) => setField('publisherId', v)}
              options={landlordOptions}
              placeholder="请选择发布人"
              error={errors.publisherId}
              className="w-full"
            />
            {errors.publisherId && <p className={errCls}>{errors.publisherId}</p>}
          </div>

          {/* 发布状态 */}
          <div>
            <label className={labelCls}>发布状态</label>
            <div className="flex gap-4">
              {[{ v: '1', label: '未发布' }, { v: '2', label: '已发布' }].map(({ v, label }) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={v}
                    checked={form.isPublished === v}
                    onChange={() => {
                      setField('isPublished', v);
                      if (v === '1') { setField('isRented', '1'); setField('publishTime', ''); }
                    }}
                    className="accent-primary"
                  />
                  <span className="text-body text-text">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {form.isPublished === '2' && (
            <>
              <div>
                <label className={labelCls}>发布时间</label>
                <input
                  type="datetime-local"
                  value={form.publishTime}
                  onChange={(e) => setField('publishTime', e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div>
                <label className={labelCls}>租出状态</label>
                <div className="flex gap-4">
                  {[{ v: '1', label: '待出租' }, { v: '2', label: '已租出' }].map(({ v, label }) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={v}
                        checked={form.isRented === v}
                        onChange={() => setField('isRented', v)}
                        className="accent-primary"
                      />
                      <span className="text-body text-text">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </Section>

        {/* ── 房屋设施 ── */}
        <Section title="房屋设施">
          {facilities.length === 0 ? (
            <p className="text-body-sm text-text-muted">暂无设施数据，请先在设施管理中添加。</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {facilities.map((f) => {
                const selected = form.facilityIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacility(f.id)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-md border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-primary-tint text-primary-dark border-primary/40'
                        : 'bg-surface border-border text-text-2 hover:border-text-disabled hover:bg-surface-2 hover:text-text'
                    }`}
                  >
                    <i className={`${FONT_FAMILY} ${f.icon} text-[22px]`} />
                    <span className="text-caption leading-tight text-center">{f.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.facilityIds && <p className={errCls}>{errors.facilityIds}</p>}
        </Section>

        {/* ── 房源描述 ── */}
        <Section title="房源描述">
          <p className="text-caption text-text-muted -mt-1">支持 Markdown 格式，可使用标题、列表、粗体等排版。</p>
          <div data-color-mode="light">
            <MDEditor
              value={form.description}
              onChange={(v) => setField('description', v ?? '')}
              height={240}
              preview="live"
            />
          </div>
        </Section>

        {/* ── 操作按钮 ── */}
        <div className="flex items-center justify-end gap-2 pt-1 pb-4">
          {!initialData && (
            <button
              type="button"
              onClick={() => {
                setForm({ ...DEFAULT_FORM });
                setErrors({});
              }}
              disabled={busy}
              className="h-8.5 px-4 text-body rounded-sm font-medium bg-card border border-border text-text-muted hover:bg-surface-2 hover:text-text transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mr-auto"
            >
              重置
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="h-8.5 px-4 text-body rounded-sm font-medium bg-card border border-border text-text-2 hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-8.5 px-5 text-body rounded-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={13} className="animate-spin" />}
            {submitLabel}
          </button>
        </div>

      </form>
    </div>
  );
}
