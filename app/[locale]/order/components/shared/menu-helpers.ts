// components/shared/menu-helpers.ts
// ============================================================
// SHARED HELPERS — Dùng chung cho FoodGrid và ProductDetailModal
// ============================================================

import { type Locale } from "@/app/i18n";
import type {
  MenuItem,
  MenuTag,
  MenuVariant,
  MenuOptionGroup,
  MenuOption,
} from "./types";

// ============================================================
// LOCALIZATION HELPERS (THỐNG NHẤT FALLBACK)
// ============================================================

/**
 * Lấy tên của item theo locale
 * Fallback: locale → en → vi → zh → name → title
 */
export function getName(item: any, locale: string): string {
  if (!item) return "";

  const langMap: Record<string, string[]> = {
    ja: ['name_ja', 'title_ja', 'name_en', 'title_en', 'name_vi', 'title_vi', 'name_zh', 'title_zh', 'name', 'title'],
    en: ['name_en', 'title_en', 'name_vi', 'title_vi', 'name_ja', 'title_ja', 'name_zh', 'title_zh', 'name', 'title'],
    vi: ['name_vi', 'title_vi', 'name_en', 'title_en', 'name_ja', 'title_ja', 'name_zh', 'title_zh', 'name', 'title'],
    zh: ['name_zh', 'title_zh', 'name_en', 'title_en', 'name_vi', 'title_vi', 'name_ja', 'title_ja', 'name', 'title'],
  };
  const keys = langMap[locale] || langMap.vi;
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && item[key] !== "") {
      return String(item[key]);
    }
  }
  return "";
}

/**
 * Lấy tên tag theo locale
 */
export function getTagName(tag: any, locale: Locale): string {
  if (!tag) return "";
  const langMap: Record<string, string[]> = {
    ja: ['name_ja', 'name_en', 'name_vi', 'name_zh'],
    en: ['name_en', 'name_vi', 'name_ja', 'name_zh'],
    vi: ['name_vi', 'name_en', 'name_ja', 'name_zh'],
    zh: ['name_zh', 'name_en', 'name_vi', 'name_ja'],
  };
  const keys = langMap[locale] || langMap.vi;
  for (const key of keys) {
    if (tag[key] !== undefined && tag[key] !== null && tag[key] !== "") {
      return String(tag[key]);
    }
  }
  return "";
}

/**
 * Lấy tên group theo locale
 */
export function getGroupName(group: any, locale: string): string {
  if (!group) return "";
  const langMap: Record<string, string[]> = {
    ja: ['name_ja', 'title_ja', 'name_en', 'title_en', 'name_vi', 'title_vi', 'name_zh', 'title_zh', 'name', 'title'],
    en: ['name_en', 'title_en', 'name_vi', 'title_vi', 'name_ja', 'title_ja', 'name_zh', 'title_zh', 'name', 'title'],
    vi: ['name_vi', 'title_vi', 'name_en', 'title_en', 'name_ja', 'title_ja', 'name_zh', 'title_zh', 'name', 'title'],
    zh: ['name_zh', 'title_zh', 'name_en', 'title_en', 'name_vi', 'title_vi', 'name_ja', 'title_ja', 'name', 'title'],
  };
  const keys = langMap[locale] || langMap.vi;
  for (const key of keys) {
    if (group[key] !== undefined && group[key] !== null && group[key] !== "") {
      return String(group[key]);
    }
  }
  return "";
}

/**
 * Lấy tên option theo locale
 */
export function getOptionName(option: any, locale: string): string {
  if (!option) return "";
  const langMap: Record<string, string[]> = {
    ja: ['name_ja', 'name_en', 'name_vi', 'name_zh', 'name'],
    en: ['name_en', 'name_vi', 'name_ja', 'name_zh', 'name'],
    vi: ['name_vi', 'name_en', 'name_ja', 'name_zh', 'name'],
    zh: ['name_zh', 'name_en', 'name_vi', 'name_ja', 'name'],
  };
  const keys = langMap[locale] || langMap.vi;
  for (const key of keys) {
    if (option[key] !== undefined && option[key] !== null && option[key] !== "") {
      return String(option[key]);
    }
  }
  return "";
}

/**
 * Lấy nhãn thuế theo locale
 */
export function getTaxLabel(locale: Locale): string {
  switch (locale) {
    case "ja": return "（税込）";
    case "vi": return "(Đã gồm thuế)";
    case "zh": return "(含税)";
    default: return "(Tax incl.)";
  }
}

/**
 * Lấy nhãn "Sold out" theo locale
 */
export function getSoldOutLabel(locale: Locale): string {
  switch (locale) {
    case "ja": return "売り切れ";
    case "vi": return "Hết món";
    case "zh": return "售罄";
    default: return "Sold out";
  }
}

// ============================================================
// VARIANT HELPERS (giữ nguyên)
// ============================================================

export function isVariantAvailable(variant: any): boolean {
  if (!variant) return false;
  if (variant.is_available === false) return false;
  if (variant.deleted_at) return false;
  const stockStatus = String(variant.stock_status ?? "available").toLowerCase();
  const unavailableStatuses = [
    "sold_out",
    "unavailable",
    "out_of_stock",
    "paused",
    "inactive",
  ];
  if (unavailableStatuses.includes(stockStatus)) return false;
  return true;
}

export function getItemVariants(item: any): MenuVariant[] {
  let variants: any[] = [];
  if (Array.isArray(item?.variants)) {
    variants = item.variants;
  } else if (Array.isArray(item?.tbl_menu_item_variants)) {
    variants = item.tbl_menu_item_variants;
  }
  return variants.filter(isVariantAvailable);
}

export function getVariantLabel(item: any, locale: Locale): string {
  const variants = getItemVariants(item);
  if (variants.length === 0) return "";
  const names = variants.map((v) => getName(v, locale)).filter(Boolean);
  if (names.length === 0) return "";
  switch (locale) {
    case "ja": return "サイズを選択";
    case "vi": return "Chọn kích thước";
    case "zh": return "选择规格";
    default: return "Choose size";
  }
}

// ============================================================
// TAG HELPERS (giữ nguyên)
// ============================================================

export function getItemTags(item: any): MenuTag[] {
  if (Array.isArray(item?.tags)) {
    return item.tags.filter((tag: any) => tag && Number(tag.is_active ?? 1) === 1);
  }
  if (Array.isArray(item?.tbl_menu_item_tag)) {
    return item.tbl_menu_item_tag
      .map((relation: any) => relation?.tbl_tag)
      .filter((tag: any) => tag && Number(tag.is_active ?? 1) === 1);
  }
  return [];
}

// ============================================================
// OPTION HELPERS (giữ nguyên)
// ============================================================

export function getGroupRequired(group: any): boolean {
  if (!group) return false;
  if (group.is_required !== undefined && group.is_required !== null) {
    return group.is_required === true || group.is_required === 1 || group.is_required === "1" || group.is_required === "true";
  }
  if (group.required !== undefined && group.required !== null) {
    return group.required === true || group.required === 1 || group.required === "1" || group.required === "true";
  }
  return false;
}

export function getGroupKey(group: any, index: number): string {
  if (group?.id !== undefined && group?.id !== null) {
    return `group-${String(group.id)}`;
  }
  if (group?.group_id !== undefined && group?.group_id !== null) {
    return `group-${String(group.group_id)}`;
  }
  return `group-index-${index}`;
}

export function isMultipleGroup(group: any): boolean {
  const type = String(
    group?.type ?? group?.selection_type ?? group?.select_type ?? "single"
  ).toLowerCase();
  return type === "multiple" || type === "checkbox" || type === "multi";
}

export function getOptionPrice(option: any, variantId?: any): number {
  if (variantId === undefined || variantId === null) {
    return Number(option?.price ?? 0);
  }
  if (option?.variantPrices && typeof option.variantPrices === "object") {
    const variantPrice = option.variantPrices[String(variantId)];
    if (variantPrice !== undefined && variantPrice !== null) {
      return Number(variantPrice);
    }
  }
  return Number(option?.price ?? 0);
}

// ============================================================
// PRICE HELPERS (giữ nguyên)
// ============================================================

export function getDisplayPrice(item: any, locale: Locale): {
  price: number;
  hasRange: boolean;
  hasVariants: boolean;
  variantCount: number;
} {
  const variants = getItemVariants(item);
  if (variants.length === 0) {
    const basePrice = Number(item?.price ?? 0);
    return {
      price: Number.isFinite(basePrice) ? basePrice : 0,
      hasRange: false,
      hasVariants: false,
      variantCount: 0,
    };
  }
  const prices = variants
    .map((variant: any) => Number(variant?.price ?? 0))
    .filter((price: number) => Number.isFinite(price));
  if (prices.length === 0) {
    const basePrice = Number(item?.price ?? 0);
    return {
      price: Number.isFinite(basePrice) ? basePrice : 0,
      hasRange: false,
      hasVariants: true,
      variantCount: variants.length,
    };
  }
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  return {
    price: minPrice,
    hasRange: minPrice !== maxPrice,
    hasVariants: variants.length > 0,
    variantCount: variants.length,
  };
}

// ============================================================
// AVAILABILITY HELPERS (giữ nguyên)
// ============================================================

export function isSoldOut(item: any): boolean {
  return item?.status === "PAUSED";
}

// ============================================================
// CART HELPERS (giữ nguyên)
// ============================================================

export function getItemQuantity(cartItems: any[], itemId: any): number {
  if (!Array.isArray(cartItems)) return 0;
  return cartItems.reduce((total, ci) => {
    const ciId = ci.menuItemId ?? ci.itemId ?? ci.id ?? ci.dish_id;
    if (String(ciId) === String(itemId)) {
      return total + Number(ci.quantity ?? 0);
    }
    return total;
  }, 0);
}

export function getFirstCartKeyForItem(
  cartItems: any[],
  itemId: any
): string | null {
  if (!Array.isArray(cartItems)) return null;
  const found = cartItems.find((ci) => {
    const ciId = ci.menuItemId ?? ci.itemId ?? ci.id ?? ci.dish_id;
    return String(ciId) === String(itemId);
  });
  return found?.cartKey ?? null;
}