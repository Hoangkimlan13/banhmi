"use client";

import { useEffect, useState } from "react";
import styles from "../styles/MenuItemTags.module.css";

/* ============================================================
   TYPES
   ============================================================ */

type Tag = {
  id: number;
  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;
  code: string;
  color: string | null;
  icon: string | null;
  sort_order: number | null;
  is_active: number | null;
};

type Props = {
  itemId: number | null;
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function MenuItemTags({ itemId }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  // Lưu 1 ID duy nhất hoặc null
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /* ==========================================================
     LOAD TAGS
     ========================================================== */

  useEffect(() => {
    if (!itemId) {
      setTags([]);
      setSelectedId(null);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function loadTags() {
      setLoading(true);
      setError("");
      setSuccess(false);

      try {
        const response = await fetch(
          `/api/store-manager/menu-item-tags?itemId=${itemId}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ?? "タグ情報を取得できません。"
          );
        }

        setTags(Array.isArray(data.tags) ? data.tags : []);

        // Lấy ID đầu tiên nếu server trả về mảng, ngược lại đặt null
        if (Array.isArray(data.selectedTagIds) && data.selectedTagIds.length > 0) {
          setSelectedId(Number(data.selectedTagIds[0]));
        } else if (data.selectedTagId) {
          setSelectedId(Number(data.selectedTagId));
        } else {
          setSelectedId(null);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        console.error("[MenuItemTags]", err);
        setError(
          err instanceof Error
            ? err.message
            : "タグ情報の取得に失敗しました。"
        );
      } finally {
        setLoading(false);
      }
    }

    loadTags();

    return () => {
      controller.abort();
    };
  }, [itemId]);

  /* ==========================================================
     SELECT TAG (SINGLE CHOICE)
     ========================================================== */

  function handleSelectTag(tagId: number) {
    // Nếu bấm lại vào tag đang chọn thì hủy chọn (toggle về null)
    setSelectedId((current) => (current === tagId ? null : tagId));
    setSuccess(false);
    setError("");
  }

  /* ==========================================================
     SAVE
     ========================================================== */

  async function saveTags() {
    if (!itemId) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/store-manager/menu-item-tags", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          // Gửi mảng chứa 1 item hoặc mảng rỗng để khớp API backend
          tagIds: selectedId ? [selectedId] : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "タグを保存できません。");
      }

      if (Array.isArray(data.tagIds) && data.tagIds.length > 0) {
        setSelectedId(Number(data.tagIds[0]));
      } else if (data.selectedTagId) {
        setSelectedId(Number(data.selectedTagId));
      } else {
        setSelectedId(null);
      }

      setSuccess(true);

      window.setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("[MenuItemTags save]", err);
      setError(
        err instanceof Error
          ? err.message
          : "タグの保存に失敗しました。"
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================================
     NO ITEM
     ========================================================== */

  if (!itemId) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <span className="material-symbols-outlined">sell</span>
          </div>
          <div className={styles.headerText}>
            <h3>タグ</h3>
            <p>商品に表示するタグを設定します。</p>
          </div>
        </div>
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined">lock</span>
          <p>商品を一度保存するとタグを設定できます。</p>
        </div>
      </div>
    );
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  const selectedTag = tags.find((t) => t.id === selectedId);

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <span className="material-symbols-outlined">sell</span>
        </div>
        <div className={styles.headerText}>
          <div className={styles.titleRow}>
            <h3>タグ</h3>
            {selectedTag && (
              <span className={styles.badge}>1件選択中</span>
            )}
          </div>
          <p>タグを1つ選択してください（横にスクロール可）</p>
        </div>
      </div>

      {/* MAIN HORIZONTAL SCROLL TAG LIST */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>タグを読み込んでいます…</p>
        </div>
      ) : tags.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-outlined">info</span>
          <p>登録されているタグがありません。</p>
        </div>
      ) : (
        <div className={styles.tagList}>
          {tags.map((tag) => {
            const isSelected = selectedId === tag.id;

            return (
              <button
                key={tag.id}
                type="button"
                className={isSelected ? styles.tagSelected : styles.tag}
                onClick={() => handleSelectTag(tag.id)}
                disabled={saving}
                style={
                  isSelected && tag.color
                    ? {
                        borderColor: tag.color,
                        backgroundColor: `${tag.color}18`,
                        color: tag.color,
                      }
                    : undefined
                }
              >
                {tag.icon && (
                  <span className="material-symbols-outlined">{tag.icon}</span>
                )}

                <span>{tag.name_ja}</span>

                {isSelected && (
                  <span className="material-symbols-outlined">check</span>
                )}
              </button>
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
          <span>タグを保存しました。</span>
        </div>
      )}

      {/* FOOTER */}
      <div className={styles.footerActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={saveTags}
          disabled={loading || saving}
        >
          <span
            className={`material-symbols-outlined ${
              saving ? styles.savingIcon : ""
            }`}
          >
            {saving ? "sync" : "save"}
          </span>
          <span>{saving ? "保存中..." : "タグを保存"}</span>
        </button>
      </div>
    </div>
  );
}