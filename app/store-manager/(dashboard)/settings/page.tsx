"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./styles/settings.module.css";

type StoreSettings = {
  id: number;
  title: string;
  slug: string | null;
  type: string;
  color: string | null;
  address: string | null;
  google_map_url: string | null;
  phone: string | null;
  open_time: string | null;
  close_time: string | null;
  pickup_note: string | null;
  accepting_orders: boolean;
  latitude: number | string | null;
  longitude: number | string | null;
};

type ToastState = {
  show: boolean;
  message: string;
  type: "success" | "error";
};

export default function StoreSettingsPage() {
  const [store, setStore] = useState<StoreSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // State quản lý Toast
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
    ) => {
    setToast({
        show: true,
        message,
        type,
    });

    window.setTimeout(() => {
        setToast((prev) => ({
        ...prev,
        show: false,
        }));
    }, 3500);
    };

  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapUrl, setGoogleMapUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [color, setColor] = useState("#cccccc");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // ============================================================
  // LOAD
  // ============================================================

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/store-manager/settings",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "店舗情報の取得に失敗しました。"
          );
        }

        const data: StoreSettings = result.store;

        setStore(data);

        setTitle(data.title ?? "");
        setAddress(data.address ?? "");
        setGoogleMapUrl(data.google_map_url ?? "");
        setPhone(data.phone ?? "");

        setOpenTime(formatTime(data.open_time));
        setCloseTime(formatTime(data.close_time));

        setPickupNote(data.pickup_note ?? "");
        setAcceptingOrders(data.accepting_orders ?? true);

        setColor(data.color ?? "#cccccc");

        setLatitude(
          data.latitude !== null &&
          data.latitude !== undefined
            ? String(data.latitude)
            : ""
        );

        setLongitude(
          data.longitude !== null &&
          data.longitude !== undefined
            ? String(data.longitude)
            : ""
        );
      } catch (err) {
        console.error(err);

        const errMessage =
          err instanceof Error
            ? err.message
            : "店舗情報の取得に失敗しました。";

        setError(errMessage);
        // Đã lược bỏ showToast ở đây để tránh bị nháy toast khi vừa load trang gặp lỗi 500
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // ============================================================
  // SAVE
  // ============================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "/api/store-manager/settings",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            address: address.trim() || null,
            google_map_url:
              googleMapUrl.trim() || null,
            phone: phone.trim() || null,
            open_time: openTime || null,
            close_time: closeTime || null,
            pickup_note:
              pickupNote.trim() || null,
            accepting_orders: acceptingOrders,
            color: color || null,
            latitude: latitude || null,
            longitude: longitude || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "店舗設定の更新に失敗しました。"
        );
      }

      setStore(result.store);

      showToast(
        result.message || "店舗設定を更新しました。",
        "success"
      );
    } catch (err) {
      console.error(err);

      const errMessage =
        err instanceof Error
          ? err.message
          : "店舗設定の更新に失敗しました。";

      setError(errMessage);
      showToast(errMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loading}>
          読み込み中...
        </div>
      </main>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (!store && error) {
    return (
      <main className={styles.page}>
        <div className={styles.errorBox}>
          {error}
        </div>
      </main>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className={styles.page}>
      {/* ============================================================
            TOAST
        ============================================================ */}
        {toast.show && (
        <div
            className={`
            ${styles.toast}
            ${toast.type === "success"
                ? styles.toastSuccess
                : styles.toastError}
            `}
        >
            <span
            className={`material-symbols-outlined ${styles.toastIcon}`}
            >
            {toast.type === "success"
                ? "check_circle"
                : "error"}
            </span>

            <span>{toast.message}</span>
        </div>
        )}

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>営業設定</h1>
            <p>
              店舗の営業時間・注文受付・受取情報を設定します。
            </p>
          </div>

          {store && (
            <div className={styles.storeBadge}>
              <span className="material-symbols-outlined">
                storefront
              </span>

              <span>{store.title}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          {/* ================================================
              店舗情報
          ================================================= */}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className="material-symbols-outlined">
                store
              </span>

              <div>
                <h2>店舗情報</h2>
                <p>お客様に表示する店舗情報です。</p>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="title">
                  店舗名
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  maxLength={100}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="phone">
                  電話番号
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="03-0000-0000"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="address">
                住所
              </label>

              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="東京都新宿区..."
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="googleMapUrl">
                Google Map URL
              </label>

              <input
                id="googleMapUrl"
                type="url"
                value={googleMapUrl}
                onChange={(e) =>
                  setGoogleMapUrl(e.target.value)
                }
                placeholder="https://maps.google.com/..."
              />
            </div>
          </section>

          {/* ================================================
              営業時間
          ================================================= */}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className="material-symbols-outlined">
                schedule
              </span>

              <div>
                <h2>営業時間</h2>
                <p>
                  通常営業日の営業時間を設定します。
                </p>
              </div>
            </div>

            <div className={styles.timeGrid}>
              <div className={styles.field}>
                <label htmlFor="openTime">
                  開店時間
                </label>

                <input
                  id="openTime"
                  type="time"
                  value={openTime}
                  onChange={(e) =>
                    setOpenTime(e.target.value)
                  }
                />
              </div>

              <div className={styles.timeSeparator}>
                〜
              </div>

              <div className={styles.field}>
                <label htmlFor="closeTime">
                  閉店時間
                </label>

                <input
                  id="closeTime"
                  type="time"
                  value={closeTime}
                  onChange={(e) =>
                    setCloseTime(e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          {/* ================================================
              受取案内
          ================================================= */}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className="material-symbols-outlined">
                info
              </span>

              <div>
                <h2>受取案内</h2>
                <p>
                  お客様への受取・店舗案内を設定します。
                </p>
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="pickupNote">
                受取案内
              </label>

              <textarea
                id="pickupNote"
                value={pickupNote}
                onChange={(e) =>
                  setPickupNote(e.target.value)
                }
                rows={4}
                placeholder="例：商品到着後、店頭スタッフまでお声がけください。"
              />
            </div>
          </section>

          {/* ================================================
              地図情報
          ================================================= */}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className="material-symbols-outlined">
                location_on
              </span>

              <div>
                <h2>位置情報</h2>
                <p>
                  店舗の位置情報を設定します。
                </p>
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="latitude">
                  緯度
                </label>

                <input
                  id="latitude"
                  type="text"
                  value={latitude}
                  onChange={(e) =>
                    setLatitude(e.target.value)
                  }
                  placeholder="35.68950000"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="longitude">
                  経度
                </label>

                <input
                  id="longitude"
                  type="text"
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(e.target.value)
                  }
                  placeholder="139.69171000"
                />
              </div>
            </div>
          </section>

          {/* ================================================
              保存
          ================================================= */}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              <span className="material-symbols-outlined">
                {saving ? "progress_activity" : "save"}
              </span>

              {saving
                ? "保存中..."
                : "設定を保存"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

// ============================================================
// TIME FORMATTER
// ============================================================

function formatTime(
  value: string | Date | null
): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const match = value.match(
      /(\d{2}):(\d{2})/
    );

    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${String(date.getUTCHours()).padStart(
    2,
    "0"
  )}:${String(date.getUTCMinutes()).padStart(
    2,
    "0"
  )}`;
}