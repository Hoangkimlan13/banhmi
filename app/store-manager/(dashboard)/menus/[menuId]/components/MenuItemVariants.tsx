"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  MenuItemVariant,
} from "../MenuEditorClient";

import MenuItemVariantForm from "./MenuItemVariantForm";

import styles from "../styles/MenuItemVariants.module.css";

type Props = {
  menuItemId: number;

  onCountChange?: (
    count: number
  ) => void;
};

export default function MenuItemVariants({
  menuItemId,
  onCountChange,
}: Props) {
  const [variants, setVariants] =
    useState<MenuItemVariant[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingVariant, setEditingVariant] =
    useState<MenuItemVariant | null>(
      null
    );

  /* ============================================================
     LOAD
     ============================================================ */

  async function loadVariants() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/store-manager/menu-item-variants?menuItemId=${menuItemId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "サイズ情報を取得できません。"
        );
      }

      const nextVariants =
        Array.isArray(
          data?.variants
        )
          ? data.variants.map(
              (item: any) => ({
                ...item,

                id: Number(item.id),

                menu_item_id:
                  Number(
                    item.menu_item_id
                  ),

                price: Number(
                  item.price
                ),

                sort_order:
                  Number(
                    item.sort_order ??
                      0
                  ),

                is_default:
                  Boolean(
                    item.is_default
                  ),

                is_available:
                  Boolean(
                    item.is_available
                  ),

                sku:
                  item.sku ??
                  null,

                name_vi:
                  item.name_vi ??
                  null,

                name_en:
                  item.name_en ??
                  null,

                name_zh:
                  item.name_zh ??
                  null,
              })
            )
          : [];

      setVariants(
        nextVariants
      );

      onCountChange?.(
        nextVariants.length
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "サイズ情報を取得できません。"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVariants();
  }, [menuItemId]);

  /* ============================================================
     CREATE
     ============================================================ */

  function handleCreate() {
    setEditingVariant(null);
    setShowForm(true);
  }

  /* ============================================================
     EDIT
     ============================================================ */

  function handleEdit(
    variant: MenuItemVariant
  ) {
    setEditingVariant(
      variant
    );

    setShowForm(true);
  }

  /* ============================================================
     SAVED
     ============================================================ */

  function handleSaved(
    savedVariant: MenuItemVariant
  ) {
    setVariants(
      (current) => {
        const exists =
          current.some(
            (item) =>
              item.id ===
              savedVariant.id
          );

        if (exists) {
          return current.map(
            (item) =>
              item.id ===
              savedVariant.id
                ? savedVariant
                : item
          );
        }

        return [
          ...current,
          savedVariant,
        ];
      }
    );

    setShowForm(false);
    setEditingVariant(null);
  }

  /* ============================================================
     TOGGLE
     ============================================================ */

  async function handleToggle(
    variant: MenuItemVariant
  ) {
    try {
      const response =
        await fetch(
          "/api/store-manager/menu-item-variants",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: variant.id,

              is_available:
                !variant.is_available,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "状態を変更できません。"
        );
      }

      if (
        !data?.success ||
        !data?.variant
      ) {
        throw new Error(
          "状態変更に失敗しました。"
        );
      }

      setVariants(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              variant.id
                ? {
                    ...item,
                    ...data.variant,

                    price: Number(
                      data.variant
                        .price
                    ),

                    is_available:
                      Boolean(
                        data.variant
                          .is_available
                      ),
                  }
                : item
          )
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "エラーが発生しました。"
      );
    }
  }

  /* ============================================================
     DELETE
     ============================================================ */

  async function handleDelete(
    variant: MenuItemVariant
  ) {
    const confirmed =
      window.confirm(
        `「${variant.name_ja}」を削除しますか？`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/store-manager/menu-item-variants",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: variant.id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "サイズを削除できません。"
        );
      }

      setVariants(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              variant.id
          )
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "エラーが発生しました。"
      );
    }
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.loading}>
          <span className="material-symbols-outlined">
            progress_activity
          </span>

          サイズを読み込み中...
        </div>
      </section>
    );
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <section
        className={styles.section}
      >
        {/* HEADER */}

        <header
          className={
            styles.sectionHeader
          }
        >
          <div>
            <div
              className={
                styles.titleRow
              }
            >
              <span className="material-symbols-outlined">
                straighten
              </span>

              <h3>
                サイズ
              </h3>

              <span
                className={
                  styles.count
                }
              >
                {variants.length}
              </span>
            </div>

            <p>
              この商品のサイズと価格を管理します。
            </p>
          </div>

          <button
            type="button"
            className={
              styles.addButton
            }
            onClick={handleCreate}
          >
            <span className="material-symbols-outlined">
              add
            </span>

            サイズを追加
          </button>
        </header>

        {/* ERROR */}

        {error && (
          <div
            className={
              styles.error
            }
          >
            <span className="material-symbols-outlined">
              error
            </span>

            {error}

            <button
              type="button"
              onClick={
                loadVariants
              }
            >
              再読み込み
            </button>
          </div>
        )}

        {/* EMPTY */}

        {variants.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <span className="material-symbols-outlined">
              straighten
            </span>

            <strong>
              サイズは設定されていません
            </strong>

            <p>
              サイズがない商品は、通常の価格で販売されます。
            </p>

            <button
              type="button"
              onClick={
                handleCreate
              }
            >
              ＋ サイズを追加
            </button>
          </div>
        ) : (
          <div
            className={
              styles.variantList
            }
          >
            {variants.map(
              (variant) => (
                <article
                  key={
                    variant.id
                  }
                  className={`
                    ${styles.variantCard}
                    ${
                      !variant.is_available
                        ? styles.disabled
                        : ""
                    }
                  `}
                >
                  {/* MAIN */}

                  <div
                    className={
                      styles.variantMain
                    }
                  >
                    <div
                      className={
                        styles.sizeIcon
                      }
                    >
                      <span className="material-symbols-outlined">
                        straighten
                      </span>
                    </div>

                    <div
                      className={
                        styles.variantInfo
                      }
                    >
                      <div
                        className={
                          styles.nameRow
                        }
                      >
                        <strong>
                          {
                            variant.name_ja
                          }
                        </strong>

                        {variant.is_default && (
                          <span
                            className={
                              styles.defaultBadge
                            }
                          >
                            デフォルト
                          </span>
                        )}

                        {!variant.is_available && (
                          <span
                            className={
                              styles.disabledBadge
                            }
                          >
                            無効
                          </span>
                        )}
                      </div>

                      <div
                        className={
                          styles.meta
                        }
                      >
                        <span>
                          CODE:
                          {" "}
                          {
                            variant.code
                          }
                        </span>

                        {variant.sku && (
                          <span>
                            SKU:
                            {" "}
                            {
                              variant.sku
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PRICE */}

                  <div
                    className={
                      styles.price
                    }
                  >
                    ¥
                    {variant.price.toLocaleString(
                      "ja-JP"
                    )}
                  </div>

                  {/* ACTIONS */}

                  <div
                    className={
                      styles.actions
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(
                          variant
                        )
                      }
                      title="編集"
                    >
                      <span className="material-symbols-outlined">
                        edit
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggle(
                          variant
                        )
                      }
                      title={
                        variant.is_available
                          ? "無効にする"
                          : "有効にする"
                      }
                    >
                      <span className="material-symbols-outlined">
                        {
                          variant.is_available
                            ? "visibility_off"
                            : "visibility"
                        }
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        styles.deleteButton
                      }
                      onClick={() =>
                        handleDelete(
                          variant
                        )
                      }
                      title="削除"
                    >
                      <span className="material-symbols-outlined">
                        delete
                      </span>
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {/* FORM */}

      {showForm && (
        <MenuItemVariantForm
          menuItemId={
            menuItemId
          }
          variant={
            editingVariant
          }
          onClose={() => {
            setShowForm(false);
            setEditingVariant(
              null
            );
          }}
          onSaved={
            handleSaved
          }
        />
      )}
    </>
  );
}