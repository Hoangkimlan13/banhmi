"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  MenuItemVariant,
} from "../MenuEditorClient";

import styles from "../styles/MenuItemVariantForm.module.css";

type Props = {
  menuItemId: number;

  variant: MenuItemVariant | null;

  onClose: () => void;

  onSaved: (
    variant: MenuItemVariant
  ) => void;
};

export default function MenuItemVariantForm({
  menuItemId,
  variant,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(variant);

  const [code, setCode] =
    useState("");

  const [sku, setSku] =
    useState("");

  const [nameJa, setNameJa] =
    useState("");

  const [nameVi, setNameVi] =
    useState("");

  const [nameEn, setNameEn] =
    useState("");

  const [nameZh, setNameZh] =
    useState("");

  const [price, setPrice] =
    useState("");

  const [isDefault, setIsDefault] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ============================================================
     INITIAL
     ============================================================ */

  useEffect(() => {
    if (!variant) {
      setCode("");
      setSku("");
      setNameJa("");
      setNameVi("");
      setNameEn("");
      setNameZh("");
      setPrice("");
      setIsDefault(false);

      return;
    }

    setCode(
      variant.code ?? ""
    );

    setSku(
      variant.sku ?? ""
    );

    setNameJa(
      variant.name_ja ?? ""
    );

    setNameVi(
      variant.name_vi ?? ""
    );

    setNameEn(
      variant.name_en ?? ""
    );

    setNameZh(
      variant.name_zh ?? ""
    );

    setPrice(
      String(variant.price ?? 0)
    );

    setIsDefault(
      Boolean(variant.is_default)
    );
  }, [variant]);

  /* ============================================================
     SAVE
     ============================================================ */

  async function handleSave() {
    setError("");

    const trimmedCode =
      code.trim();

    const trimmedNameJa =
      nameJa.trim();

    const numericPrice =
      Number(price);

    if (!trimmedCode) {
      setError(
        "コードを入力してください。"
      );
      return;
    }

    if (
      trimmedCode.length > 50
    ) {
      setError(
        "コードは50文字以内で入力してください。"
      );
      return;
    }

    if (!trimmedNameJa) {
      setError(
        "サイズ名を入力してください。"
      );
      return;
    }

    if (
      trimmedNameJa.length > 100
    ) {
      setError(
        "サイズ名は100文字以内で入力してください。"
      );
      return;
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      setError(
        "正しい価格を入力してください。"
      );
      return;
    }

    setSaving(true);

    try {
      let response: Response;

      if (variant) {
        response = await fetch(
          "/api/store-manager/menu-item-variants",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id: variant.id,

              code: trimmedCode,

              sku:
                sku.trim() ||
                null,

              name_ja:
                trimmedNameJa,

              name_vi:
                nameVi.trim() ||
                null,

              name_en:
                nameEn.trim() ||
                null,

              name_zh:
                nameZh.trim() ||
                null,

              price:
                numericPrice,

              is_default:
                isDefault,
            }),
          }
        );
      } else {
        response = await fetch(
          "/api/store-manager/menu-item-variants",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              menu_item_id:
                menuItemId,

              code: trimmedCode,

              sku:
                sku.trim() ||
                null,

              name_ja:
                trimmedNameJa,

              name_vi:
                nameVi.trim() ||
                null,

              name_en:
                nameEn.trim() ||
                null,

              name_zh:
                nameZh.trim() ||
                null,

              price:
                numericPrice,

              is_default:
                isDefault,
            }),
          }
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "保存に失敗しました。"
        );
      }

      if (
        !data?.success ||
        !data?.variant
      ) {
        throw new Error(
          "サイズの保存に失敗しました。"
        );
      }

      onSaved(data.variant);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "保存に失敗しました。"
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div className={styles.overlay}>
      <section className={styles.modal}>
        {/* HEADER */}

        <header className={styles.header}>
          <div>
            <h2>
              {isEdit
                ? "サイズを編集"
                : "サイズを追加"}
            </h2>

            <p>
              商品のサイズと価格を設定します。
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={saving}
          >
            <span className="material-symbols-outlined">
              close
            </span>
          </button>
        </header>

        {/* FORM */}

        <div className={styles.form}>
          {/* CODE */}

          <label className={styles.field}>
            <span>
              コード
              <b>*</b>
            </span>

            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                )
              }
              placeholder="例：S"
              maxLength={50}
              disabled={saving}
            />

            <small>
              商品内で一意のコードです。
            </small>
          </label>

          {/* SKU */}

          <label className={styles.field}>
            <span>
              SKU
            </span>

            <input
              type="text"
              value={sku}
              onChange={(e) =>
                setSku(
                  e.target.value
                )
              }
              placeholder="例：BANHMI-S"
              maxLength={100}
              disabled={saving}
            />
          </label>

          {/* JAPANESE */}

          <label className={styles.field}>
            <span>
              サイズ名（日本語）
              <b>*</b>
            </span>

            <input
              type="text"
              value={nameJa}
              onChange={(e) =>
                setNameJa(
                  e.target.value
                )
              }
              placeholder="例：小"
              maxLength={100}
              disabled={saving}
            />
          </label>

          {/* VIETNAMESE */}

          <label className={styles.field}>
            <span>
              サイズ名（ベトナム語）
            </span>

            <input
              type="text"
              value={nameVi}
              onChange={(e) =>
                setNameVi(
                  e.target.value
                )
              }
              placeholder="例：Nhỏ"
              maxLength={100}
              disabled={saving}
            />
          </label>

          {/* ENGLISH */}

          <label className={styles.field}>
            <span>
              サイズ名（英語）
            </span>

            <input
              type="text"
              value={nameEn}
              onChange={(e) =>
                setNameEn(
                  e.target.value
                )
              }
              placeholder="例：Small"
              maxLength={100}
              disabled={saving}
            />
          </label>

          {/* CHINESE */}

          <label className={styles.field}>
            <span>
              サイズ名（中国語）
            </span>

            <input
              type="text"
              value={nameZh}
              onChange={(e) =>
                setNameZh(
                  e.target.value
                )
              }
              placeholder="例：小份"
              maxLength={100}
              disabled={saving}
            />
          </label>

          {/* PRICE */}

          <label className={styles.field}>
            <span>
              価格
              <b>*</b>
            </span>

            <div className={styles.priceInput}>
              <span>¥</span>

              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                placeholder="500"
                disabled={saving}
              />
            </div>
          </label>

          {/* DEFAULT */}

          <label
            className={
              styles.checkbox
            }
          >
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) =>
                setIsDefault(
                  e.target.checked
                )
              }
              disabled={saving}
            />

            <div>
              <strong>
                デフォルトサイズ
              </strong>

              <small>
                この商品を注文した際に最初に選択されるサイズです。
              </small>
            </div>
          </label>

          {/* ERROR */}

          {error && (
            <div className={styles.error}>
              <span className="material-symbols-outlined">
                error
              </span>

              {error}
            </div>
          )}

          {/* ACTION */}

          <div
            className={
              styles.actions
            }
          >
            <button
              type="button"
              className={
                styles.cancelButton
              }
              onClick={onClose}
              disabled={saving}
            >
              キャンセル
            </button>

            <button
              type="button"
              className={
                styles.saveButton
              }
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? "保存中..."
                : isEdit
                ? "更新する"
                : "追加する"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}