"use client";

import {
  CheckCircle2,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";

import styles from "./styles/menuItemCard.module.css";

import type {
  MenuCategory,
  MenuItem,
} from "./menu.types";

interface MenuItemCardProps {
  item: MenuItem;
  category: MenuCategory | undefined;
  isLoading: boolean;
  onToggleItem: (item: MenuItem) => void;
}

export default function MenuItemCard({
  item,
  category,
  isLoading,
  onToggleItem,
}: MenuItemCardProps) {
  const isAvailable = item.is_available;

  return (
    <article
      className={`${styles.card} ${
        !isAvailable ? styles.unavailable : ""
      }`}
    >
      {/* ======================================================
          TOP STATUS
          ====================================================== */}

      <div className={styles.topRow}>
        <div className={styles.metaGroup}>
          <span className={styles.categoryBadge}>
            {category?.name_ja ?? "未分類"}
          </span>

          <span
            className={`${styles.statusPill} ${
              isAvailable
                ? styles.statusActive
                : styles.statusInactive
            }`}
          >
            <span className={styles.statusDot} />

            {isAvailable ? "販売中" : "売り切れ"}
          </span>
        </div>

        <div className={styles.statusIcon}>
          {isAvailable ? (
            <CheckCircle2 size={18} />
          ) : (
            <Power size={18} />
          )}
        </div>
      </div>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <div className={styles.content}>
        <h3 className={styles.itemName}>
          {item.name_ja}
        </h3>

        {item.name_vi && (
          <div className={styles.itemSubName}>
            {item.name_vi}
          </div>
        )}
      </div>

      {/* ======================================================
          BOTTOM
          ====================================================== */}

      <div className={styles.bottomRow}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>
            価格
          </span>

          <span className={styles.price}>
            ¥{item.price.toLocaleString("ja-JP")}
          </span>
        </div>

        <button
          type="button"
          disabled={isLoading}
          className={`${styles.toggleButton} ${
            isAvailable
              ? styles.soldOutBtn
              : styles.activeBtn
          }`}
          onClick={() => onToggleItem(item)}
        >
          {isLoading ? (
            <>
              <Loader2
                size={16}
                className={styles.spinner}
              />

              <span>更新中...</span>
            </>
          ) : isAvailable ? (
            <>
              <PowerOff size={16} />

              <span>売り切れにする</span>
            </>
          ) : (
            <>
              <Power size={16} />

              <span>販売を再開</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}