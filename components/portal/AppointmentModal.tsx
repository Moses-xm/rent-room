"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Loader2 } from "lucide-react";

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (appointmentTime: string, remark: string) => Promise<void>;
}

export function AppointmentModal({ open, onClose, onSubmit }: AppointmentModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({});

  function validate() {
    const e: { date?: string; time?: string } = {};
    if (!date) e.date = "请选择预约日期";
    if (!time) e.time = "请选择预约时间";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(`${date}T${time}:00`, remark.trim());
      // reset on success
      setDate("");
      setTime("");
      setRemark("");
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setDate("");
    setTime("");
    setRemark("");
    setErrors({});
    onClose();
  }

  // 最小可选日期为明天
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  // 最远可选日期为 90 天后
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  return (
    <Modal open={open} onClose={handleClose}>
      <div
        className="bg-white w-full max-w-md rounded-sm overflow-y-auto animate-in zoom-in-95 duration-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-medium text-text">预约看房</h3>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-text-muted hover:text-text transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        {/* 表单 */}
        <div className="px-6 py-5 space-y-4">
          {/* 预约日期 */}
          <div>
            <label className="block text-sm text-text-2 mb-1.5">
              预约日期<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="date"
              value={date}
              min={minDateStr}
              max={maxDateStr}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              className={`w-full h-10 px-3 border rounded-sm text-sm text-text bg-white focus:outline-none focus:border-primary transition-colors cursor-pointer ${
                errors.date ? "border-red-400" : "border-border"
              }`}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* 预约时间 */}
          <div>
            <label className="block text-sm text-text-2 mb-1.5">
              预约时间<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setErrors((prev) => ({ ...prev, time: undefined }));
              }}
              className={`w-full h-10 px-3 border rounded-sm text-sm text-text bg-white focus:outline-none focus:border-primary transition-colors cursor-pointer ${
                errors.time ? "border-red-400" : "border-border"
              }`}
            />
            {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm text-text-2 mb-1.5">备注（选填）</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="例如：上午 10 点前有空，请提前确认"
              className="w-full px-3 py-2 border border-border rounded-sm text-sm text-text bg-white focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 h-10 border border-border text-text-2 text-sm rounded-sm hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-10 bg-[var(--color-primary)] text-white text-sm rounded-sm hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-1.5"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            确定预约
          </button>
        </div>
      </div>
    </Modal>
  );
}
