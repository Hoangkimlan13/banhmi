"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  Loader2,
  Power,
  PowerOff,
  Search,
  Store,
  XCircle,
  SlidersHorizontal,
} from "lucide-react";

import styles from "./styles/menu-client.module.css";

import MenuItemCard from "./MenuItemCard";

import type {
  MenuCategory,
  MenuItem,
  MenuOptionGroup,
  MenuOptionItem,
  MenuItemOptionGroup,
} from "./menu.types";

import {
  updateMenuItemAvailability,
  updateMenuCategoryAvailability,
  updateMenuOptionGroupAvailability,
  updateMenuOptionItemAvailability,
} from "./menu.actions";

interface MenuClientProps {
  initialCategories: MenuCategory[];
  initialItems: MenuItem[];
  initialOptionGroups: MenuOptionGroup[];
  initialOptionItems: MenuOptionItem[];
  initialItemOptionGroups: MenuItemOptionGroup[];

  storeType: string;

  menuId: number;

  menuName: string;

  scheduleInfo: {
    id: number;
    workDate: string;
    locationName: string | null;
    address: string | null;
  } | null;
}

export default function MenuClient({
  initialCategories,
  initialItems,
  initialOptionGroups,
  initialOptionItems,
  initialItemOptionGroups,
  storeType,
  menuId,
  menuName,
  scheduleInfo,
}: MenuClientProps) {
  const [items, setItems] = useState<MenuItem[]>(
    initialItems ?? []
  );

  const [itemOptionGroups] =
    useState<MenuItemOptionGroup[]>(
      initialItemOptionGroups ?? []
    );

  const [optionGroups, setOptionGroups] =
    useState<MenuOptionGroup[]>(
      initialOptionGroups ?? []
    );

  const [optionItems, setOptionItems] =
    useState<MenuOptionItem[]>(
      initialOptionItems ?? []
    );

  // ============================================================
  // SELECTED CATEGORY
  // ============================================================

  const [selectedCategory, setSelectedCategory] =
    useState<number | "ALL" | "OPTIONS">("ALL");

  const [search, setSearch] = useState("");

  const [loadingKey, setLoadingKey] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  // ============================================================
  // FILTER ITEMS
  // ============================================================

  const filteredItems = useMemo(() => {
    // OPTION TAB
    if (selectedCategory === "OPTIONS") {
      return [];
    }

    const keyword = search
      .trim()
      .toLowerCase();

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

      return [
        item.name_ja,
        item.name_vi,
        item.name_en,
        item.name_zh,
      ].some((name) =>
        name
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [
    items,
    selectedCategory,
    search,
  ]);

  // ============================================================
  // GET CATEGORY
  // ============================================================

  const getCategory = (
    categoryId: number
  ) => {
    return initialCategories.find(
      (category) =>
        category.id === categoryId
    );
  };

  // ============================================================
  // OPTION GROUPS OF ITEM
  // ============================================================

  const getItemOptionGroups = (
    itemId: number
  ) => {
    return itemOptionGroups
      .filter(
        (row) =>
          row.menu_item_id === itemId
      )
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order
      );
  };

  // ============================================================
  // GET OPTION GROUP
  // ============================================================

  const getOptionGroup = (
    optionGroupId: number
  ) => {
    return optionGroups.find(
      (group) =>
        group.id === optionGroupId
    );
  };

  // ============================================================
  // GET OPTION ITEMS
  // ============================================================

  const getOptionItems = (
    optionGroupId: number
  ) => {
    return optionItems
      .filter(
        (option) =>
          option.option_group_id ===
          optionGroupId
      )
      .sort(
        (a, b) =>
          a.sort_order - b.sort_order
      );
  };

  // ============================================================
  // TOGGLE ITEM
  // ============================================================

  const handleToggleItem = (
    item: MenuItem
  ) => {
    const nextValue =
      !item.is_available;

    setLoadingKey(
      `item-${item.id}`
    );

    startTransition(async () => {
      try {
        const result =
          await updateMenuItemAvailability(
            item.id,
            nextValue
          );

        if (!result.success) {
          alert(result.message);
          return;
        }

        setItems((current) =>
          current.map(
            (currentItem) =>
              currentItem.id === item.id
                ? {
                    ...currentItem,
                    is_available:
                      nextValue,
                  }
                : currentItem
          )
        );
      } catch (error) {
        console.error(
          "[MenuClient] Item toggle failed:",
          error
        );

        alert(
          "商品の状態更新に失敗しました。"
        );
      } finally {
        setLoadingKey(null);
      }
    });
  };

  // ============================================================
  // TOGGLE CATEGORY
  //
  // Stop / restore ALL items in selected category.
  //
  // Example:
  //
  // バインミー
  //   ├─ A  ON
  //   ├─ B  ON
  //   ├─ C  ON
  //   └─ D  ON
  //
  // → カテゴリー停止
  //
  // All become OFF.
  //
  // If even one item is OFF:
  //
  // → 販売再開 / 販売状態を統一
  //
  // All become ON.
  // ============================================================

  const handleToggleCategory = (
    category: MenuCategory
  ) => {
    const categoryItems =
      items.filter(
        (item) =>
          item.category_id ===
          category.id
      );

    if (categoryItems.length === 0) {
      alert(
        "このカテゴリーには商品がありません。"
      );
      return;
    }

    const hasUnavailableItem =
      categoryItems.some(
        (item) =>
          !item.is_available
      );

    // ----------------------------------------------------------
    // If at least one item is unavailable:
    // restore ALL.
    //
    // If all items are available:
    // stop ALL.
    // ----------------------------------------------------------

    const nextValue =
      hasUnavailableItem
        ? true
        : false;

    setLoadingKey(
      `category-${category.id}`
    );

    startTransition(async () => {
      try {
        const result =
          await updateMenuCategoryAvailability(
            category.id,
            nextValue
          );

        if (!result.success) {
          alert(result.message);
          return;
        }

        // ------------------------------------------------------
        // Update local state immediately.
        // No page reload required.
        // ------------------------------------------------------

        setItems((current) =>
          current.map((item) =>
            item.category_id ===
            category.id
              ? {
                  ...item,
                  is_available:
                    nextValue,
                }
              : item
          )
        );
      } catch (error) {
        console.error(
          "[MenuClient] Category toggle failed:",
          error
        );

        alert(
          "カテゴリーの販売状態更新に失敗しました。"
        );
      } finally {
        setLoadingKey(null);
      }
    });
  };

  // ============================================================
  // TOGGLE OPTION GROUP
  // ============================================================

  const handleToggleOptionGroup = (
    group: MenuOptionGroup
  ) => {
    const nextValue =
      !group.is_available;

    setLoadingKey(
      `group-${group.id}`
    );

    startTransition(async () => {
      try {
        const result =
          await updateMenuOptionGroupAvailability(
            group.id,
            nextValue
          );

        if (!result.success) {
          alert(result.message);
          return;
        }

        setOptionGroups((current) =>
          current.map(
            (currentGroup) =>
              currentGroup.id ===
              group.id
                ? {
                    ...currentGroup,
                    is_available:
                      nextValue,
                  }
                : currentGroup
          )
        );
      } catch (error) {
        console.error(
          "[MenuClient] Option group toggle failed:",
          error
        );

        alert(
          "オプショングループの状態更新に失敗しました。"
        );
      } finally {
        setLoadingKey(null);
      }
    });
  };

  // ============================================================
  // TOGGLE OPTION ITEM
  // ============================================================

  const handleToggleOptionItem = (
    option: MenuOptionItem
  ) => {
    const nextValue =
      !option.is_available;

    setLoadingKey(
      `option-${option.id}`
    );

    startTransition(async () => {
      try {
        const result =
          await updateMenuOptionItemAvailability(
            option.id,
            nextValue
          );

        if (!result.success) {
          alert(result.message);
          return;
        }

        setOptionItems((current) =>
          current.map(
            (currentOption) =>
              currentOption.id ===
              option.id
                ? {
                    ...currentOption,
                    is_available:
                      nextValue,
                  }
                : currentOption
          )
        );
      } catch (error) {
        console.error(
          "[MenuClient] Option item toggle failed:",
          error
        );

        alert(
          "オプション項目の状態更新に失敗しました。"
        );
      } finally {
        setLoadingKey(null);
      }
    });
  };

  // ============================================================
  // STATISTICS
  // ============================================================

  const availableCount =
    items.filter(
      (item) =>
        item.is_available
    ).length;

  const unavailableCount =
    items.length -
    availableCount;

  const availableOptionGroupCount =
    optionGroups.filter(
      (group) =>
        group.is_available
    ).length;

  // ============================================================
  // SELECTED CATEGORY INFORMATION
  //
  // Used for category-level control.
  // ============================================================

  const selectedCategoryInfo =
    selectedCategory !== "ALL" &&
    selectedCategory !== "OPTIONS"
      ? getCategory(
          selectedCategory
        )
      : undefined;

  const selectedCategoryItems =
    selectedCategoryInfo
      ? items.filter(
          (item) =>
            item.category_id ===
            selectedCategoryInfo.id
        )
      : [];

  const selectedCategoryAvailableCount =
    selectedCategoryItems.filter(
      (item) =>
        item.is_available
    ).length;

  const selectedCategoryAllAvailable =
    selectedCategoryItems.length >
      0 &&
    selectedCategoryAvailableCount ===
      selectedCategoryItems.length;

  const selectedCategoryAllUnavailable =
    selectedCategoryItems.length >
      0 &&
    selectedCategoryAvailableCount ===
      0;

  const selectedCategoryMixed =
    selectedCategoryItems.length >
      0 &&
    !selectedCategoryAllAvailable &&
    !selectedCategoryAllUnavailable;

  const selectedCategoryLoading =
    selectedCategoryInfo
      ? isPending &&
        loadingKey ===
          `category-${selectedCategoryInfo.id}`
      : false;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className={styles.page}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div className={styles.titleIcon}>
            <Store size={22} />
          </div>

          <div>
            <h1 className={styles.title}>
              販売状況
            </h1>

            <p className={styles.subtitle}>
              商品・オプションの販売状況を管理します
            </p>

            {storeType === "Truck" &&
              scheduleInfo && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  <strong>
                    本日の出店
                  </strong>

                  {" ・ "}

                  {scheduleInfo.locationName ??
                    scheduleInfo.address ??
                    "場所未設定"}

                  {" ・ "}

                  {menuName}
                </div>
              )}
          </div>
        </div>
      </header>

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <section
        className={styles.statsGrid}
      >
        <div
          className={styles.statCard}
        >
          <div
            className={styles.statIcon}
          >
            <Store size={18} />
          </div>

          <div>
            <span
              className={
                styles.statLabel
              }
            >
              全商品
            </span>

            <strong
              className={
                styles.statValue
              }
            >
              {items.length}
            </strong>
          </div>
        </div>

        <div
          className={styles.statCard}
        >
          <div
            className={`${styles.statIcon} ${styles.availableIcon}`}
          >
            <CheckCircle2 size={18} />
          </div>

          <div>
            <span
              className={
                styles.statLabel
              }
            >
              販売中
            </span>

            <strong
              className={
                styles.statValue
              }
            >
              {availableCount}
            </strong>
          </div>
        </div>

        <div
          className={styles.statCard}
        >
          <div
            className={`${styles.statIcon} ${styles.unavailableIcon}`}
          >
            <XCircle size={18} />
          </div>

          <div>
            <span
              className={
                styles.statLabel
              }
            >
              売り切れ
            </span>

            <strong
              className={
                styles.statValue
              }
            >
              {unavailableCount}
            </strong>
          </div>
        </div>
      </section>

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <section
        className={styles.toolbar}
      >
        <div
          className={styles.searchBox}
        >
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="商品名を検索..."
          />
        </div>
      </section>

      {/* ======================================================
          CATEGORY TABS
      ====================================================== */}

      <nav
        className={styles.categoryTabs}
      >
        {/* ALL */}

        <button
          type="button"
          className={`${styles.categoryTab} ${
            selectedCategory ===
            "ALL"
              ? styles.categoryTabActive
              : ""
          }`}
          onClick={() =>
            setSelectedCategory(
              "ALL"
            )
          }
        >
          すべて

          <span>
            {items.length}
          </span>
        </button>

        {/* CATEGORIES */}

        {initialCategories.map(
          (category) => {
            const categoryItems =
              items.filter(
                (item) =>
                  item.category_id ===
                  category.id
              );

            const count =
              categoryItems.length;

            const availableCount =
              categoryItems.filter(
                (item) =>
                  item.is_available
              ).length;

            const allUnavailable =
              count > 0 &&
              availableCount === 0;

            return (
              <button
                key={category.id}
                type="button"
                className={`${styles.categoryTab} ${
                  selectedCategory ===
                  category.id
                    ? styles.categoryTabActive
                    : ""
                } ${
                  allUnavailable
                    ? styles.categoryTabUnavailable
                    : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    category.id
                  )
                }
              >
                {allUnavailable && (
                  <PowerOff
                    size={13}
                  />
                )}

                {category.name_ja}

                <span>
                  {count}
                </span>
              </button>
            );
          }
        )}

        {/* OPTIONS */}

        {optionGroups.length >
          0 && (
          <button
            type="button"
            className={`${styles.categoryTab} ${styles.optionCategoryTab} ${
              selectedCategory ===
              "OPTIONS"
                ? styles.categoryTabActive
                : ""
            }`}
            onClick={() =>
              setSelectedCategory(
                "OPTIONS"
              )
            }
          >
            <SlidersHorizontal
              size={14}
            />

            オプショングループ

            <span>
              {
                availableOptionGroupCount
              }
              /
              {optionGroups.length}
            </span>
          </button>
        )}
      </nav>

      {/* ======================================================
          OPTIONS TAB
      ====================================================== */}

      {selectedCategory ===
        "OPTIONS" &&
      optionGroups.length > 0 ? (
        <section
          className={
            styles.optionSection
          }
        >
          <div
            className={
              styles.optionSectionTitle
            }
          >
            <div>
              <strong>
                オプショングループ管理
              </strong>

              <span>
                共通オプションの販売状態を設定します
              </span>
            </div>

            <div
              className={
                styles.optionGroupSummary
              }
            >
              {
                availableOptionGroupCount
              }
              /
              {
                optionGroups.length
              }{" "}
              有効
            </div>
          </div>

          <div
            className={
              styles.optionGroups
            }
          >
            {optionGroups.map(
              (group) => {
                const children =
                  getOptionItems(
                    group.id
                  );

                const isLoading =
                  isPending &&
                  loadingKey ===
                    `group-${group.id}`;

                return (
                  <div
                    key={group.id}
                    className={`${styles.optionGroup} ${
                      !group.is_available
                        ? styles.optionGroupUnavailable
                        : ""
                    }`}
                  >
                    <div
                      className={
                        styles.optionGroupHeader
                      }
                    >
                      <div>
                        <div
                          className={
                            styles.optionGroupName
                          }
                        >
                          {
                            group.name_ja
                          }
                        </div>

                        <div
                          className={
                            styles.optionGroupStatusText
                          }
                        >
                          {group.is_available
                            ? "販売中"
                            : "売切中"}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={
                          isLoading
                        }
                        className={`${styles.optionToggleButton} ${
                          group.is_available
                            ? styles.optionAvailableButton
                            : styles.optionUnavailableButton
                        }`}
                        onClick={() =>
                          handleToggleOptionGroup(
                            group
                          )
                        }
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            className={
                              styles.spinner
                            }
                          />
                        ) : group.is_available ? (
                          <PowerOff
                            size={14}
                          />
                        ) : (
                          <Power
                            size={14}
                          />
                        )}

                        {group.is_available
                          ? "停止"
                          : "販売"}
                      </button>
                    </div>

                    {children.length >
                      0 && (
                      <div
                        className={
                          styles.optionItems
                        }
                      >
                        {children.map(
                          (option) => {
                            const effectiveAvailable =
                              group.is_available &&
                              option.is_available;

                            const optionLoading =
                              isPending &&
                              loadingKey ===
                                `option-${option.id}`;

                            return (
                              <div
                                key={
                                  option.id
                                }
                                className={`${styles.optionItem} ${
                                  !effectiveAvailable
                                    ? styles.optionItemUnavailable
                                    : ""
                                }`}
                              >
                                <div
                                  className={
                                    styles.optionItemInfo
                                  }
                                >
                                  {option.icon_url ? (
                                    <img
                                      src={
                                        option.icon_url
                                      }
                                      alt={
                                        option.name_ja
                                      }
                                      className={
                                        styles.optionIcon
                                      }
                                    />
                                  ) : (
                                    <span
                                      className={
                                        styles.optionBullet
                                      }
                                    />
                                  )}

                                  <div>
                                    <div
                                      className={
                                        styles.optionItemName
                                      }
                                    >
                                      {
                                        option.name_ja
                                      }
                                    </div>
                                  </div>
                                </div>

                                <div
                                  className={
                                    styles.optionItemRight
                                  }
                                >
                                  <span
                                    className={
                                      styles.optionItemPrice
                                    }
                                  >
                                    {option.price >
                                    0
                                      ? `+¥${option.price.toLocaleString(
                                          "ja-JP"
                                        )}`
                                      : "¥0"}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={
                                      !group.is_available ||
                                      optionLoading
                                    }
                                    className={`${styles.optionItemToggle} ${
                                      effectiveAvailable
                                        ? styles.optionItemOn
                                        : styles.optionItemOff
                                    }`}
                                    onClick={() =>
                                      handleToggleOptionItem(
                                        option
                                      )
                                    }
                                  >
                                    {optionLoading ? (
                                      <Loader2
                                        size={
                                          13
                                        }
                                        className={
                                          styles.spinner
                                        }
                                      />
                                    ) : effectiveAvailable ? (
                                      <PowerOff
                                        size={
                                          13
                                        }
                                      />
                                    ) : (
                                      <Power
                                        size={
                                          13
                                        }
                                      />
                                    )}

                                    {!group.is_available
                                      ? "親停止"
                                      : effectiveAvailable
                                        ? "停止"
                                        : "有効"}
                                  </button>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}

                    {children.length ===
                      0 && (
                      <div
                        className={
                          styles.optionEmpty
                        }
                      >
                        オプション項目がありません。
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </section>
      ) : (
        <>
          {/* ==================================================
              CATEGORY CONTROL
              Only shown when a specific category is selected.
          ================================================== */}

          {selectedCategoryInfo && (
            <section
              className={
                styles.categoryControl
              }
            >
              <div
                className={
                  styles.categoryControlInfo
                }
              >
                <div
                  className={
                    styles.categoryControlName
                  }
                >
                  {
                    selectedCategoryInfo.name_ja
                  }
                </div>

                <div
                  className={
                    styles.categoryControlStatus
                  }
                >
                  {
                    selectedCategoryItems.length
                  }
                  商品 ・{" "}
                  {
                    selectedCategoryAvailableCount
                  }
                  商品販売中

                  {selectedCategoryMixed &&
                    " ・ 一部売切中"}
                </div>
              </div>

              <button
                type="button"
                disabled={
                  selectedCategoryLoading ||
                  selectedCategoryItems.length ===
                    0
                }
                className={`${styles.categoryControlButton} ${
                  selectedCategoryAllAvailable
                    ? styles.categoryControlStop
                    : styles.categoryControlStart
                }`}
                onClick={() =>
                  handleToggleCategory(
                    selectedCategoryInfo
                  )
                }
              >
                {selectedCategoryLoading ? (
                  <Loader2
                    size={15}
                    className={
                      styles.spinner
                    }
                  />
                ) : selectedCategoryAllAvailable ? (
                  <PowerOff
                    size={15}
                  />
                ) : (
                  <Power size={15} />
                )}

                {selectedCategoryAllAvailable
                  ? "カテゴリー停止"
                  : selectedCategoryAllUnavailable
                    ? "販売再開"
                    : "販売状態を統一"}
              </button>
            </section>
          )}

          {/* ==================================================
              ITEM GRID
          ================================================== */}

          <section
            className={
              styles.itemGrid
            }
          >
            {filteredItems.length >
            0 ? (
              filteredItems.map(
                (item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    category={getCategory(item.category_id)}
                    isLoading={isPending && loadingKey === `item-${item.id}`}
                    onToggleItem={handleToggleItem}
                  />
                )
              )
            ) : (
              <div
                className={
                  styles.emptyState
                }
              >
                <Store size={42} />

                <h3>
                  商品がありません
                </h3>

                <p>
                  {search
                    ? "検索条件に一致する商品がありません。"
                    : "このカテゴリーには商品がありません。"}
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}