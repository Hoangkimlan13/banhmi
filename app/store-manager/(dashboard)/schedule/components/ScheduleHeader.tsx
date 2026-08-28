"use client";

import styles from "../styles/schedule.module.css";

type Props = {
  onNew: () => void;
};

export default function ScheduleHeader({
  onNew,
}: Props) {
  return (
    <header className={styles.header}>
      <div>
        <h1>
          営業スケジュール
        </h1>

        <p>
          キッチンカーの営業場所・イベント・休業日を管理します。
        </p>
      </div>

      <button
        type="button"
        className={styles.newButton}
        onClick={onNew}
      >
        <span className="material-symbols-outlined">
          add
        </span>

        新しい予定
      </button>
    </header>
  );
}