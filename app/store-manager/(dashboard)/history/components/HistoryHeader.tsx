"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import headerStyles from "../styles/history-header.module.css";

export default function HistoryHeader({
  selectedDate,
  stats,
}: {
  selectedDate: string;
  stats: {
    totalOrders: number;
    totalRevenue: number;
    paidOrders: number;
    waitingOrders: number;
    cancelledOrders: number;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(selectedDate);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <header className={headerStyles.pageHeader}>
      <div className={headerStyles.headerTop}>
        <h1 className={headerStyles.pageTitle}>注文履歴</h1>

        <form onSubmit={handleSearch} className={headerStyles.filterBar}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={headerStyles.datePicker}
          />
          <button type="submit" className={headerStyles.searchBtn}>
            <span className="material-symbols-outlined">search</span>
            表示
          </button>
        </form>
      </div>

      {/* Lưới thống kê 4 cột thu gọn */}
      <div className={headerStyles.statsContainer}>
        {/* Doanh thu */}
        <div className={headerStyles.statCard}>
          <span className="material-symbols-outlined headerIcon revenue">payments</span>
          <div className={headerStyles.statInfo}>
            <span className={headerStyles.statLabel}>売上合計</span>
            <span className={headerStyles.statValue}>
              ￥{stats.totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Đã đặt / Thành công */}
        <div className={headerStyles.statCard}>
          <span className="material-symbols-outlined headerIcon orders">check_circle</span>
          <div className={headerStyles.statInfo}>
            <span className={headerStyles.statLabel}>完了</span>
            <span className={headerStyles.statValue}>
              {stats.paidOrders} <small>件</small>
            </span>
          </div>
        </div>

        {/* Đợi thanh toán */}
        <div className={headerStyles.statCard}>
          <span className="material-symbols-outlined headerIcon waiting">schedule</span>
          <div className={headerStyles.statInfo}>
            <span className={headerStyles.statLabel}>支払い待ち</span>
            <span className={headerStyles.statValue}>
              {stats.waitingOrders} <small>件</small>
            </span>
          </div>
        </div>

        {/* Đã hủy */}
        <div className={headerStyles.statCard}>
          <span className="material-symbols-outlined headerIcon cancelled">cancel</span>
          <div className={headerStyles.statInfo}>
            <span className={headerStyles.statLabel}>キャンセル</span>
            <span className={headerStyles.statValue}>
              {stats.cancelledOrders} <small>件</small>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}