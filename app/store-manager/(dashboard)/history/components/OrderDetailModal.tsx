// components/OrderDetailModal.tsx
"use client";

import { useState, useEffect } from "react";
import { reprintOrderBill } from "@/app/store-manager/(dashboard)/orders/actions";
import Toast from "@/app/store-manager/(dashboard)/orders/components/Toast";
import { Printer, Loader2 } from "lucide-react";
import styles from "../styles/OrderDetailModal.module.css";

interface OrderDetailModalProps {
  selectedOrder: any;
  onClose: () => void;
  formatTime: (dateStr: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

export default function OrderDetailModal({
  selectedOrder,
  onClose,
  formatTime,
  getStatusBadge,
}: OrderDetailModalProps) {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Tự động ẩn Toast sau 3 giây
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!selectedOrder) return null;

  // Xử lý gọi hàm in lại bill /領収書
  const handlePrintJob = async (jobType: string) => {
    setLoadingType(jobType);
    try {
      const res = await reprintOrderBill(selectedOrder.id, undefined, jobType);
      setToast({
        message: res.message,
        type: res.success ? "success" : "error",
      });
    } catch (error) {
      setToast({
        message: "通信エラーが発生しました。",
        type: "error",
      });
    } finally {
      setLoadingType(null);
    }
  };

  // Hàm helper đảm bảo luôn hiển thị đầy đủ Ngày & Giờ chuẩn tiếng Nhật
  const formatFullDateTime = (dateStr: string) => {
    if (!dateStr) return "---";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return formatTime(dateStr);
      
      return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date).replace(/\//g, "年").replace("年 ", "月").replace("日 ", "日 ");
    } catch {
      return formatTime(dateStr);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Toast thông báo in ấn */}
        {toast && (
          <Toast 
            key={toast.message}
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}

        {/* Header Modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitles}>
            <span className={styles.modalTag}>注文情報</span>
            <h3 className={styles.modalTitle}>
              呼び出し番号: #{selectedOrder.order_number || selectedOrder.id}
            </h3>
          </div>
          <div className={styles.headerRightArea}>
            <div className={styles.statusCard}>
              <div className={styles.statusBadgeWrapper}>{getStatusBadge(selectedOrder.status)}</div>
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Body Modal */}
        <div className={styles.modalBody}>
          {selectedOrder.scheduled_for && (
            <div className={styles.summaryGrid}>
              <div className={styles.scheduleCard}>
                <div className={styles.cardLabelHighlight}>
                  <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>schedule</span>
                  受取予定日時
                </div>
                <div className={styles.cardValueHighlight}>
                  {formatFullDateTime(selectedOrder.scheduled_for)}
                </div>
              </div>
            </div>
          )}

          <div className={styles.infoCard}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>注文日時</span>
              <span className={styles.metaValue}>{formatFullDateTime(selectedOrder.created_at)}</span>
            </div>

            {selectedOrder.customer_name && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>お客様名</span>
                <span className={styles.metaValueBold}>{selectedOrder.customer_name} 様</span>
              </div>
            )}

            {selectedOrder.customer_phone && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>電話番号</span>
                <span className={styles.metaValue}>{selectedOrder.customer_phone}</span>
              </div>
            )}
          </div>

          <h4 className={styles.sectionTitle}>注文商品一覧</h4>

          <div className={styles.itemList}>
            {selectedOrder.tbl_customer_order_items &&
            selectedOrder.tbl_customer_order_items.length > 0 ? (
              selectedOrder.tbl_customer_order_items.map((item: any) => {
                const optionsTotal = item.tbl_customer_order_item_options?.reduce((sum: number, opt: any) => {
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
                            const groupedOptions = item.tbl_customer_order_item_options.reduce((acc: any, opt: any) => {
                              const group = opt.group_name_ja_snap || opt.group_name_snap || "オプション";
                              if (!acc[group]) acc[group] = [];
                              acc[group].push(opt);
                              return acc;
                            }, {});

                            return Object.entries(groupedOptions).map(([groupName, options]: [string, any]) => (
                              <div key={groupName} className={styles.optionGroup}>
                                <div className={styles.optionGroupName}>{groupName}</div>
                                {options.map((opt: any) => {
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
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chat_bubble</span>
                          <span>{item.note}</span>
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
        </div>

        {/* Footer Modal tích hợp các nút In Bếp & In 領収書 */}
        <div className={styles.modalFooter}>
          <div className={styles.modalTotalRow}>
            <span className={styles.totalLabel}>合計金額 (税込)</span>
            <span className={styles.modalTotalAmount}>
              ¥{Number(selectedOrder.total_amount || 0).toLocaleString("ja-JP")}
            </span>
          </div>

          <div className={styles.actionButtonsContainer}>
            {/* Nút In Bếp */}
            <button 
              disabled={loadingType !== null} 
              onClick={() => handlePrintJob("KITCHEN")} 
              className={`${styles.printButton} ${styles.kitchenButton}`}
            >
              {loadingType === "KITCHEN" ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>印刷中...</span>
                </>
              ) : (
                <>
                  <Printer size={16} />
                  <span>キッチン用印刷</span>
                </>
              )}
            </button>

            {/* Nút In Hóa Đơn Khách / 領収書 */}
            <button 
              disabled={loadingType !== null} 
              onClick={() => handlePrintJob("CUSTOMER")} 
              className={`${styles.printButton} ${styles.customerButton}`}
            >
              {loadingType === "CUSTOMER" ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  <span>印刷中...</span>
                </>
              ) : (
                <>
                  <Printer size={16} />
                  <span>領収書発行</span>
                </>
              )}
            </button>
          </div>

          <button className={styles.modalCloseActionBtn} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}