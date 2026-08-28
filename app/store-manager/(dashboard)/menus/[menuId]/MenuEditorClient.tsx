"use client";

import { useMemo, useState } from "react";

import styles from "./styles/menu-editor.module.css";

import MenuEditorHeader from "./components/MenuEditorHeader";
import CategoryPanel from "./components/CategoryPanel";
import MenuItemList from "./components/MenuItemList";
import MenuItemForm from "./components/MenuItemForm";
import Toast, { ToastState } from "./components/Toast";

/* ============================================================
   STORE
   ============================================================ */

export type StoreInfo = {
  id: number;
  title: string;
  type: string;
};

/* ============================================================
   MENU
   ============================================================ */

export type Menu = {
  id: number;
  store_id: number;
  name: string;
  is_default: boolean;
  is_active: boolean;
};

/* ============================================================
   CATEGORY
   ============================================================ */

export type MenuCategory = {
  id: number;
  menu_id: number;

  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;

  description_ja: string | null;
  description_vi: string | null;

  image_url: string | null;

  display_order: number;
  is_active: boolean;
};

/* ============================================================
   MENU ITEM
   ============================================================ */

export type MenuItemStatus = "ACTIVE" | "PAUSED" | "DISCONTINUED";

export type MenuItem = {
  id: number;

  menu_id: number;

  category_id: number;

  name_ja: string;

  name_vi: string | null;

  name_en: string | null;

  name_zh: string | null;

  description_ja: string | null;

  description_vi: string | null;

  description_en: string | null;

  description_zh: string | null;

  image_url: string | null;

  price: number;

  display_order: number;

  is_available: boolean;

  status: MenuItemStatus;
};
/* ============================================================
   ITEM OPTION GROUP
   ============================================================ */

export type ItemOptionGroup = {
  id: number;

  menu_item_id: number;

  option_group_id: number;

  display_name_ja: string | null;
  display_name_vi: string | null;
  display_name_en: string | null;
  display_name_zh: string | null;

  selection_type: "single" | "multiple";
  is_required: boolean;
  min_choices: number;
  max_choices: number | null;

  is_available: boolean;

  sort_order: number;
};

/* ============================================================
   MENU ITEM VARIANT / SIZE
   ============================================================ */

export type MenuItemVariant = {
  id: number;

  menu_item_id: number;

  code: string;

  sku: string | null;

  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;

  price: number;

  is_default: boolean;
  is_available: boolean;

  stock_status: string;

  sort_order: number;

  deleted_at: string | null;
};


/* ============================================================
   MENU OPTION GROUP
   ============================================================ */

export type MenuOptionGroup = {
  id: number;

  menu_id: number | null;

  code: string;

  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;

  description: string | null;

  is_available: boolean;
  is_required: boolean;

  type: string;
  max_choices: number;

  sort_order: number;
};

/* ============================================================
   OPTION GROUP
   ============================================================ */

export type OptionGroup = {
  id: number;

  code: string;

  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;

  description: string | null;

  is_available: boolean;

  sort_order: number;
};

/* ============================================================
   OPTION ITEM
   ============================================================ */

export type OptionItem = {
  id: number;

  option_group_id: number;

  code: string;

  name_ja: string;
  name_vi?: string | null;
  name_en?: string | null;
  name_zh?: string | null;

  icon_url?: string | null;

  price: number;

  is_available: boolean;

  sort_order: number;

  created_at?: string | Date;
  updated_at?: string | Date;
};

/* ============================================================
   ITEM OPTION ITEM
   ============================================================ */

export type ItemOptionItem = {
  id: number;

  menu_item_id: number;

  option_group_id: number;

  option_item_id: number;

  is_available: boolean;

  sort_order: number;
};

/* ============================================================
   PROPS
   ============================================================ */

type Props = {
  store: StoreInfo;

  menu: Menu;

  initialCategories: MenuCategory[];

  initialItems: MenuItem[];

  initialItemOptionGroups: ItemOptionGroup[];

  initialItemOptionItems: ItemOptionItem[];

  initialOptionGroups: OptionGroup[];

  initialOptionItems: OptionItem[];

  initialMenuOptionGroups: MenuOptionGroup[];
};

/* ============================================================
   COMPONENT
   ============================================================ */

export default function MenuEditorClient({
  store,
  menu,
  initialCategories,
  initialItems,
  initialItemOptionGroups,
  initialItemOptionItems,
  initialOptionGroups,
  initialOptionItems,
  initialMenuOptionGroups,
}: Props) {
  /* ==========================================================
     STATE
     ========================================================== */

  const [categories, setCategories] = useState<MenuCategory[]>(
    initialCategories
  );

  const [items, setItems] = useState<MenuItem[]>(initialItems);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategories[0]?.id ?? null
  );

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [showItemForm, setShowItemForm] = useState(false);

  /* ==========================================================
     TOAST STATE
     ========================================================== */

  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning" = "success"
  ) => {
    setToast({
      message,
      type,
    });
  };

  /* ============================================================
     CATEGORY UPDATED
     ============================================================ */

  const handleCategoryUpdated = (updatedCategory: MenuCategory) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat))
    );

    showToast("カテゴリを更新しました。", "success");
  };

  /* ============================================================
     CATEGORY REORDERED
     ============================================================ */

  const handleCategoriesReordered = (newCategories: MenuCategory[]) => {
    setCategories(newCategories);
  };

  /* ============================================================
     CATEGORY DELETED
     ============================================================ */

  const handleCategoryDeleted = (deletedId: number) => {
    setCategories((prev) => {
      const nextCategories = prev.filter((cat) => cat.id !== deletedId);

      if (selectedCategoryId === deletedId) {
        setSelectedCategoryId(
          nextCategories.length > 0 ? nextCategories[0].id : null
        );
      }

      return nextCategories;
    });

    setItems((prev) => prev.filter((item) => item.category_id !== deletedId));
  };


  /* ============================================================
   MOVE ITEM (REORDER)
   ============================================================ */

  async function handleMoveItem(item: MenuItem, direction: "up" | "down") {
    try {
      const response = await fetch("/api/store-manager/menu-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          move: direction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "順序変更に失敗しました。");
      }

      if (!data?.success) {
        throw new Error("順序変更に失敗しました。");
      }

      // 🔥 Cập nhật toàn bộ items bằng danh sách mới từ server
      if (data.items && Array.isArray(data.items)) {
        setItems((current) => {
          // Lấy tất cả items hiện tại, thay thế những item trong cùng category
          const categoryId = item.category_id;
          const newItems = data.items.map((updatedItem: any) => ({
            ...updatedItem,
            price: Number(updatedItem.price),
            is_available: Boolean(updatedItem.is_available),
          }));

          // Giữ nguyên items của các category khác
          const otherItems = current.filter((i) => i.category_id !== categoryId);
          return [...otherItems, ...newItems];
        });
      }

      showToast("表示順を変更しました。", "info");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "エラーが発生しました。",
        "error"
      );
    }
  }
  /* ============================================================
     CURRENT ITEMS
     ============================================================ */

  const visibleItems = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }

    return items
      .filter((item) => item.category_id === selectedCategoryId)
      .sort((a, b) => {
        const getGroup = (status: MenuItemStatus) =>
          status === "DISCONTINUED" ? 1 : 0;
        const groupA = getGroup(a.status);
        const groupB = getGroup(b.status);

        if (groupA !== groupB) {
          return groupA - groupB;
        }

        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }

        return a.id - b.id;
      });
  }, [items, selectedCategoryId]);

  /* ============================================================
     CREATE ITEM
     ============================================================ */

  function handleCreateItem() {
    if (!selectedCategoryId) {
      showToast("先にカテゴリを選択してください。", "warning");
      return;
    }

    setEditingItem(null);
    setShowItemForm(true);
  }

  /* ============================================================
     EDIT ITEM
     ============================================================ */

  function handleEditItem(item: MenuItem) {
    setEditingItem(item);
    setShowItemForm(true);
  }

  /* ============================================================
     CLOSE ITEM FORM
     ============================================================ */

  function handleCloseItemForm() {
    setShowItemForm(false);
    setEditingItem(null);
  }

  /* ============================================================
     ITEM SAVED
     ============================================================ */

  function handleItemSaved(savedItem: MenuItem) {
    let isUpdate = false;

    setItems((current) => {
      const exists = current.some((item) => item.id === savedItem.id);

      if (exists) {
        isUpdate = true;
        return current.map((item) =>
          item.id === savedItem.id ? savedItem : item
        );
      }

      return [...current, savedItem];
    });

    setShowItemForm(false);
    setEditingItem(null);

    showToast(
      isUpdate ? "メニュー商品を更新しました。" : "メニュー商品を追加しました。",
      "success"
    );
  }

  /* ============================================================
     ITEM STATUS TOGGLE (đã sửa)
     ============================================================ */

  async function handleToggleAvailability(item: MenuItem) {
    try {
      // ✅ Dựa vào status để quyết định trạng thái tiếp theo
      let nextAvailable: boolean;
      if (item.status === "ACTIVE") {
        nextAvailable = false; // 停止
      } else if (item.status === "PAUSED" || item.status === "DISCONTINUED") {
        nextAvailable = true; // 再開 / 販売終了から戻す
      } else {
        // fallback (không nên xảy ra)
        nextAvailable = !item.is_available;
      }

      const response = await fetch("/api/store-manager/menu-items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          is_available: nextAvailable,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "状態を変更できません。");
      }

      if (!data?.success || !data?.item) {
        throw new Error("商品の状態を変更できません。");
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                ...data.item,
                price: Number(data.item.price),
                is_available: Boolean(data.item.is_available),
                status: data.item.status,
              }
            : currentItem
        )
      );

      showToast(
        nextAvailable ? "商品を販売中に変更しました。" : "商品を販売停止に変更しました。",
        "info"
      );
    } catch (error) {
      console.error("[Toggle Availability] Error:", error);
      showToast(
        error instanceof Error ? error.message : "エラーが発生しました。",
        "error"
      );
    }
  }

  /* ============================================================
    DISCONTINUE ITEM
    ============================================================ */

  async function handleDiscontinueItem(item: MenuItem) {
    if (item.status === "DISCONTINUED") {
      return;
    }

    const confirmed = window.confirm(
      `「${item.name_ja}」を販売終了にしますか？\n\n販売終了した商品は通常の「再開」では戻せません。`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/store-manager/menu-items", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: item.id,

          status: "DISCONTINUED",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "販売終了に変更できません。");
      }

      if (!data?.success || !data?.item) {
        throw new Error("商品の状態を変更できません。");
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,

                ...data.item,

                price: Number(data.item.price),

                is_available: Boolean(data.item.is_available),

                status: data.item.status,
              }
            : currentItem
        )
      );

      showToast("商品を販売終了にしました。", "info");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "エラーが発生しました。",
        "error"
      );
    }
  }

  /* ============================================================
     CATEGORY CREATED
     ============================================================ */

  function handleCategoryCreated(category: MenuCategory) {
    setCategories((current) => [...current, category]);
    setSelectedCategoryId(category.id);
    showToast("新しいカテゴリを追加しました。", "success");
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <main className={styles.page}>
      <MenuEditorHeader store={store} menu={menu} />

      <div className={styles.workspace}>
        <CategoryPanel
          menuId={menu.id}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onCategoryCreated={handleCategoryCreated}
          onCategoryUpdated={handleCategoryUpdated}
          onCategoryDeleted={handleCategoryDeleted}
          onCategoriesReordered={handleCategoriesReordered}
        />

        <section className={styles.content}>
          <MenuItemList
            category={
              categories.find((category) => category.id === selectedCategoryId) ??
              null
            }
            items={visibleItems}
            itemOptionGroups={initialItemOptionGroups}
            itemOptionItems={initialItemOptionItems}
            onCreateItem={handleCreateItem}
            onEditItem={handleEditItem}
            onToggleAvailability={handleToggleAvailability}
            onDiscontinueItem={handleDiscontinueItem}
            onMoveItem={handleMoveItem} 
          />
        </section>
      </div>

      {showItemForm && (
        <MenuItemForm
          menuId={menu.id}
          categoryId={selectedCategoryId}
          item={editingItem}
          itemOptionGroups={initialItemOptionGroups}
          itemOptionItems={initialItemOptionItems}
          optionGroups={initialOptionGroups}
          optionItems={initialOptionItems}
          menuOptionGroups={initialMenuOptionGroups}
          onClose={handleCloseItemForm}
          onSaved={handleItemSaved}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  );
}