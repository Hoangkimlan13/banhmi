"use client";

import React from "react";
import {
  Clock,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

import styles from "./ReservationCard.module.css";

import type {
  Reservation,
  ReservationStatus,
} from "./reservation.types";

interface ReservationCardProps {
  item: Reservation;
  dateTime: {
    dayLabel: string;
    time: string;
    dateKey: string;
  } | null;
  isLoading: boolean;
  onStatusChange: (id: number, status: ReservationStatus) => void;
  onSelect: (item: Reservation) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function ReservationCard({
  item,
  dateTime,
  isLoading,
  onStatusChange,
  onSelect,
  getStatusBadge,
}: ReservationCardProps) {
  if (!item) {
    return null;
  }

  const isToday = dateTime?.dayLabel === "今日";

  return (
    <article
      onClick={() => onSelect(item)}
      className={`${styles.card} ${isToday ? styles.todayCard : ""}`}
    >
      {/* 1. HEADER: THỜI GIAN LỊCH HẸN */}
      <div className={`${styles.cardHeader} ${isToday ? styles.todayHeader : ""}`}>
        <div className={styles.headerLeft}>
          <span className={`${styles.dayBadge} ${isToday ? styles.todayBadge : ""}`}>
            {dateTime?.dayLabel ?? "---"}
          </span>
          <div className={styles.timeWrapper}>
            <Clock size={15} />
            <span>{dateTime?.time ?? "---"}</span>
          </div>
        </div>

        {/* Trạng thái đơn ở góc trên */}
        <div>{getStatusBadge(item.status)}</div>
      </div>

      {/* 2. BODY: NỔI BẬT MÃ SỐ, KHÁCH HÀNG & TỔNG TIỀN */}
      <div className={styles.cardBody}>
        {/* Khối Mã số đơn hàng làm nổi bật */}
        <div className={styles.orderBox}>
          <span className={styles.orderLabel}>呼び出し番号：</span>
          <strong className={styles.orderNumber}>
            #{item.order_number || "---"}
          </strong>
        </div>

        {/* Thông tin khách hàng & Tổng tiền */}
        <div className={styles.infoRow}>
          <div className={styles.customerGroup}>
            <div className={styles.avatarBox}>
              <User size={18} />
            </div>
            <div className={styles.customerDetails}>
              <span className={styles.customerName}>
                {item.customer_name || "ゲスト様"} 様
              </span>
              <span className={styles.customerPhone}>
                <Phone size={12} />
                {item.customer_phone || "---"}
              </span>
            </div>
          </div>

          <div className={styles.amountGroup}>
            <span className={styles.amountLabel}>合計</span>
            <strong className={styles.amountValue}>
              ¥{Number(item.total_amount || 0).toLocaleString("ja-JP")}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. FOOTER: NÚT THAO TÁC */}
      <div
        className={styles.cardFooter}
        onClick={(e) => e.stopPropagation()}
      >
        {item.status === "WAITING_PAYMENT" && (
          <div className={styles.actionButtonsGroup}>
            <button
              type="button"
              className={`${styles.btnPrimary} ${isLoading ? styles.btnDisabled : ""}`}
              disabled={isLoading}
              onClick={() => onStatusChange(item.id, "PAID")}
            >
              {isLoading ? (
                <Loader2 size={15} className={styles.spinnerIcon} />
              ) : (
                <CheckCircle2 size={15} />
              )}
              支払済に更新
            </button>

            <button
              type="button"
              className={`${styles.btnDanger} ${isLoading ? styles.btnDisabled : ""}`}
              disabled={isLoading}
              onClick={() => onStatusChange(item.id, "CANCELLED")}
            >
              <XCircle size={15} />
              キャンセル
            </button>
          </div>
        )}

        {item.status === "PAID" && (
          <span className={styles.statusBadgeSuccess}>
            <CheckCircle2 size={15} />
            支払済
          </span>
        )}

        {(item.status === "CANCELLED" || item.status === "PAYMENT_FAILED") && (
          <span className={styles.statusBadgeDanger}>
            <XCircle size={15} />
            キャンセル済み
          </span>
        )}

        {item.status === "COMPLETED" && (
          <span className={styles.statusBadgeSuccess}>
            <CheckCircle2 size={15} />
            受け取り完了
          </span>
        )}
      </div>
    </article>
  );
}