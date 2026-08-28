"use client";

import { useEffect } from "react";
import styles from "../styles/toast.module.css";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastState = {
  message: string;
  type?: ToastType;
} | null;

type Props = {
  toast: ToastState;
  onClose: () => void;
  duration?: number; 
};

export default function Toast({ toast, onClose, duration = 3000 }: Props) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const type = toast.type || "info";

  const icons: Record<ToastType, string> = {
    success: "check_circle",
    error: "error",
    info: "info",
    warning: "warning",
  };

  return (
    <div className={`${styles.toastContainer} ${styles[type]}`} role="alert">
      <span className={`material-symbols-outlined ${styles.icon}`}>
        {icons[type]}
      </span>
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Close notification"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}