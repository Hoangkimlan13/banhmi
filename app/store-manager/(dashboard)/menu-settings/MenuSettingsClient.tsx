"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./styles/menu-settings.module.css";

type Menu = {
  id: number;
  store_id: number;
  name: string;
  is_default: boolean;
  is_active: boolean;
  categoryCount: number;
  itemCount: number;
};

type StoreInfo = {
  id: number;
  title: string;
  type: string;
};

type Props = {
  store: StoreInfo;
  initialMenus: Menu[];
};

export default function MenuSettingsClient({
  store,
  initialMenus,
}: Props) {
  const [menus, setMenus] =
    useState<Menu[]>(initialMenus);

  const [showForm, setShowForm] =
    useState(false);

  const [editingMenu, setEditingMenu] =
    useState<Menu | null>(null);

  const [name, setName] =
    useState("");

  const [isDefault, setIsDefault] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const isTruck =
    store.type === "Truck";

  const router = useRouter();
  
  
  function openMenu(menu: Menu) {
    router.push(
        `/store-manager/menus/${menu.id}`
    );
    }

  function openOptions(menu: Menu) {
    router.push(
      `/store-manager/options/${menu.id}`
    );
  }

  // ============================================================
  // OPEN CREATE
  // ============================================================

  function openCreate() {
    setEditingMenu(null);
    setName("");
    setIsDefault(
      menus.length === 0
    );
    setError("");
    setShowForm(true);
  }

  // ============================================================
  // OPEN EDIT
  // ============================================================

  function openEdit(menu: Menu) {
    setEditingMenu(menu);
    setName(menu.name);
    setIsDefault(menu.is_default);
    setError("");
    setShowForm(true);
  }

  // ============================================================
  // CLOSE FORM
  // ============================================================

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingMenu(null);
    setName("");
    setIsDefault(false);
    setError("");
  }

  // ============================================================
  // SAVE
  // ============================================================

  async function handleSave() {
    const trimmedName =
      name.trim();

    if (!trimmedName) {
      setError(
        "メニュー名を入力してください。"
      );
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "メニュー名は100文字以内で入力してください。"
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "/api/store-manager/menu-settings",
        {
          method: editingMenu
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: editingMenu?.id,
            name: trimmedName,
            is_default: isDefault,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "保存に失敗しました。"
        );
      }

      if (editingMenu) {
        setMenus((current) =>
          current.map((menu) =>
            menu.id === data.menu.id
              ? data.menu
              : isDefault &&
                  menu.id !== data.menu.id
                ? {
                    ...menu,
                    is_default: false,
                  }
                : menu
          )
        );
      } else {
        setMenus((current) => {
          const next = isDefault
            ? current.map((menu) => ({
                ...menu,
                is_default: false,
              }))
            : current;

          return [
            ...next,
            data.menu,
          ];
        });
      }

      closeForm();
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

  // ============================================================
  // DISABLE
  // ============================================================

  async function handleDisable(
    menu: Menu
  ) {
    const confirmed =
      window.confirm(
        `「${menu.name}」を無効にしますか？`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        "/api/store-manager/menu-settings",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: menu.id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "メニューを無効にできません。"
        );
      }

      setMenus((current) =>
        current.map((item) =>
          item.id === menu.id
            ? {
                ...item,
                is_active: false,
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

  // ============================================================
  // REACTIVATE
  // ============================================================

  async function handleReactivate(
    menu: Menu
  ) {
    try {
      const response = await fetch(
        "/api/store-manager/menu-settings",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id: menu.id,
            is_active: true,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "メニューを有効にできません。"
        );
      }

      setMenus((current) =>
        current.map((item) =>
          item.id === menu.id
            ? data.menu
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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className={styles.page}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className={styles.header}>
        <div>
          <h1>
            メニュー設定
          </h1>

          <p>
            {store.title}
          </p>
        </div>

        <button
          type="button"
          className={styles.createButton}
          onClick={openCreate}
        >
          <span className="material-symbols-outlined">
            add
          </span>

          メニューを作成
        </button>
      </header>

      {/* ======================================================
          DESCRIPTION
      ====================================================== */}

      <section
        className={styles.infoCard}
      >
        <span className="material-symbols-outlined">
          {isTruck
            ? "local_shipping"
            : "storefront"}
        </span>

        <div>
          <strong>
            {isTruck
              ? "キッチンカーのメニュー"
              : "店舗のメニュー"}
          </strong>

          <p>
            {isTruck
              ? "営業スケジュールごとに使用するメニューを切り替えできます。"
              : "通常メニューや営業形態に応じたメニューを管理できます。"}
          </p>
        </div>
      </section>

      {/* ======================================================
          FORM
      ====================================================== */}

      {showForm && (
        <section
          className={styles.formCard}
        >
          <div
            className={styles.formHeader}
          >
            <div>
              <h2>
                {editingMenu
                  ? "メニューを編集"
                  : "新しいメニュー"}
              </h2>

              <p>
                メニュー名を設定してください。
              </p>
            </div>

            <button
              type="button"
              className={
                styles.closeButton
              }
              onClick={closeForm}
              disabled={saving}
            >
              <span className="material-symbols-outlined">
                close
              </span>
            </button>
          </div>

          <div className={styles.form}>
            <label
              className={styles.field}
            >
              <span>
                メニュー名
              </span>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder={
                  isTruck
                    ? "例：ベトナムフェス限定"
                    : "例：通常メニュー"
                }
                maxLength={100}
                disabled={saving}
              />
            </label>

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

              <span>
                通常メニューにする
              </span>
            </label>

            {isTruck && (
              <p
                className={
                  styles.helper
                }
              >
                キッチンカーでは、営業スケジュールごとに
                販売場所と使用するメニューを指定できます。
              </p>
            )}

            {error && (
              <div
                className={
                  styles.error
                }
              >
                {error}
              </div>
            )}

            <div
              className={styles.formActions}
            >
              <button
                type="button"
                className={
                  styles.cancelButton
                }
                onClick={closeForm}
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
                  : editingMenu
                    ? "更新する"
                    : "作成する"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          MENU LIST
      ====================================================== */}

      <section
        className={styles.listSection}
      >
        <div
          className={styles.sectionHeader}
        >
          <div>
            <h2>
              メニュー一覧
            </h2>

            <span>
              {menus.length}件
            </span>
          </div>
        </div>

        {menus.length === 0 ? (
          <div
            className={
              styles.emptyState 
            }
          >
            <span className="material-symbols-outlined">
              menu_book
            </span>

            <h3>
              メニューがありません
            </h3>

            <p>
              最初のメニューを作成してください。
            </p>

            <button
              type="button"
              onClick={openCreate}
              className={
                styles.emptyButton
              }
            >
              ＋ メニューを作成
            </button>
          </div>
        ) : (
          <div
            className={styles.menuList}
          >
            {menus.map((menu) => (
              <article
                key={menu.id}
                className={`${styles.menuCard} ${
                  !menu.is_active
                    ? styles.inactive
                    : ""
                }`}
              >
                <div
                  className={
                    styles.menuMain
                  }
                >
                  <div
                    className={
                      styles.menuIcon
                    }
                  >
                    <span className="material-symbols-outlined">
                      restaurant_menu
                    </span>
                  </div>

                  <div
                    className={
                      styles.menuInfo
                    }
                  >
                    <div
                      className={
                        styles.menuTitle
                      }
                    >
                      <h3>
                        {menu.name}
                      </h3>

                      {menu.is_default && (
                        <span
                          className={
                            styles.defaultBadge
                          }
                        >
                          通常
                        </span>
                      )}

                      {!menu.is_active && (
                        <span
                          className={
                            styles.inactiveBadge
                          }
                        >
                          無効
                        </span>
                      )}
                    </div>

                    <div
                      className={
                        styles.menuStats
                      }
                    >
                      <span>
                        カテゴリ{" "}
                        {menu.categoryCount}
                      </span>

                      <span>
                        商品{" "}
                        {menu.itemCount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.menuActions}>
                  {menu.is_active && (
                    <>
                      {/* メニュー編集 */}
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.primaryBtn}`}
                        onClick={() => openMenu(menu)}
                      >
                        <span className="material-symbols-outlined">
                          restaurant_menu
                        </span>

                        <span>メニューを編集</span>
                      </button>

                      {/* オプション管理 */}
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                        onClick={() => openOptions(menu)}
                      >
                        <span className="material-symbols-outlined">
                          tune
                        </span>

                        <span>オプション管理</span>
                      </button>
                    </>
                  )}

                  {/* メニュー設定 */}
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.secondaryBtn}`}
                    onClick={() => openEdit(menu)}
                    disabled={!menu.is_active}
                  >
                    <span className="material-symbols-outlined">
                      settings
                    </span>

                    <span>設定</span>
                  </button>

                  {/* 有効 / 無効 */}
                  {menu.is_active ? (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.dangerBtn}`}
                      onClick={() => handleDisable(menu)}
                    >
                      <span className="material-symbols-outlined">
                        block
                      </span>

                      <span>無効にする</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.successBtn}`}
                      onClick={() => handleReactivate(menu)}
                    >
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>

                      <span>有効にする</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}