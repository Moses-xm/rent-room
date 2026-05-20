"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { fmtDateTime } from "@/utils/format";
import { NOTIFICATION_TYPE_LABEL, NOTIFICATION_TYPE_COLOR } from "@/utils/constants";

type NotificationItem = {
  id: number;
  type: number;
  title: string;
  content: string;
  relatedType: string | null;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
};

type ApiResp = {
  success: boolean;
  data: NotificationItem[];
  total: number;
  totalPages: number;
};

export default function NotificationPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 选中集合
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // 展开的通知 ID（查看详情）
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 各操作 loading
  const [batchLoading, setBatchLoading] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [singleLoading, setSingleLoading] = useState<number | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await portalRequest<ApiResp>(
        `/portal/notification?page=${p}&limit=20`
      );
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch {
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  // ── 单条：展开 + 自动标已读 ─────────────────────────────
  async function handleExpand(item: NotificationItem) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    if (!item.isRead) {
      setSingleLoading(item.id);
      try {
        await portalRequest(`/portal/notification/${item.id}`, { method: "PATCH" });
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      } catch {
      } finally {
        setSingleLoading(null);
      }
    }
  }

  // ── 单条：删除 ───────────────────────────────────────────
  async function handleDeleteOne(id: number) {
    setSingleLoading(id);
    try {
      await portalRequest(`/portal/notification/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((n) => n.id !== id));
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
      if (expandedId === id) setExpandedId(null);
      setTotal((t) => t - 1);
      toast.success("已删除");
    } catch {
    } finally {
      setSingleLoading(null);
    }
  }

  // ── 全选 / 取消全选 ────────────────────────────────────
  function toggleSelectAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((n) => n.id)));
    }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  // ── 批量标已读 ─────────────────────────────────────────
  async function handleBatchMarkRead() {
    if (selected.size === 0) { toast.error("请先选择通知"); return; }
    setBatchLoading(true);
    try {
      await portalRequest("/portal/notification/batch", {
        method: "POST",
        json: { action: "markRead", ids: Array.from(selected) },
      });
      setItems((prev) =>
        prev.map((n) => (selected.has(n.id) ? { ...n, isRead: true } : n))
      );
      setSelected(new Set());
      toast.success("已标记为已读");
    } catch {
    } finally {
      setBatchLoading(false);
    }
  }

  // ── 批量删除 ────────────────────────────────────────────
  async function handleBatchDelete() {
    if (selected.size === 0) { toast.error("请先选择通知"); return; }
    setBatchLoading(true);
    try {
      await portalRequest("/portal/notification/batch", {
        method: "POST",
        json: { action: "delete", ids: Array.from(selected) },
      });
      const ids = selected;
      setItems((prev) => prev.filter((n) => !ids.has(n.id)));
      setTotal((t) => t - ids.size);
      setSelected(new Set());
      if (expandedId !== null && ids.has(expandedId)) setExpandedId(null);
      toast.success(`已删除 ${ids.size} 条通知`);
    } catch {
    } finally {
      setBatchLoading(false);
    }
  }

  // ── 全部标已读 ──────────────────────────────────────────
  async function handleMarkAll() {
    setMarkAllLoading(true);
    try {
      await portalRequest("/portal/notification", { method: "PATCH" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("已全部标记为已读");
    } catch {
    } finally {
      setMarkAllLoading(false);
    }
  }

  // ── 清空全部 ────────────────────────────────────────────
  async function handleClearAll() {
    if (!confirm("确认清空全部通知？此操作不可恢复。")) return;
    setClearLoading(true);
    try {
      await portalRequest("/portal/notification", { method: "DELETE" });
      setItems([]);
      setTotal(0);
      setSelected(new Set());
      setExpandedId(null);
      toast.success("已清空全部通知");
    } catch {
    } finally {
      setClearLoading(false);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;
  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <MineShell title="我的通知">
      {/* ── 工具栏 ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 px-4 lg:px-5 py-3 border-b border-[#eee] bg-surface">
        {/* 全选复选框 */}
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-text-2 select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            disabled={items.length === 0}
            className="w-4 h-4 accent-primary"
          />
          全选
        </label>

        {selected.size > 0 && (
          <span className="text-xs text-text-muted">已选 {selected.size} 条</span>
        )}

        <div className="flex flex-wrap gap-2 ml-auto">
          <button
            onClick={handleBatchMarkRead}
            disabled={selected.size === 0 || batchLoading}
            className="h-7 px-3 text-xs border border-border rounded cursor-pointer hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            批量已读
          </button>
          <button
            onClick={handleBatchDelete}
            disabled={selected.size === 0 || batchLoading}
            className="h-7 px-3 text-xs border border-border rounded cursor-pointer hover:border-red-400 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            批量删除
          </button>
          <button
            onClick={handleMarkAll}
            disabled={markAllLoading || unreadCount === 0}
            className="h-7 px-3 text-xs border border-border rounded cursor-pointer hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            {markAllLoading ? "处理中…" : "全部已读"}
          </button>
          <button
            onClick={handleClearAll}
            disabled={clearLoading || items.length === 0}
            className="h-7 px-3 text-xs border border-red-200 text-red-400 rounded cursor-pointer hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            {clearLoading ? "清空中…" : "清空"}
          </button>
        </div>
      </div>

      {/* ── 未读徽章提示 ────────────────────────────────────── */}
      {hasLoaded && unreadCount > 0 && (
        <div className="px-5 py-2 text-xs text-text-muted bg-[#fffbf0] border-b border-[#f5e8b0]">
          你有 <span className="text-(--color-accent) font-medium">{unreadCount}</span> 条未读通知
        </div>
      )}

      {/* ── 骨架屏 ────────────────────────────────────────────── */}
      {loading && !hasLoaded && (
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-4 border-b border-[#f5f5f5]">
              <div className="skeleton-shimmer w-4 h-4 rounded mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-4 w-2/3 rounded" />
                <div className="skeleton-shimmer h-3 w-1/2 rounded" />
              </div>
              <div className="skeleton-shimmer h-3 w-20 rounded shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* ── 空态 ──────────────────────────────────────────────── */}
      {hasLoaded && items.length === 0 && (
        <div className="py-20 text-center text-text-muted text-sm">暂无通知</div>
      )}

      {/* ── 通知列表 ───────────────────────────────────────────── */}
      {hasLoaded && items.length > 0 && (
        <div>
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const isSelected = selected.has(item.id);
            const typeColor = NOTIFICATION_TYPE_COLOR[item.type] ?? "bg-gray-100 text-gray-500";
            const typeLabel = NOTIFICATION_TYPE_LABEL[item.type] ?? "通知";
            const isSingleLoading = singleLoading === item.id;

            return (
              <div
                key={item.id}
                className={`border-b border-[#f0f0f0] transition-colors ${
                  item.isRead ? "bg-white" : "bg-[#fffcf5]"
                } ${isExpanded ? "border-b-primary/20" : ""}`}
              >
                {/* 通知行 */}
                <div className="flex items-start gap-3 px-4 lg:px-5 py-3.5">
                  {/* 复选框 */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    className="w-4 h-4 mt-1 accent-primary shrink-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* 未读圆点 */}
                  <span
                    className={`mt-2 w-2 h-2 rounded-full shrink-0 ${
                      item.isRead ? "bg-transparent" : "bg-(--color-accent)"
                    }`}
                  />

                  {/* 主体内容，点击展开 */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleExpand(item)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${typeColor}`}>
                        {typeLabel}
                      </span>
                      <span
                        className={`text-sm truncate flex-1 min-w-0 ${
                          item.isRead ? "text-text-2" : "text-text font-medium"
                        }`}
                      >
                        {item.title}
                      </span>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-text-muted mt-1 truncate leading-relaxed">
                        {item.content}
                      </p>
                    )}
                  </div>

                  {/* 时间 + 操作 */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="hidden sm:block text-xs text-text-muted whitespace-nowrap">
                      {fmtDateTime(item.createdAt)}
                    </span>
                    <button
                      onClick={() => handleDeleteOne(item.id)}
                      disabled={isSingleLoading}
                      className="text-xs text-[#ccc] hover:text-red-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                      title="删除"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 展开的详情区域 */}
                {isExpanded && (
                  <div className="px-12 lg:px-14 pb-4">
                    <div className="text-xs text-text-muted mb-2 sm:hidden">
                      {fmtDateTime(item.createdAt)}
                    </div>
                    <div className="bg-[#f9f9f9] rounded p-3 text-sm text-text-2 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </div>
                    {item.relatedType && item.relatedId && (
                      <div className="mt-2 text-xs text-text-muted">
                        关联：{item.relatedType} #{item.relatedId}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      {!item.isRead && (
                        <button
                          onClick={async () => {
                            setSingleLoading(item.id);
                            try {
                              await portalRequest(`/portal/notification/${item.id}`, { method: "PATCH" });
                              setItems((prev) =>
                                prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
                              );
                            } catch {
                            } finally {
                              setSingleLoading(null);
                            }
                          }}
                          disabled={isSingleLoading}
                          className="text-xs text-primary hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          标为已读
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(null)}
                        className="text-xs text-text-muted hover:text-text cursor-pointer"
                      >
                        收起
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 分页 ──────────────────────────────────────────────── */}
      {hasLoaded && total > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 border-t border-[#eee]">
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1}
            className="px-3 h-8 border border-border text-sm rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary hover:text-primary"
          >
            上一页
          </button>
          <span className="text-sm text-text-muted">{page} / {totalPages}</span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= totalPages}
            className="px-3 h-8 border border-border text-sm rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 hover:border-primary hover:text-primary"
          >
            下一页
          </button>
        </div>
      )}
    </MineShell>
  );
}
