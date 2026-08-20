"use client";

import { useEffect, useState } from "react";
import styles from "../styles/components.module.css";

type PrinterStatusData = {
  status: "ONLINE" | "OFFLINE" | "ERROR";
  lastError?: string | null;
};

export default function PrinterStatus() {
  const [data, setData] = useState<PrinterStatusData>({
    status: "OFFLINE",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/store-manager/printer-status", {
          cache: "no-store",
        });
        const json = await res.json();

        if (isMounted && json.success) {
          setData({
            status: json.status,
            lastError: json.lastError,
          });
        }
      } catch {
        if (isMounted) {
          setData({ status: "OFFLINE" });
        }
      }
    }

    fetchStatus();

    const interval = setInterval(fetchStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusConfig = () => {
    switch (data.status) {
      case "ONLINE":
        return {
          dotClass: `${styles.statusDot} ${styles.online}`,
          text: "プリンター接続中",
        };
      case "ERROR":
        return {
          dotClass: `${styles.statusDot} ${styles.error}`,
          text: "プリンターエラー",
        };
      case "OFFLINE":
      default:
        return {
          dotClass: `${styles.statusDot} ${styles.offline}`,
          text: "プリンターオフライン",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={styles.statusBadge} title={data.lastError || undefined}>
      <span className={config.dotClass}></span>
      <span>{config.text}</span>
    </div>
  );
}