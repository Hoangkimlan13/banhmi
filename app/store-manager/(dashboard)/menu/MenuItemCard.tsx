"use client";

import { Loader2, Power, PowerOff } from "lucide-react";

import styles from "./menu.module.css";

import type { MenuCategory, MenuItem } from "./menu.types";

interface MenuItemCardProps {
  item: MenuItem;
  category: MenuCategory | undefined;
  isLoading: boolean;
  onToggle: (item: MenuItem) => void;
}

export default function MenuItemCard({
  item,
  category,
  isLoading,
  onToggle,
}: MenuItemCardProps) {
  return (
    <article
      className={`${styles.itemCard} ${
        !item.is_available ? styles.itemUnavailable : ""
      }`}
    >
      {/* ============================================================
          IMAGE
      ============================================================ */}

      <div className={styles.imageWrapper}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name_ja}
            className={styles.itemImage}
          />
        ) : (
          <div className={styles.noImage}>
            <span className="material-symbols-outlined">
              restaurant
            </span>
          </div>
        )}

        {!item.is_available && (
          <div className={styles.soldOutOverlay}>
            <span>売り切れ</span>
          </div>
        )}
      </div>

      {/* ============================================================
          CONTENT
      ============================================================ */}

      <div className={styles.itemContent}>
        <div className={styles.itemTop}>
          <div>
            <div className={styles.categoryName}>
              {category?.name_ja ?? "未分類"}
            </div>

            <h3 className={styles.itemName}>{item.name_ja}</h3>

            {item.name_vi && (
              <div className={styles.itemNameVi}>
                {item.name_vi}
              </div>
            )}
          </div>

          <div className={styles.itemPrice}>
            ¥{item.price.toLocaleString("ja-JP")}
          </div>
        </div>

        {item.description_ja && (
          <p className={styles.itemDescription}>
            {item.description_ja}
          </p>
        )}

        {/* ============================================================
            STATUS
        ============================================================ */}

        <div className={styles.itemFooter}>
          <div
            className={`${styles.statusLabel} ${
              item.is_available
                ? styles.statusAvailable
                : styles.statusUnavailable
            }`}
          >
            <span
              className={`${styles.statusDot} ${
                item.is_available
                  ? styles.statusDotAvailable
                  : styles.statusDotUnavailable
              }`}
            />

            {item.is_available ? "販売中" : "売り切れ"}
          </div>

          <button
            type="button"
            disabled={isLoading}
            className={`${styles.toggleButton} ${
              item.is_available
                ? styles.soldOutButton
                : styles.availableButton
            }`}
            onClick={() => onToggle(item)}
          >
            {isLoading ? (
              <Loader2
                size={16}
                className={styles.spinner}
              />
            ) : item.is_available ? (
              <PowerOff size={16} />
            ) : (
              <Power size={16} />
            )}

            {item.is_available
              ? "売り切れにする"
              : "販売を再開"}
          </button>
        </div>
      </div>
    </article>
  );
}