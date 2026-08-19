"use client";

import { useEffect } from "react";
import styles from "../styles/Toast.module.css";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Tự động ẩn sau 3 giây

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${type === "error" ? styles.error : styles.success}`}>
      <span className="material-symbols-outlined">
        {type === "error" ? "error" : "check_circle"}
      </span>
      <span className={styles.toastMessage}>{message}</span>
      {/* Nút X để đóng thủ công */}
      <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}