'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Upload, ImagePlus, Loader2 } from 'lucide-react';
import { request } from '@/utils/request';
import { getManageCity, getManageProvince } from '@/utils/manage-city';
import { useCommunityForm, type CoverUploadApi, type CommunityFormData } from '@/utils/use-community-form';
import FilterSelect from '@/components/FilterSelect';

export type { CommunityFormData };

/* ─── Dynamic map import (SSR disabled) ───────────────────────────────────── */
const BaiduMapPicker = dynamic(() => import('@/components/BaiduMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-surface border border-border rounded-md">
      <Loader2 size={20} className="animate-spin text-text-muted" />
    </div>
  ),
});

/* ─── Shared input styles ─────────────────────────────────────────────────── */
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

/* ─── Cover upload API (module-level stable reference) ────────────────────── */
const coverApi: CoverUploadApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await request<{ success: boolean; message?: string; data?: { path: string } }>(
      '/upload/avatar', { method: 'POST', formData, silent: true }
    );
    if (!res.success || !res.data?.path) throw new Error(res.message || '封面上传失败');
    return res.data.path;
  },
  remove: async (path: string) => {
    await request('/upload/avatar', { method: 'DELETE', json: { path }, silent: true });
  },
};

/* ─── Props ───────────────────────────────────────────────────────────────── */
type Props = {
  title: string;
  subtitle: string;
  initialData?: Partial<CommunityFormData>;
  onSubmit: (data: CommunityFormData) => Promise<void>;
  backHref: string;
  submitLabel: string;
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function CommunityForm({ title, subtitle, initialData, onSubmit, backHref, submitLabel }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    form, setForm, errors,
    provinces, cities, districts,
    subwayLines, availableSubwayLines, toggleSubwayLine,
    addressQuery, centerCity, mapZoom, mapPosition, handleMapPick,
    coverPreviewUrl, isUploading, isCleaningCover, uploadError,
    handleCoverUpload, handleClearCover,
    isSubmitting, busy, handleSubmit, handleReset,
  } = useCommunityForm({
    initialData,
    autoFillProvince: getManageProvince,
    autoFillCity: getManageCity,
    coverApi,
    onSubmit,
  });

  return (
    <div className="space-y-5">

      {/* ── 面包屑 ── */}
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1.5 text-body-sm min-w-0">
          <button
            onClick={() => router.back()}
            title="返回"
            className="w-7 h-7 rounded-sm grid place-items-center text-text-muted hover:bg-surface-2 hover:text-text transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={17} />
          </button>
          <span className="text-text-disabled shrink-0">/</span>
          <Link href="/manage/community" className="text-text-muted hover:text-text transition-colors shrink-0">
            小区管理
          </Link>
          <ChevronRight size={13} className="text-text-disabled shrink-0" />
          <span className="text-text font-emphasis truncate">{title}</span>
        </nav>
      </div>

      {/* ── 标题 ── */}
      <div>
        <h1 className="font-(family-name:--typeface-display) text-h1 font-heading tracking-tight text-text leading-[1.1] m-0">
          {title}
        </h1>
        <p className="text-body text-text-muted mt-1.5">{subtitle}</p>
      </div>

      {/* ── 主体：左侧表单 + 右侧地图 ── */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">

          {/* ── 左侧表单 ── */}
          <div className="space-y-4">

            {/* 基础信息 */}
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <span className="text-body-sm font-emphasis text-text-2">基础信息</span>
              </div>
              <div className="px-5 py-4 space-y-4">

                {/* 小区名称 */}
                <div className="space-y-1.5">
                  <label className={labelCls}>小区名称 <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputCls(errors.name)}
                    placeholder="请输入小区名称"
                  />
                  {errors.name && <p className="text-caption text-danger">{errors.name}</p>}
                </div>

                {/* 封面图片 */}
                <div className="space-y-1.5">
                  <label className={labelCls}>封面图片 <span className="text-danger">*</span></label>
                  <div className={`flex items-start gap-3 rounded-sm border border-dashed p-4 ${errors.cover ? 'border-danger bg-danger-bg/10' : 'border-border bg-surface'}`}>
                    <div className="w-16 h-12 rounded-md shrink-0 grid place-items-center overflow-hidden bg-primary-tint border border-border">
                      {coverPreviewUrl ? (
                        <img src={coverPreviewUrl} alt="封面预览" className="h-full w-full object-cover" />
                      ) : (
                        <ImagePlus size={18} className="text-text-disabled" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 px-3 text-body-sm rounded-sm font-medium
                                     bg-card border border-border text-text-2
                                     hover:bg-surface-2 transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     flex items-center gap-1.5 cursor-pointer"
                        >
                          {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                          {isUploading ? '上传中…' : '上传图片'}
                        </button>
                        {form.cover && (
                          <button
                            type="button"
                            onClick={handleClearCover}
                            disabled={isUploading || isCleaningCover}
                            className="text-body-sm text-text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            清空
                          </button>
                        )}
                      </div>
                      <p className="text-caption text-text-muted">支持 JPG、PNG、WEBP，建议 16:9 比例，不超过 5 MB。</p>
                      {uploadError && <p className="text-caption text-danger">{uploadError}</p>}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={form.cover}
                    onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))}
                    className={inputCls(errors.cover)}
                    placeholder="或粘贴图片 URL"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  {errors.cover && <p className="text-caption text-danger">{errors.cover}</p>}
                </div>

              </div>
            </div>

            {/* 地址信息 */}
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <span className="text-body-sm font-emphasis text-text-2">地址信息</span>
                <span className="text-caption text-text-muted">（修改后地图将自动定位）</span>
              </div>
              <div className="px-5 py-4 space-y-4">

                {/* 省 / 市 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>省份 <span className="text-danger">*</span></label>
                    <FilterSelect
                      value={form.province}
                      onChange={(v) => setForm((f) => ({ ...f, province: v, city: '', district: '', street: '', streetNumber: '', lng: '', lat: '', subwayLine: '' }))}
                      options={provinces}
                      placeholder="请选择省份"
                      error={errors.province}
                      className="w-full"
                    />
                    {errors.province && <p className="text-caption text-danger">{errors.province}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>城市 <span className="text-danger">*</span></label>
                    <FilterSelect
                      value={form.city}
                      onChange={(v) => setForm((f) => ({ ...f, city: v, district: '', street: '', streetNumber: '', lng: '', lat: '', subwayLine: '' }))}
                      disabled={!form.province}
                      options={cities}
                      placeholder="请选择城市"
                      error={errors.city}
                      className="w-full"
                    />
                    {errors.city && <p className="text-caption text-danger">{errors.city}</p>}
                  </div>
                </div>

                {/* 区 / 县 */}
                <div className="space-y-1.5">
                  <label className={labelCls}>区/县 <span className="text-danger">*</span></label>
                  <FilterSelect
                    value={form.district}
                    onChange={(v) => setForm((f) => ({ ...f, district: v, street: '', streetNumber: '', lng: '', lat: '' }))}
                    disabled={!form.city}
                    options={districts}
                    placeholder="请选择区/县"
                    error={errors.district}
                    className="w-full"
                  />
                  {errors.district && <p className="text-caption text-danger">{errors.district}</p>}
                </div>

                {/* 街道 + 门牌号 */}
                <div className="grid grid-cols-[1fr_auto] gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>街道</label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                      className={inputCls()}
                      placeholder="例：中山路"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>门牌号</label>
                    <input
                      type="text"
                      value={form.streetNumber}
                      onChange={(e) => setForm((f) => ({ ...f, streetNumber: e.target.value }))}
                      className={`${inputCls()} w-24`}
                      placeholder="例：18号"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* 坐标 & 地铁 */}
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <span className="text-body-sm font-emphasis text-text-2">坐标与交通</span>
              </div>
              <div className="px-5 py-4 space-y-4">

                {/* 经纬度 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>经度 <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.lng}
                      onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                      className={inputCls(errors.lng)}
                      placeholder="例：116.40769"
                    />
                    {errors.lng && <p className="text-caption text-danger">{errors.lng}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>纬度 <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={form.lat}
                      onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                      className={inputCls(errors.lat)}
                      placeholder="例：39.90960"
                    />
                    {errors.lat && <p className="text-caption text-danger">{errors.lat}</p>}
                  </div>
                </div>
                <p className="text-caption text-text-muted -mt-2">可直接点击右侧地图自动填入坐标。</p>

                {/* 地铁线路 */}
                <div className="space-y-1.5">
                  <label className={labelCls}>地铁线路</label>
                  {availableSubwayLines.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {availableSubwayLines.map((line) => {
                        const selected = subwayLines.includes(line);
                        return (
                          <button
                            key={line}
                            type="button"
                            onClick={() => toggleSubwayLine(line)}
                            className={`px-2.5 py-1 rounded-full text-body-sm font-medium transition-colors cursor-pointer
                              ${selected
                                ? 'bg-primary-tint text-primary-dark'
                                : 'bg-surface border border-border text-text-2 hover:border-text-disabled hover:text-text'
                              }`}
                          >
                            {line}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-caption text-text-muted py-1">
                      {form.city ? '当前城市暂无地铁数据' : '请先选择城市'}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex items-center justify-between pt-1 pb-4">
              {!initialData && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={busy}
                  className="h-8.5 px-4 text-body rounded-sm font-medium
                             bg-card border border-border text-text-muted
                             hover:bg-surface-2 hover:text-text transition-colors
                             cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重置表单
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => router.push(backHref)}
                  disabled={busy}
                  className="h-8.5 px-4 text-body rounded-sm font-medium
                             bg-card border border-border text-text-2
                             hover:bg-surface-2 transition-colors
                             cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="h-8.5 px-4 text-body rounded-sm font-medium
                             bg-primary text-white hover:bg-primary-dark transition-colors
                             flex items-center gap-2
                             cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  {submitLabel}
                </button>
              </div>
            </div>

          </div>

          {/* ── 右侧地图 ── */}
          <div className="sticky top-4">
            <div className="bg-card border border-border rounded-md shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface">
                <span className="text-body-sm font-emphasis text-text-2">地图定位</span>
                <span className="text-caption text-text-muted">（双向联动）</span>
              </div>
              <div className="p-3" style={{ height: '520px' }}>
                <BaiduMapPicker
                  centerCity={centerCity}
                  addressQuery={addressQuery}
                  zoom={mapZoom}
                  position={mapPosition}
                  onPick={handleMapPick}
                  height="100%"
                />
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
