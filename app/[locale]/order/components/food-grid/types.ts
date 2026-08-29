// components/food-grid/types.ts
// ============================================================
// FOOD GRID TYPES
// ============================================================

import { type Locale } from "@/app/i18n";
import type { MenuItem, MenuTag, MenuVariant } from "../shared/types";

// ============================================================
// PROPS
// ============================================================

export interface FoodGridProps {
  locale: Locale;
  items: MenuItem[];
  cartItems?: any[]; // CartItem (chưa có type đầy đủ)
  getName: (item: any) => string;
  onAddToCart?: (item: any, options?: any[]) => void;
  onDecreaseCart?: (cartKey: string, delta: number) => void;
  onOpenOptions?: (item: any) => void;
}

// ============================================================
// DISPLAY PRICE
// ============================================================

export interface DisplayPrice {
  price: number;
  hasRange: boolean;
  hasVariants: boolean;
  variantCount: number;
}

// ============================================================
// FOOD CARD PROPS
// ============================================================

export interface FoodCardProps {
  item: MenuItem;
  locale: Locale;
  cartItems: any[];
  getName: (item: any) => string;
  onAddToCart?: (item: any, options?: any[]) => void;
  onDecreaseCart?: (cartKey: string, delta: number) => void;
  onOpenOptions?: (item: any) => void;
}

// ============================================================
// FOOD IMAGE PROPS
// ============================================================

export interface FoodImageProps {
  item: MenuItem;
  locale: Locale;
  soldOut: boolean;
  tags: MenuTag[];
  getName: (item: any) => string;
}

// ============================================================
// FOOD TAGS PROPS
// ============================================================

export interface FoodTagsProps {
  tags: MenuTag[];
  locale: Locale;
}

// ============================================================
// FOOD PRICE PROPS
// ============================================================

export interface FoodPriceProps {
  displayPrice: DisplayPrice;
  variantLabel: string;
  locale: Locale;
}

// ============================================================
// FOOD CART CONTROL PROPS
// ============================================================

export interface FoodCartControlProps {
  locale: Locale;
  item: MenuItem;
  quantity: number;
  soldOut: boolean;
  cartKey: string | null;
  onDecreaseCart?: (cartKey: string, delta: number) => void;
  onOpenOptions?: (item: any) => void;
  onAddToCart?: (item: any, options?: any[]) => void;
  handleItemClick: (item: any) => void;
}