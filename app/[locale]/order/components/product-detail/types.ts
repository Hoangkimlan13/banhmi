// components/product-detail/types.ts
// ============================================================
// PRODUCT DETAIL TYPES
// ============================================================

import type {
  MenuItem,
  MenuVariant,
  MenuOptionGroup,
  MenuOption,
  MenuAllergen,
  SelectedOptions,
  SelectedOptionSnapshot,
  CartItem,
} from "../shared/types";

// ============================================================
// PROPS
// ============================================================

export interface ProductDetailModalProps {
  isOpen: boolean;
  itemId: any;
  locale: string;
  onClose: () => void;
  onAddToCart: (cartItem: any) => void;
}

// ============================================================
// MODAL STATE
// ============================================================

export interface ProductDetailState {
  product: MenuItem | null;
  loading: boolean;
  validating: boolean;
  selectedOptions: SelectedOptions;
  selectedVariant: MenuVariant | null;
  note: string;
  quantity: number;
  errorMessage: string;
  showAllergens: boolean;
  isScrolled: boolean;
  isClosing: boolean;
}

// ============================================================
// TRANSLATIONS
// ============================================================

export interface ProductDetailTranslations {
  loading: string;
  required: string;
  optional: string;
  allergens: string;
  noteLabel: string;
  notePlaceholder: string;
  quantity: string;
  free: string;
  selectRequired: string;
  continueShopping: string;
  checkoutNow: string;
  total: string;
  size: string;
  selectSize: string;
}

export type ProductDetailTranslationMap = Record<
  string,
  ProductDetailTranslations
>;

// ============================================================
// PRICE SUMMARY
// ============================================================

export interface ProductPriceSummary {
  basePrice: number;
  optionsPrice: number;
  unitPrice: number;
  totalPrice: number;
}

// ============================================================
// CART BUILD RESULT
// ============================================================

export type BuildCartItemResult = CartItem | null;

// ============================================================
// VALIDATION RESULT
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errorMessage?: string;
  scrollToKey?: string;
}

// ============================================================
// OPTION GROUP RENDER PROPS
// ============================================================

export interface OptionGroupRenderProps {
  group: MenuOptionGroup;
  groupIndex: number;
  groupKey: string;
  required: boolean;
  multiple: boolean;
  currentSelected: any;
  selectedVariant: MenuVariant | null;
  dict: ProductDetailTranslations;
  onSelectOption: (
    group: MenuOptionGroup,
    groupIndex: number,
    option: MenuOption
  ) => void;
}