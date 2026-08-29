// components/product-detail/utils/product-validation.ts
"use client";

import {
  getGroupRequired,
  getGroupKey,
  isMultipleGroup,
} from "../../shared/menu-helpers";

export interface IsFormValidParams {
  product: any;
  selectedVariant: any;
  selectedOptions: Record<string, any>;
}

export function isFormValid({
  product,
  selectedVariant,
  selectedOptions,
}: IsFormValidParams): boolean {
  // ============================================================
  // PRODUCT CÓ VARIANT
  // ============================================================

  if (
    Array.isArray(product?.variants) &&
    product.variants.length > 0
  ) {
    if (!selectedVariant) {
      return false;
    }
  }

  // ============================================================
  // OPTION GROUP
  // ============================================================

  if (
    !product?.optionGroups ||
    !Array.isArray(product.optionGroups)
  ) {
    return true;
  }

  for (let index = 0; index < product.optionGroups.length; index++) {
    const group = product.optionGroups[index];

    if (!getGroupRequired(group)) {
      continue;
    }

    const groupKey = getGroupKey(group, index);
    const selected = selectedOptions[groupKey];
    const multiple = isMultipleGroup(group);

    if (multiple) {
      if (!Array.isArray(selected) || selected.length === 0) {
        return false;
      }
    } else {
      if (!selected || Array.isArray(selected)) {
        return false;
      }
    }
  }

  return true;
}