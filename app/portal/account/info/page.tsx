"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  X, Eye, EyeOff, Camera, Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MineShell } from "@/components/portal/MineShell";
import { Modal } from "@/components/Modal";
import { portalRequest } from "@/utils/portal-request";
import { resolveUploadedFileUrl, normalizeUploadPathForStorage } from "@/lib/upload-path";
import { fmtDate } from "@/utils/format";
import { GENDER_LABEL, IDENTITY_LABEL } from "@/utils/constants";
import { clearPortalAuth, getPortalProfile, setPortalProfile, PORTAL_LOGIN_PATH } from "@/utils/portal-auth";

/* ─── Types ───────────────────────────────────────────────────────────────── */
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

type EditField = "nickname" | "phone" | "email" | "gender";

const FIELD_LABEL: Record<EditField, string> = {
  nickname: "昵称",
  phone:    "手机号",
  email:    "邮箱",
  gender:   "性别",
};

/* ─── Change Password Modal ───────────────────────────────────────────────── */
function ChangePasswordModal({
  open, onClose, onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setShowNew(false);
      setShowConfirm(false);
      setError("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPwd) { setError("请输入当前密码"); return; }
    if (newPwd.length < 6) { setError("密码不能少于 6 位"); return; }
    if (newPwd !== confirmPwd) { setError("两次密码输入不一致"); return; }
    setError("");
    setSubmitting(true);
    try {
      await portalRequest("/portal/account/password", {
        method: "PUT",
        json: { currentPassword: currentPwd, newPassword: newPwd },
      });
      toast.success("密码修改成功，请重新登录");
      onSuccess();
    } catch {
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <span className="text-base font-medium text-text">修改密码</span>
          <button onClick={onClose} className="text-text-muted hover:text-text cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm text-text-2 font-medium block mb-1.5">当前密码</label>
            <input
              ref={inputRef}
              type="password"
              value={currentPwd}
              onChange={(e) => { setCurrentPwd(e.target.value); setError(""); }}
              placeholder="请输入当前密码"
              className="w-full h-9 px-3 text-sm border border-[#ddd] rounded outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-text-2 font-medium block mb-1.5">新密码</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setError(""); }}
                placeholder="请输入新密码（至少 6 位）"
                className="w-full h-9 pl-3 pr-9 text-sm border border-[#ddd] rounded outline-none focus:border-[var(--color-primary)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-text-2 font-medium block mb-1.5">确认新密码</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); setError(""); }}
                placeholder="再次输入新密码"
                className={`w-full h-9 pl-3 pr-9 text-sm border rounded outline-none transition-colors ${
                  error ? "border-red-400 focus:border-red-500" : "border-[#ddd] focus:border-[var(--color-primary)]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-9 text-sm border border-[#ddd] rounded text-text-2 hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-9 text-sm rounded font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "确认修改"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* ─── Edit Field Modal ────────────────────────────────────────────────────── */
function EditFieldModal({
  field, value, onClose, onSave,
}: {
  field: EditField;
  value: string;
  onClose: () => void;
  onSave: (val: string) => Promise<void>;
}) {
  const [fieldValue, setFieldValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(fieldValue);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={true} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
          <span className="text-base font-medium text-text">修改{FIELD_LABEL[field]}</span>
          <button onClick={onClose} className="text-text-muted hover:text-text cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          {field === "gender" ? (
            <div className="flex gap-6">
              {[{ v: "1", l: "男" }, { v: "2", l: "女" }, { v: "3", l: "保密" }].map(({ v, l }) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="modal-gender"
                    value={v}
                    checked={fieldValue === v}
                    onChange={() => setFieldValue(v)}
                    className="w-4 h-4 accent-[var(--color-primary)]"
                  />
                  {l}
                </label>
              ))}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={`请输入${FIELD_LABEL[field]}`}
              className="w-full h-9 px-3 border border-[#ddd] rounded text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="h-9 px-5 border border-[#ddd] text-text-2 text-sm rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 bg-[var(--color-primary)] text-white text-sm rounded cursor-pointer hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 transition-opacity"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AccountInfoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [info, setInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditField | null>(null);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);

  useEffect(() => {
    portalRequest<{ success: boolean; data: UserInfo }>("/portal/account/info")
      .then((res) => setInfo(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── Avatar upload ── */
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await portalRequest<{ success: boolean; data: { path: string } }>(
        "/upload/avatar",
        { method: "POST", formData: form }
      );
      const storagePath = normalizeUploadPathForStorage(uploadRes.data.path);
      const res = await portalRequest<{ success: boolean; data: UserInfo }>(
        "/portal/account/info",
        { method: "PUT", json: { avatar: storagePath } }
      );
      setInfo(res.data);
      const profile = getPortalProfile();
      if (profile) setPortalProfile({ ...profile, avatar: storagePath });
      setAvatarPreviewOpen(false);
      toast.success("头像已更新");
    } catch {
      toast.error("头像上传失败");
    } finally {
      setUploading(false);
    }
  }

  /* ── Field save ── */
  async function handleFieldSave(field: EditField, val: string) {
    const payload: Record<string, string | number> =
      field === "gender" ? { gender: parseInt(val) } : { [field]: val };
    const res = await portalRequest<{ success: boolean; data: UserInfo }>(
      "/portal/account/info",
      { method: "PUT", json: payload }
    );
    setInfo(res.data);
    setEditingField(null);
    if (field === "nickname") {
      const profile = getPortalProfile();
      if (profile) setPortalProfile({ ...profile, nickname: val || undefined });
    }
    toast.success("修改成功");
  }

  /* ── Password change success → force logout ── */
  function handlePasswordChanged() {
    clearPortalAuth();
    router.replace(PORTAL_LOGIN_PATH);
  }

  const avatarUrl = resolveUploadedFileUrl(info?.avatar ?? null);
  const displayName = info?.nickname ?? info?.username ?? "";

  /* ── Skeleton ── */
  if (loading) {
    return (
      <MineShell title="我的资料">
        <div className="px-6 py-5 space-y-8">
          {/* 头像行 */}
          <div className="flex items-center gap-4">
            <div className="w-20 shrink-0" />
            <div className="flex-1">
              <div className="skeleton-shimmer-warm w-14 h-14 rounded-full" />
            </div>
            <div className="skeleton-shimmer w-14 h-7 rounded shrink-0" />
          </div>
          {/* 用户名 / 注册时间 / 身份 — 纯展示行 */}
          {[72, 56, 48].map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton-shimmer w-20 h-4 rounded shrink-0" />
              <div className={`skeleton-shimmer h-4 rounded`} style={{ width: w }} />
            </div>
          ))}
          {/* 昵称 / 性别 / 手机 / 邮箱 — 可编辑行（含修改按钮） */}
          {[80, 40, 96, 112].map((w, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton-shimmer w-20 h-4 rounded shrink-0" />
              <div className="flex-1">
                <div className="skeleton-shimmer h-4 rounded" style={{ width: w }} />
              </div>
              <div className="skeleton-shimmer w-14 h-7 rounded shrink-0" />
            </div>
          ))}
          {/* 登录密码行 */}
          <div className="flex items-center gap-4">
            <div className="skeleton-shimmer w-20 h-4 rounded shrink-0" />
            <div className="skeleton-shimmer w-24 h-7 rounded" />
          </div>
        </div>
      </MineShell>
    );
  }

  if (!info) return null;

  return (
    <MineShell title="我的资料">
      <div className="px-6 py-5">
        {/* ── 信息列表 ── */}
        <div className="space-y-8">
          {/* 头像行 */}
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-text-muted shrink-0">头像</span>
            <div className="flex-1">
              <button
                onClick={() => setAvatarPreviewOpen(true)}
                className="relative w-14 h-14 rounded-full overflow-hidden group cursor-pointer shrink-0"
                title="查看头像"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            </div>
            <button
              onClick={() => setAvatarPreviewOpen(true)}
              className="shrink-0 h-7 px-4 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs rounded cursor-pointer hover:bg-[var(--color-primary)] hover:text-white transition-colors"
            >
              修改
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <InfoItem label="用户名"  value={info.username} />
          <InfoItem label="注册时间" value={fmtDate(info.createdAt)} />
          <InfoItem label="身份"    value={IDENTITY_LABEL[info.identity] ?? "—"} />

          <EditableItem label="昵称"  value={info.nickname || "—"}            onEdit={() => setEditingField("nickname")} />
          <EditableItem label="性别"  value={GENDER_LABEL[info.gender] ?? "—"} onEdit={() => setEditingField("gender")} />
          <EditableItem label="手机"  value={info.phone || "暂未填写"}         onEdit={() => setEditingField("phone")} />
          <EditableItem label="邮箱"  value={info.email || "暂未填写"}         onEdit={() => setEditingField("email")} />

          {/* 修改密码 */}
          <div className="flex items-center gap-4">
            <span className="w-20 text-sm text-text-muted shrink-0">登录密码</span>
            <button
              onClick={() => setChangePwdOpen(true)}
              className="h-7 px-4 border border-[#ddd] text-text-2 text-xs rounded cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3 h-3" />
              修改密码
            </button>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {editingField && (
        <EditFieldModal
          field={editingField}
          value={editingField === "gender" ? String(info.gender) : (info[editingField] ?? "")}
          onClose={() => setEditingField(null)}
          onSave={(val) => handleFieldSave(editingField, val)}
        />
      )}

      <ChangePasswordModal
        open={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
        onSuccess={handlePasswordChanged}
      />

      {/* 头像预览弹窗 */}
      <Modal open={avatarPreviewOpen} onClose={() => setAvatarPreviewOpen(false)}>
        <div
          className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#eee]">
            <span className="text-base font-medium text-[#333]">头像</span>
            <button
              onClick={() => setAvatarPreviewOpen(false)}
              className="text-[#999] hover:text-[#333] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-center py-10 bg-[#fafafa]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-44 h-44 rounded-full object-cover"
              />
            ) : (
              <div className="w-44 h-44 rounded-full bg-primary flex items-center justify-center text-white text-6xl font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="px-5 py-4 border-t border-[#eee]">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-9 bg-primary text-white text-sm rounded cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {uploading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Camera className="w-4 h-4" />修改头像</>
              }
            </button>
          </div>
        </div>
      </Modal>
    </MineShell>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-sm text-text-muted shrink-0">{label}</span>
      <span className="flex-1 text-sm text-text">{value}</span>
    </div>
  );
}

function EditableItem({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-sm text-text-muted shrink-0">{label}</span>
      <span className="flex-1 text-sm text-text">{value}</span>
      <button
        onClick={onEdit}
        className="shrink-0 h-7 px-4 border border-[var(--color-primary)] text-[var(--color-primary)] text-xs rounded cursor-pointer hover:bg-[var(--color-primary)] hover:text-white transition-colors"
      >
        修改
      </button>
    </div>
  );
}
