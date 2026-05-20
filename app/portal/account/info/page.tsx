"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
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

type EditField = "nickname" | "phone" | "email" | "gender";

const FIELD_LABEL: Record<EditField, string> = {
  nickname: "昵称",
  phone:    "手机号",
  email:    "邮箱",
  gender:   "性别",
};

export default function AccountInfoPage() {
  const [info, setInfo]               = useState<UserInfo | null>(null);
  const [loading, setLoading]         = useState(true);
  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [fieldValue, setFieldValue]   = useState("");
  const [saving, setSaving]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    portalRequest<{ success: boolean; data: UserInfo }>("/portal/account/info")
      .then((res) => setInfo(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openModal(field: EditField) {
    if (!info) return;
    const v = field === "gender" ? String(info.gender) : (info[field] ?? "");
    setFieldValue(v);
    setEditingField(field);
    // 下一帧聚焦 input
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeModal() {
    setEditingField(null);
    setFieldValue("");
  }

  async function handleSave() {
    if (!info || !editingField) return;
    setSaving(true);
    try {
      const payload: Record<string, string | number> =
        editingField === "gender"
          ? { gender: parseInt(fieldValue) }
          : { [editingField]: fieldValue };
      const res = await portalRequest<{ success: boolean; data: UserInfo }>(
        "/portal/account/info",
        { method: "PUT", json: payload }
      );
      setInfo(res.data);
      closeModal();
      toast.success("修改成功");
    } catch {
    } finally {
      setSaving(false);
    }
  }

  const avatarUrl = resolveUploadedFileUrl(info?.avatar);

  return (
    <MineShell title="我的资料">
      {/* 骨架屏 */}
      {loading && (
        <div className="divide-y divide-[#eee]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center h-16 px-6 gap-4">
              <div className="skeleton-shimmer w-16 h-4 rounded shrink-0" />
              <div className="skeleton-shimmer flex-1 h-4 rounded max-w-48" />
            </div>
          ))}
        </div>
      )}

      {!loading && info && (
        <div className="divide-y divide-[#eee]">
          {/* 头像 */}
          <div className="flex items-center h-20 px-6 gap-4">
            <span className="w-24 text-sm text-text-muted shrink-0">头像</span>
            <div className="flex-1">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={info.nickname ?? info.username}
                  className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
                  {(info.nickname ?? info.username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <InfoRow label="用户名"  value={info.username} />
          <InfoRow label="身份"    value={IDENTITY_LABEL[info.identity] ?? "—"} />
          <InfoRow label="余额"    value={`¥${info.wallet.toFixed(2)}`} />
          <InfoRow label="注册时间" value={fmtDate(info.createdAt)} />

          <EditableRow label="昵称"   value={info.nickname || "—"}          onEdit={() => openModal("nickname")} />
          <EditableRow label="性别"   value={GENDER_LABEL[info.gender] ?? "—"} onEdit={() => openModal("gender")} />
          <EditableRow label="手机"   value={info.phone   || "暂未填写"}    onEdit={() => openModal("phone")} />
          <EditableRow label="邮箱"   value={info.email   || "暂未填写"}    onEdit={() => openModal("email")} />
        </div>
      )}

      {/* ── 编辑弹窗 ───────────────────────────────────────── */}
      {editingField && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-sm mx-4 overflow-hidden">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
              <span className="text-base font-medium text-text">
                修改{FIELD_LABEL[editingField]}
              </span>
              <button
                onClick={closeModal}
                className="text-text-muted hover:text-text cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 表单区 */}
            <div className="px-5 py-5">
              {editingField === "gender" ? (
                <div className="flex gap-6">
                  {[{ v: "1", l: "男" }, { v: "2", l: "女" }, { v: "3", l: "保密" }].map(({ v, l }) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="modal-gender"
                        value={v}
                        checked={fieldValue === v}
                        onChange={() => setFieldValue(v)}
                        className="w-4 h-4 accent-primary"
                      />
                      {l}
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  ref={inputRef}
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder={`请输入${FIELD_LABEL[editingField]}`}
                  className="w-full h-9 px-3 border border-border rounded text-sm outline-none focus:border-primary transition-colors"
                />
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2 px-5 pb-5">
              <button
                onClick={closeModal}
                className="h-9 px-5 border border-border text-text-2 text-sm rounded cursor-pointer hover:bg-surface transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-5 bg-primary text-white text-sm rounded cursor-pointer hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MineShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center h-16 px-6 gap-4">
      <span className="w-24 text-sm text-text-muted shrink-0">{label}</span>
      <span className="flex-1 text-sm text-text">{value}</span>
    </div>
  );
}

function EditableRow({
  label, value, onEdit,
}: {
  label: string; value: string; onEdit: () => void;
}) {
  return (
    <div className="flex items-center h-16 px-6 gap-4">
      <span className="w-24 text-sm text-text-muted shrink-0">{label}</span>
      <span className="flex-1 text-sm text-text">{value}</span>
      <button
        onClick={onEdit}
        className="shrink-0 h-7 px-4 border border-primary text-primary text-xs rounded cursor-pointer hover:bg-primary hover:text-white transition-colors"
      >
        修改
      </button>
    </div>
  );
}
