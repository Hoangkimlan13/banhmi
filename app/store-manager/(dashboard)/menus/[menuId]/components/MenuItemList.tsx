"use client";

import styles from "../styles/menu-editor.module.css";

import MenuItemCard from "./MenuItemCard";

import type {
  MenuCategory,
  MenuItem,
  ItemOptionGroup,
  ItemOptionItem,
} from "../MenuEditorClient";

/* ============================================================
   TYPES
   ============================================================ */

type Props = {
  category: MenuCategory | null;

  items: MenuItem[];

  itemOptionGroups: ItemOptionGroup[];

  itemOptionItems: ItemOptionItem[];

  onCreateItem: () => void;

  onEditItem: (item: MenuItem) => void;

  onToggleAvailability: (item: MenuItem) => void;

  onDiscontinueItem: (item: MenuItem) => void;

  onMoveItem: (
    item: MenuItem,
    direction: "up" | "down"
  ) => void;
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function MenuItemList({
  category,
  items,
  itemOptionGroups,
  itemOptionItems,
  onCreateItem,
  onEditItem,
  onToggleAvailability,
  onDiscontinueItem,
  onMoveItem,
}: Props) {
  /* ==========================================================
     NO CATEGORY
     ========================================================== */

  if (!category) {
    return (
      <div className={styles.selectCategory}>
        <span className="material-symbols-outlined">
          category
        </span>

        <h2>
          カテゴリを選択してください
        </h2>

        <p>
          左側からカテゴリを選択すると、商品を管理できます。
        </p>
      </div>
    );
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div>
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className={styles.itemsHeader}>
        <div>
          <div className={styles.itemsEyebrow}>
            CATEGORY
          </div>

          <h2>{category.name_ja}</h2>

          <span>
            商品 {items.length}件
          </span>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={onCreateItem}
        >
          <span className="material-symbols-outlined">
            add
          </span>

          商品を追加
        </button>
      </div>

      {/* ======================================================
          EMPTY
          ====================================================== */}

      {items.length === 0 ? (
        <div className={styles.emptyItems}>
          <span className="material-symbols-outlined">
            restaurant
          </span>

          <h3>
            商品がありません
          </h3>

          <p>
            このカテゴリに商品を追加してください。
          </p>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={onCreateItem}
          >
            <span className="material-symbols-outlined">
              add
            </span>

            商品を追加
          </button>
        </div>
      ) : (
        <div className={styles.itemGrid}>
          {items.map((item, index) => {
            /* ==================================================
               OPTION GROUP COUNT

               ItemOptionGroup の ID は option_group_id
               ではなく id を使用する。

               itemOptionGroups が menu item 単位の
               relation データの場合、同じ menu item に
               属する group を数える。
               ================================================== */

            const optionGroupCount =
              new Set(
                itemOptionGroups
                  .filter(
                    (row) =>
                      row.menu_item_id ===
                        item.id &&
                      row.is_available !== false
                  )
                  .map(
                    (row) => row.id
                  )
              ).size;

            /* ==================================================
               OPTION ITEM COUNT
               ================================================== */

            const optionItemCount =
              new Set(
                itemOptionItems
                  .filter(
                    (row) =>
                      row.menu_item_id ===
                        item.id &&
                      row.is_available !== false
                  )
                  .map(
                    (row) =>
                      row.option_item_id
                  )
              ).size;

            return (
              <MenuItemCard
                key={item.id}
                item={item}

                optionGroupCount={
                  optionGroupCount
                }

                optionItemCount={
                  optionItemCount
                }

                onEdit={() =>
                  onEditItem(item)
                }

                onToggleAvailability={() =>
                  onToggleAvailability(item)
                }

                onDiscontinue={() =>
                  onDiscontinueItem(item)
                }

                onMoveUp={() =>
                  onMoveItem(
                    item,
                    "up"
                  )
                }

                onMoveDown={() =>
                  onMoveItem(
                    item,
                    "down"
                  )
                }

                isFirst={
                  index === 0
                }

                isLast={
                  index ===
                  items.length - 1
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}