"use client";

import { useState, useEffect } from "react";
import OrderList from "./OrderList";
import OrderDetailPanel from "./OrderDetailPanel";
import Toast from "./Toast"; 
import styles from "./StoreManager.module.css";

export default function StoreManagerShell({ store, initialOrders, initialSchedule }: any) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrders[0]?.id || null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotify = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  // Polling tự động làm mới đơn hàng
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch("/api/store-manager/orders", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
          if (selectedOrderId === null && data.orders.length > 0) {
            setSelectedOrderId(data.orders[0].id);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [selectedOrderId]);

  const selectedOrder = orders.find((o: any) => String(o.id) === String(selectedOrderId)) || null;

  const handleSelectOrder = (id: string) => {
    setSelectedOrderId(id);
    setMobileShowDetail(true);
  };

  const handleBackToList = () => {
    setMobileShowDetail(false);
  };

  return (
    // Không còn gọi StoreHeader hay StoreSidebar ở đây nữa
    <div className={styles.storeManagerContent}>
      <main className={`${styles.content} ${mobileShowDetail ? styles.showDetail : ""}`}>
        <div className={styles.orderListContainer}>
          <OrderList 
            orders={orders} 
            selectedOrderId={selectedOrderId} 
            onSelectOrder={handleSelectOrder} 
            onNotify={showNotify}
          />
        </div>
        
        <div className={styles.orderDetailContainer}>
          <OrderDetailPanel 
            order={selectedOrder} 
            onBack={handleBackToList} 
          />
        </div>
      </main>

      {toast && (
        <Toast 
          key={toast.message}
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}