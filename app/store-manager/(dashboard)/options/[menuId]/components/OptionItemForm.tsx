"use client";

import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";

import {
  createOptionItem,
  updateOptionItem,
} from "../actions/optionItemActions";

import type {
  OptionGroup,
  OptionItem,
  OptionItemFormData,
} from "../types/option.types";

import styles from "../styles/optionItemForm.module.css";

type Props = {
  menuId: number;
  group: OptionGroup;
  item: OptionItem | null;
  onClose: () => void;
  onSaved: () => void;
};

function createEmptyForm(groupId: number): OptionItemFormData {
  return {
    option_group_id: groupId,
    code: "",
    name_ja: "",
    name_vi: "",
    name_en: "",
    name_zh: "",
    icon_url: "",
    price: "0",
    sort_order: 0,
    is_available: true,
  };
}

export default function OptionItemForm({
  menuId,
  group,
  item,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<OptionItemFormData>(() => createEmptyForm(group.id));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) {
      setForm(createEmptyForm(group.id));
      setError("");
      return;
    }
    setForm({
      option_group_id: group.id,
      code: item.code,
      name_ja: item.name_ja,
      name_vi: item.name_vi ?? "",
      name_en: item.name_en ?? "",
      name_zh: item.name_zh ?? "",
      icon_url: item.icon_url ?? "",
      price: String(item.price),
      sort_order: item.sort_order,
      is_available: item.is_available,
    });
    setError("");
  }, [group.id, item]);

  const updateField = <K extends keyof OptionItemFormData>(
    key: K,
    value: OptionItemFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!group?.id) {
      setError("オプショングループが見つかりません。");
      return;
    }

    const code = form.code.trim().toUpperCase();
    const nameJa = form.name_ja.trim();
    const nameVi = form.name_vi.trim();
    const nameEn = form.name_en.trim();
    const nameZh = form.name_zh.trim();

    if (!code) {
      setError("コードを入力してください。");
      return;
    }
    if (!nameJa) {
      setError("日本語名を入力してください。");
      return;
    }
    if (code.length > 50) {
      setError("コードは50文字以内で入力してください。");
      return;
    }

    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setError("価格を正しく入力してください。");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        menu_id: menuId,
        option_group_id: group.id,
        code,
        name_ja: nameJa,
        name_vi: nameVi || undefined,
        name_en: nameEn || undefined,
        name_zh: nameZh || undefined,
        icon_url: form.icon_url.trim() || undefined,
        price,
        is_available: form.is_available,
      };

      const result = item
        ? await updateOptionItem({ id: item.id, ...payload })
        : await createOptionItem(payload);

      if (!result.success) {
        setError(result.message || "保存に失敗しました。");
        return;
      }

      onSaved();
    } catch (err) {
      console.error("OptionItemForm submit error:", err);
      setError("保存中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <span className={styles.headerEyebrow}>OPTION</span>
            <h2>{item ? "オプションを編集" : "オプションを追加"}</h2>
            <p>{group.name_ja} / {group.code}</p>
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            disabled={loading}
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>コード <b>*</b></span>
              <input
                value={form.code}
                onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                placeholder="例: LARGE"
                maxLength={50}
                disabled={loading || (Boolean(item) && (item?.usage_count ?? 0) > 0)}
              />
            </label>

            <label className={styles.field}>
              <span>日本語 <b>*</b></span>
              <input
                value={form.name_ja}
                onChange={(e) => updateField("name_ja", e.target.value)}
                placeholder="例: 大"
                maxLength={100}
                disabled={loading}
              />
            </label>

            <label className={styles.field}>
              <span>Tiếng Việt</span>
              <input
                value={form.name_vi}
                onChange={(e) => updateField("name_vi", e.target.value)}
                placeholder="Lớn"
                maxLength={100}
                disabled={loading}
              />
            </label>

            <label className={styles.field}>
              <span>English</span>
              <input
                value={form.name_en}
                onChange={(e) => updateField("name_en", e.target.value)}
                placeholder="Large"
                maxLength={100}
                disabled={loading}
              />
            </label>

            <label className={styles.field}>
              <span>中文</span>
              <input
                value={form.name_zh}
                onChange={(e) => updateField("name_zh", e.target.value)}
                placeholder="大"
                maxLength={100}
                disabled={loading}
              />
            </label>

            <label className={styles.field}>
              <span>追加料金</span>
              <div className={styles.priceInput}>
                <span>¥</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => updateField("price", e.target.value)}
                  disabled={loading}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>アイコンURL</span>
              <input
                value={form.icon_url}
                onChange={(e) => updateField("icon_url", e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
            </label>
          </div>

          <div className={styles.sortInfo}>
            <div className={styles.sortInfoIcon}>↕</div>
            <div>
              <strong>表示順は自動管理</strong>
              <span>追加したオプションは最後に追加されます。順番は「⋯」メニューから変更できます。</span>
            </div>
          </div>

          <label className={styles.switchRow}>
            <span>
              <strong>有効</strong>
              <small>このオプションを利用可能にする</small>
            </span>
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(e) => updateField("is_available", e.target.checked)}
              disabled={loading}
            />
          </label>

          {error && <div className={styles.formError}>{error}</div>}

          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" className={styles.primaryButton} disabled={loading}>
              <Save size={17} />
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}