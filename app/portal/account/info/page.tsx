"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { resolveUploadedFileUrl } from "@/lib/upload-path";
import { fmtDate } from "@/utils/format";
import { GENDER_LABEL, IDENTITY_LABEL } from "@/utils/constants";

type UserInfo = {
  id: number;
  username: string;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  gender: number;
  identity: number;
  avatar: string | null;
  wallet: number;
  createdAt: string;
};

export default function AccountInfoPage() {
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nickname: "", phone: "", email: "", gender: 3 });

  useEffect(() => {
    portalRequest<{ success: boolean; data: UserInfo }>("/portal/account/info")
      .then((res) => {
        setInfo(res.data);
        setForm({
          nickname: res.data.nickname ?? "",
          phone: res.data.phone ?? "",
          email: res.data.email ?? "",
          gender: res.data.gender,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await portalRequest<{ success: boolean; data: UserInfo }>(
        "/portal/account/info",
        { method: "PUT", json: form }
      );
      setInfo(res.data);
      setEditing(false);
      toast.success("资料已更新");
    } catch {
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = resolveUploadedFileUrl(info?.avatar);

  return (
    <MineShell title="我的资料">
      {loading ? (
        <div className="p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex h-16 border-b border-[#eee] items-center gap-4">
              <div className="skeleton-shimmer w-20 h-4 rounded" />
              <div className="skeleton-shimmer flex-1 h-4 rounded max-w-48" />
            </div>
          ))}
        </div>
      ) : !info ? (
        <div className="p-10 text-center text-text-muted">加载失败，请刷新重试</div>
      ) : (
        <>
          {/* 头像区 */}
          <div className="flex items-center gap-4 px-6 py-5 border-b border-[#eee]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={info.nickname ?? info.username}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-semibold">
                {(info.nickname ?? info.username).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium text-text">{info.nickname ?? info.username}</div>
              <div className="text-sm text-text-muted mt-0.5">
                {IDENTITY_LABEL[info.identity] ?? "普通用户"}
              </div>
            </div>
          </div>

          {/* 信息列表 */}
          {!editing ? (
            <>
              {[
                { label: "用户名", value: info.username },
                { label: "昵称", value: info.nickname || "—" },
                { label: "手机", value: info.phone || "—" },
                { label: "邮箱", value: info.email || "—" },
                { label: "性别", value: GENDER_LABEL[info.gender] ?? "—" },
                { label: "余额", value: `¥${info.wallet.toFixed(2)}` },
                { label: "注册时间", value: fmtDate(info.createdAt) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center h-16 px-6 border-b border-[#eee] text-sm"
                >
                  <span className="w-20 text-text-muted shrink-0">{label}</span>
                  <span className="text-text">{value}</span>
                </div>
              ))}
              <div className="px-6 py-5">
                <button
                  onClick={() => setEditing(true)}
                  className="h-9 px-6 bg-primary text-white text-sm rounded cursor-pointer hover:bg-primary-dark transition-colors"
                >
                  编辑资料
                </button>
              </div>
            </>
          ) : (
            <div className="px-6 py-5 space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-text-muted mb-1">昵称</label>
                <input
                  value={form.nickname}
                  onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                  placeholder="请输入昵称"
                  className="w-full h-9 px-3 border border-border rounded text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">手机号</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="请输入手机号"
                  className="w-full h-9 px-3 border border-border rounded text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">邮箱</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="请输入邮箱"
                  className="w-full h-9 px-3 border border-border rounded text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">性别</label>
                <div className="flex gap-4">
                  {[{ v: 1, l: "男" }, { v: 2, l: "女" }, { v: 3, l: "保密" }].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="gender"
                        value={v}
                        checked={form.gender === v}
                        onChange={() => setForm((f) => ({ ...f, gender: v }))}
                        className="accent-primary"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 px-6 bg-primary text-white text-sm rounded cursor-pointer hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                  {saving ? "保存中…" : "保存"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="h-9 px-6 border border-border text-text-2 text-sm rounded cursor-pointer hover:bg-surface transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </MineShell>
  );
}
