"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronLeft, Upload, ImagePlus, Loader2 } from "lucide-react";
import { portalRequest } from "@/utils/portal-request";
import { getPortalCity, getPortalProvince } from "@/utils/portal-city";
import { useCommunityForm, type CoverUploadApi, type CommunityFormData } from "@/utils/use-community-form";
import FilterSelect from "@/components/FilterSelect";

export type { CommunityFormData as PortalCommunityFormData };

/* ─── Dynamic map ─────────────────────────────────────────────────────────── */
const BaiduMapPicker = dynamic(() => import("@/components/BaiduMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#fafafa] border border-[#eee] rounded">
      <Loader2 className="w-5 h-5 animate-spin text-[#ccc]" />
    </div>
  ),
});

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const inputCls = (err?: string) =>
  `w-full h-10 px-3 border rounded text-sm outline-none transition-colors placeholder:text-[#bbb] ${
    err
      ? "border-red-400 focus:border-red-500"
      : "border-[#ddd] focus:border-[var(--color-primary)]"
  }`;
const labelCls = "block text-sm font-medium text-[#555] mb-1.5";
const errCls   = "text-xs text-red-500 mt-1";

/* ─── Cover upload API ────────────────────────────────────────────────────── */
const coverApi: CoverUploadApi = {
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await portalRequest<{ success: boolean; data?: { path: string }; message?: string }>(
      "/upload/avatar", { method: "POST", formData: fd, silent: true }
    );
    if (!res.success || !res.data?.path) throw new Error(res.message || "封面上传失败");
    return res.data.path;
  },
  remove: async (path: string) => {
    await portalRequest("/upload/avatar", { method: "DELETE", json: { path }, silent: true });
  },
};

/* ─── Section card ────────────────────────────────────────────────────────── */
function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center gap-2">
        <span className="text-sm font-medium text-[#444]">{title}</span>
        {sub && <span className="text-xs text-[#aaa]">{sub}</span>}
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

/* ─── Props ───────────────────────────────────────────────────────────────── */
type Props = {
  title: string;
  initialData?: Partial<CommunityFormData>;
  onSubmit: (data: CommunityFormData) => Promise<void>;
  submitLabel: string;
};

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function PortalCommunityForm({ title, initialData, onSubmit, submitLabel }: Props) {
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
    autoFillProvince: getPortalProvince,
    autoFillCity: getPortalCity,
    coverApi,
    onSubmit,
  });

  return (
    <div className="px-5 py-5 space-y-4">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-[#888]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 hover:text-[var(--color-primary)] cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          返回
        </button>
        <span>/</span>
        <span className="text-[#333] font-medium">{title}</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 桌面端：左表单 + 右地图 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">

          {/* 左侧表单 */}
          <div className="space-y-4">

            {/* 基础信息 */}
            <Section title="基础信息">
              <div>
                <label className={labelCls}>小区名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputCls(errors.name)}
                  placeholder="请输入小区名称"
                />
                {errors.name && <p className={errCls}>{errors.name}</p>}
              </div>

              {/* 封面 */}
              <div>
                <label className={labelCls}>封面图片 <span className="text-red-500">*</span></label>
                <div className={`flex items-start gap-3 rounded border border-dashed p-4 ${errors.cover ? "border-red-400 bg-red-50/30" : "border-[#ddd] bg-[#fafafa]"}`}>
                  <div className="w-16 h-12 rounded shrink-0 grid place-items-center overflow-hidden border border-[#eee] bg-white">
                    {coverPreviewUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={coverPreviewUrl} alt="封面" className="w-full h-full object-cover" />
                      : <ImagePlus className="w-5 h-5 text-[#ccc]" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 px-3 text-xs border border-[#ddd] rounded text-[#555] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isUploading ? "上传中…" : "上传图片"}
                      </button>
                      {form.cover && (
                        <button
                          type="button"
                          onClick={handleClearCover}
                          disabled={isUploading || isCleaningCover}
                          className="text-xs text-[#999] hover:text-[#555] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          清空
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#aaa]">支持 JPG、PNG、WEBP，建议 16:9，不超过 5 MB</p>
                    {uploadError && <p className={errCls}>{uploadError}</p>}
                  </div>
                </div>
                <input
                  type="text"
                  value={form.cover}
                  onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))}
                  className={`${inputCls(errors.cover)} mt-2`}
                  placeholder="或粘贴图片 URL"
                />
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="hidden" />
                {errors.cover && <p className={errCls}>{errors.cover}</p>}
              </div>
            </Section>

            {/* 地址信息 */}
            <Section title="地址信息" sub="（修改后地图将自动定位）">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>省份 <span className="text-red-500">*</span></label>
                  <FilterSelect
                    value={form.province}
                    onChange={(v) => setForm((f) => ({ ...f, province: v, city: "", district: "", street: "", streetNumber: "", lng: "", lat: "", subwayLine: "" }))}
                    options={provinces} placeholder="请选择省份" error={errors.province} className="w-full"
                  />
                  {errors.province && <p className={errCls}>{errors.province}</p>}
                </div>
                <div>
                  <label className={labelCls}>城市 <span className="text-red-500">*</span></label>
                  <FilterSelect
                    value={form.city}
                    onChange={(v) => setForm((f) => ({ ...f, city: v, district: "", street: "", streetNumber: "", lng: "", lat: "", subwayLine: "" }))}
                    disabled={!form.province} options={cities} placeholder="请选择城市" error={errors.city} className="w-full"
                  />
                  {errors.city && <p className={errCls}>{errors.city}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>区/县 <span className="text-red-500">*</span></label>
                <FilterSelect
                  value={form.district}
                  onChange={(v) => setForm((f) => ({ ...f, district: v, street: "", streetNumber: "", lng: "", lat: "" }))}
                  disabled={!form.city} options={districts} placeholder="请选择区/县" error={errors.district} className="w-full"
                />
                {errors.district && <p className={errCls}>{errors.district}</p>}
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4">
                <div>
                  <label className={labelCls}>街道</label>
                  <input type="text" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} className={inputCls()} placeholder="如：中山路" />
                </div>
                <div>
                  <label className={labelCls}>门牌号</label>
                  <input type="text" value={form.streetNumber} onChange={(e) => setForm((f) => ({ ...f, streetNumber: e.target.value }))} className={`${inputCls()} w-24`} placeholder="如：18号" />
                </div>
              </div>
            </Section>

            {/* 坐标与地铁 */}
            <Section title="坐标与交通">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>经度 <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="decimal" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} className={inputCls(errors.lng)} placeholder="如：116.40769" />
                  {errors.lng && <p className={errCls}>{errors.lng}</p>}
                </div>
                <div>
                  <label className={labelCls}>纬度 <span className="text-red-500">*</span></label>
                  <input type="text" inputMode="decimal" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} className={inputCls(errors.lat)} placeholder="如：39.90960" />
                  {errors.lat && <p className={errCls}>{errors.lat}</p>}
                </div>
              </div>
              <p className="text-xs text-[#aaa] -mt-2">可直接点击右侧地图自动填入坐标。</p>

              {availableSubwayLines.length > 0 && (
                <div>
                  <label className={labelCls}>地铁线路</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSubwayLines.map((line) => {
                      const sel = subwayLines.includes(line);
                      return (
                        <button
                          key={line}
                          type="button"
                          onClick={() => toggleSubwayLine(line)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                            sel
                              ? "bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)] border-[var(--color-primary-tint)]"
                              : "bg-[#f5f5f5] border-[#eee] text-[#666] hover:text-[#333]"
                          }`}
                        >
                          {line}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* 提交按钮 */}
            <div className="flex items-center justify-end gap-3 pb-6">
              {!initialData && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={busy}
                  className="h-10 px-5 border border-[#ddd] text-[#999] text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重置
                </button>
              )}
              <button
                type="button"
                onClick={() => router.back()}
                disabled={busy}
                className="h-10 px-5 border border-[#ddd] text-[#666] text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-10 px-8 bg-[var(--color-primary)] text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitLabel}
              </button>
            </div>
          </div>

          {/* 右侧地图 */}
          <div className="sticky top-4">
            <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa] flex items-center gap-2">
                <span className="text-sm font-medium text-[#444]">地图定位</span>
                <span className="text-xs text-[#aaa]">（点击地图自动填入坐标）</span>
              </div>
              <div className="p-3" style={{ height: "480px" }}>
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
