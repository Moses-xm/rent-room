"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MineShell } from "@/components/portal/MineShell";
import { portalRequest } from "@/utils/portal-request";
import { fmtDate } from "@/utils/format";
import { ORDER_TYPE_OPTIONS, ORDER_TYPE_STYLE, MINE_SKELETON_ROWS } from "@/utils/constants";
import Pagination from "@/components/Pagination";
import ConfirmDialog from "@/components/ConfirmDialog";

type OrderItem = {
  id: number;
  roomId: number;
  roomName: string;
  roomCoverUrl: string | null;
  contractId: number;
  type: number;
  fee: number | null;
  pledge: number | null;
  paidPeriod: string | null;
  createdAt: string;
};

function orderTypeLabel(t: number) {
  return ORDER_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "—";
}

const COLS = "grid-cols-[2fr_1fr_1fr_120px]";

function ListSkeleton() {
  return (
    <>
      <div className="hidden lg:block">
        {Array.from({ length: MINE_SKELETON_ROWS }).map((_, i) => (
          <div key={i} className={`grid ${COLS} px-5 py-4 border-b border-[#eee] items-center gap-3`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="skeleton-shimmer w-16 h-12 rounded shrink-0" />
              <div className="skeleton-shimmer flex-1 h-4 rounded" />
            </div>
            <div className="skeleton-shimmer h-5 w-14 rounded-full" />
            <div className="skeleton-shimmer h-4 w-20 rounded" />
            <div className="flex gap-2">
              <div className="skeleton-shimmer h-4 w-12 rounded" />
              <div className="skeleton-shimmer h-4 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="lg:hidden space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-[#eee] rounded p-3 space-y-2">
            <div className="flex gap-3">
              <div className="skeleton-shimmer w-20 h-15 rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-4 w-3/4 rounded" />
                <div className="skeleton-shimmer h-4 w-1/2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function OrdersPage() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (p: number, l: number) => {
    setLoading(true);
    try {
      const res = await portalRequest<{
        success: boolean;
        data: OrderItem[];
        total: number;
        totalPages: number;
      }>(`/portal/account/orders?page=${p}&limit=${l}`);
      setItems(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setPage(p);
      setLimit(l);
    } catch {
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => { load(1, 10); }, [load]);

  async function handleDelete() {
    if (deleteConfirmId === null) return;
    setDeleting(true);
    try {
      await portalRequest(`/portal/account/orders?id=${deleteConfirmId}`, { method: "DELETE" });
      toast.success("已删除");
      setDeleteConfirmId(null);
      load(page, limit);
    } catch {
    } finally {
      setDeleting(false);
    }
  }

  return (
    <MineShell title="我的订单">
      {/* 桌面端表头 */}
      <div className={`hidden lg:grid ${COLS} gap-3 text-sm text-text-muted px-5 py-3 border-b border-[#eee] bg-surface`}>
        <span>房源</span>
        <span>订单类型</span>
        <span>支付金额</span>
        <span>操作</span>
      </div>

      {/* 骨架屏 */}
      {loading && !hasLoaded && <ListSkeleton />}

      {hasLoaded && items.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">暂无订单记录</div>
      )}

      {hasLoaded && items.length > 0 && (
        <>
          {/* 桌面端 */}
          <div className="hidden lg:block">
            {items.map((item) => (
              <div
                key={item.id}
                className={`grid ${COLS} gap-3 px-5 py-4 border-b border-[#eee] items-center text-sm hover:bg-surface`}
              >
                {/* 房源列 */}
                <Link href={`/portal/room/${item.roomId}`} className="flex items-center gap-3 group min-w-0">
                  {item.roomCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.roomCoverUrl} alt={item.roomName} className="w-16 h-12 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-surface-2 rounded shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-text group-hover:text-(--color-accent) group-hover:underline">{item.roomName}</div>
                    <div className="text-xs text-text-muted mt-0.5">{fmtDate(item.createdAt)}</div>
                  </div>
                </Link>

                {/* 订单类型 */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs w-fit ${ORDER_TYPE_STYLE[item.type] ?? ""}`}>
                  {orderTypeLabel(item.type)}
                </span>

                {/* 支付金额 */}
                <div>
                  {item.type === 3 ? (
                    <p className="text-(--color-accent-dark) font-medium">
                      ¥{(item.pledge ?? 0).toFixed(2)}
                    </p>
                  ) : (
                    <>
                      <p className="text-(--color-accent-dark) font-medium">
                        ¥{(item.fee ?? 0).toFixed(2)}
                      </p>
                      {item.pledge != null && item.pledge > 0 && (
                        <p className="text-xs text-text-muted mt-0.5">押金 ¥{item.pledge.toFixed(2)}</p>
                      )}
                    </>
                  )}
                </div>

                {/* 操作 */}
                <div className="flex items-center gap-0.5">
                  <Link
                    href={`/portal/account/orders/${item.id}`}
                    title="查看详情"
                    className="w-8 h-8 rounded grid place-items-center text-text-muted hover:text-primary hover:bg-surface transition-colors"
                  >
                    <Eye size={15} />
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    title="删除"
                    className="w-8 h-8 rounded grid place-items-center text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 移动端卡片 */}
          <div className="lg:hidden space-y-3 p-4">
            {items.map((item) => (
              <div key={item.id} className="border border-[#eee] rounded p-3">
                <div className="flex gap-3">
                  {item.roomCoverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.roomCoverUrl} alt={item.roomName} className="w-20 h-15 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-20 h-15 bg-surface-2 rounded shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/portal/room/${item.roomId}`}
                        className="font-medium text-sm text-text hover:text-(--color-accent) truncate"
                      >
                        {item.roomName}
                      </Link>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs ${ORDER_TYPE_STYLE[item.type] ?? ""}`}>
                        {orderTypeLabel(item.type)}
                      </span>
                    </div>
                    <div className="mt-1">
                      {item.type === 3 ? (
                        <span className="text-sm text-(--color-accent-dark) font-medium">¥{(item.pledge ?? 0).toFixed(2)}</span>
                      ) : (
                        <>
                          <span className="text-sm text-(--color-accent-dark) font-medium">¥{(item.fee ?? 0).toFixed(2)}</span>
                          {item.pledge != null && item.pledge > 0 && (
                            <span className="text-xs text-text-muted ml-2">押金 ¥{item.pledge.toFixed(2)}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#f5f5f5]">
                  <span className="text-xs text-text-muted">{fmtDate(item.createdAt)}</span>
                  <div className="flex items-center gap-0.5">
                    <Link
                      href={`/portal/account/orders/${item.id}`}
                      title="查看详情"
                      className="w-8 h-8 rounded grid place-items-center text-text-muted hover:text-primary hover:bg-surface transition-colors"
                    >
                      <Eye size={15} />
                    </Link>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      title="删除"
                      className="w-8 h-8 rounded grid place-items-center text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasLoaded && total > 0 && (
        <Pagination
          page={page}
          pageSize={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={(p) => load(p, limit)}
          onPageSizeChange={(l) => load(1, l)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="删除订单记录"
        description="确认删除该订单记录吗？仅对自己隐藏，不影响实际交易。"
        confirmText="删除"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirmId(null)}
      />
    </MineShell>
  );
}
