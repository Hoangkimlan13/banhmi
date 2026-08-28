"use client";

import { useEffect, useState } from "react";
import styles from "../styles/MenuItemAllergens.module.css";

type Allergen = {
  id: number;
  code: string;
  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;
  description_ja?: string | null;
  description_vi?: string | null;
  description_en?: string | null;
  description_zh?: string | null;
  is_active: boolean;
  sort_order: number;
};

type Props = {
  itemId: number | null;
};

export default function MenuItemAllergens({ itemId }: Props) {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setAllergens([]);
      setSelectedIds([]);
      return;
    }

    const controller = new AbortController();

    async function loadAllergens() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/store-manager/menu-item-allergens?itemId=${itemId}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ?? "アレルゲン情報を取得できません。"
          );
        }

        setAllergens(Array.isArray(data.allergens) ? data.allergens : []);
        setSelectedIds(
          Array.isArray(data.selectedAllergenIds)
            ? data.selectedAllergenIds.map(Number)
            : []
        );
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("[MenuItemAllergens]", err);
        setError(
          err instanceof Error
            ? err.message
            : "アレルゲン情報の取得に失敗しました。"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAllergens();

    return () => {
      controller.abort();
    };
  }, [itemId]);

  function toggleAllergen(allergenId: number) {
    setSelectedIds((current) =>
      current.includes(allergenId)
        ? current.filter((id) => id !== allergenId)
        : [...current, allergenId]
    );
  }

  async function saveAllergens() {
    if (!itemId) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/store-manager/menu-item-allergens", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          allergenIds: selectedIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ?? "アレルゲンを保存できません。"
        );
      }

      setSelectedIds(
        Array.isArray(data.allergenIds)
          ? data.allergenIds.map(Number)
          : []
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("[MenuItemAllergens save]", err);
      setError(
        err instanceof Error
          ? err.message
          : "アレルゲンの保存に失敗しました。"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!itemId) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className="material-symbols-outlined">warning</span>
          </div>
          <div className={styles.headerText}>
            <h3>アレルギー</h3>
            <p>商品に含まれるアレルゲンを設定します。</p>
          </div>
        </div>
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined">lock</span>
          <p>商品を一度保存するとアレルギーを設定できます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <span className="material-symbols-outlined">warning</span>
        </div>
        <div className={styles.headerText}>
          <div className={styles.titleRow}>
            <h3>アレルギー</h3>
            {selectedIds.length > 0 && (
              <span className={styles.badge}>{selectedIds.length}件選択中</span>
            )}
          </div>
          <p>該当するアレルゲンを選択してください（横にスクロール可）</p>
        </div>
      </div>

      {/* SELECTED TAGS SCROLL BAR */}
      {selectedIds.length > 0 && (
        <div className={styles.selectedContainer}>
          <div className={styles.selectedScroll}>
            {allergens
              .filter((a) => selectedIds.includes(a.id))
              .map((allergen) => (
                <span
                  key={allergen.id}
                  className={styles.selectedTag}
                  onClick={() => toggleAllergen(allergen.id)}
                  title="タップして解除"
                >
                  <span className="material-symbols-outlined">check</span>
                  {allergen.name_ja}
                  <span className="material-symbols-outlined">close</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* ALLERGEN HORIZONTAL SCROLL GRID */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>アレルゲン情報を読み込んでいます…</p>
        </div>
      ) : allergens.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined">info</span>
          <p>登録されているアレルゲンがありません。</p>
        </div>
      ) : (
        <div className={styles.allergenGrid}>
          {allergens.map((allergen) => {
            const checked = selectedIds.includes(allergen.id);

            return (
              <label
                key={allergen.id}
                className={`${styles.allergenCard} ${
                  checked ? styles.selected : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAllergen(allergen.id)}
                  disabled={saving}
                  className={styles.hiddenCheckbox}
                />
                <div className={styles.checkboxCustom}>
                  <span className="material-symbols-outlined">check</span>
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.allergenName}>
                    {allergen.name_ja}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {/* MESSAGES */}
      {error && (
        <div className={styles.errorMessage}>
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <span className="material-symbols-outlined">check_circle</span>
          <span>アレルギー情報を保存しました。</span>
        </div>
      )}

      {/* FOOTER */}
      <div className={styles.footerActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={saveAllergens}
          disabled={loading || saving}
        >
          <span
            className={`material-symbols-outlined ${
              saving ? styles.savingIcon : ""
            }`}
          >
            {saving ? "sync" : "save"}
          </span>
          <span>{saving ? "保存中..." : "アレルギーを保存"}</span>
        </button>
      </div>
    </div>
  );
}