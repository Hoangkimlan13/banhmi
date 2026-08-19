"use client";

import { useState } from "react";
import OrderDetailModal from "./OrderDetailModal"; // Import component Modal vừa tách
import styles from "../styles/history-table.module.css"; 

export default function HistoryTable({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "COMPLETED":
        return (
          <span className={`${styles.badge} ${styles.badgePaid}`}>
            <span className="material-symbols-outlined">check_circle</span>
            支払済
          </span>
        );
      case "CANCELLED":
      case "PAYMENT_FAILED":
        return (
          <span className={`${styles.badge} ${styles.badgeCancelled}`}>
            <span className="material-symbols-outlined">cancel</span>
            取消
          </span>
        );
      case "WAITING_PAYMENT":
        return (
          <span className={`${styles.badge} ${styles.badgeUnpaid}`}>
            <span className="material-symbols-outlined">hourglass_top</span>
            未払
          </span>
        );
      default:
        return (
          <span className={`${styles.badge} ${styles.badgeDefault}`}>
            {status}
          </span>
        );
    }
  };

  const isScheduledOrder = (orderType: string) => {
    return orderType && orderType.includes("SCHEDULED");
  };

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>選択した日付の注文履歴はありません。</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.cardListContainer}>
        {orders.map((order) => {
          const isReserved = isScheduledOrder(order.order_type);

          return (
            <div
              key={order.id.toString()}
              className={`${styles.orderCard} ${isReserved ? styles.reservedCard : ""}`}
              onClick={() => setSelectedOrder(order)}
            >
              {/* Header: Thời gian, Nhãn ご予約 và Trạng thái */}
              <div className={styles.cardHeader}>
                <div className={styles.timeAndBadge}>
                  <span className={styles.orderTime}>
                    <span className="material-symbols-outlined">schedule</span>
                    {formatTime(order.created_at)}
                  </span>
                  {isReserved && (
                    <span className={styles.reservationBadge}>
                      ご予約
                    </span>
                  )}
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Body: Số thứ tự đơn */}
              <div className={styles.cardBody}>
                <div className={styles.orderMainInfo}>
                  <span className={styles.orderNumber}>
                    呼び出し番号: {order.order_number || "---"}
                  </span>
                </div>
              </div>

              {/* Footer: Tổng tiền & Nút xem chi tiết */}
              <div className={styles.cardFooter}>
                <div className={styles.totalAmount}>
                  <span className={styles.amountLabel}>合計</span>
                  <span className={styles.amountValue}>
                    ￥{Number(order.total_amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className={styles.detailAction}>
                  <span>詳細</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gọi Modal Component đã tách */}
      <OrderDetailModal
        selectedOrder={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        formatTime={formatTime}
        getStatusBadge={getStatusBadge}
      />
    </>
  );
}