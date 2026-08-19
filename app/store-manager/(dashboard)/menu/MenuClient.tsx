"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  Search,
  Store,
  XCircle,
} from "lucide-react";

import styles from "./menu.module.css";

import MenuItemCard from "./MenuItemCard";

import type {
  MenuCategory,
  MenuItem,
} from "./menu.types";

import { updateMenuItemAvailability } from "./menu.actions";

interface MenuClientProps {
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
}

export default function MenuClient({
  initialCategories,
  initialItems,
}: MenuClientProps) {
  const [items, setItems] = useState<MenuItem[]>(
    initialItems ?? []
  );

  const [selectedCategory, setSelectedCategory] =
    useState<number | "ALL">("ALL");

  const [search, setSearch] = useState("");

  const [loadingId, setLoadingId] = useState<number | null>(
    null
  );

  const [isPending, startTransition] = useTransition();

  // ============================================================
  // FILTER
  // ============================================================

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return items.filter((item) => {
      const categoryMatch =
        selectedCategory === "ALL" ||
        item.category_id === selectedCategory;

      if (!categoryMatch) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        item.name_ja.toLowerCase().includes(keyword) ||
        item.name_vi?.toLowerCase().includes(keyword) ||
        item.name_en?.toLowerCase().includes(keyword) ||
        item.name_zh?.toLowerCase().includes(keyword)
      );
    });
  }, [items, selectedCategory, search]);

  // ============================================================
  // CATEGORY
  // ============================================================

  const getCategory = (categoryId: number) => {
    return initialCategories.find(
      (category) => category.id === categoryId
    );
  };

  // ============================================================
  // TOGGLE AVAILABILITY
  // ============================================================

  const handleToggle = (item: MenuItem) => {
    const nextValue = !item.is_available;

    setLoadingId(item.id);

    startTransition(async () => {
      const result = await updateMenuItemAvailability(
        item.id,
        nextValue
      );

      if (result.success) {
        setItems((current) =>
          current.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  is_available: nextValue,
                }
              : currentItem
          )
        );
      } else {
        alert(result.message);
      }

      setLoadingId(null);
    });
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const availableCount = items.filter(
    (item) => item.is_available
  ).length;

  const unavailableCount =
    items.length - availableCount;

  return (
    <main className={styles.page}>
      {/* ============================================================
          HEADER
      ============================================================ */}

      <header className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <Store size={22} />
          </div>

          <div>
            <h1 className={styles.title}>メニュー管理</h1>
            <p className={styles.subtitle}>
              商品の販売状態を管理します
            </p>
          </div>
        </div>
      </header>

      {/* ============================================================
          STATISTICS
      ============================================================ */}

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Store size={18} />
          </div>

          <div>
            <span className={styles.statLabel}>
              全商品
            </span>

            <strong className={styles.statValue}>
              {items.length}
            </strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.availableIcon}`}
          >
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span className={styles.statLabel}>
              販売中
            </span>

            <strong className={styles.statValue}>
              {availableCount}
            </strong>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.unavailableIcon}`}
          >
            <XCircle size={18} />
          </div>

          <div>
            <span className={styles.statLabel}>
              売り切れ
            </span>

            <strong className={styles.statValue}>
              {unavailableCount}
            </strong>
          </div>
        </div>
      </section>

      {/* ============================================================
          TOOLBAR
      ============================================================ */}

      <section className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="商品名を検索..."
          />
        </div>
      </section>

      {/* ============================================================
          CATEGORY TABS
      ============================================================ */}

      <nav className={styles.categoryTabs}>
        <button
          type="button"
          className={`${styles.categoryTab} ${
            selectedCategory === "ALL"
              ? styles.categoryTabActive
              : ""
          }`}
          onClick={() => setSelectedCategory("ALL")}
        >
          すべて
          <span>{items.length}</span>
        </button>

        {initialCategories.map((category) => {
          const count = items.filter(
            (item) =>
              item.category_id === category.id
          ).length;

          return (
            <button
              key={category.id}
              type="button"
              className={`${styles.categoryTab} ${
                selectedCategory === category.id
                  ? styles.categoryTabActive
                  : ""
              }`}
              onClick={() =>
                setSelectedCategory(category.id)
              }
            >
              {category.name_ja}

              <span>{count}</span>
            </button>
          );
        })}
      </nav>

      {/* ============================================================
          ITEMS
      ============================================================ */}

      <section className={styles.itemGrid}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              category={getCategory(item.category_id)}
              isLoading={
                isPending && loadingId === item.id
              }
              onToggle={handleToggle}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <Store size={42} />

            <h3>商品がありません</h3>

            <p>
              {search
                ? "検索条件に一致する商品がありません。"
                : "このカテゴリーには商品がありません。"}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}