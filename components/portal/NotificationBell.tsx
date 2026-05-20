"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { portalRequest } from "@/utils/portal-request";
import { fmtDateTime } from "@/utils/format";
import { NOTIFICATION_TYPE_LABEL } from "@/utils/constants";

type NotificationItem = {
  id: number;
  type: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type ListResponse = {
  success: boolean;
  data: NotificationItem[];
  total: number;
  totalPages: number;
};

type ConfirmState =
  | { type: "single"; id: number; title: string }
  | { type: "all" }
  | null;

const LIMIT = 20;

const TYPE_COLOR: Record<number, string> = {
  1: "bg-sky-500",
  2: "bg-rose-500",
  3: "bg-emerald-500",
  4: "bg-violet-500",
  5: "bg-emerald-500",
  6: "bg-teal-500",
  7: "bg-amber-500",
  8: "bg-emerald-500",
  9: "bg-red-500",
  10: "bg-orange-500",
  11: "bg-slate-500",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await portalRequest<{ success: boolean; count: number }>(
        "/portal/notification/unread-count",
        { silent: true }
      );
      setUnread(res.count ?? 0);
    } catch {
      // 未登录时静默忽略
    }
  }, []);

  const fetchList = useCallback(async (p: number, append = false) => {
    setLoading(true);
    try {
      const res = await portalRequest<ListResponse>(
        `/portal/notification?page=${p}&limit=${LIMIT}`,
        { silent: true }
      );
      setTotal(res.total ?? 0);
      setList((prev) => (append ? [...prev, ...(res.data ?? [])] : (res.data ?? [])));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const timer = setInterval(fetchUnread, 60_000);
    return () => clearInterval(timer);
  }, [fetchUnread]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirm(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (!open) {
      setPage(1);
      fetchList(1);
    }
    setOpen((v) => !v);
    setConfirm(null);
  };

  const markRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    try {
      await portalRequest(`/portal/notification/${item.id}`, { method: "PATCH", silent: true });
      setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnread((v) => Math.max(0, v - 1));
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await portalRequest("/portal/notification", { method: "PATCH", silent: true });
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      // ignore
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "single") {
        await portalRequest(`/portal/notification/${confirm.id}`, { method: "DELETE", silent: true });
        const deleted = list.find((n) => n.id === confirm.id);
        setList((prev) => prev.filter((n) => n.id !== confirm.id));
        setTotal((v) => v - 1);
        if (deleted && !deleted.isRead) setUnread((v) => Math.max(0, v - 1));
      } else {
        await portalRequest("/portal/notification", { method: "DELETE", silent: true });
        setList([]);
        setTotal(0);
        setUnread(0);
      }
    } catch {
      // ignore
    } finally {
      setConfirm(null);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchList(next, true);
  };

  const hasMore = list.length < total;

  return (
    <div ref={panelRef} className="relative">
      {/* 铃铛按钮 */}
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 text-[#666] hover:text-[#333] cursor-pointer transition-colors"
        title="消息通知"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-[#e74c3c] text-white text-[10px] font-bold leading-4 rounded-full flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#e6e6e6] shadow-xl z-50 flex flex-col max-h-120">

          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] shrink-0">
            <span className="text-sm font-semibold text-[#333]">
              消息通知
              {total > 0 && <span className="ml-1.5 text-xs text-[#999] font-normal">共 {total} 条</span>}
            </span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-(--color-primary-brand) hover:opacity-75 cursor-pointer transition-opacity"
                >
                  全部已读
                </button>
              )}
              {total > 0 && (
                <button
                  onClick={() => setConfirm({ type: "all" })}
                  className="text-xs text-[#999] hover:text-[#e74c3c] cursor-pointer transition-colors"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {/* 列表 */}
          <div className="overflow-y-auto flex-1">
            {list.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#bbb]">
                <Bell className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-sm">暂无消息通知</span>
              </div>
            ) : (
              <>
                {list.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => markRead(item)}
                    className={`group relative flex gap-3 px-4 py-3 border-b border-[#f5f5f5] cursor-pointer transition-colors ${
                      item.isRead ? "bg-white hover:bg-[#fafafa]" : "bg-[#fffdf0] hover:bg-[#fff9e0]"
                    }`}
                  >
                    <div className="shrink-0 mt-1">
                      <span className={`block w-2 h-2 rounded-full ${TYPE_COLOR[item.type] ?? "bg-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          item.isRead ? "bg-[#f0f0f0] text-[#999]" : "bg-[#fff3cd] text-[#b8860b]"
                        }`}>
                          {NOTIFICATION_TYPE_LABEL[item.type] ?? "通知"}
                        </span>
                        {!item.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e74c3c] shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm leading-snug truncate ${item.isRead ? "text-[#555]" : "text-[#222] font-medium"}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-[#999] mt-0.5 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                      <p className="text-[10px] text-[#bbb] mt-1">
                        {fmtDateTime(item.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirm({ type: "single", id: item.id, title: item.title });
                      }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#ccc] hover:text-[#e74c3c] cursor-pointer mt-0.5"
                      title="删除"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-2.5 text-xs text-(--color-primary-brand) hover:bg-[#f9f9f9] cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {loading ? "加载中..." : "加载更多"}
                  </button>
                )}
                {loading && list.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#bbb]">加载中...</div>
                )}
              </>
            )}
          </div>

          {/* 二次确认覆盖层 */}
          {confirm && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
              <div className="mx-4 w-full bg-white border border-[#e6e6e6] shadow-lg rounded-lg p-5 text-center">
                <p className="text-sm font-semibold text-[#333] mb-1">
                  {confirm.type === "all" ? "清空全部通知？" : "删除该通知？"}
                </p>
                <p className="text-xs text-[#999] mb-4 leading-relaxed">
                  {confirm.type === "all"
                    ? "所有通知将被永久删除，无法恢复。"
                    : `「${confirm.title}」将被永久删除，无法恢复。`}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setConfirm(null)}
                    className="h-8 px-4 text-xs border border-[#d9d9d9] text-[#555] hover:bg-[#f5f5f5] transition-colors cursor-pointer rounded"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="h-8 px-4 text-xs bg-[#e74c3c] text-white hover:opacity-90 transition-opacity cursor-pointer rounded"
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
