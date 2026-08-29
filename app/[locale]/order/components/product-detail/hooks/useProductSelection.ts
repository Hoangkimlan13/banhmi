// components/product-detail/hooks/useProductSelection.ts
"use client";

import { useState, useMemo, useCallback } from "react";
import {
  getGroupRequired,
  getGroupKey,
  isMultipleGroup,
  getOptionPrice,
  getName,
  getGroupName,
} from "../../shared/menu-helpers";

interface UseProductSelectionOptions {
  product: any;
  locale: string;
  initialVariant?: any;
  dict: any;
}

export function useProductSelection({
  product,
  locale,
  initialVariant = null,
  dict,
}: UseProductSelectionOptions) {
  // ============================================================
  // STATE
  // ============================================================

  const [selectedOptions, setSelectedOptions] = useState<Record<string, any | any[]>>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(initialVariant);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================
  // PRICE CALCULATION
  // ============================================================

  const basePrice = useMemo(() => {
    if (selectedVariant) {
      return Number(selectedVariant.price ?? 0);
    }
    return Number(product?.price ?? 0);
  }, [selectedVariant, product]);

  const optionsPrice = useMemo(() => {
    const variantId = selectedVariant?.id;
    return Object.values(selectedOptions).reduce((sum: number, selected: any) => {
      if (Array.isArray(selected)) {
        return (
          sum +
          selected.reduce(
            (optionSum: number, option: any) =>
              optionSum + getOptionPrice(option, variantId),
            0
          )
        );
      }
      return sum + getOptionPrice(selected, variantId);
    }, 0);
  }, [selectedOptions, selectedVariant]);

  const unitPrice = basePrice + optionsPrice;
  const totalPrice = unitPrice * quantity;

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleSelectVariant = useCallback((variant: any) => {
    if (!variant) return;

    const isAvailable = variant?.is_available !== false;
    const stockStatus = String(variant?.stock_status ?? "available").toLowerCase();
    const unavailableStatuses = [
      "sold_out",
      "unavailable",
      "out_of_stock",
      "paused",
      "inactive",
    ];

    if (!isAvailable || unavailableStatuses.includes(stockStatus)) {
      return;
    }

    setSelectedVariant(variant);
    setErrorMessage("");
  }, []);

  const handleSelectOption = useCallback((
    group: any,
    groupIndex: number,
    option: any
  ) => {
    const groupKey = getGroupKey(group, groupIndex);
    const multiple = isMultipleGroup(group);

    setSelectedOptions((previous) => {
      const next = { ...previous };

      if (multiple) {
        const current = Array.isArray(previous[groupKey])
          ? previous[groupKey]
          : [];

        const exists = current.some(
          (item: any) => String(item?.id) === String(option?.id)
        );

        if (exists) {
          next[groupKey] = current.filter(
            (item: any) => String(item?.id) !== String(option?.id)
          );
        } else {
          next[groupKey] = [...current, option];
        }

        if (Array.isArray(next[groupKey]) && next[groupKey].length === 0) {
          delete next[groupKey];
        }
      } else {
        next[groupKey] = option;
      }

      return next;
    });

    setErrorMessage("");
  }, []);

  const setQuantitySafe = useCallback((q: number) => {
    setQuantity(Math.max(1, q));
  }, []);

  // ============================================================
  // FORM VALIDATION
  // ============================================================

  const isFormValid = useMemo(() => {
    // PRODUCT CÓ VARIANT
    if (
      Array.isArray(product?.variants) &&
      product.variants.length > 0
    ) {
      if (!selectedVariant) {
        return false;
      }
    }

    // OPTION GROUP
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
  }, [product, selectedVariant, selectedOptions]);

  // ============================================================
  // SET DEFAULT VARIANT
  // ============================================================

  const setDefaultVariant = useCallback((variant: any) => {
    setSelectedVariant(variant);
  }, []);

  // ============================================================
  // RESET
  // ============================================================

  const resetSelection = useCallback(() => {
    setSelectedOptions({});
    setSelectedVariant(null);
    setNote("");
    setQuantity(1);
    setErrorMessage("");
  }, []);

  return {
    // State
    selectedOptions,
    selectedVariant,
    note,
    quantity,
    errorMessage,

    // Price
    basePrice,
    optionsPrice,
    unitPrice,
    totalPrice,

    // Handlers
    handleSelectVariant,
    handleSelectOption,
    setNote,
    setQuantity: setQuantitySafe,
    setErrorMessage,

    // Validation
    isFormValid,

    // Default variant
    setDefaultVariant,

    // Reset
    resetSelection,
  };
}