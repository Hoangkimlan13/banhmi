"use client";

import { useState, useEffect } from "react";
import { reprintOrderBill } from "../actions";
import Toast from "./Toast"; 
import { 
  Printer, 
  User, 
  Phone, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  CalendarDays,
  Loader2,
  ArrowLeft 
} from "lucide-react";
import styles from "../styles/OrderDetailPanel.module.css";

export default function OrderDetailPanel({ order, onBack }: { order: any; onBack?: () => void }) {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  
  // State quản lý Toast tại panel (đã bổ sung useEffect tự ẩn bên dưới để khắc phục lỗi)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Thêm useEffect để Toast trong Panel tự động mất sau 3 giây
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!order) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconWrapper}>
          <Receipt size={40} strokeWidth={1.5} />
        </div>
        <p className={styles.emptyText}>注文を選択してください</p>
        <span className={styles.emptySubText}>左側のリストから詳細を確認したい注文を選んでください。</span>
      </div>
    );
  }

  const formatJSTTime = (dateString: string) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const handlePrintJob = async (jobType: string) => {
    setLoadingType(jobType);
    try {
      const res = await reprintOrderBill(order.id, undefined, jobType);
      
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

  const renderOrderTypeLabel = (type: string) => {
    switch (type) {
      case "IMMEDIATE":
        return "今すぐ受け取り (即時注文)";
      case "SCHEDULED_TIME":
      case "SCHEDULED_DATE":
        return "日時指定受取 (ご予約)";
      default:
        return type || "通常注文";
    }
  };

  const getTotalQuantity = (items: any[]) => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const isScheduled = order.order_type && order.order_type !== "IMMEDIATE";
  const totalQty = getTotalQuantity(order.tbl_customer_order_items);

  return (
    <div className={styles.panelContainer}>
      {/* Hiển thị Toast thông báo tại panel kèm key để tự động kích hoạt lại hiệu ứng */}
      {toast && (
        <Toast 
          key={toast.message}
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {onBack && (
        <button className={styles.backButtonMobile} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>注文一覧に戻る</span>
        </button>
      )}

      {/* Thông báo đặt lịch (nếu có) */}
      {isScheduled && order.scheduled_for && (
        <div className={styles.scheduledAlertBox}>
          <CalendarDays size={20} className={styles.scheduledIcon} />
          <div>
            <div className={styles.scheduledTitle}>【ご予約・日時指定受取】</div>
            <div className={styles.scheduledTime}>{formatJSTTime(order.scheduled_for)}</div>
          </div>
        </div>
      )}

      {/* Header đơn hàng & Khách hàng */}
      <div className={styles.topInfoCard}>
        <div className={styles.headerRow}>
          <div>
            <span className={styles.orderLabel}>呼び出し番号</span>
            <h2 className={styles.orderTitle}>#{order.order_number ?? order.id}</h2>
            <div className={styles.orderTypeInfo}>
              受取方法: <span>{renderOrderTypeLabel(order.order_type)}</span>
            </div>
          </div>
          <div className={styles.statusBadgeGroup}>
            <div className={styles.statusBadge}>
              <CheckCircle2 size={13} />
              <span>{order.status === "PAID" ? "支払済" : order.status}</span>
            </div>
            {order.created_at && (
              <div className={styles.timeTag}>
                <Clock size={12} />
                <span>{formatJSTTime(order.created_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin khách hàng */}
        <div className={styles.customerGrid}>
          <div className={styles.customerRow}>
            <User size={14} className={styles.customerIcon} />
            <span className={styles.customerLabel}>お受取人:</span>
            <span className={styles.customerValue}>{order.customer_name || "名無し"}</span>
          </div>
          {order.customer_phone && (
            <div className={styles.customerRow}>
              <Phone size={14} className={styles.customerIcon} />
              <span className={styles.customerLabel}>電話番号:</span>
              <span className={styles.customerValue}>{order.customer_phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Nội dung đơn hàng */}
      <div className={styles.itemListSection}>
        <div className={styles.sectionHeaderBar}>
          <h3 className={styles.sectionTitle}>注文内容</h3>
          <span className={styles.itemCountBadge}>{totalQty} 品</span>
        </div>
        
        <div className={styles.itemsScrollArea}>
          {order.tbl_customer_order_items?.map((item: any) => {
            const optionsTotal = item.tbl_customer_order_item_options?.reduce((sum: number, opt: any) => {
              return sum + Number(opt.price_snap || 0);
            }, 0) || 0;

            const unitPrice = Number(item.price_at_time || 0) + optionsTotal;
            const itemTotalPrice = unitPrice * (item.quantity || 1);

            return (
              <div key={String(item.id)} className={styles.itemRow}>
                <div className={styles.itemQuantity}>{item.quantity}ｘ</div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.food_name_ja_snap || item.food_name_snap}</div>
                  
                  {(() => {
                    const groupedOptions = item.tbl_customer_order_item_options?.reduce((acc: any, opt: any) => {
                        const group = opt.group_name_ja_snap || opt.group_name_snap || "Khác";
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(opt);
                        return acc;
                    }, {});

                    return Object.entries(groupedOptions || {}).map(([groupName, options]: [string, any]) => {
                        const isMultiple = options.length > 1;

                        return (
                          <div key={groupName} className={styles.optionGroup}>
                              {isMultiple ? (
                                <>
                                  <div className={styles.optionGroupName}>• {groupName}:</div>
                                  <div className={styles.optionItemsContainer}>
                                    {options.map((opt: any) => {
                                        const optName = opt.option_name_ja_snap || opt.option_name_snap;
                                        const optPrice = Number(opt.price_snap || 0);
                                        return (
                                          <div key={opt.id} className={styles.optionItemRow}>
                                              <span>+ {optName}</span>
                                              {optPrice > 0 && (
                                                <span className={styles.optionPrice}>+¥{optPrice.toLocaleString("ja-JP")}</span>
                                              )}
                                          </div>
                                        );
                                    })}
                                  </div>
                                </>
                              ) : (
                                (() => {
                                    const opt = options[0];
                                    const optName = opt.option_name_ja_snap || opt.option_name_snap;
                                    const optPrice = Number(opt.price_snap || 0);
                                    return (
                                      <div className={styles.optionList}>
                                          <span>• {groupName}: {optName}</span>
                                          {optPrice > 0 && (
                                            <span className={styles.optionPrice}>+¥{optPrice.toLocaleString("ja-JP")}</span>
                                          )}
                                      </div>
                                    );
                                })()
                              )}
                          </div>
                        );
                    });
                  })()}

                  {item.note && (
                    <div className={styles.itemNote}>メモ: {item.note}</div>
                  )}
                </div>

                <div className={styles.itemPrice}>
                  ¥{itemTotalPrice.toLocaleString("ja-JP")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer & Các nút thao tác in */}
      <div className={styles.footerSection}>
        <div className={styles.totalRow}>
          <span>合計金額 (税込)</span>
          <span className={styles.totalAmount}>
            ¥{Number(order.total_amount).toLocaleString("ja-JP")}
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
                <span>キッチン用</span>
              </>
            )}
          </button>

          {/* Nút In Hóa Đơn Khách */}
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
                <span>領収書</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}