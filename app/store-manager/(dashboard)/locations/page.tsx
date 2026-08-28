"use client";

import { useEffect, useState } from "react";
import styles from "./styles/locations.module.css";

// ============================================================
// TYPES
// ============================================================

type Location = {
  id: number;
  store_id: number;
  name: string;
  address: string | null;
  google_map_url: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  default_open_time: string | null;
  default_close_time: string | null;
  default_last_order_time: string | null;
  pickup_note: string | null;
  note: string | null;
};

type ToastType = "success" | "error";

type ToastState = {
  show: boolean;
  message: string;
  type: ToastType;
};

// ============================================================
// HELPERS
// ============================================================

function formatTime(value: string | null): string {
  if (!value) return "";
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapUrl, setGoogleMapUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [note, setNote] = useState("");

  function showToast(message: string, type: ToastType = "success") {
    setToast({ show: true, message, type });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3200);
  }

  async function loadLocations() {
    try {
      setLoading(true);
      const response = await fetch("/api/store-manager/locations", {
        method: "GET",
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "販売場所の取得に失敗しました。");
      }
      setLocations(Array.isArray(result.locations) ? result.locations : []);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "販売場所の取得に失敗しました。",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLocations();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setAddress("");
    setGoogleMapUrl("");
    setLatitude("");
    setLongitude("");
    setOpenTime("");
    setCloseTime("");
    setPickupNote("");
    setNote("");
  }

  function handleEdit(location: Location) {
    setEditingId(location.id);
    setName(location.name);
    setAddress(location.address ?? "");
    setGoogleMapUrl(location.google_map_url ?? "");
    setLatitude(location.latitude !== null ? String(location.latitude) : "");
    setLongitude(location.longitude !== null ? String(location.longitude) : "");
    setOpenTime(formatTime(location.default_open_time));
    setCloseTime(formatTime(location.default_close_time));
    setPickupNote(location.pickup_note ?? "");
    setNote(location.note ?? "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!name.trim()) {
      showToast("販売場所名を入力してください。", "error");
      return;
    }

    if (openTime && closeTime && openTime >= closeTime) {
      showToast("閉店時間は開店時間より後にしてください。", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name: name.trim(),
        address: address.trim() || null,
        google_map_url: googleMapUrl.trim() || null,
        latitude: latitude.trim() || null,
        longitude: longitude.trim() || null,
        default_open_time: openTime || null,
        default_close_time: closeTime || null,
        pickup_note: pickupNote.trim() || null,
        note: note.trim() || null,
      };

      const response = await fetch("/api/store-manager/locations", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "販売場所の保存に失敗しました。");
      }

      showToast(result.message || "販売場所を保存しました。", "success");
      resetForm();
      await loadLocations();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "販売場所の保存に失敗しました。",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(location: Location) {
    if (!window.confirm(`「${location.name}」を削除しますか？`)) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `/api/store-manager/locations?id=${location.id}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "販売場所の削除に失敗しました。");
      }

      showToast(result.message || "販売場所を削除しました。", "success");
      if (editingId === location.id) resetForm();
      await loadLocations();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "販売場所の削除に失敗しました。",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <span>読み込み中...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* TOAST NOTIFICATION */}
      <div
        className={`${styles.toast} ${toast.show ? styles.toastShow : ""} ${
          toast.type === "success" ? styles.toastSuccess : styles.toastError
        }`}
      >
        <span className="material-symbols-outlined">
          {toast.type === "success" ? "check_circle" : "error"}
        </span>
        <span>{toast.message}</span>
      </div>

      <div className={styles.container}>
        {/* HEADER */}
        <header className={styles.header}>
          <div>
            <h1>販売場所管理</h1>
            <p>キッチンカーで営業する販売場所の登録・管理を行います。</p>
          </div>

          <button
            type="button"
            className={styles.newButton}
            onClick={resetForm}
          >
            <span className="material-symbols-outlined">add</span>
            新しい販売場所
          </button>
        </header>

        {/* CONTENT GRID */}
        <div className={styles.contentGrid}>
          {/* FORM CARD */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>{editingId ? "販売場所を編集" : "新規販売場所登録"}</h2>
              <p>営業スケジュールで使用する基本情報です。</p>
            </div>

            <div className={styles.formBody}>
              <div className={styles.field}>
                <label>
                  販売場所名 <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：新宿駅前"
                />
              </div>

              <div className={styles.field}>
                <label>住所</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="例：東京都新宿区新宿3-38-1"
                />
              </div>

              <div className={styles.field}>
                <label>Google Map URL</label>
                <input
                  type="url"
                  value={googleMapUrl}
                  onChange={(e) => setGoogleMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className={styles.twoColumns}>
                <div className={styles.field}>
                  <label>緯度 (Latitude)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="35.6895"
                  />
                </div>

                <div className={styles.field}>
                  <label>経度 (Longitude)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="139.6917"
                  />
                </div>
              </div>

              <div className={styles.sectionDivider}>
                <div className={styles.sectionTitle}>
                  <span className="material-symbols-outlined">schedule</span>
                  <span>標準営業時間</span>
                </div>

                <div className={styles.threeColumns}>
                  <div className={styles.field}>
                    <label>開店</label>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label>閉店</label>
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label>受取案内</label>
                <textarea
                  value={pickupNote}
                  onChange={(e) => setPickupNote(e.target.value)}
                  rows={2}
                  placeholder="例：キッチンカー前でお受け取りください。"
                />
              </div>

              <div className={styles.field}>
                <label>メモ (社内用)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="スタッフ向けメモを入力..."
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={resetForm}
                  disabled={saving}
                >
                  クリア
                </button>

                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <span className="material-symbols-outlined">
                    {saving ? "sync" : "save"}
                  </span>
                  {saving ? "保存中..." : editingId ? "更新する" : "登録する"}
                </button>
              </div>
            </div>
          </section>

          {/* LIST CARD */}
          <section className={styles.card}>
            <div className={styles.cardHeaderBetween}>
              <div>
                <h2>登録済み販売場所</h2>
                <p>現在登録されているロケーション一覧</p>
              </div>
              <span className={styles.badge}>{locations.length} 件</span>
            </div>

            {locations.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <span className="material-symbols-outlined">location_off</span>
                </div>
                <strong>販売場所がありません</strong>
                <p>左側のフォームから最初の販売場所を登録してください。</p>
              </div>
            ) : (
              <div className={styles.locationList}>
                {locations.map((loc) => (
                  <article key={loc.id} className={styles.locationCard}>
                    <div className={styles.locationHeader}>
                      <div className={styles.locationTitleGroup}>
                        <div className={styles.locationIcon}>
                          <span className="material-symbols-outlined">
                            location_on
                          </span>
                        </div>
                        <div>
                          <h3>{loc.name}</h3>
                          <span className={styles.locationId}>ID #{loc.id}</span>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          type="button"
                          className={styles.iconActionButton}
                          onClick={() => handleEdit(loc)}
                          title="編集"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconActionButton} ${styles.deleteAction}`}
                          onClick={() => handleDelete(loc)}
                          disabled={saving}
                          title="削除"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>

                    {loc.address && (
                      <p className={styles.address}>
                        <span className="material-symbols-outlined">map</span>
                        {loc.address}
                      </p>
                    )}

                    <div className={styles.metaGroup}>
                      {loc.default_open_time && loc.default_close_time && (
                        <span className={styles.tag}>
                          <span className="material-symbols-outlined">schedule</span>
                          {formatTime(loc.default_open_time)} - {formatTime(loc.default_close_time)}
                        </span>
                      )}

                      {loc.default_last_order_time && (
                        <span className={styles.tag}>
                          <span className="material-symbols-outlined">timer</span>
                          LO {formatTime(loc.default_last_order_time)}
                        </span>
                      )}

                      {loc.google_map_url && (
                        <a
                          href={loc.google_map_url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.mapLink}
                        >
                          <span className="material-symbols-outlined">open_in_new</span>
                          Map
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}