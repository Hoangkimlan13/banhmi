"use client";

import { useEffect, useRef } from "react";
import styles from "../styles/OrderList.module.css";

type OrderListProps = {
  orders: any[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  onNotify?: (message: string, type?: "success" | "error") => void;
};

export default function OrderList({ orders, selectedOrderId, onSelectOrder, onNotify }: OrderListProps) {
  // Lưu trữ danh sách các job_id đã được bắn thông báo lỗi trước đó
  const alertedJobIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!onNotify || !orders) return;

    orders.forEach((order) => {
      const printJobs = order.tbl_print_jobs || [];
      
      printJobs.forEach((job: any) => {
        if (job.status === "FAILED") {
          const jobIdStr = String(job.id);

          // Nếu job này chưa từng được thông báo lỗi trước đó
          if (!alertedJobIdsRef.current.has(jobIdStr)) {
            alertedJobIdsRef.current.add(jobIdStr);

            const orderNum = order.order_number ?? order.id;
            const errorMsg = job.last_error ? `(${job.last_error})` : "";

            onNotify(
              `注文番号 #${orderNum} 印刷エラーが発生しました ${errorMsg}`, 
              "error"
            );
          }
        }
      });
    });
  }, [orders, onNotify]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  };

  const getTotalQuantity = (items: any[]) => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  return (
    <div className={styles.orderListContainer}>
      <div className={styles.orderListHeader}>
        <span>本日の注文</span>
        <span className={styles.dateBadge}>{orders.length}件</span>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined">receipt_long</span>
          <p className={styles.emptyText}>本日の注文はまだありません</p>
        </div>
      ) : (
        <div className={styles.orderItems}>
          {orders.map((order: any) => {
            const selected = String(order.id) === String(selectedOrderId);
            const totalQty = getTotalQuantity(order.tbl_customer_order_items);
            
            const isPaid = order.status === "PAID";
            const isCancelled = order.status === "CANCELLED" || order.status === "PAYMENT_FAILED";

            const printJobs = order.tbl_print_jobs || [];
            const hasFailedPrint = printJobs.some((job: any) => job.status === "FAILED");
            const allPrinted = printJobs.length > 0 && printJobs.every((job: any) => job.status === "PRINTED");
            const failedJob = printJobs.find((job: any) => job.status === "FAILED");

            const isScheduled = order.order_type && order.order_type !== "IMMEDIATE";

            return (
              <button
                key={String(order.id)}
                type="button"
                className={`${styles.orderItemCard} ${selected ? styles.selected : ""}`}
                onClick={() => onSelectOrder(order.id)}
              >
                <div className={styles.orderItemTop}>
                  <div className={styles.orderIdGroup}>
                    <span className={styles.orderLabel}>呼び出し番号</span>
                    <span className={styles.orderNumber}>#{order.order_number ?? order.id}</span>
                  </div>
                  <span className={styles.orderPrice}>
                    ¥{Number(order.total_amount).toLocaleString("ja-JP")}
                  </span>
                </div>

                {isScheduled && (
                  <div className={styles.orderTypeRow}>
                    <span className={`${styles.typeBadge} ${styles.badgeScheduled}`}>
                      <span className="material-symbols-outlined">event_upcoming</span>
                      予約注文 ({formatTime(order.scheduled_for)})
                    </span>
                  </div>
                )}

                <div className={styles.orderItemMiddle}>
                  <div className={styles.timeGroup}>
                    <span className="material-symbols-outlined">schedule</span>
                    <span className={styles.orderTime}>注文: {formatTime(order.created_at)}</span>
                  </div>
                  <div className={styles.itemSummary}>
                    <span className="material-symbols-outlined">shopping_bag</span>
                    <span>商品 {totalQty}点</span>
                  </div>
                </div>

                <div className={styles.orderItemBottom}>
                  {isPaid ? (
                    <span className={`${styles.badge} ${styles.badgePaid}`}>
                      <span className="material-symbols-outlined">check_circle</span>
                      支払済
                    </span>
                  ) : isCancelled ? (
                    <span className={`${styles.badge} ${styles.badgeCancelled}`}>
                      <span className="material-symbols-outlined">cancel</span>
                      取消
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeUnpaid}`}>
                      <span className="material-symbols-outlined">hourglass_top</span>
                      未払
                    </span>
                  )}

                  {hasFailedPrint ? (
                    <span 
                      className={`${styles.badge} ${styles.badgePrintFailed}`} 
                      title={failedJob?.last_error ? `エラー: ${failedJob.last_error}` : "プリンターエラー"}
                    >
                      <span className="material-symbols-outlined">error</span>
                      印刷エラー
                    </span>
                  ) : allPrinted ? (
                    <span className={`${styles.badge} ${styles.badgePrinted}`}>
                      <span className="material-symbols-outlined">print</span>
                      印刷済
                    </span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeNotPrinted}`}>
                      <span className="material-symbols-outlined">print_disabled</span>
                      印刷待ち
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}