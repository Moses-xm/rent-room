"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import FilterSelect from "@/components/FilterSelect";
import { getPortalProfile, setPortalProfile } from "@/utils/portal-auth";
import areaData from "@/localData/area.json";
import { useMemo } from "react";
import { MUNICIPALITY_PROVINCES } from "@/utils/constants";

/* ─── Shared styles ──────────────────────────────────────────────────────── */
const inputCls = (err?: string) =>
  `w-full h-10 px-3 border rounded text-sm outline-none transition-colors placeholder:text-[#bbb] ${
    err
      ? "border-red-400 focus:border-red-500"
      : "border-[#ddd] focus:border-[var(--color-primary)]"
  }`;
const labelCls = "block text-sm font-medium text-[#555] mb-1.5";
const errCls   = "text-xs text-red-500 mt-1";

type AreaOption = { label: string; value: string };

export default function LandlordVerifyPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    phone: "", email: "", realname: "",
    nickname: "", gender: "3",
    province: "", city: "", district: "", address: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
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

  /* 若已是房东则跳走 */
  useEffect(() => {
    const profile = getPortalProfile();
    if (profile?.identity === 2) {
      router.replace("/portal/account/room");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          city:     form.city || undefined,
          district: form.district || undefined,
          address:  form.address.trim() || undefined,
        },
      });
      // 更新本地 profile 的 identity
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
    <MineShell title="房东认证">
      <div className="px-6 py-6 max-w-lg">
        <p className="text-sm text-[#888] mb-6 leading-relaxed">
          填写以下信息完成房东认证，认证后即可发布房源和创建小区。
          标注 <span className="text-red-500">*</span> 的为必填项。
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 必填 */}
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
                <div className="flex gap-6 mt-1">
                  {[{ v: "1", l: "男" }, { v: "2", l: "女" }, { v: "3", l: "保密" }].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer text-sm text-[#555]">
                      <input
                        type="radio"
                        name="gender"
                        value={v}
                        checked={form.gender === v}
                        onChange={() => set("gender", v)}
                        className="w-4 h-4 accent-[var(--color-primary)]"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              {/* 省市区 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>省份</label>
                  <FilterSelect
                    value={form.province}
                    onChange={(v) => { set("province", v); set("city", ""); set("district", ""); }}
                    options={provinces}
                    placeholder="省份"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className={labelCls}>城市</label>
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
                </div>
                <div>
                  <label className={labelCls}>区/县</label>
                  <FilterSelect
                    value={form.district}
                    onChange={(v) => set("district", v)}
                    options={districts}
                    disabled={!form.city}
                    placeholder="区/县"
                    className="w-full"
                  />
                </div>
              </div>

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
      </div>
    </MineShell>
  );
}
