"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./styles/special-schedule.module.css";

type ScheduleType = "CLOSED" | "SPECIAL_OPEN";

type SpecialSchedule = {
  id: number;
  store_id: number;
  start_date: string;
  end_date: string;
  type: ScheduleType;
  open_time: string | null;
  close_time: string | null;
  reason: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ToastState = {
  show: boolean;
  message: string;
  type: "success" | "error";
};

export default function SpecialSchedulePage() {
  const [schedules, setSchedules] = useState<SpecialSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<ScheduleType>("CLOSED");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "success",
  });

  function showToast(
    message: string,
    toastType: "success" | "error" = "success"
    ) {
    setToast({
        show: true,
        message,
        type: toastType,
    });

    window.setTimeout(() => {
        setToast((prev) => ({
        ...prev,
        show: false,
        }));
    }, 3500);
    }

  async function loadSchedules() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/store-manager/special-schedule", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "営業カレンダーの取得に失敗しました。");
      }

      setSchedules(Array.isArray(result.schedules) ? result.schedules : []);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "営業カレンダーの取得に失敗しました。";
      setError(message);
      // Chỉ set error box, không gọi showToast khi vừa load trang để tránh bị nháy toast vô duyên
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  function resetForm() {
    setStartDate("");
    setEndDate("");
    setType("CLOSED");
    setOpenTime("");
    setCloseTime("");
    setReason("");
    setNote("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!startDate || !endDate) {
      showToast("開始日と終了日を選択してください。", "error");
      return;
    }

    if (startDate > endDate) {
      showToast("終了日は開始日以降にしてください。", "error");
      return;
    }

    if (type === "SPECIAL_OPEN" && (!openTime || !closeTime)) {
      showToast("特別営業時間を入力してください。", "error");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/store-manager/special-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          type,
          open_time: type === "SPECIAL_OPEN" ? openTime : null,
          close_time: type === "SPECIAL_OPEN" ? closeTime : null,
          reason: reason.trim() || null,
          note: note.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "営業カレンダーの登録に失敗しました。");
      }

      showToast(result.message || "営業カレンダーを登録しました。", "success");
      resetForm();
      await loadSchedules();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "営業カレンダーの登録に失敗しました。";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("この営業カレンダーを削除しますか？")) return;

    try {
      const response = await fetch(`/api/store-manager/special-schedule?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "営業カレンダーの削除に失敗しました。");
      }

      showToast(result.message || "営業カレンダーを削除しました。", "success");
      await loadSchedules();
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "営業カレンダーの削除に失敗しました。";
      showToast(message, "error");
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <span>読み込み中...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* ============================================================
            TOAST NOTIFICATION
        ============================================================ */}
        {toast.show && (
        <div
            className={`
            ${styles.toast}
            ${
                toast.type === "success"
                ? styles.toastSuccess
                : styles.toastError
            }
            `}
        >
            <span className="material-symbols-outlined">
            {toast.type === "success"
                ? "check_circle"
                : "error"}
            </span>

            <span>{toast.message}</span>
        </div>
        )}

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h1>営業カレンダー</h1>
            <p>臨時休業・特別営業時間をスマートに管理します。</p>
          </div>
          <div className={styles.headerIconWrapper}>
            <span className="material-symbols-outlined">event_upcoming</span>
          </div>
        </header>

        {error && (
          <div className={styles.errorBox}>
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.contentGrid}>
          {/* FORM CARD */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined">add_circle</span>
              </div>
              <div>
                <h2>日程を追加</h2>
                <p>期間を指定して新しい例外スケジュールを登録</p>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.dateGrid}>
                <div className={styles.field}>
                  <label htmlFor="startDate">開始日</label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.dateSeparator}>〜</div>
                <div className={styles.field}>
                  <label htmlFor="endDate">終了日</label>
                  <input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>営業区分</label>
                <div className={styles.typeGrid}>
                  <button
                    type="button"
                    className={`${styles.typeButton} ${type === "CLOSED" ? styles.typeButtonClosedActive : ""}`}
                    onClick={() => setType("CLOSED")}
                  >
                    <span className="material-symbols-outlined">event_busy</span>
                    <div>
                      <strong>休業</strong>
                      <small>注文受付を停止</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`${styles.typeButton} ${type === "SPECIAL_OPEN" ? styles.typeButtonOpenActive : ""}`}
                    onClick={() => setType("SPECIAL_OPEN")}
                  >
                    <span className="material-symbols-outlined">schedule</span>
                    <div>
                      <strong>特別営業</strong>
                      <small>時間を変更して営業</small>
                    </div>
                  </button>
                </div>
              </div>

              {type === "SPECIAL_OPEN" && (
                <div className={styles.timeCardAnimation}>
                  <div className={styles.timeGrid}>
                    <div className={styles.field}>
                      <label htmlFor="openTime">開店時間</label>
                      <input
                        id="openTime"
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                      />
                    </div>
                    <div className={styles.timeSeparator}>〜</div>
                    <div className={styles.field}>
                      <label htmlFor="closeTime">閉店時間</label>
                      <input
                        id="closeTime"
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="reason">理由・タイトル</label>
                <input
                  id="reason"
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={100}
                  placeholder="例：お盆休み、年末年始休業"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="note">内部メモ</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="店舗スタッフ向けの共有事項など"
                />
              </div>

              <div className={styles.actions}>
                <button type="button" className={styles.cancelButton} onClick={resetForm} disabled={saving}>
                  クリア
                </button>
                <button type="submit" className={styles.saveButton} disabled={saving}>
                  <span className="material-symbols-outlined">
                    {saving ? "progress_activity" : "check"}
                  </span>
                  {saving ? "登録中..." : "登録する"}
                </button>
              </div>
            </form>
          </section>

          {/* LIST CARD */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <span className="material-symbols-outlined">event_note</span>
              </div>
              <div>
                <h2>登録済みスケジュール</h2>
                <p>現在適用されている例外日程の一覧</p>
              </div>
            </div>

            {schedules.length === 0 ? (
              <div className={styles.empty}>
                <span className="material-symbols-outlined">event_available</span>
                <p>登録されている特別営業・休業日はありません。</p>
              </div>
            ) : (
              <div className={styles.scheduleList}>
                {schedules.map((schedule) => (
                  <div key={schedule.id} className={styles.scheduleItem}>
                    <div
                      className={`
                        ${styles.scheduleIcon}
                        ${schedule.type === "CLOSED" ? styles.closedIcon : styles.openIcon}
                      `}
                    >
                      <span className="material-symbols-outlined">
                        {schedule.type === "CLOSED" ? "event_busy" : "schedule"}
                      </span>
                    </div>

                    <div className={styles.scheduleContent}>
                      <div className={styles.scheduleTop}>
                        <span
                          className={`
                            ${styles.badge}
                            ${schedule.type === "CLOSED" ? styles.badgeClosed : styles.badgeOpen}
                          `}
                        >
                          {schedule.type === "CLOSED" ? "休業" : "特別営業"}
                        </span>
                        <div className={styles.scheduleDate}>
                          {formatJapaneseDate(schedule.start_date)}
                          {schedule.start_date !== schedule.end_date && (
                            <>{" 〜 "}{formatJapaneseDate(schedule.end_date)}</>
                          )}
                        </div>
                      </div>

                      {schedule.type === "SPECIAL_OPEN" && schedule.open_time && schedule.close_time && (
                        <div className={styles.scheduleTime}>
                          <span className="material-symbols-outlined">schedule</span>
                          {schedule.open_time} 〜 {schedule.close_time}
                        </div>
                      )}

                      {schedule.reason && <div className={styles.scheduleReason}>{schedule.reason}</div>}
                      {schedule.note && <div className={styles.scheduleNote}>{schedule.note}</div>}
                    </div>

                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => handleDelete(schedule.id)}
                      aria-label="削除"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function formatJapaneseDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[1]}/${match[2]}/${match[3]}`;
}