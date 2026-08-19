"use client";

import { useState } from "react";
import { toggleStoreOrders } from "../actions";
import styles from "../styles/StoreStatusToggle.module.css";

type StoreStatusToggleProps = {
  store: any;
  onChange?: (s: any) => void;
  onNotify?: (message: string, type: "success" | "error") => void;
};

export default function StoreStatusToggle({ store, onChange, onNotify }: StoreStatusToggleProps) {
  const [isOpen, setIsOpen] = useState(store ? Boolean(store.accepting_orders) : true);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleToggle = async (accepting: boolean, stopReason?: string) => {
    setLoading(true);
    try {
      const res = await toggleStoreOrders(accepting, stopReason);
      if (res.success) {
        setIsOpen(accepting);
        setShowModal(false);
        setReason("");
        onChange?.({ ...store, accepting_orders: accepting });
        
        const successMsg = accepting ? "注文受付を再開しました" : "注文受付を一時停止しました";
        onNotify?.(successMsg, "success");
      } else {
        onNotify?.(res.message || "エラーが発生しました。再度お試しください。", "error");
      }
    } catch (err) {
      onNotify?.("通信エラーが発生しました。", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setShowModal(!showModal)}
        className={`${styles.toggleBtn} ${isOpen ? styles.open : styles.closed}`}
      >
        <span className={styles.dot}></span>
        <span>{isOpen ? "受付中" : "一時停止中"}</span>
        <span className={styles.arrow}>▼</span>
      </button>

      {showModal && (
        <>
          <div className={styles.backdrop} onClick={() => setShowModal(false)} />
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <span>受付ステータス</span>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {isOpen ? (
              <div className={styles.modalBody}>
                <p className={styles.modalDesc}>混雑時などに注文を一時停止できます。</p>
                <input
                  type="text"
                  placeholder="停止理由 (例: 混雑のため)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={styles.input}
                />
                <button
                  disabled={loading}
                  onClick={() => handleToggle(false, reason)}
                  className={`${styles.actionBtn} ${styles.dangerBtn}`}
                >
                  {loading ? "処理中..." : "一時停止する"}
                </button>
              </div>
            ) : (
              <div className={styles.modalBody}>
                <p className={styles.modalDesc}>営業を再開し、注文の受付を始めます。</p>
                <button
                  disabled={loading}
                  onClick={() => handleToggle(true)}
                  className={`${styles.actionBtn} ${styles.successBtn}`}
                >
                  {loading ? "処理中..." : "受付を再開する"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}