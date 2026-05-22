"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, BadgeCheck, Home, Building2, FileText, CalendarCheck, Star, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import FilterSelect from "@/components/FilterSelect";
import {
  getPortalProfile, setPortalProfile,
} from "@/utils/portal-auth";
import { getPortalCity, getPortalProvince } from "@/utils/portal-city";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { fmtDate } from "@/utils/format";
import { MUNICIPALITY_PROVINCES } from "@/utils/constants";
import areaData from "@/localData/area.json";

/* ─── Types ────────────────────────────────────────────────────────────────── */
type UserInfo = {
  id: number;
  username: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  gender: number;
  identity: number;
  avatar: string | null;
  createdAt: string;
};

type AreaOption = { label: string; value: string };

/* ─── Styles ───────────────────────────────────────────────────────────────── */
const inputCls = (err?: string) =>
  `w-full h-10 px-3 border rounded text-sm outline-none transition-colors placeholder:text-[#bbb] ${
    err
      ? "border-red-400 focus:border-red-500"
      : "border-[#ddd] focus:border-[var(--color-primary)]"
  }`;

const labelCls = "block text-sm font-medium text-[#555] mb-1.5";
const errCls = "text-xs text-red-500 mt-1";

/* ─── Already-landlord view ─────────────────────────────────────────────────── */
function LandlordAlreadyView({ info }: { info: UserInfo }) {
  const avatarUrl = resolveUploadedFileUrl(info.avatar);
  const displayName = info.nickname ?? info.username;

  const perks = [
    { icon: Home,         label: "发布房源", desc: "上架自有房源，快速招租",           href: "/portal/account/room" },
    { icon: Building2,    label: "创建小区", desc: "管理名下小区，关联多套房源",       href: "/portal/account/community" },
    { icon: CalendarCheck,label: "收到的预约", desc: "查看租客对您房源提交的看房预约", href: "/portal/account/appointment?tab=landlord" },
    { icon: FileText,     label: "租客合同", desc: "查看租客签订的租赁合同详情",       href: "/portal/account/contract?tab=landlord" },
  ];

  return (
    <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8 items-start">
      {/* 左栏：认证徽章 + 账户信息 */}
      <div className="flex flex-col gap-5">
        {/* 头像 + 认证状态 */}
        <div className="flex flex-col items-center text-center p-6 bg-linear-to-br from-primary/8 to-primary/3 border border-primary/20 rounded-2xl">
          <div className="relative mb-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-semibold ring-4 ring-primary/20">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center ring-2 ring-white">
              <BadgeCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-base font-semibold text-[#222]">{displayName}</h2>
          <p className="text-xs text-[#888] mt-0.5 mb-4">注册于 {fmtDate(info.createdAt)}</p>
          <div className="flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">已完成房东认证</span>
          </div>
          <p className="text-xs text-[#666] mt-1.5 leading-relaxed">
            您已通过平台房东认证，可享受完整的房东权限。
          </p>
        </div>

        {/* 账户信息摘要 */}
        <div className="bg-[#fafafa] border border-[#eee] rounded-xl px-5 py-4 space-y-3">
          <p className="text-xs text-[#aaa] font-medium tracking-wider">账户信息</p>
          {[
            { label: "用户名", value: info.username },
            { label: "手机号", value: info.phone || "暂未填写" },
            { label: "邮箱",   value: info.email  || "暂未填写" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-[#888]">{label}</span>
              <span className="text-[#444] font-medium truncate ml-4 max-w-[60%] text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 右栏：专属功能入口 */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-[#444]">房东专属功能</p>
        <div className="grid grid-cols-2 gap-3">
          {perks.map(({ icon: Icon, label, desc, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 p-4 lg:p-5 bg-[#fafafa] hover:bg-primary/5 border border-[#eee] hover:border-primary/30 rounded-xl transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <ChevronRight className="w-4 h-4 text-[#ccc] group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#333] group-hover:text-primary transition-colors">{label}</p>
                <p className="text-xs text-[#999] mt-1 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Verify form ──────────────────────────────────────────────────────────── */
function LandlordVerifyForm({ info }: { info: UserInfo }) {
  const router = useRouter();

  const initProvince = getPortalProvince();
  const initCity     = getPortalCity();

  const [form, setForm] = useState({
    phone:    info.phone    ?? "",
    email:    info.email    ?? "",
    realname: "",
    nickname: info.nickname ?? "",
    gender:   String(info.gender ?? 3),
    province: initProvince,
    city:     initCity,
    district: "",
    address:  "",
  });
  const [errors, setErrors]       = useState<Partial<typeof form>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  /* 区域级联 */
  const provinces = useMemo<AreaOption[]>(
    () => (areaData as { label: string; value: string }[]).map((p) => ({
      label: p.label, value: p.value,
    })),
    []
  );
  const cities = useMemo<AreaOption[]>(() => {
    if (!form.province) return [];
    const p = (areaData as { value: string; children?: { label: string; value: string }[] }[])
      .find((x) => x.value === form.province);
    return p?.children?.map((c) => ({ label: c.label, value: c.value })) ?? [];
  }, [form.province]);
  const districts = useMemo<AreaOption[]>(() => {
    if (!form.province || !form.city) return [];
    const p = (areaData as { value: string; children?: { value: string; children?: { label: string; value: string }[] }[] }[])
      .find((x) => x.value === form.province);
    const c = p?.children?.find((x) => x.value === form.city);
    return c?.children?.map((d) => ({ label: d.label, value: d.value })) ?? [];
  }, [form.province, form.city]);

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.phone.trim())    e.phone    = "手机号不能为空";
    if (!form.email.trim())    e.email    = "邮箱不能为空";
    if (!form.realname.trim()) e.realname = "真实姓名不能为空";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await portalRequest("/portal/account/verify-landlord", {
        method: "POST",
        json: {
          phone:    form.phone.trim(),
          email:    form.email.trim(),
          realname: form.realname.trim(),
          nickname: form.nickname.trim() || undefined,
          gender:   Number(form.gender),
          province: form.province || undefined,
          city:     form.city     || undefined,
          district: form.district || undefined,
          address:  form.address.trim() || undefined,
        },
      });
      const profile = getPortalProfile();
      if (profile) setPortalProfile({ ...profile, identity: 2 });
      toast.success("恭喜！您已成功认证为房东");
      router.push("/portal/account/room");
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-10 items-start">
      {/* 左栏：表单 */}
      <form onSubmit={handleSubmit} className="space-y-5 order-2 lg:order-1">
        {/* 用户名（只读展示） */}
        <div>
          <p className={labelCls}>用户名</p>
          <p className="text-sm text-[#333] h-10 flex items-center">{info.username}</p>
        </div>

        {/* 手机号 + 邮箱（PC 双列） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>手机号 <span className="text-red-500">*</span></label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="请输入手机号"
              className={inputCls(errors.phone)}
            />
            {errors.phone && <p className={errCls}>{errors.phone}</p>}
          </div>
          <div>
            <label className={labelCls}>邮箱 <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="请输入邮箱"
              className={inputCls(errors.email)}
            />
            {errors.email && <p className={errCls}>{errors.email}</p>}
          </div>
        </div>

        {/* 真实姓名 */}
        <div>
          <label className={labelCls}>真实姓名 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.realname}
            onChange={(e) => set("realname", e.target.value)}
            placeholder="请输入真实姓名"
            className={inputCls(errors.realname)}
          />
          {errors.realname && <p className={errCls}>{errors.realname}</p>}
        </div>

        {/* 分隔线 */}
        <div className="border-t border-[#f0f0f0] pt-4">
          <p className="text-xs text-[#aaa] mb-4">以下为选填信息</p>
          <div className="space-y-5">
            {/* 昵称 + 性别（PC 双列） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>昵称</label>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => set("nickname", e.target.value)}
                  placeholder="请输入昵称（可选）"
                  className={inputCls()}
                />
              </div>
              <div>
                <label className={labelCls}>性别</label>
                <div className="flex gap-6 h-10 items-center">
                  {[{ v: "1", l: "男" }, { v: "2", l: "女" }, { v: "3", l: "保密" }].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer text-sm text-[#555]">
                      <input
                        type="radio"
                        name="gender"
                        value={v}
                        checked={form.gender === v}
                        onChange={() => set("gender", v)}
                        className="w-4 h-4 accent-primary"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 省市区 */}
            <div>
              <label className={labelCls}>所在地区</label>
              <div className="grid grid-cols-3 gap-3">
                <FilterSelect
                  value={form.province}
                  onChange={(v) => { set("province", v); set("city", ""); set("district", ""); }}
                  options={provinces}
                  placeholder="省份"
                  className="w-full"
                />
                <FilterSelect
                  value={form.city}
                  onChange={(v) => {
                    const cityVal = MUNICIPALITY_PROVINCES.has(form.province) ? "市辖区" : v;
                    set("city", cityVal);
                    set("district", "");
                  }}
                  options={cities}
                  disabled={!form.province}
                  placeholder="城市"
                  className="w-full"
                />
                <FilterSelect
                  value={form.district}
                  onChange={(v) => set("district", v)}
                  options={districts}
                  disabled={!form.city}
                  placeholder="区/县"
                  className="w-full"
                />
              </div>
              {(form.province || form.city) && (
                <p className="text-xs text-[#aaa] mt-1.5">
                  已根据您当前选择的城市自动填充，可手动修改
                </p>
              )}
            </div>

            {/* 详细地址 */}
            <div>
              <label className={labelCls}>详细地址</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="请输入详细地址（可选）"
                className={inputCls()}
              />
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="h-10 px-6 border border-[#ddd] text-[#666] text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-10 px-8 bg-[var(--color-primary)] text-white text-sm rounded cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            提交认证
          </button>
        </div>
      </form>

      {/* 右栏：认证说明 */}
      <aside className="flex flex-col gap-4 order-1 lg:order-2 lg:sticky lg:top-6">
        <div className="p-4 lg:p-5 bg-primary/5 border border-primary/15 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-semibold text-primary">完成房东认证</p>
          </div>
          <p className="text-xs text-[#666] leading-relaxed">
            认证后即可发布房源、创建小区，享受完整房东权限。标注{" "}
            <span className="text-red-500">*</span> 的为必填项。
          </p>
          {/* 权益列表：移动端横排 2 列，桌面竖排 */}
          <ul className="mt-3 grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-2.5">
            {[
              { icon: Home,      text: "发布并管理自有房源" },
              { icon: Building2, text: "创建小区，关联多套房源" },
              { icon: FileText,  text: "签订与跟踪租赁合同" },
              { icon: Star,      text: "访问房东专属数据看板" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-xs text-[#555]">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* 温馨提示：移动端隐藏，桌面显示 */}
        <div className="hidden lg:block p-4 bg-[#fffbf0] border border-[#ffe58f] rounded-xl">
          <p className="text-xs font-medium text-[#ad6800] mb-1">温馨提示</p>
          <p className="text-xs text-[#8a6100] leading-relaxed">
            请填写真实信息，平台将对提交内容进行审核。认证成功后身份将同步更新。
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────────────── */
function LandlordSkeleton() {
  return (
    <MineShell title="房东认证">
      <div className="px-6 py-8 max-w-lg space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton-shimmer-warm w-20 h-20 rounded-full" />
          <div className="skeleton-shimmer h-4 w-28 rounded" />
          <div className="skeleton-shimmer h-3 w-20 rounded opacity-60" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton-shimmer h-3.5 w-16 rounded" />
            <div className="skeleton-shimmer h-10 w-full rounded" />
          </div>
        ))}
      </div>
    </MineShell>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function LandlordVerifyPage() {
  const [info, setInfo]     = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalRequest<{ success: boolean; data: UserInfo }>("/portal/account/info")
      .then((res) => setInfo(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LandlordSkeleton />;
  if (!info)   return null;

  const isLandlord = info.identity === 2;

  return (
    <MineShell title="房东认证">
      {isLandlord
        ? <LandlordAlreadyView info={info} />
        : <LandlordVerifyForm  info={info} />
      }
    </MineShell>
  );
}
