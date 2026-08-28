"use client";

import Image from "next/image";
import styles from "../styles/MenuItemCard.module.css";
import type { MenuItem } from "../MenuEditorClient";

type Props = {
  item: MenuItem;
  onEdit: () => void;
  onToggleAvailability: () => void;
  onDiscontinue: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  optionGroupCount: number;
  optionItemCount: number;
  isFirst: boolean;
  isLast: boolean;
};

export default function MenuItemCard({
  item,
  onEdit,
  onToggleAvailability,
  onDiscontinue,
  onMoveUp,
  onMoveDown,
  optionGroupCount,
  optionItemCount,
  isFirst,
  isLast,
}: Props) {
  const isActive = item.status === "ACTIVE";
  const isPaused = item.status === "PAUSED";
  const isDiscontinued = item.status === "DISCONTINUED";
  const hasOptions = optionGroupCount > 0 || optionItemCount > 0;

  const cardStatusClass = isDiscontinued
    ? styles.itemDiscontinued
    : isPaused
    ? styles.itemUnavailable
    : "";

  const statusLabel = isDiscontinued
    ? "販売終了"
    : isPaused
    ? "一時停止"
    : "販売中";

  return (
    <article className={`${styles.itemCard} ${cardStatusClass}`}>
      {/* 1. REORDER CONTROLS (Nút di chuyển nằm dọc góc trái) */}
      <div className={styles.reorderGroup}>
        <button
          type="button"
          className={styles.moveBtn}
          onClick={onMoveUp}
          disabled={isFirst}
          title="上へ移動"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
        <button
          type="button"
          className={styles.moveBtn}
          onClick={onMoveDown}
          disabled={isLast}
          title="下へ移動"
        >
          <span className="material-symbols-outlined">arrow_downward</span>
        </button>
      </div>

      {/* 2. IMAGE WRAPPER */}
      <div className={styles.imageWrapper}>
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name_ja}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className={styles.previewImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <span className="material-symbols-outlined">restaurant</span>
          </div>
        )}

        {/* Badge trạng thái đè lên ảnh khi Tạm dừng/Kết thúc */}
        {!isActive && (
          <div
            className={`${styles.statusBadge} ${
              isDiscontinued ? styles.badgeDiscontinued : styles.badgePaused
            }`}
          >
            {statusLabel}
          </div>
        )}
      </div>

      {/* 3. MAIN CONTENT BODY */}
      <div className={styles.itemBody}>
        {/* TOP ROW: Tên món & Giá */}
        <div className={styles.itemHeader}>
          <div className={styles.titleGroup}>
            <h3 className={styles.nameJa}>{item.name_ja}</h3>
            {item.name_vi && <p className={styles.nameVi}>{item.name_vi}</p>}
          </div>

          <div className={styles.priceGroup}>
            <strong className={styles.price}>
              ¥{item.price.toLocaleString("ja-JP")}
            </strong>
          </div>
        </div>

        {/* BOTTOM ROW: Options & Hành động */}
        <div className={styles.itemFooter}>
          {/* OPTION BADGE */}
          <div className={styles.optionContainer}>
            {hasOptions ? (
              <span className={styles.optionTag}>
                <span className="material-symbols-outlined">
                  tune
                </span>

                オプション{" "}
                <strong>{optionGroupCount}</strong>組・
                <strong>{optionItemCount}</strong>項
              </span>
            ) : (
              <span className={styles.optionEmpty}>
                オプションなし
              </span>
            )}
          </div>

          {/* ACTIONS GROUP */}
          <div className={styles.itemActions}>
            {/* Nút Chỉnh Sửa */}
            <button
              type="button"
              className={styles.editBtn}
              onClick={onEdit}
              title="編集"
            >
              <span className="material-symbols-outlined">edit</span>
              <span className={styles.btnText}>編集</span>
            </button>

            {/* Nút Bật / Tắt Bán */}
            <button
              type="button"
              className={`${styles.toggleBtn} ${
                isActive
                  ? styles.btnDisable
                  : isDiscontinued
                  ? styles.btnReactivate
                  : styles.btnEnable
              }`}
              onClick={onToggleAvailability}
              title={
                isActive
                  ? "一時停止"
                  : isDiscontinued
                  ? "販売再開"
                  : "販売再開"
              }
            >
              <span className="material-symbols-outlined">
                {isActive ? "pause_circle" : "play_circle"}
              </span>
              <span className={styles.btnText}>
                {isActive ? "停止" : "再開"}
              </span>
            </button>



            {/* Nút Bán Kết Thúc (Chỉ hiện khi chưa kết thúc) */}
            {!isDiscontinued && (
              <button
                type="button"
                className={styles.discontinueBtn}
                onClick={onDiscontinue}
                title="販売終了"
              >
                <span className="material-symbols-outlined">
                  delete_forever
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}