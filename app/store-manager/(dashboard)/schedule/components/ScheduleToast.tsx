"use client";

import styles from "../styles/schedule.module.css";

import type { ToastState } from "../types";

type Props = {
  toast: ToastState;
};

export default function ScheduleToast({
  toast,
}: Props) {
  return (
    <div
      className={`${styles.toast} ${
        toast.show
          ? styles.toastShow
          : ""
      } ${
        toast.type === "success"
          ? styles.toastSuccess
          : styles.toastError
      }`}
    >
      <span className="material-symbols-outlined">
        {toast.type === "success"
          ? "check_circle"
          : "error"}
      </span>

      <span>{toast.message}</span>
    </div>
  );
}