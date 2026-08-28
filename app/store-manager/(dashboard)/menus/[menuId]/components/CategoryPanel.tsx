"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Toast, { type ToastState } from "./Toast";
import styles from "../styles/category-panel.module.css";
import type { MenuCategory } from "../MenuEditorClient";

type Props = {
  menuId: number;
  categories: MenuCategory[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number) => void;
  onCategoryCreated: (category: MenuCategory) => void;
  onCategoryUpdated: (category: MenuCategory) => void;
  onCategoryDeleted: (id: number) => void;
  onCategoriesReordered: (categories: MenuCategory[]) => void;
};

export default function CategoryPanel({
  menuId,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
  onCategoriesReordered,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const [toastState, setToastState] = useState<ToastState>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // State lưu ID danh mục đang mở Popover Menu 3 chấm
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  }>({
    top: 0,
    left: 0,
  });

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToastState({ message, type });
  };

  // Lắng nghe sự kiện click toàn trang để đóng Popover Menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (openMenuId === null) return;

    const handleScroll = () => {
      setOpenMenuId(null);
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);


  // FORM STATES
  const [nameJa, setNameJa] = useState("");
  const [nameVi, setNameVi] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameZh, setNameZh] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  function resetForm() {
    setNameJa("");
    setNameVi("");
    setNameEn("");
    setNameZh("");
    setImageUrl("");
    setIsActive(true);
    setEditingCategory(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(category: MenuCategory, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingCategory(category);
    setNameJa(category.name_ja || "");
    setNameVi(category.name_vi || "");
    setNameEn(category.name_en || "");
    setNameZh(category.name_zh || "");
    setImageUrl(category.image_url || "");
    setIsActive(category.is_active ?? true);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    resetForm();
  }

  async function handleDeleteCategory(category: MenuCategory, e: React.MouseEvent) {
    e.stopPropagation();

    const confirmMessage = `「${category.name_ja}」を削除してもよろしいですか？\n※カテゴリ内の商品も削除される可能性があります。`;
    if (!window.confirm(confirmMessage)) return;

    setDeletingId(category.id);

    try {
      const response = await fetch(`/api/store-manager/menu-categories/${category.id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "削除に失敗しました。");

      onCategoryDeleted(category.id);
      showToast("カテゴリを削除しました", "success");

      if (editingCategory?.id === category.id) {
        closeForm();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました。";
      showToast(errorMessage, "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    const trimmedNameJa = nameJa.trim();
    if (!trimmedNameJa) {
      showToast("日本語のカテゴリ名を入力してください。", "error");
      return;
    }

    setSaving(true);

    const isEdit = Boolean(editingCategory);
    const url = isEdit
      ? `/api/store-manager/menu-categories/${editingCategory!.id}`
      : "/api/store-manager/menu-categories";

    const method = isEdit ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_id: menuId,
          name_ja: trimmedNameJa,
          name_vi: nameVi.trim() || null,
          name_en: nameEn.trim() || null,
          name_zh: nameZh.trim() || null,
          image_url: imageUrl.trim() || null,
          is_active: isActive,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "処理に失敗しました。");

      if (isEdit) {
        onCategoryUpdated(data.category);
        showToast("カテゴリを更新しました", "success");
      } else {
        onCategoryCreated(data.category);
        showToast("カテゴリを追加しました", "success");
      }

      closeForm();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "エラーが発生しました。";
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(index: number, direction: "up" | "down", e: React.MouseEvent) {
    e.stopPropagation();
    if (reordering) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onCategoriesReordered(updated);
    setReordering(true);

    try {
      const payload = updated.map((cat, i) => ({
        id: cat.id,
        display_order: i + 1,
      }));

      const res = await fetch("/api/store-manager/menu-categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_id: menuId, items: payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        onCategoriesReordered(categories);
        showToast(data.error || "順序の変更に失敗しました", "error");
      } else {
        showToast(data.message || "順序を変更しました", "success");
      }
    } catch {
      onCategoriesReordered(categories);
      showToast("通信エラーが発生しました", "error");
    } finally {
      setReordering(false);
    }
  }


  function handleOpenMenu(
    categoryId: number,
    e: React.MouseEvent<HTMLButtonElement>
  ) {
    e.stopPropagation();

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();

    const menuWidth = 130;
    const gap = 6;

    // Mặc định: dropdown nằm bên dưới button
    let left = rect.right - menuWidth;
    let top = rect.bottom + gap;

    // Không cho dropdown vượt mép phải màn hình
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    // Không cho vượt mép trái
    if (left < 8) {
      left = 8;
    }

    // Nếu phía dưới không đủ chỗ → mở lên trên
    const estimatedMenuHeight = 190;

    if (top + estimatedMenuHeight > window.innerHeight - 8) {
      top = rect.top - estimatedMenuHeight - gap;
    }

    // Không cho vượt phía trên
    if (top < 8) {
      top = 8;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId((current) =>
      current === categoryId ? null : categoryId
    );
  }


  return (
    <aside className={styles.categoryPanel}>
      <Toast toast={toastState} onClose={() => setToastState(null)} />

      {/* PANEL HEADER */}
      <div className={styles.panelHeader}>
        <div className={styles.titleGroup}>
          <h2>カテゴリ</h2>
          <span className={styles.countBadge}>{categories.length}</span>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={openCreateForm}
          title="カテゴリを追加"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {/* FORM MODAL / CARD */}
      {showForm && (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3>{editingCategory ? "カテゴリ編集" : "新規カテゴリ"}</h3>
            <button type="button" className={styles.closeButton} onClick={closeForm} disabled={saving}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className={styles.formFields}>
            <label className={styles.field}>
              <span>日本語 <b className={styles.required}>必須</b></span>
              <input
                type="text"
                placeholder="例: バインミー"
                value={nameJa}
                onChange={(e) => setNameJa(e.target.value)}
                maxLength={255}
                disabled={saving}
                autoFocus
              />
            </label>

            <div className={styles.multiLangGrid}>
              <label className={styles.field}>
                <span>Tiếng Việt</span>
                <input
                  type="text"
                  placeholder="Bánh mì"
                  value={nameVi}
                  onChange={(e) => setNameVi(e.target.value)}
                  maxLength={255}
                  disabled={saving}
                />
              </label>

              <label className={styles.field}>
                <span>English</span>
                <input
                  type="text"
                  placeholder="Banh Mi"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  maxLength={255}
                  disabled={saving}
                />
              </label>

              <label className={styles.field}>
                <span>中文</span>
                <input
                  type="text"
                  placeholder="越式面包"
                  value={nameZh}
                  onChange={(e) => setNameZh(e.target.value)}
                  maxLength={255}
                  disabled={saving}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>画像URL</span>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                maxLength={500}
                disabled={saving}
              />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={saving}
              />
              <span>有効にする</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={closeForm} disabled={saving}>
              キャンセル
            </button>
            <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving || !nameJa.trim()}>
              {saving ? "保存中..." : editingCategory ? "更新" : "追加"}
            </button>
          </div>
        </section>
      )}

      {/* CATEGORY LIST */}
      <div className={styles.categoryList}>
        {categories.map((category, index) => {
          const isSelected = selectedCategoryId === category.id;
          const isDeleting = deletingId === category.id;

          return (
            <div
              key={category.id}
              className={`${styles.categoryItem} ${isSelected ? styles.selected : ""} ${
                !category.is_active ? styles.inactive : ""
              }`}
              onClick={() => onSelectCategory(category.id)}
            >
              <div className={styles.thumb}>
                {category.image_url ? (
                  <img src={category.image_url} alt={category.name_ja} />
                ) : (
                  <span className="material-symbols-outlined">category</span>
                )}
              </div>

              <div className={styles.info}>
                <span className={styles.nameJa}>{category.name_ja}</span>
              </div>

              {/* ACTIONS: Menu 3 chấm dạng Popover Context */}
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={styles.moreBtn}
                  onClick={(e) => handleOpenMenu(category.id, e)}
                  title="メニュー"
                >
                  <span className="material-symbols-outlined">more_vert</span>
                </button>

                {openMenuId !== null &&
                  typeof document !== "undefined" &&
                  createPortal(
                    <div
                      className={styles.dropdownMenu}
                      style={{
                        position: "fixed",
                        top: menuPosition.top,
                        left: menuPosition.left,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const index = categories.findIndex(
                          (category) => category.id === openMenuId
                        );

                        const category = categories[index];

                        if (!category) return null;

                        const isDeleting = deletingId === category.id;

                        return (
                          <>
                            <button
                              type="button"
                              disabled={index === 0 || reordering}
                              onClick={(e) => {
                                handleMove(index, "up", e);
                                setOpenMenuId(null);
                              }}
                            >
                              <span className="material-symbols-outlined">
                                keyboard_arrow_up
                              </span>
                              上へ移動
                            </button>

                            <button
                              type="button"
                              disabled={
                                index === categories.length - 1 ||
                                reordering
                              }
                              onClick={(e) => {
                                handleMove(index, "down", e);
                                setOpenMenuId(null);
                              }}
                            >
                              <span className="material-symbols-outlined">
                                keyboard_arrow_down
                              </span>
                              下へ移動
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                openEditForm(category, e);
                                setOpenMenuId(null);
                              }}
                            >
                              <span className="material-symbols-outlined">
                                edit
                              </span>
                              編集
                            </button>

                            <hr className={styles.dropdownDivider} />

                            <button
                              type="button"
                              className={styles.deleteMenuItem}
                              disabled={isDeleting}
                              onClick={(e) => {
                                handleDeleteCategory(category, e);
                                setOpenMenuId(null);
                              }}
                            >
                              <span className="material-symbols-outlined">
                                {isDeleting ? "sync" : "delete"}
                              </span>
                              削除
                            </button>
                          </>
                        );
                      })()}
                    </div>,
                    document.body
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}