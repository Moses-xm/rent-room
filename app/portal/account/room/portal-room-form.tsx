"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Upload, ImagePlus, Loader2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { isManagedUploadPath, resolveUploadedFileUrl } from "@/lib/upload-path";
import { portalRequest } from "@/utils/portal-request";
import { getPortalToken } from "@/utils/portal-auth";
import {
  FONT_FAMILY, RENT_TYPE_OPTIONS, ROOM_TYPE_OPTIONS,
  DIRECTION_OPTIONS, LEVEL_OPTIONS, LIFT_OPTIONS,
} from "@/utils/constants";
import FilterSelect from "@/components/FilterSelect";
import RichEditor from "@/components/RichEditor";

/* ─── Types ───────────────────────────────────────────────────────────────── */
export type PortalRoomFormData = {
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
};

type CommunityOption = { id: number; name: string; district: string };
type FacilityOption  = { id: number; name: string; icon: string };

type Props = {
  title: string;
  initialData?: Partial<PortalRoomFormData>;
  onSubmit: (data: PortalRoomFormData) => Promise<void>;
  submitLabel: string;
};

/* ─── Shared input styles ────────────────────────────────────────────────── */
const inputCls = (err?: string) =>
  `w-full h-10 px-3 border rounded text-sm outline-none transition-colors placeholder:text-[#bbb] ${
    err
      ? "border-red-400 focus:border-red-500"
      : "border-[#ddd] focus:border-[var(--color-primary)]"
  }`;
const numCls = (err?: string) =>
  `h-10 px-3 border rounded text-sm outline-none w-20 text-center transition-colors ${
    err
      ? "border-red-400 focus:border-red-500"
      : "border-[#ddd] focus:border-[var(--color-primary)]"
  }`;
const labelCls = "block text-sm font-medium text-[#555] mb-1.5";
const errCls   = "text-xs text-red-500 mt-1";

const RENT_OPTS = RENT_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));
const ROOM_OPTS = ROOM_TYPE_OPTIONS.map((o) => ({ value: o, label: o }));
const DIR_OPTS  = DIRECTION_OPTIONS.map((o) => ({ value: o, label: o }));
const LEVEL_OPTS = LEVEL_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));
const LIFT_OPTS  = LIFT_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));

const DEFAULT_FORM: PortalRoomFormData = {
  name: "", cmyId: "", rentType: "1", minTenancy: "1",
  bedroom: "1", parlour: "1", bathroom: "1",
  roomType: "", direction: "", price: "", area: "",
  pledge: "1", pay: "1", floor: "1", floors: "1",
  level: "2", lift: "1",
  description: "", cover: "", images: [], facilityIds: [],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#eee] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
        <span className="text-sm font-medium text-[#444]">{title}</span>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export default function PortalRoomForm({ title, initialData, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PortalRoomFormData>({ ...DEFAULT_FORM, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof PortalRoomFormData | string, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const formRef = useRef(form);
  formRef.current = form;
  const savedRef = useRef(false);

  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [facilities,  setFacilities]  = useState<FacilityOption[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const [uploadingCover,  setUploadingCover]  = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [coverError, setCoverError] = useState("");
  const coverRef  = useRef<HTMLInputElement | null>(null);
  const imagesRef = useRef<HTMLInputElement | null>(null);
  const initialCoverRef  = useRef(initialData?.cover ?? "");
  const initialImagesRef = useRef<string[]>(initialData?.images ?? []);

  const set = <K extends keyof PortalRoomFormData>(k: K, v: PortalRoomFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  /* 拉取所有小区 */
  useEffect(() => {
    setLoadingCommunities(true);
    portalRequest<{ success: boolean; data: CommunityOption[] }>(
      "/portal/communities?all=true", { silent: true }
    ).then((res) => { if (res.success) setCommunities(res.data); })
    .catch(() => {})
    .finally(() => setLoadingCommunities(false));
  }, []);

  /* 拉取设施 */
  useEffect(() => {
    portalRequest<{ success: boolean; data: FacilityOption[] }>(
      "/portal/facilities?all=true", { silent: true }
    ).then((res) => { if (res.success) setFacilities(res.data); })
    .catch(() => {});
  }, []);

  /* 离开时清理未提交的临时文件 */
  useEffect(() => {
    const deleteFile = (path: string, keepalive: boolean) => {
      const token = getPortalToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      fetch("/api/upload/avatar", {
        method: "DELETE", headers, body: JSON.stringify({ path }), keepalive,
      }).catch(() => {});
    };
    const deletePic = (path: string, keepalive: boolean) => {
      const token = getPortalToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      fetch("/api/upload/pictures", {
        method: "DELETE", headers, body: JSON.stringify({ path }), keepalive,
      }).catch(() => {});
    };
    const cleanup = (keepalive: boolean) => {
      if (savedRef.current) return;
      const f = formRef.current;
      const cover = f.cover.trim();
      if (cover && isManagedUploadPath(cover) && cover !== initialCoverRef.current.trim())
        deleteFile(cover, keepalive);
      for (const img of f.images)
        if (!initialImagesRef.current.includes(img) && isManagedUploadPath(img))
          deletePic(img, keepalive);
    };
    const onUnload = () => cleanup(true);
    window.addEventListener("beforeunload", onUnload);
    return () => { window.removeEventListener("beforeunload", onUnload); cleanup(false); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* 封面上传 */
  const coverPreviewUrl = resolveUploadedFileUrl(form.cover.trim());

  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const prev = form.cover.trim();
    setCoverError("");
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await portalRequest<{ success: boolean; data?: { path: string }; message?: string }>(
        "/upload/avatar", { method: "POST", formData: fd, silent: true }
      );
      if (!res.success || !res.data?.path) throw new Error(res.message || "封面上传失败");
      // 清除旧临时封面
      if (prev && isManagedUploadPath(prev) && prev !== initialCoverRef.current.trim())
        portalRequest("/upload/avatar", { method: "DELETE", json: { path: prev }, silent: true }).catch(() => {});
      set("cover", res.data.path);
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "封面上传失败");
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleClearCover() {
    const cover = form.cover.trim();
    if (cover && isManagedUploadPath(cover) && cover !== initialCoverRef.current.trim())
      portalRequest("/upload/avatar", { method: "DELETE", json: { path: cover }, silent: true }).catch(() => {});
    set("cover", "");
  }

  /* 多图上传 */
  async function handleImagesUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await portalRequest<{ success: boolean; data?: { path: string }; message?: string }>(
          "/upload/pictures", { method: "POST", formData: fd, silent: true }
        );
        if (res.success && res.data?.path) uploaded.push(res.data.path);
        else toast.error(res.message || "部分图片上传失败");
      }
      if (uploaded.length) set("images", [...form.images, ...uploaded]);
    } finally {
      setUploadingImages(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleRemoveImage(path: string) {
    if (!initialImagesRef.current.includes(path) && isManagedUploadPath(path))
      portalRequest("/upload/pictures", { method: "DELETE", json: { path }, silent: true }).catch(() => {});
    set("images", form.images.filter((p) => p !== path));
  }

  /* 设施切换 */
  const toggleFacility = (id: number) =>
    set("facilityIds", form.facilityIds.includes(id)
      ? form.facilityIds.filter((x) => x !== id)
      : [...form.facilityIds, id]);

  /* 小区选项 */
  const communityOpts = useMemo(
    () => communities.map((c) => ({ value: String(c.id), label: `${c.name} — ${c.district}` })),
    [communities]
  );

  /* 校验 */
  function validate() {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "请输入房源名称";
    if (!form.cmyId) e.cmyId = "请选择所属小区";
    if (!form.rentType) e.rentType = "请选择租赁类型";
    if (!form.roomType) e.roomType = "请选择房屋类型";
    if (!form.direction) e.direction = "请选择朝向";
    if (!form.price || Number(form.price) <= 0) e.price = "请输入有效价格";
    if (!form.area  || Number(form.area)  <= 0) e.area  = "请输入有效面积";
    if (!form.cover.trim()) e.cover = "请上传房源封面";
    if (form.images.length === 0) e.images = "请至少上传一张房源图片";
    if (form.facilityIds.length === 0) e.facilityIds = "请至少选择一项设施";
    const pay = Math.max(1, parseInt(form.pay) || 1);
    const ten = parseInt(form.minTenancy) || 0;
    if (ten <= 0 || ten % pay !== 0) e.minTenancy = `最短租期须为 ${pay} 个月的整数倍`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      savedRef.current = true;
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || uploadingCover || uploadingImages;

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

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* 基础信息 */}
        <Section title="基础信息">
          <div>
            <label className={labelCls}>房源名称 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputCls(errors.name)}
              placeholder="如：阳光精品两居室"
            />
            {errors.name && <p className={errCls}>{errors.name}</p>}
          </div>
        </Section>

        {/* 封面与图片 */}
        <Section title="房源图片">
          {/* 封面 */}
          <div>
            <label className={labelCls}>房源封面 <span className="text-red-500">*</span></label>
            <div className={`flex items-start gap-3 rounded border border-dashed p-4 ${errors.cover ? "border-red-400 bg-red-50/30" : "border-[#ddd] bg-[#fafafa]"}`}>
              <div className="w-20 h-14 rounded shrink-0 grid place-items-center overflow-hidden border border-[#eee] bg-white">
                {coverPreviewUrl
                  ? <img src={coverPreviewUrl} alt="封面" className="w-full h-full object-cover" />
                  : <ImagePlus className="w-5 h-5 text-[#ccc]" />
                }
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverRef.current?.click()}
                    className="h-7 px-3 text-xs border border-[#ddd] rounded text-[#555] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadingCover ? "上传中…" : "上传封面"}
                  </button>
                  {form.cover && (
                    <button type="button" onClick={handleClearCover} className="text-xs text-[#999] hover:text-[#555] cursor-pointer transition-colors">
                      清除
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#aaa]">支持 JPG、PNG、WEBP，建议 16:9，不超过 5 MB</p>
                {coverError && <p className={errCls}>{coverError}</p>}
              </div>
            </div>
            <input ref={coverRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCoverUpload} className="hidden" />
            {errors.cover && <p className={errCls}>{errors.cover}</p>}
          </div>

          {/* 多图 */}
          <div>
            <label className={labelCls}>更多图片 <span className="text-red-500">*</span></label>
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                {form.images.map((path) => (
                  <div key={path} className="relative group aspect-square rounded overflow-hidden border border-[#eee]">
                    <img src={resolveUploadedFileUrl(path)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(path)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={uploadingImages}
                onClick={() => imagesRef.current?.click()}
                className="h-8 px-3 text-xs border border-[#ddd] rounded text-[#555] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {uploadingImages ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {uploadingImages ? "上传中…" : "添加图片"}
              </button>
              <span className="text-xs text-[#aaa]">已上传 {form.images.length} 张</span>
            </div>
            <input ref={imagesRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImagesUpload} className="hidden" />
            {errors.images && <p className={errCls}>{errors.images}</p>}
          </div>
        </Section>

        {/* 所属小区 */}
        <Section title="所属小区">
          <div>
            <label className={labelCls}>选择小区 <span className="text-red-500">*</span></label>
            <FilterSelect
              value={form.cmyId}
              onChange={(v) => set("cmyId", v)}
              options={communityOpts}
              placeholder={loadingCommunities ? "加载中…" : `请选择小区（共 ${communities.length} 个）`}
              error={errors.cmyId}
              disabled={loadingCommunities}
              className="w-full"
            />
            {errors.cmyId && <p className={errCls}>{errors.cmyId}</p>}
            <p className="text-xs text-[#aaa] mt-1.5">
              找不到小区？可先去
              <button type="button" onClick={() => router.push("/portal/account/community/new")}
                className="text-[var(--color-primary)] underline cursor-pointer mx-0.5">
                创建小区
              </button>
              再回来发布房源。
            </p>
          </div>
        </Section>

        {/* 租房信息 */}
        <Section title="租房信息">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>租赁类型 <span className="text-red-500">*</span></label>
              <FilterSelect value={form.rentType} onChange={(v) => set("rentType", v)} clearable={false} options={RENT_OPTS} className="w-full" error={errors.rentType} />
              {errors.rentType && <p className={errCls}>{errors.rentType}</p>}
            </div>
            <div>
              <label className={labelCls}>房屋类型 <span className="text-red-500">*</span></label>
              <FilterSelect value={form.roomType} onChange={(v) => set("roomType", v)} options={ROOM_OPTS} placeholder="请选择" className="w-full" error={errors.roomType} />
              {errors.roomType && <p className={errCls}>{errors.roomType}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>户型</label>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="number" min="0" max="10" value={form.bedroom}  onChange={(e) => set("bedroom",  e.target.value)} className={numCls()} />
              <span className="text-sm text-[#888]">室</span>
              <input type="number" min="0" max="10" value={form.parlour}  onChange={(e) => set("parlour",  e.target.value)} className={numCls()} />
              <span className="text-sm text-[#888]">厅</span>
              <input type="number" min="0" max="10" value={form.bathroom} onChange={(e) => set("bathroom", e.target.value)} className={numCls()} />
              <span className="text-sm text-[#888]">卫</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>面积（㎡）<span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={form.area} onChange={(e) => set("area", e.target.value)} className={`${inputCls(errors.area)} flex-1`} placeholder="如：85" />
                <span className="text-sm text-[#888] shrink-0">㎡</span>
              </div>
              {errors.area && <p className={errCls}>{errors.area}</p>}
            </div>
            <div>
              <label className={labelCls}>朝向 <span className="text-red-500">*</span></label>
              <FilterSelect value={form.direction} onChange={(v) => set("direction", v)} options={DIR_OPTS} placeholder="请选择" className="w-full" error={errors.direction} />
              {errors.direction && <p className={errCls}>{errors.direction}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>租金与押付 <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} className={`${numCls(errors.price)} w-28`} placeholder="月租金" />
                <span className="text-sm text-[#888] shrink-0">元/月</span>
              </div>
              <span className="text-[#ccc]">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#888] shrink-0">押</span>
                <input type="number" min="1" max="12" value={form.pledge} onChange={(e) => set("pledge", e.target.value)} className={numCls()} />
                <span className="text-sm text-[#888] shrink-0">付</span>
                <input type="number" min="1" max="12" value={form.pay} onChange={(e) => {
                  setForm((f) => ({ ...f, pay: e.target.value, minTenancy: e.target.value }));
                }} className={numCls()} />
              </div>
            </div>
            {errors.price && <p className={errCls}>{errors.price}</p>}
          </div>

          <div>
            <label className={labelCls}>楼层信息</label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[#888] shrink-0">第</span>
                <input type="number" min="1" max="200" value={form.floor} onChange={(e) => set("floor", e.target.value)} className={numCls()} />
                <span className="text-sm text-[#888] shrink-0">层，共</span>
                <input type="number" min="1" max="200" value={form.floors} onChange={(e) => set("floors", e.target.value)} className={numCls()} />
                <span className="text-sm text-[#888] shrink-0">层</span>
              </div>
              <FilterSelect value={form.level} onChange={(v) => set("level", v)} clearable={false} options={LEVEL_OPTS} placeholder="楼层段" className="w-28" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>电梯</label>
              <FilterSelect value={form.lift} onChange={(v) => set("lift", v)} clearable={false} options={LIFT_OPTS} placeholder="请选择" className="w-full" />
            </div>
            <div>
              <label className={labelCls}>最短租期（月）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={form.pay}
                  step={form.pay}
                  value={form.minTenancy}
                  onChange={(e) => {
                    set("minTenancy", e.target.value);
                    const pay = Math.max(1, parseInt(form.pay) || 1);
                    const val = parseInt(e.target.value) || 0;
                    setErrors((prev) => ({
                      ...prev,
                      minTenancy: val > 0 && val % pay === 0 ? undefined : `须为 ${pay} 个月的整数倍`,
                    }));
                  }}
                  className={`${inputCls(errors.minTenancy)} flex-1`}
                />
                <span className="text-sm text-[#888] shrink-0">月</span>
              </div>
              {errors.minTenancy && <p className={errCls}>{errors.minTenancy}</p>}
            </div>
          </div>
        </Section>

        {/* 房屋设施 */}
        <Section title="房屋设施">
          {facilities.length === 0 ? (
            <p className="text-sm text-[#aaa]">暂无设施数据</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {facilities.map((f) => {
                const sel = form.facilityIds.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacility(f.id)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded border transition-colors cursor-pointer ${
                      sel
                        ? "bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)] border-[var(--color-primary)]/40"
                        : "bg-[#fafafa] border-[#eee] text-[#555] hover:border-[#aaa] hover:bg-white"
                    }`}
                  >
                    <i className={`${FONT_FAMILY} ${f.icon} text-[22px]`} />
                    <span className="text-xs leading-tight text-center">{f.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {errors.facilityIds && <p className={errCls}>{errors.facilityIds}</p>}
        </Section>

        {/* 房源描述 */}
        <Section title="房源描述（选填）">
          <RichEditor
            value={form.description}
            onChange={(v) => set("description", v)}
            height={220}
          />
        </Section>

        {/* 操作按钮 */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={busy}
            className="h-10 px-6 border border-[#ddd] text-[#666] text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-10 px-8 bg-[var(--color-primary)] text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>

      </form>
    </div>
  );
}
