"use client";

import { useState, useMemo } from "react";

import ReservationCard from "./ReservationCard";
import ReservationModal from "./ReservationModal";

import { updateReservationStatus } from "./actions";

import type {
  Reservation,
  ReservationStatus,
} from "./reservation.types";

import styles from "./reservations.module.css";

interface ReservationsClientProps {
  initialReservations: Reservation[];
}

// Cải tiến hàm getDateTime để hiển thị chuẩn: 今日, 明日, hoặc M月D日 (曜日)
function getDateTime(value: string | Date | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const timeZone = "Asia/Tokyo";

  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  // Tính ngày mai (Tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  // Nhãn ngày thông minh: 今日, 明日, hoặc dạng "8月20日 (木)"
  let dayLabel = "";
  if (dateKey === todayKey) {
    dayLabel = "今日";
  } else if (dateKey === tomorrowKey) {
    dayLabel = "明日";
  } else {
    const monthDay = new Intl.DateTimeFormat("ja-JP", {
      timeZone,
      month: "numeric",
      day: "numeric",
    }).format(date);

    const weekday = new Intl.DateTimeFormat("ja-JP", {
      timeZone,
      weekday: "short",
    }).format(date);

    dayLabel = `${monthDay} (${weekday})`;
  }

  const time = new Intl.DateTimeFormat("ja-JP", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return {
    dayLabel,
    time,
    dateKey,
  };
}

function getStatusBadge(status: string): React.ReactNode {
  switch (status) {
    case "WAITING_PAYMENT":
      return <span className={styles.waitingBadge}>支払待ち</span>;

    case "PAID":
      return <span className={styles.paidBadge}>支払済</span>;

    case "CANCELLED":
      return <span className={styles.cancelledBadge}>キャンセル</span>;

    case "PAYMENT_FAILED":
      return <span className={styles.cancelledBadge}>支払失敗</span>;

    case "COMPLETED":
      return <span className={styles.completedBadge}>完了</span>;

    default:
      return <span className={styles.statusBadge}>{status || "---"}</span>;
  }
}

export default function ReservationsClient({
  initialReservations,
}: ReservationsClientProps) {
  const [reservations, setReservations] = useState<Reservation[]>(
    Array.isArray(initialReservations)
      ? initialReservations.filter(Boolean)
      : []
  );

  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);

  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Bộ lọc trạng thái đơn trên Header
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  async function handleStatusChange(
    orderId: number,
    newStatus: ReservationStatus
  ) {
    if (loadingId !== null) {
      return;
    }

    try {
      setLoadingId(orderId);

      const result = await updateReservationStatus(orderId, newStatus);

      if (!result.success) {
        alert(
          result.message || "ステータスの更新に失敗しました。"
        );
        return;
      }

      setReservations((current) =>
        current
          .filter(Boolean)
          .map((item) => {
            if (item.id === orderId) {
              return {
                ...item,
                status: newStatus,
              };
            }
            return item;
          })
      );

      setSelectedReservation((current) => {
        if (!current || current.id !== orderId) {
          return current;
        }
        return {
          ...current,
          status: newStatus,
        };
      });
    } catch (error) {
      console.error("[ReservationsClient] Status update failed:", error);
      alert("ステータスの更新に失敗しました。");
    } finally {
      setLoadingId(null);
    }
  }

  const safeReservations = reservations.filter(
    (item): item is Reservation => item != null
  );

  // Tính toán số lượng đơn cho từng trạng thái
  const counts = useMemo(() => {
    return {
      all: safeReservations.length,
      waitingPayment: safeReservations.filter(
        (i) => i.status === "WAITING_PAYMENT"
      ).length,
      paid: safeReservations.filter((i) => i.status === "PAID").length,
      completed: safeReservations.filter(
        (i) => i.status === "COMPLETED"
      ).length,
      cancelled: safeReservations.filter(
        (i) => i.status === "CANCELLED" || i.status === "PAYMENT_FAILED"
      ).length,
    };
  }, [safeReservations]);

  // Lọc danh sách theo Tab đang chọn
  const filteredReservations = useMemo(() => {
    if (filterStatus === "ALL") return safeReservations;
    if (filterStatus === "CANCELLED") {
      return safeReservations.filter(
        (item) =>
          item.status === "CANCELLED" || item.status === "PAYMENT_FAILED"
      );
    }
    return safeReservations.filter((item) => item.status === filterStatus);
  }, [safeReservations, filterStatus]);

  return (
    <div className={styles.pageContainer}>
      {/* HEADER QUẢN LÝ */}
      <header className={styles.pageHeader}>
        <div className={styles.headerTitleArea}>
          <h1 className={styles.pageTitle}>予約管理</h1>
          <span className={styles.totalBadge}>
            合計: {safeReservations.length} 予約
          </span>
        </div>

        {/* Thanh lọc trạng thái nhanh */}
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${
              filterStatus === "ALL" ? styles.activeTab : ""
            }`}
            onClick={() => setFilterStatus("ALL")}
          >
            すべて ({counts.all})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${
              filterStatus === "WAITING_PAYMENT" ? styles.activeTab : ""
            }`}
            onClick={() => setFilterStatus("WAITING_PAYMENT")}
          >
            支払待ち ({counts.waitingPayment})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${
              filterStatus === "PAID" ? styles.activeTab : ""
            }`}
            onClick={() => setFilterStatus("PAID")}
          >
            支払済 ({counts.paid})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${
              filterStatus === "COMPLETED" ? styles.activeTab : ""
            }`}
            onClick={() => setFilterStatus("COMPLETED")}
          >
            完了 ({counts.completed})
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${
              filterStatus === "CANCELLED" ? styles.activeTab : ""
            }`}
            onClick={() => setFilterStatus("CANCELLED")}
          >
            キャンセル ({counts.cancelled})
          </button>
        </div>
      </header>

      {/* DANH SÁCH THẺ */}
      <div className={styles.reservationsList}>
        {filteredReservations.length === 0 ? (
          <div className={styles.emptyState}>
            該当する予約はありません。
          </div>
        ) : (
          filteredReservations.map((item) => {
            if (!item) {
              return null;
            }

            return (
              <ReservationCard
                key={item.id}
                item={item}
                dateTime={getDateTime(item.scheduled_for)}
                isLoading={loadingId === item.id}
                onStatusChange={handleStatusChange}
                onSelect={setSelectedReservation}
                getStatusBadge={getStatusBadge}
              />
            );
          })
        )}
      </div>

      <ReservationModal
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
}