// ============================================================
// MENU TYPES
// ============================================================

export interface MenuCategory {
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
}

// ============================================================
// MENU ITEM
// ============================================================

export type MenuItemStatus = "ACTIVE" | "PAUSED" | "DISCONTINUED";

export interface MenuItem {
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
  is_available: boolean;   // computed from status
  status: MenuItemStatus;  // actual DB field
}

// ============================================================
// OPTION GROUP
// ============================================================

export interface MenuOptionGroup {
  id: number;
  code: string;
  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;
  description: string | null;
  is_available: boolean;
  sort_order: number;
}

// ============================================================
// OPTION ITEM
// ============================================================

export interface MenuOptionItem {
  id: number;
  option_group_id: number;
  code: string;
  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;
  icon_url: string | null;
  price: number;
  is_available: boolean;
  sort_order: number;
}

// ============================================================
// ITEM ↔ OPTION GROUP
// ============================================================

export interface MenuItemOptionGroup {
  id: number;
  menu_item_id: number;
  option_group_id: number;
  display_name_ja: string | null;
  display_name_vi: string | null;
  display_name_en: string | null;
  display_name_zh: string | null;
  is_available: boolean;
  sort_order: number;
}