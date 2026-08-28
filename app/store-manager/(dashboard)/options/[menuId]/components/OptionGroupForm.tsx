"use client";

import { useEffect, useState } from "react";
import { X, Save, Info } from "lucide-react";

import {
  createOptionGroup,
  updateOptionGroup,
} from "../actions/optionGroupActions";

import type {
  OptionGroup,
  OptionGroupFormData,
} from "../types/option.types";

import styles from "../styles/optionItemForm.module.css";

/* ============================================================
   TYPES
   ============================================================ */

type Props = {
  menuId: number;
  group: OptionGroup | null;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * type phải là literal union.
 *
 * Không dùng:
 *
 * const type = condition ? "multiple" : "single";
 *
 * vì trong một số trường hợp TypeScript có thể widen thành string
 * khi đưa vào object payload.
 */
type OptionGroupType = "single" | "multiple";

/* ============================================================
   EMPTY FORM
   ============================================================ */

const EMPTY_FORM: OptionGroupFormData = {
  code: "",
  name_ja: "",
  name_vi: "",
  name_en: "",
  name_zh: "",
  description: "",
  sort_order: 0,
  is_available: true,
  is_required: false,
  type: "single",
  max_choices: 1,
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function OptionGroupForm({
  menuId,
  group,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] =
    useState<OptionGroupFormData>({
      ...EMPTY_FORM,
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ============================================================
     LOAD GROUP DATA
     ============================================================ */

  useEffect(() => {
    if (!group) {
      setForm({
        ...EMPTY_FORM,
      });

      setError("");

      return;
    }

    /**
     * Explicit literal union.
     *
     * Quan trọng:
     * Không để TypeScript suy luận thành string.
     */
    const type: OptionGroupType =
      group.type === "multiple"
        ? "multiple"
        : "single";

    const maxChoices =
      type === "multiple"
        ? Math.max(
            2,
            Number(
              group.max_choices ?? 2
            ) || 2
          )
        : 1;

    setForm({
      code: group.code ?? "",

      name_ja:
        group.name_ja ?? "",

      name_vi:
        group.name_vi ?? "",

      name_en:
        group.name_en ?? "",

      name_zh:
        group.name_zh ?? "",

      description:
        group.description ?? "",

      sort_order:
        Number(
          group.sort_order ?? 0
        ),

      is_available:
        Boolean(
          group.is_available
        ),

      is_required:
        Boolean(
          group.is_required
        ),

      type,

      max_choices:
        maxChoices,
    });

    setError("");
  }, [group]);

  /* ============================================================
     UPDATE FORM FIELD
     ============================================================ */

  const updateField = <
    K extends keyof OptionGroupFormData
  >(
    key: K,
    value: OptionGroupFormData[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ============================================================
     CHANGE TYPE
     ============================================================ */

  const handleTypeChange = (
    type: OptionGroupType
  ) => {
    if (type === "single") {
      setForm((prev) => ({
        ...prev,
        type: "single",
        max_choices: 1,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      type: "multiple",
      max_choices:
        Number(prev.max_choices) >= 2
          ? Number(prev.max_choices)
          : 2,
    }));
  };

  /* ============================================================
     CHANGE MAX CHOICES
     ============================================================ */

  const handleMaxChoicesChange = (
    value: string
  ) => {
    if (value === "") {
      updateField(
        "max_choices",
        ""
      );

      return;
    }

    const num = Number(value);

    if (!Number.isFinite(num)) {
      return;
    }

    updateField(
      "max_choices",
      Math.trunc(num)
    );
  };

  /* ============================================================
     SUBMIT
     ============================================================ */

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    /* ==========================================================
       NORMALIZE VALUES
       ========================================================== */

    const code =
      form.code
        .trim()
        .toUpperCase();

    const nameJa =
      form.name_ja.trim();

    const nameVi =
      form.name_vi.trim();

    const nameEn =
      form.name_en.trim();

    const nameZh =
      form.name_zh.trim();

    const description =
      form.description.trim();

    /* ==========================================================
       VALIDATION
       ========================================================== */

    if (!code) {
      setError(
        "コードを入力してください。"
      );

      return;
    }

    if (!nameJa) {
      setError(
        "日本語名を入力してください。"
      );

      return;
    }

    if (code.length > 50) {
      setError(
        "コードは50文字以内で入力してください。"
      );

      return;
    }

    /* ==========================================================
       TYPE
       ========================================================== */

    /**
     * QUAN TRỌNG:
     *
     * Explicit type:
     *
     * "single" | "multiple"
     *
     * thay vì để TypeScript suy luận thành string.
     */
    const type: OptionGroupType =
      form.type === "multiple"
        ? "multiple"
        : "single";

    /* ==========================================================
       REQUIRED
       ========================================================== */

    const isRequired =
      Boolean(
        form.is_required
      );

    /* ==========================================================
       MAX CHOICES
       ========================================================== */

    let maxChoices = 1;

    if (type === "multiple") {
      const raw =
        Number(
          form.max_choices
        );

      if (
        !Number.isFinite(raw) ||
        raw < 2
      ) {
        setError(
          "最大選択数は2以上を入力してください。"
        );

        return;
      }

      maxChoices =
        Math.trunc(raw);
    }

    /* ==========================================================
       START SAVE
       ========================================================== */

    setLoading(true);

    try {
      /* ========================================================
         PAYLOAD
         ======================================================== */

      /**
       * Explicit type cho payload.
       *
       * Đây chính là phần sửa lỗi:
       *
       * type: "single" | "multiple"
       *
       * Không còn bị suy luận thành string.
       */
      const payload = {
        menu_id: Number(menuId),

        code,

        name_ja: nameJa,

        name_vi:
          nameVi || undefined,

        name_en:
          nameEn || undefined,

        name_zh:
          nameZh || undefined,

        description:
          description || undefined,

        sort_order:
          Number(
            form.sort_order
          ) || 0,

        is_available:
          Boolean(
            form.is_available
          ),

        is_required:
          isRequired,

        type:
          type as OptionGroupType,

        max_choices:
          maxChoices,
      };

      /* ========================================================
         DEBUG
         ======================================================== */

      console.log(
        "[OptionGroupForm] Saving:",
        {
          mode: group
            ? "update"
            : "create",
          menuId,
          groupId:
            group?.id ?? null,
          payload,
        }
      );

      /* ========================================================
         CREATE / UPDATE
         ======================================================== */

      const result = group
        ? await updateOptionGroup({
            id: Number(
              group.id
            ),

            ...payload,

            /**
             * Explicit cast thêm một lần ở đây
             * để bảo đảm action nhận đúng literal union.
             */
            type:
              type as
                | "single"
                | "multiple",
          })
        : await createOptionGroup({
            ...payload,

            type:
              type as
                | "single"
                | "multiple",
          });

      /* ========================================================
         RESULT
         ======================================================== */

      if (!result.success) {
        setError(
          result.message ||
            "保存に失敗しました。"
        );

        return;
      }

      /* ========================================================
         SUCCESS
         ======================================================== */

      console.log(
        "[OptionGroupForm] Saved successfully:",
        result
      );

      onSaved();
    } catch (err) {
      console.error(
        "[OptionGroupForm] submit error:",
        err
      );

      setError(
        "保存中にエラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div
      className={
        styles.modalOverlay
      }
      onMouseDown={(e) => {
        if (
          e.target ===
            e.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        className={
          styles.modal
        }
      >
        {/* ======================================================
            HEADER
            ====================================================== */}

        <div
          className={
            styles.modalHeader
          }
        >
          <div
            className={
              styles.headerContent
            }
          >
            <span
              className={
                styles.headerEyebrow
              }
            >
              MASTER OPTION GROUP
            </span>

            <h2>
              {group
                ? "オプショングループを編集"
                : "オプショングループを追加"}
            </h2>
          </div>

          <button
            type="button"
            className={
              styles.iconButton
            }
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ======================================================
            FORM
            ====================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className={
            styles.form
          }
        >
          {/* ==================================================
              CODE
              ================================================== */}

          <div
            className={
              styles.field
            }
          >
            <span>
              コード <b>*</b>
            </span>

            <input
              value={
                form.code
              }
              onChange={(e) =>
                updateField(
                  "code",
                  e.target.value.toUpperCase()
                )
              }
              disabled={
                loading ||
                (Boolean(group) &&
                  (group?.usage_count ??
                    0) > 0)
              }
              placeholder="例: SIZE"
              maxLength={50}
            />

            {group &&
              (group.usage_count ??
                0) > 0 && (
                <div
                  className={
                    styles.sortInfo
                  }
                >
                  <div
                    className={
                      styles.sortInfoIcon
                    }
                  >
                    <Info
                      size={14}
                    />
                  </div>

                  <span>
                    商品で使用中のため、コードは変更できません。
                  </span>
                </div>
              )}
          </div>

          {/* ==================================================
              TRANSLATIONS
              ================================================== */}

          <div
            className={
              styles.formGrid
            }
          >
            <label
              className={
                styles.field
              }
            >
              <span>
                日本語 <b>*</b>
              </span>

              <input
                value={
                  form.name_ja
                }
                onChange={(e) =>
                  updateField(
                    "name_ja",
                    e.target.value
                  )
                }
                placeholder="例: サイズ"
                maxLength={100}
                disabled={
                  loading
                }
              />
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                Tiếng Việt
              </span>

              <input
                value={
                  form.name_vi
                }
                onChange={(e) =>
                  updateField(
                    "name_vi",
                    e.target.value
                  )
                }
                placeholder="Ví dụ: Kích thước"
                maxLength={100}
                disabled={
                  loading
                }
              />
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                English
              </span>

              <input
                value={
                  form.name_en
                }
                onChange={(e) =>
                  updateField(
                    "name_en",
                    e.target.value
                  )
                }
                placeholder="e.g. Size"
                maxLength={100}
                disabled={
                  loading
                }
              />
            </label>

            <label
              className={
                styles.field
              }
            >
              <span>
                中文
              </span>

              <input
                value={
                  form.name_zh
                }
                onChange={(e) =>
                  updateField(
                    "name_zh",
                    e.target.value
                  )
                }
                placeholder="例: 尺寸"
                maxLength={100}
                disabled={
                  loading
                }
              />
            </label>
          </div>

          {/* ==================================================
              DESCRIPTION
              ================================================== */}

          <label
            className={
              styles.field
            }
          >
            <span>
              説明
            </span>

            <textarea
              value={
                form.description
              }
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value
                )
              }
              rows={3}
              placeholder="オプショングループの詳細説明を入力してください..."
              disabled={
                loading
              }
            />
          </label>

          {/* ==================================================
              SELECTION SETTINGS
              ================================================== */}

          <div
            className={
              styles.selectionSettings
            }
          >
            <div
              className={
                styles.selectionSettingsHeader
              }
            >
              <div>
                <strong>
                  選択設定
                </strong>

                <small>
                  お客様がこのオプショングループをどのように選択するか設定します。
                </small>
              </div>
            </div>

            {/* REQUIRED */}

            <label
              className={
                styles.switchRow
              }
            >
              <span>
                <strong>
                  選択を必須にする
                </strong>

                <small>
                  このグループから必ず1つ以上選択してもらう
                </small>
              </span>

              <input
                type="checkbox"
                checked={
                  form.is_required ===
                  true
                }
                onChange={(e) =>
                  updateField(
                    "is_required",
                    e.target.checked
                  )
                }
                disabled={
                  loading
                }
              />
            </label>

            {/* SELECTION TYPE */}

            <div
              className={
                styles.field
              }
            >
              <span>
                選択方式
              </span>

              <div
                className={
                  styles.selectionTypeGrid
                }
              >
                <button
                  type="button"
                  className={
                    form.type ===
                    "single"
                      ? styles.selectionTypeActive
                      : styles.selectionTypeButton
                  }
                  onClick={() =>
                    handleTypeChange(
                      "single"
                    )
                  }
                  disabled={
                    loading
                  }
                >
                  <strong>
                    単一選択
                  </strong>

                  <small>
                    1つだけ選択
                  </small>
                </button>

                <button
                  type="button"
                  className={
                    form.type ===
                    "multiple"
                      ? styles.selectionTypeActive
                      : styles.selectionTypeButton
                  }
                  onClick={() =>
                    handleTypeChange(
                      "multiple"
                    )
                  }
                  disabled={
                    loading
                  }
                >
                  <strong>
                    複数選択
                  </strong>

                  <small>
                    複数選択可能
                  </small>
                </button>
              </div>
            </div>

            {/* MAX CHOICES */}

            {form.type ===
              "multiple" && (
              <label
                className={
                  styles.field
                }
              >
                <span>
                  最大選択数
                </span>

                <input
                  type="number"
                  min={2}
                  step={1}
                  value={
                    form.max_choices ??
                    ""
                  }
                  onChange={(e) =>
                    handleMaxChoicesChange(
                      e.target.value
                    )
                  }
                  disabled={
                    loading
                  }
                  inputMode="numeric"
                />

                <small>
                  2以上の数字を入力してください。
                </small>
              </label>
            )}
          </div>

          {/* ==================================================
              AVAILABLE
              ================================================== */}

          <label
            className={
              styles.switchRow
            }
          >
            <span>
              <strong>
                有効
              </strong>

              <small>
                このオプショングループを利用可能にする
              </small>
            </span>

            <input
              type="checkbox"
              checked={
                form.is_available ===
                true
              }
              onChange={(e) =>
                updateField(
                  "is_available",
                  e.target.checked
                )
              }
              disabled={
                loading
              }
            />
          </label>

          {/* ==================================================
              ERROR
              ================================================== */}

          {error && (
            <div
              className={
                styles.formError
              }
            >
              {error}
            </div>
          )}

          {/* ==================================================
              FOOTER
              ================================================== */}

          <div
            className={
              styles.modalFooter
            }
          >
            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                onClose
              }
              disabled={
                loading
              }
            >
              キャンセル
            </button>

            <button
              type="submit"
              className={
                styles.primaryButton
              }
              disabled={
                loading
              }
            >
              <Save
                size={16}
              />

              {loading
                ? "保存中..."
                : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}