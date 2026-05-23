"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // 模拟网络请求延迟
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 800);
  }

  if (submitted) {
    return (
      <div className="max-w-lg flex flex-col items-center py-10 gap-4">
        {/* 圆形勾号动画 */}
        <div className="relative w-16 h-16">
          <svg
            viewBox="0 0 64 64"
            className="w-full h-full"
            style={{ animation: "successCircle 0.5s ease-out forwards" }}
          >
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeDasharray="188"
              strokeDashoffset="188"
              style={{ animation: "drawCircle 0.5s ease-out 0.1s forwards" }}
            />
            <polyline
              points="18,33 28,43 46,24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="40"
              strokeDashoffset="40"
              style={{ animation: "drawCheck 0.35s ease-out 0.55s forwards" }}
            />
          </svg>
        </div>

        <p className="text-base font-semibold text-[var(--color-text)]"
          style={{ animation: "fadeSlideUp 0.4s ease-out 0.7s both" }}
        >
          留言提交成功
        </p>
        <p className="text-sm text-[var(--color-text-muted)] text-center"
          style={{ animation: "fadeSlideUp 0.4s ease-out 0.85s both" }}
        >
          感谢您的反馈，我们会在 3 个工作日内与您联系
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] underline cursor-pointer transition-colors"
          style={{ animation: "fadeSlideUp 0.4s ease-out 1s both" }}
        >
          再次留言
        </button>

        <style>{`
          @keyframes drawCircle {
            to { stroke-dashoffset: 0; }
          }
          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <form className="space-y-4 max-w-lg" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs text-[var(--color-text-2)] mb-1">您的姓名</label>
        <input
          type="text"
          placeholder="请输入姓名"
          className="w-full h-9 px-3 text-sm border border-[var(--color-border)] rounded outline-none focus:border-[var(--color-primary)] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--color-text-2)] mb-1">联系方式</label>
        <input
          type="text"
          placeholder="手机号或邮箱"
          className="w-full h-9 px-3 text-sm border border-[var(--color-border)] rounded outline-none focus:border-[var(--color-primary)] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--color-text-2)] mb-1">留言内容</label>
        <textarea
          rows={4}
          placeholder="请描述您的问题或建议..."
          className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="h-9 px-6 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm rounded cursor-pointer transition-colors flex items-center gap-2"
      >
        {submitting && (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
          </svg>
        )}
        {submitting ? "提交中…" : "提交留言"}
      </button>
    </form>
  );
}
