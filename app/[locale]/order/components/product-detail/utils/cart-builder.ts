// components/product-detail/utils/cart-builder.ts
"use client";

import { generateCartKey } from "@/lib/cartHelper";
import {
  getName,
  getGroupRequired,
  getGroupName,
  getGroupKey,
  isMultipleGroup,
  getOptionPrice,
} from "../../shared/menu-helpers";

export interface BuildCartItemParams {
  product: any;
  selectedOptions: Record<string, any>;
  selectedVariant: any;
  note: string;
  quantity: number;
  locale: string;
  dict: any;
  setError: (msg: string) => void;
  scrollToGroup?: (groupKey: string) => void;
}

export function buildCartItem({
  product,
  selectedOptions,
  selectedVariant,
  note,
  quantity,
  locale,
  dict,
  setError,
  scrollToGroup,
}: BuildCartItemParams) {
  // ============================================================
  // 1. REQUIRED VARIANT
  // ============================================================

  if (
    Array.isArray(product?.variants) &&
    product.variants.length > 0 &&
    !selectedVariant
  ) {
    setError(dict.selectSize);
    return null;
  }

  // ============================================================
  // 2. REQUIRED OPTION GROUP
  // ============================================================

  if (
    product?.optionGroups &&
    Array.isArray(product.optionGroups)
  ) {
    for (let index = 0; index < product.optionGroups.length; index++) {
      const group = product.optionGroups[index];

      if (!getGroupRequired(group)) {
        continue;
      }

      const groupKey = getGroupKey(group, index);
      const selected = selectedOptions[groupKey];
      const multiple = isMultipleGroup(group);

      const valid = multiple
        ? Array.isArray(selected) && selected.length > 0
        : !!selected && !Array.isArray(selected);

      if (!valid) {
        setError(
          `${dict.selectRequired} ${getGroupName(group, locale)}`
        );

        if (scrollToGroup) {
          setTimeout(() => {
            scrollToGroup(groupKey);
          }, 50);
        }

        return null;
      }
    }
  }

  // ============================================================
  // 3. COPY SELECTED OPTIONS
  // ============================================================

  const cartSelectedOptions = { ...selectedOptions };

  // ============================================================
  // 4. CART KEY
  // ============================================================

  const cartKey = generateCartKey(
    product.id,
    {
      variantId: selectedVariant?.id ?? null,
      selectedOptions: cartSelectedOptions,
    },
    note
  );

  // ============================================================
  // 5. SNAPSHOT OPTION
  // ============================================================

  const selectedOptionSnapshot: Record<string, any> = {};

  Object.entries(cartSelectedOptions).forEach(([groupKey, selected]) => {
    if (Array.isArray(selected)) {
      selectedOptionSnapshot[groupKey] = selected.map((option: any) => ({
        id: option.id,
        code: option.code ?? null,
        name_vi: option.name_vi ?? "",
        name_ja: option.name_ja ?? "",
        name_en: option.name_en ?? "",
        name_zh: option.name_zh ?? "",
        price: getOptionPrice(option, selectedVariant?.id),
        variantId: selectedVariant?.id ?? null,
      }));
    } else if (selected) {
      selectedOptionSnapshot[groupKey] = {
        id: selected.id,
        code: selected.code ?? null,
        name_vi: selected.name_vi ?? "",
        name_ja: selected.name_ja ?? "",
        name_en: selected.name_en ?? "",
        name_zh: selected.name_zh ?? "",
        price: getOptionPrice(selected, selectedVariant?.id),
        variantId: selectedVariant?.id ?? null,
      };
    }
  });

  // ============================================================
  // 6. PRICE
  // ============================================================

  const basePrice = selectedVariant
    ? Number(selectedVariant.price ?? 0)
    : Number(product?.price ?? 0);

  const optionsPrice = Object.values(cartSelectedOptions).reduce(
    (sum: number, selected: any) => {
      if (Array.isArray(selected)) {
        return (
          sum +
          selected.reduce(
            (optionSum: number, option: any) =>
              optionSum + getOptionPrice(option, selectedVariant?.id),
            0
          )
        );
      }
      return sum + getOptionPrice(selected, selectedVariant?.id);
    },
    0
  );

  const unitPrice = basePrice + optionsPrice;
  const totalPrice = unitPrice * quantity;

  // ============================================================
  // 7. CART ITEM
  // ============================================================

  return {
    cartKey,
    menuItemId: product.id,
    itemId: product.id,
    name: getName(product, locale),
    name_vi: product.name_vi,
    name_ja: product.name_ja,
    name_en: product.name_en,
    name_zh: product.name_zh,
    image_url: product.image_url,
    variantId: selectedVariant?.id ?? null,
    variantCode: selectedVariant?.code ?? null,
    variantName: selectedVariant ? getName(selectedVariant, locale) : null,
    variantName_vi: selectedVariant?.name_vi ?? null,
    variantName_ja: selectedVariant?.name_ja ?? null,
    variantName_en: selectedVariant?.name_en ?? null,
    variantName_zh: selectedVariant?.name_zh ?? null,
    variantPrice: basePrice,
    basePrice,
    optionsPrice,
    unitPrice,
    totalPrice,
    selectedOptions: cartSelectedOptions,
    selectedOptionSnapshot,
    optionGroups: product.optionGroups,
    note,
    quantity,
  };
}