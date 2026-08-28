"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ChevronRight,
  Edit3,
  MoreHorizontal,
  Plus,
  Power,
  PowerOff,
  Search,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import {
  deleteOptionGroup,
  toggleOptionGroup,
  moveOptionGroup,
} from "../actions/optionGroupActions";

import {
  deleteOptionItem,
  toggleOptionItem,
  moveOptionItem,
} from "../actions/optionItemActions";

import OptionGroupForm from "./OptionGroupForm";
import OptionItemForm from "./OptionItemForm";

import type {
  OptionGroup,
  OptionItem,
} from "../types/option.types";

import styles from "../styles/options.module.css";

/* ============================================================
   TYPES
   ============================================================ */

type Filter =
  | "ALL"
  | "ACTIVE"
  | "INACTIVE";

type Toast = {
  type:
    | "success"
    | "error";

  message: string;
};

type Props = {
  initialGroups: OptionGroup[];
  menuId: number;
  menuName: string;
};
/* ============================================================
   NORMALIZED GROUP
   ============================================================

   OptionGroup hiện tại có thể định nghĩa:

   items?: OptionItem[]
   usage_count?: number

   Nhưng component này luôn cần:

   items: OptionItem[]
   usage_count: number

   Vì vậy normalize một lần ở đầu component.
   ============================================================ */

type NormalizedOptionGroup =
  Omit<
    OptionGroup,
    "items" | "usage_count"
  > & {
    items: OptionItem[];
    usage_count: number;
  };

/* ============================================================
   COMPONENT
   ============================================================ */

export default function OptionsClient({
  initialGroups,
  menuId,
  menuName,
}: Props) {
  const router = useRouter();

  /* ==========================================================
     SEARCH
     ========================================================== */

  const [search, setSearch] =
    useState("");

  /* ==========================================================
     FILTER
     ========================================================== */

  const [filter, setFilter] =
    useState<Filter>("ALL");

  /* ==========================================================
     EXPANDED GROUPS
     ========================================================== */

  const [
    expandedGroups,
    setExpandedGroups,
  ] = useState<Set<number>>(
    () => new Set(),
  );

  /* ==========================================================
     GROUP MODAL
     ========================================================== */

  const [groupModal, setGroupModal] =
    useState<{
      open: boolean;
      group: OptionGroup | null;
    }>({
      open: false,
      group: null,
    });

  /* ==========================================================
     ITEM MODAL
     ========================================================== */

  const [itemModal, setItemModal] =
    useState<{
      open: boolean;
      group: OptionGroup | null;
      item: OptionItem | null;
    }>({
      open: false,
      group: null,
      item: null,
    });

  /* ==========================================================
     TOAST
     ========================================================== */

  const [toast, setToast] =
    useState<Toast | null>(null);

  /* ==========================================================
     ACTION MENU
     ========================================================== */

  const [
    openActionMenu,
    setOpenActionMenu,
  ] = useState<string | null>(null);

  /* ==========================================================
     CLOSE ACTION MENU WHEN CLICK OUTSIDE
     ========================================================== */

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent,
    ) {
      const target =
        event.target as HTMLElement;

      if (
        !target.closest(
          "[data-action-menu]",
        )
      ) {
        setOpenActionMenu(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, []);

  /* ==========================================================
     NORMALIZE GROUPS
     ==========================================================

     Đây là phần FIX QUAN TRỌNG.

     Không chỉ:

       items ?? []

     mà còn:

       usage_count ?? 0

     Vì TypeScript của OptionGroup đang cho phép
     usage_count là undefined.
     ========================================================== */

  const normalizedGroups =
    useMemo<NormalizedOptionGroup[]>(
      () => {
        if (
          !Array.isArray(
            initialGroups,
          )
        ) {
          return [];
        }

        return initialGroups.map(
          (group) => ({
            ...group,

            items: Array.isArray(
              group.items,
            )
              ? group.items
              : [],

            usage_count:
              typeof group.usage_count ===
                "number"
                ? group.usage_count
                : 0,
          }),
        );
      },
      [initialGroups],
    );

  /* ==========================================================
     FILTER
     ========================================================== */

  const filteredGroups =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return normalizedGroups.filter(
        (group) => {
          /* ==================================================
             FILTER STATUS
             ================================================== */

          const matchesFilter =
            filter === "ALL" ||
            (
              filter === "ACTIVE" &&
              group.is_available
            ) ||
            (
              filter === "INACTIVE" &&
              !group.is_available
            );

          if (!matchesFilter) {
            return false;
          }

          /* ==================================================
             NO SEARCH
             ================================================== */

          if (!keyword) {
            return true;
          }

          /* ==================================================
             SEARCH GROUP
             ================================================== */

          const groupMatch = [
            group.code,
            group.name_ja,
            group.name_vi,
            group.name_en,
            group.name_zh,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    keyword,
                  ),
            );

          /* ==================================================
             SEARCH ITEMS
             ================================================== */

          const itemMatch =
            group.items.some(
              (item) =>
                [
                  item.code,
                  item.name_ja,
                  item.name_vi,
                  item.name_en,
                  item.name_zh,
                ]
                  .filter(Boolean)
                  .some(
                    (value) =>
                      String(value)
                        .toLowerCase()
                        .includes(
                          keyword,
                        ),
                  ),
            );

          return (
            groupMatch ||
            itemMatch
          );
        },
      );
    }, [
      normalizedGroups,
      search,
      filter,
    ]);

  /* ==========================================================
     TOAST
     ========================================================== */

  function showToast(
    type: Toast["type"],
    message: string,
  ) {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  /* ==========================================================
     EXPAND GROUP
     ========================================================== */

  function toggleExpanded(
    groupId: number,
  ) {
    setExpandedGroups(
      (prev) => {
        const next =
          new Set(prev);

        if (
          next.has(groupId)
        ) {
          next.delete(groupId);
        } else {
          next.add(groupId);
        }

        return next;
      },
    );
  }

  /* ==========================================================
     GROUP MODAL
     ========================================================== */

  function openCreateGroup() {
    setGroupModal({
      open: true,
      group: null,
    });
  }

  function openEditGroup(
    group: OptionGroup,
  ) {
    setGroupModal({
      open: true,
      group,
    });
  }

  /* ==========================================================
     ITEM MODAL
     ========================================================== */

  function openCreateItem(
    group: OptionGroup,
  ) {
    setItemModal({
      open: true,
      group,
      item: null,
    });
  }

  function openEditItem(
    group: OptionGroup,
    item: OptionItem,
  ) {
    setItemModal({
      open: true,
      group,
      item,
    });
  }

  /* ==========================================================
     TOGGLE GROUP
     ========================================================== */

  async function handleToggleGroup(
    group: OptionGroup,
  ) {
    const result =
      await toggleOptionGroup(
        group.id,
        menuId,
        !group.is_available,
      );

    showToast(
      result.success
        ? "success"
        : "error",
      result.message ??
        "処理が完了しました。",
    );

    if (result.success) {
      router.refresh();
    }
  }

  /* ==========================================================
     MOVE GROUP
     ========================================================== */

  async function handleMoveGroup(
    group: OptionGroup,
    direction:
      | "UP"
      | "DOWN",
  ) {
    setOpenActionMenu(null);

    const result =
      await moveOptionGroup(
        group.id,
        menuId,
        direction,
      );

    showToast(
      result.success
        ? "success"
        : "error",
      result.message ??
        "処理が完了しました。",
    );

    if (result.success) {
      router.refresh();
    }
  }

  /* ==========================================================
     DELETE GROUP
     ========================================================== */

  async function handleDeleteGroup(
    group: NormalizedOptionGroup,
  ) {
    /*
     * FIX:
     *
     * usage_count đã được normalize
     * thành number ở normalizedGroups.
     *
     * Vì vậy không còn:
     *
     * group.usage_count is possibly undefined
     */

    if (
      group.usage_count > 0
    ) {
      showToast(
        "error",
        "このグループは商品で使用されているため削除できません。無効化してください。",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `「${group.name_ja}」を削除しますか？\n\nこのグループ内のオプションもすべて削除されます。`,
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deleteOptionGroup(
        group.id,
        menuId,
      );

    showToast(
      result.success
        ? "success"
        : "error",
      result.message ??
        "処理が完了しました。",
    );

    if (result.success) {
      router.refresh();
    }
  }

  /* ==========================================================
     TOGGLE ITEM
     ========================================================== */

  async function handleToggleItem(
    item: OptionItem,
  ) {
    const result =
      await toggleOptionItem(
        item.id,
        menuId,
        !item.is_available,
      );

    showToast(
      result.success
        ? "success"
        : "error",
      result.message ??
        "処理が完了しました。",
    );

    if (result.success) {
      router.refresh();
    }
  }

  /* ==========================================================
     DELETE ITEM
     ========================================================== */

  async function handleDeleteItem(
    item: OptionItem,
  ) {
    const confirmed =
      window.confirm(
        `「${item.name_ja}」を削除しますか？`,
      );

    if (!confirmed) {
      return;
    }

    const result =
      await deleteOptionItem(
        item.id,
        menuId,
      );

    showToast(
      result.success
        ? "success"
        : "error",
      result.message ??
        "処理が完了しました。",
    );

    if (result.success) {
      router.refresh();
    }
  }

  /* ==========================================================
     MOVE ITEM
     ========================================================== */

  async function handleMoveItem(
    item: OptionItem,
    direction:
      | "UP"
      | "DOWN",
  ) {
    setOpenActionMenu(null);

    const result =
      await moveOptionItem(
        item.id,
        menuId,
        direction,
      );

    showToast(
      result.success
        ? "success"
        : "error",
      result.message ??
        "処理が完了しました。",
    );

    if (result.success) {
      router.refresh();
    }
  }

  /* ==========================================================
     STATS
     ========================================================== */

  const totalGroups =
    normalizedGroups.length;

  const activeGroups =
    normalizedGroups.filter(
      (group) =>
        group.is_available,
    ).length;

  const totalItems =
    normalizedGroups.reduce(
      (total, group) =>
        total +
        group.items.length,
      0,
    );

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main
      className={styles.page}
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <header
        className={
          styles.pageHeader
        }
      >
        <div
          className={
            styles.headerLeft
          }
        >
          <button
            type="button"
            className={
              styles.backButton
            }
            onClick={() =>
              router.push(
                "/store-manager/menu-settings",
              )
            }
          >
            <ChevronRight
              size={18}
              className={
                styles.backIcon
              }
            />

            <span>
              メニュー設定に戻る
            </span>
          </button>

          <div
            className={
              styles.breadcrumb
            }
          >
            MENU

            <ChevronRight
              size={13}
            />

            OPTIONS
          </div>

          <div
            className={
              styles.titleRow
            }
          >
            <div>
              <h1>
                オプション管理
              </h1>

              <p>
                商品で使用する
                MASTER OPTION
                を管理します。
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={
            openCreateGroup
          }
        >
          <Plus size={18} />

          <span>
            グループを追加
          </span>
        </button>
      </header>

      {/* ======================================================
          STATS
          ====================================================== */}

      <section
        className={styles.stats}
      >
        <div
          className={
            styles.statCard
          }
        >
          <span>
            GROUP
          </span>

          <strong>
            {totalGroups}
          </strong>

          <small>
            オプショングループ
          </small>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <span>
            ACTIVE
          </span>

          <strong>
            {activeGroups}
          </strong>

          <small>
            有効なグループ
          </small>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <span>
            OPTIONS
          </span>

          <strong>
            {totalItems}
          </strong>

          <small>
            オプション数
          </small>
        </div>
      </section>

      {/* ======================================================
          TOOLBAR
          ====================================================== */}

      <section
        className={
          styles.toolbar
        }
      >
        <div
          className={
            styles.searchBox
          }
        >
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="オプションを検索..."
          />
        </div>

        <div
          className={
            styles.filters
          }
        >
          <button
            type="button"
            className={
              filter === "ALL"
                ? styles.filterActive
                : ""
            }
            onClick={() =>
              setFilter("ALL")
            }
          >
            すべて
          </button>

          <button
            type="button"
            className={
              filter === "ACTIVE"
                ? styles.filterActive
                : ""
            }
            onClick={() =>
              setFilter("ACTIVE")
            }
          >
            有効
          </button>

          <button
            type="button"
            className={
              filter === "INACTIVE"
                ? styles.filterActive
                : ""
            }
            onClick={() =>
              setFilter("INACTIVE")
            }
          >
            無効
          </button>
        </div>
      </section>

      {/* ======================================================
          GROUP LIST
          ====================================================== */}

      <section
        className={
          styles.groupList
        }
      >
        {filteredGroups.length ===
          0 && (
          <div
            className={
              styles.emptyState
            }
          >
            <Search size={32} />

            <h3>
              オプションがありません
            </h3>

            <p>
              条件を変更するか、
              新しいグループを追加してください。
            </p>
          </div>
        )}

        {filteredGroups.map(
          (group) => {
            const expanded =
              expandedGroups.has(
                group.id,
              );

            return (
              <article
                key={group.id}
                className={`
                  ${styles.groupCard}
                  ${
                    !group.is_available
                      ? styles.groupDisabled
                      : ""
                  }
                `}
              >
                {/* ==================================================
                    GROUP HEADER
                    ================================================== */}

                <div
                  className={
                    styles.groupHeader
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.expandButton
                    }
                    onClick={() =>
                      toggleExpanded(
                        group.id,
                      )
                    }
                  >
                    {expanded ? (
                      <ChevronDown
                        size={20}
                      />
                    ) : (
                      <ChevronRight
                        size={20}
                      />
                    )}
                  </button>

                  <div
                    className={
                      styles.groupIdentity
                    }
                  >
                    <div
                      className={
                        styles.groupTitleRow
                      }
                    >
                      <h2>
                        {
                          group.name_ja
                        }
                      </h2>

                      <span
                        className={
                          group.is_available
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        {group.is_available
                          ? "有効"
                          : "無効"}
                      </span>
                    </div>

                    <div
                      className={
                        styles.groupMeta
                      }
                    >
                      <span>
                        {
                          group.items
                            .length
                        }{" "}
                        オプション
                      </span>

                      {group.usage_count >
                        0 && (
                        <span>
                          {
                            group.usage_count
                          }{" "}
                          商品で使用中
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ==================================================
                      GROUP ACTION MENU
                      ================================================== */}

                  <div
                    className={
                      styles.itemActions
                    }
                    data-action-menu
                  >
                    <button
                      type="button"
                      className={
                        styles.moreButton
                      }
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();

                        const menuIdKey =
                          `group-${group.id}`;

                        setOpenActionMenu(
                          (current) =>
                            current ===
                            menuIdKey
                              ? null
                              : menuIdKey,
                        );
                      }}
                      aria-label="アクション"
                      aria-expanded={
                        openActionMenu ===
                        `group-${group.id}`
                      }
                    >
                      <MoreHorizontal
                        size={20}
                      />
                    </button>

                    {openActionMenu ===
                      `group-${group.id}` && (
                      <div
                        className={
                          styles.actionDropdown
                        }
                        onClick={(
                          event,
                        ) =>
                          event.stopPropagation()
                        }
                      >
                        {/* MOVE UP */}

                        <button
                          type="button"
                          onClick={() =>
                            handleMoveGroup(
                              group,
                              "UP",
                            )
                          }
                        >
                          <ArrowUp
                            size={16}
                          />

                          <span>
                            上へ移動
                          </span>
                        </button>

                        {/* MOVE DOWN */}

                        <button
                          type="button"
                          onClick={() =>
                            handleMoveGroup(
                              group,
                              "DOWN",
                            )
                          }
                        >
                          <ArrowDown
                            size={16}
                          />

                          <span>
                            下へ移動
                          </span>
                        </button>

                        <div
                          className={
                            styles.actionDivider
                          }
                        />

                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenu(
                              null,
                            );

                            openEditGroup(
                              group,
                            );
                          }}
                        >
                          <Edit3
                            size={16}
                          />

                          <span>
                            編集
                          </span>
                        </button>

                        {/* ENABLE / DISABLE */}

                        <button
                          type="button"
                          onClick={() => {
                            setOpenActionMenu(
                              null,
                            );

                            handleToggleGroup(
                              group,
                            );
                          }}
                        >
                          {group.is_available ? (
                            <PowerOff
                              size={16}
                            />
                          ) : (
                            <Power
                              size={16}
                            />
                          )}

                          <span>
                            {group.is_available
                              ? "無効化"
                              : "有効化"}
                          </span>
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          className={
                            styles.dropdownDanger
                          }
                          onClick={() => {
                            setOpenActionMenu(
                              null,
                            );

                            handleDeleteGroup(
                              group,
                            );
                          }}
                          disabled={
                            group.usage_count >
                            0
                          }
                        >
                          <Trash2
                            size={16}
                          />

                          <span>
                            削除
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    GROUP CONTENT
                    ================================================== */}

                {expanded && (
                  <div
                    className={
                      styles.groupContent
                    }
                  >
                    <div
                      className={
                        styles.itemHeader
                      }
                    >
                      <div>
                        <span>
                          OPTIONS
                        </span>

                        <strong>
                          {
                            group.items
                              .length
                          }{" "}
                          個
                        </strong>
                      </div>

                      <button
                        type="button"
                        className={
                          styles.addItemButton
                        }
                        onClick={() =>
                          openCreateItem(
                            group,
                          )
                        }
                      >
                        <Plus
                          size={16}
                        />

                        オプション追加
                      </button>
                    </div>

                    {/* ==================================================
                        EMPTY ITEMS
                        ================================================== */}

                    {group.items
                      .length === 0 ? (
                      <div
                        className={
                          styles.emptyItems
                        }
                      >
                        <p>
                          オプションが
                          まだ登録されていません。
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            openCreateItem(
                              group,
                            )
                          }
                        >
                          最初のオプションを追加
                        </button>
                      </div>
                    ) : (
                      /* ==================================================
                         ITEM LIST
                         ================================================== */

                      <div
                        className={
                          styles.itemList
                        }
                      >
                        {group.items.map(
                          (item) => (
                            <div
                              key={
                                item.id
                              }
                              className={`
                                ${styles.itemRow}
                                ${
                                  !item.is_available
                                    ? styles.itemDisabled
                                    : ""
                                }
                              `}
                            >
                              {/* ICON */}

                              <div
                                className={
                                  styles.itemIcon
                                }
                              >
                                {item.icon_url ? (
                                  <img
                                    src={
                                      item.icon_url
                                    }
                                    alt=""
                                  />
                                ) : (
                                  <span>
                                    {item.name_ja.slice(
                                      0,
                                      1,
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* INFO */}

                              <div
                                className={
                                  styles.itemInfo
                                }
                              >
                                <div
                                  className={
                                    styles.itemNameRow
                                  }
                                >
                                  <strong>
                                    {
                                      item.name_ja
                                    }
                                  </strong>

                                  {!item.is_available && (
                                    <span
                                      className={
                                        styles.statusInactive
                                      }
                                    >
                                      無効
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={
                                    styles.itemMeta
                                  }
                                >
                                  {item.name_vi && (
                                    <span>
                                      {
                                        item.name_vi
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* PRICE */}

                              <div
                                className={
                                  styles.itemPrice
                                }
                              >
                                {Number(
                                  item.price,
                                ) > 0
                                  ? `+¥${Number(
                                      item.price,
                                    ).toLocaleString(
                                      "ja-JP",
                                      {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                      },
                                    )}`
                                  : "¥0"}
                              </div>

                              {/* ACTION MENU */}

                              <div
                                className={
                                  styles.itemActions
                                }
                                data-action-menu
                              >
                                <button
                                  type="button"
                                  className={
                                    styles.moreButton
                                  }
                                  onClick={(
                                    event,
                                  ) => {
                                    event.stopPropagation();

                                    const menuIdKey =
                                      `item-${item.id}`;

                                    setOpenActionMenu(
                                      (
                                        current,
                                      ) =>
                                        current ===
                                        menuIdKey
                                          ? null
                                          : menuIdKey,
                                    );
                                  }}
                                  aria-label="アクション"
                                  aria-expanded={
                                    openActionMenu ===
                                    `item-${item.id}`
                                  }
                                >
                                  <MoreHorizontal
                                    size={
                                      20
                                    }
                                  />
                                </button>

                                {openActionMenu ===
                                  `item-${item.id}` && (
                                  <div
                                    className={
                                      styles.actionDropdown
                                    }
                                    onClick={(
                                      event,
                                    ) =>
                                      event.stopPropagation()
                                    }
                                  >
                                    {/* MOVE UP */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMoveItem(
                                          item,
                                          "UP",
                                        )
                                      }
                                    >
                                      <ArrowUp
                                        size={
                                          16
                                        }
                                      />

                                      <span>
                                        上へ移動
                                      </span>
                                    </button>

                                    {/* MOVE DOWN */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMoveItem(
                                          item,
                                          "DOWN",
                                        )
                                      }
                                    >
                                      <ArrowDown
                                        size={
                                          16
                                        }
                                      />

                                      <span>
                                        下へ移動
                                      </span>
                                    </button>

                                    <div
                                      className={
                                        styles.actionDivider
                                      }
                                    />

                                    {/* EDIT */}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenu(
                                          null,
                                        );

                                        openEditItem(
                                          group,
                                          item,
                                        );
                                      }}
                                    >
                                      <Edit3
                                        size={
                                          16
                                        }
                                      />

                                      <span>
                                        編集
                                      </span>
                                    </button>

                                    {/* ENABLE / DISABLE */}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenActionMenu(
                                          null,
                                        );

                                        handleToggleItem(
                                          item,
                                        );
                                      }}
                                    >
                                      {item.is_available ? (
                                        <PowerOff
                                          size={
                                            16
                                          }
                                        />
                                      ) : (
                                        <Power
                                          size={
                                            16
                                          }
                                        />
                                      )}

                                      <span>
                                        {item.is_available
                                          ? "無効化"
                                          : "有効化"}
                                      </span>
                                    </button>

                                    {/* DELETE */}

                                    <button
                                      type="button"
                                      className={
                                        styles.dropdownDanger
                                      }
                                      onClick={() => {
                                        setOpenActionMenu(
                                          null,
                                        );

                                        handleDeleteItem(
                                          item,
                                        );
                                      }}
                                    >
                                      <Trash2
                                        size={
                                          16
                                        }
                                      />

                                      <span>
                                        削除
                                      </span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          },
        )}
      </section>

      {/* ======================================================
          GROUP MODAL
          ====================================================== */}

      {groupModal.open && (
        <OptionGroupForm
          menuId={menuId}
          group={
            groupModal.group
          }
          onClose={() =>
            setGroupModal({
              open: false,
              group: null,
            })
          }
          onSaved={() => {
            setGroupModal({
              open: false,
              group: null,
            });

            router.refresh();
          }}
        />
      )}

      {/* ======================================================
          ITEM MODAL
          ====================================================== */}

      {itemModal.open &&
        itemModal.group && (
          <OptionItemForm
            menuId={menuId}
            group={
              itemModal.group
            }
            item={
              itemModal.item
            }
            onClose={() =>
              setItemModal({
                open: false,
                group: null,
                item: null,
              })
            }
            onSaved={() => {
              setItemModal({
                open: false,
                group: null,
                item: null,
              });

              router.refresh();
            }}
          />
        )}

      {/* ======================================================
          TOAST
          ====================================================== */}

      {toast && (
        <div
          className={`
            ${styles.toast}
            ${
              toast.type ===
              "error"
                ? styles.toastError
                : styles.toastSuccess
            }
          `}
        >
          {
            toast.message
          }
        </div>
      )}
    </main>
  );
}