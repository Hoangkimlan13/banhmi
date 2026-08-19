"use client";

import {
  X,
  Calendar,
  Phone,
  User,
  Clock,
  FileText,
} from "lucide-react";

import styles from "./ReservationModal.module.css";
import type { Reservation } from "./reservation.types";

interface ReservationModalProps {
  reservation: Reservation | null;
  onClose: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function ReservationModal({
  reservation,
  onClose,
  getStatusBadge,
}: ReservationModalProps) {
  if (!reservation) {
    return null;
  }

  // Hàm chuyển đổi các loại đơn (order_type) sang tiếng Nhật chuẩn nhà hàng
  const formatOrderType = (type: string | undefined | null) => {
    if (!type) return "---";
    const upperType = type.toUpperCase();
    switch (upperType) {
      case "IMMEDIATE":
        return "今すぐ受取";
      case "SCHEDULED_TIME":
      case "SCHEDULED":
        return "時間指定予約";
      case "SCHEDULED_DATE":
        return "日指定予約";
      default:
        return type;
    }
  };

  const formatFullDateTime = (value: string | Date | null) => {
    if (!value) return "---";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "---";

    try {
      return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tokyo",
      })
        .format(date)
        .replace(/\//g, "年")
        .replace("年 ", "月")
        .replace("日 ", "日 ");
    } catch {
      return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitles}>
            <span className={styles.modalTag}>予約・注文情報</span>
            <h3 className={styles.modalTitle}>
              呼び出し番号: #{reservation.order_number || "---"}
            </h3>
          </div>
          <div className={styles.headerRightArea}>
            <div className={styles.statusCard}>
              <div className={styles.statusBadgeWrapper}>
                {getStatusBadge(reservation.status)}
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              type="button"
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Modal */}
        <div className={styles.modalBody}>
          {reservation.scheduled_for && (
            <div className={styles.summaryGrid}>
              <div className={styles.scheduleCard}>
                <div className={styles.cardLabelHighlight}>
                  <Clock size={15} />
                  受取予定日時
                </div>
                <div className={styles.cardValueHighlight}>
                  {formatFullDateTime(reservation.scheduled_for)}
                </div>
              </div>
            </div>
          )}

          <div className={styles.infoCard}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>注文日時</span>
              <span className={styles.metaValue}>
                {formatFullDateTime(reservation.created_at)}
              </span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>お客様名</span>
              <span className={styles.metaValueBold}>
                {reservation.customer_name ? `${reservation.customer_name} 様` : "ゲスト様"}
              </span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>電話番号</span>
              <span className={styles.metaValue}>
                {reservation.customer_phone || "---"}
              </span>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>注文タイプ</span>
              <span className={styles.metaValue}>
                {formatOrderType(reservation.order_type)}
              </span>
            </div>
          </div>

          {/* Danh sách chi tiết món ăn trong đơn */}
          <h4 className={styles.sectionTitle}>注文商品一覧</h4>

          <div className={styles.itemList}>
            {reservation.tbl_customer_order_items &&
            reservation.tbl_customer_order_items.length > 0 ? (
              reservation.tbl_customer_order_items.map((item) => {
                const optionsTotal = item.tbl_customer_order_item_options?.reduce((sum, opt) => {
                  return sum + Number(opt.price_snap || 0);
                }, 0) || 0;

                const unitPrice = Number(item.price_at_time || 0) + optionsTotal;
                const itemTotalPrice = unitPrice * (item.quantity || 1);

                return (
                  <div key={String(item.id)} className={styles.orderItemRow}>
                    <div className={styles.itemInfo}>
                      <div className={styles.itemHeaderRow}>
                        <span className={styles.itemQuantity}>{item.quantity}ｘ</span>
                        <span className={styles.itemName}>
                          {item.food_name_ja_snap || item.food_name_snap || "商品"}
                        </span>
                      </div>

                      {item.tbl_customer_order_item_options && 
                       item.tbl_customer_order_item_options.length > 0 && (
                        <div className={styles.optionsContainer}>
                          {(() => {
                            const groupedOptions = item.tbl_customer_order_item_options.reduce((acc: Record<string, typeof item.tbl_customer_order_item_options>, opt) => {
                              const group = opt.group_name_ja_snap || opt.group_name_snap || "オプション";
                              if (!acc[group]) acc[group] = [];
                              acc[group].push(opt);
                              return acc;
                            }, {});

                            return Object.entries(groupedOptions).map(([groupName, options]) => (
                              <div key={groupName} className={styles.optionGroup}>
                                <div className={styles.optionGroupName}>{groupName}</div>
                                {options?.map((opt) => {
                                  const optName = opt.option_name_ja_snap || opt.option_name_snap;
                                  const optPrice = Number(opt.price_snap || 0);
                                  return (
                                    <div key={opt.id} className={styles.optionItemRow}>
                                      <span>• {optName}</span>
                                      {optPrice > 0 && (
                                        <span className={styles.optionPrice}>+¥{optPrice.toLocaleString("ja-JP")}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {item.note && (
                        <div className={styles.itemNote}>
                          <span>メモ：{item.note}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.itemPrice}>
                      ¥{itemTotalPrice.toLocaleString("ja-JP")}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noItemsText}>商品情報がありません</div>
            )}
          </div>

          {reservation.cancel_reason && (
            <div className={`${styles.infoSection} ${styles.cancelSection}`}>
              <h4 className={styles.sectionTitleText}>
                <FileText size={16} /> キャンセル理由
              </h4>
              <p className={styles.cancelReasonText}>
                {reservation.cancel_reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className={styles.modalFooter}>
          <div className={styles.modalTotalRow}>
            <span className={styles.totalLabel}>合計金額 (税込)</span>
            <span className={styles.modalTotalAmount}>
              ¥
              {Number(reservation.total_amount || 0).toLocaleString("ja-JP")}
            </span>
          </div>

          <button
            className={styles.modalCloseActionBtn}
            onClick={onClose}
            type="button"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}