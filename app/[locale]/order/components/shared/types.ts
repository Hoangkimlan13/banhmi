// components/shared/types.ts
// ============================================================
// SHARED TYPES — Dùng chung cho FoodGrid và ProductDetailModal
// ============================================================

import { type Locale } from "@/app/i18n";

// ============================================================
// LOCALE
// ============================================================

export type { Locale };

// ============================================================
// TAG
// ============================================================

export interface MenuTag {
  id: number | string;
  name_vi?: string | null;
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active?: number | boolean;
  isActive?: number | boolean;
}

// ============================================================
// VARIANT
// ============================================================

export interface MenuVariant {
  id: number | string;
  name_vi?: string | null;
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  price?: number | string | null;
  is_available?: boolean | number;
  is_default?: boolean | number;
  stock_status?: string | null;
  deleted_at?: string | null;
  code?: string | null;
}

// ============================================================
// OPTION (Topping / Lựa chọn)
// ============================================================

export interface MenuOption {
  id: number | string;
  name_vi?: string | null;
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  price?: number | string | null;
  code?: string | null;
  variantPrices?: Record<string, number> | null; // { variantId: price }
}

// ============================================================
// OPTION GROUP
// ============================================================

export interface MenuOptionGroup {
  id: number | string;
  name_vi?: string | null;
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  title_vi?: string | null;
  title_ja?: string | null;
  title_en?: string | null;
  title_zh?: string | null;
  type?: string | null; // "single" | "multiple" | "checkbox" | "multi"
  selection_type?: string | null;
  select_type?: string | null;
  is_required?: boolean | number | string | null;
  required?: boolean | number | string | null;
  options?: MenuOption[];
}

// ============================================================
// ALLERGEN
// ============================================================

export interface MenuAllergen {
  id: number | string;
  name_vi?: string | null;
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
}

// ============================================================
// MENU ITEM (Sản phẩm)
// ============================================================

export interface MenuItem {
  id: number | string;
  name_vi?: string | null;
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  title_vi?: string | null;
  title_ja?: string | null;
  title_en?: string | null;
  title_zh?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  price?: number | string | null;
  status?: string | null; // "PAUSED" = sold out

  // Tags (new normalized data)
  tags?: MenuTag[];

  // Tags (old Prisma relation)
  tbl_menu_item_tag?: Array<{
    tbl_tag?: MenuTag;
  }>;

  // Variants (new normalized data)
  variants?: MenuVariant[];

  // Variants (old Prisma relation)
  tbl_menu_item_variants?: MenuVariant[];

  // Option groups
  optionGroups?: MenuOptionGroup[];

  // Allergens
  allergens?: MenuAllergen[];

  // Category
  category_id?: number | string | null;
}

// ============================================================
// CART ITEM
// ============================================================

export interface CartItem {
  // Key
  cartKey: string;

  // Product
  menuItemId: number | string;
  itemId: number | string;
  name: string;
  name_vi?: string | null;
  name_ja?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  image_url?: string | null;

  // Variant
  variantId?: number | string | null;
  variantCode?: string | null;
  variantName?: string | null;
  variantName_vi?: string | null;
  variantName_ja?: string | null;
  variantName_en?: string | null;
  variantName_zh?: string | null;
  variantPrice?: number;

  // Price
  basePrice: number;
  optionsPrice: number;
  unitPrice: number;
  totalPrice: number;

  // Options
  selectedOptions: SelectedOptions;
  selectedOptionSnapshot: SelectedOptionSnapshot;
  optionGroups?: MenuOptionGroup[];

  // Other
  note: string;
  quantity: number;
}

// ============================================================
// SELECTED OPTIONS
// ============================================================

export type SelectedOptions = Record<string, any | any[]>;

export type SelectedOptionSnapshot = Record<string, any>;

// ============================================================
// CART VALIDATION
// ============================================================

export interface CartValidationRequest {
  items: Array<{
    menuItemId: number;
    variantId: number | null;
    quantity: number;
    selectedOptions: SelectedOptions;
  }>;
}

export interface CartValidationResponse {
  success: boolean;
  valid: boolean;
  items?: Array<{
    reason?: string; // "ITEM_UNAVAILABLE" | "VARIANT_UNAVAILABLE" | "VARIANT_NOT_FOUND" | "INVALID_VARIANT"
  }>;
  message?: string;
}

// ============================================================
// MENU API RESPONSE
// ============================================================

export interface MenuItemApiResponse {
  success: boolean;
  data: MenuItem;
  message?: string;
}