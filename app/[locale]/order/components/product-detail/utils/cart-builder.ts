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

// ============================================================
// TYPES
// ============================================================

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

// ============================================================
// HELPERS
// ============================================================

function toSafeNumber(
  value: any,
  fallback = 0
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

// ============================================================
// BUILD CART ITEM
// ============================================================

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
  // 1. PRODUCT VALIDATION
  // ============================================================

  if (!product) {
    setError(dict.genericError);
    return null;
  }

  // ============================================================
  // 2. REQUIRED VARIANT
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
  // 3. REQUIRED OPTION GROUP
  // ============================================================

  if (
    product?.optionGroups &&
    Array.isArray(product.optionGroups)
  ) {
    for (
      let index = 0;
      index < product.optionGroups.length;
      index++
    ) {
      const group =
        product.optionGroups[index];

      if (!getGroupRequired(group)) {
        continue;
      }

      const groupKey =
        getGroupKey(group, index);

      const selected =
        selectedOptions?.[groupKey];

      const multiple =
        isMultipleGroup(group);

      const valid = multiple
        ? Array.isArray(selected) &&
          selected.length > 0
        : !!selected &&
          !Array.isArray(selected);

      if (!valid) {
        setError(
          `${dict.selectRequired} ${getGroupName(
            group,
            locale
          )}`
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
  // 4. QUANTITY
  // ============================================================

  const safeQuantity = Math.max(
    1,
    Math.floor(
      toSafeNumber(quantity, 1)
    )
  );

  // ============================================================
  // 5. COPY SELECTED OPTIONS
  // ============================================================

  const cartSelectedOptions: Record<
    string,
    any
  > = {
    ...(selectedOptions || {}),
  };

  // ============================================================
  // 6. OPTION GROUPS
  // ============================================================

  const optionGroups =
    Array.isArray(product.optionGroups)
      ? product.optionGroups
      : [];

  // ============================================================
  // 7. BUILD OPTION MAP
  // ============================================================

  const fullOptionsMap =
    new Map<number, any>();

  optionGroups.forEach(
    (group: any) => {
      const options =
        Array.isArray(group?.options)
          ? group.options
          : [];

      options.forEach(
        (option: any) => {
          const optionId =
            Number(option?.id);

          if (
            Number.isFinite(optionId)
          ) {
            fullOptionsMap.set(
              optionId,
              option
            );
          }
        }
      );
    }
  );

  // ============================================================
  // 8. ATTACH FULL OPTION DATA
  // ============================================================

  Object.keys(
    cartSelectedOptions
  ).forEach((groupKey) => {
    const selected =
      cartSelectedOptions[groupKey];

    // ==========================================================
    // MULTIPLE
    // ==========================================================

    if (Array.isArray(selected)) {
      cartSelectedOptions[groupKey] =
        selected.map(
          (option: any) => {
            const optionId =
              Number(option?.id);

            if (
              !Number.isFinite(
                optionId
              )
            ) {
              return option;
            }

            const fullOption =
              fullOptionsMap.get(
                optionId
              );

            if (!fullOption) {
              return option;
            }

            return {
              ...fullOption,
              ...option,

              variantPrices:
                fullOption.variantPrices ??
                option.variantPrices ??
                {},
            };
          }
        );

      return;
    }

    // ==========================================================
    // SINGLE
    // ==========================================================

    if (
      selected &&
      typeof selected === "object"
    ) {
      const optionId =
        Number(selected?.id);

      if (
        !Number.isFinite(
          optionId
        )
      ) {
        return;
      }

      const fullOption =
        fullOptionsMap.get(
          optionId
        );

      if (!fullOption) {
        return;
      }

      cartSelectedOptions[groupKey] = {
        ...fullOption,
        ...selected,

        variantPrices:
          fullOption.variantPrices ??
          selected.variantPrices ??
          {},
      };
    }
  });

  // ============================================================
  // 9. VARIANT ID
  // ============================================================

  const variantId =
    selectedVariant?.id != null
      ? Number(selectedVariant.id)
      : null;

  const safeVariantId =
    variantId !== null &&
    Number.isFinite(variantId)
      ? variantId
      : null;

  // ============================================================
  // 10. SELECTED OPTION IDS
  // ============================================================

  const selectedOptionIds =
    Object.values(
      cartSelectedOptions
    ).flatMap(
      (selected: any) => {
        if (
          Array.isArray(selected)
        ) {
          return selected
            .map(
              (option: any) =>
                Number(option?.id)
            )
            .filter(
              (id: number) =>
                Number.isFinite(id)
            );
        }

        const id =
          Number(selected?.id);

        return Number.isFinite(id)
          ? [id]
          : [];
      }
    );

  // ============================================================
  // 11. CART KEY
  // ============================================================

  const cartKey =
    generateCartKey(
      product.id,
      {
        variantId:
          safeVariantId,

        selectedOptions:
          cartSelectedOptions,
      },
      note
    );

  // ============================================================
  // 12. OPTION PRICE SNAPSHOT
  // ============================================================

  const selectedOptionSnapshot: Record<
    string,
    any
  > = {};

  Object.entries(
    cartSelectedOptions
  ).forEach(
    ([groupKey, selected]) => {
      // ========================================================
      // MULTIPLE
      // ========================================================

      if (
        Array.isArray(selected)
      ) {
        selectedOptionSnapshot[
          groupKey
        ] = selected.map(
          (option: any) => ({
            id: option?.id,

            code:
              option?.code ??
              null,

            name_vi:
              option?.name_vi ??
              "",

            name_ja:
              option?.name_ja ??
              "",

            name_en:
              option?.name_en ??
              "",

            name_zh:
              option?.name_zh ??
              "",

            // IMPORTANT:
            //
            // Đây là GIÁ CỘNG THÊM
            // của option.
            //
            // Ví dụ:
            // Egg = +100
            price: toSafeNumber(
              getOptionPrice(
                option,
                safeVariantId
              )
            ),

            variantId:
              safeVariantId,
          })
        );

        return;
      }

      // ========================================================
      // SINGLE
      // ========================================================

      if (selected) {
        selectedOptionSnapshot[
          groupKey
        ] = {
          id: selected?.id,

          code:
            selected?.code ??
            null,

          name_vi:
            selected?.name_vi ??
            "",

          name_ja:
            selected?.name_ja ??
            "",

          name_en:
            selected?.name_en ??
            "",

          name_zh:
            selected?.name_zh ??
            "",

          // GIÁ CỘNG THÊM
          price: toSafeNumber(
            getOptionPrice(
              selected,
              safeVariantId
            )
          ),

          variantId:
            safeVariantId,
        };
      }
    }
  );

  // ============================================================
  // 13. BASE PRICE
  // ============================================================
  //
  // QUAN TRỌNG NHẤT
  //
  // Variant.price là GIÁ CỦA VARIANT.
  //
  // KHÔNG ĐƯỢC:
  //
  // product.price + variant.price
  //
  // Vì:
  //
  // product.price = giá mặc định / giá legacy
  //
  // variant.price = giá thực tế của size
  //
  // Ví dụ:
  //
  // Regular = 790
  // Mini    = 500
  //
  // Chọn Regular:
  //
  // basePrice = 790
  //
  // Chọn Mini:
  //
  // basePrice = 500
  // ============================================================

  const productPrice =
    toSafeNumber(
      product?.price
    );

  const selectedVariantPrice =
    selectedVariant
      ? toSafeNumber(
          selectedVariant?.price
        )
      : 0;

  const basePrice =
    selectedVariant
      ? selectedVariantPrice
      : productPrice;

  // ============================================================
  // 14. OPTION TOTAL
  // ============================================================

  const optionsPrice =
    Object.values(
      cartSelectedOptions
    ).reduce(
      (
        sum: number,
        selected: any
      ) => {
        // ======================================================
        // MULTIPLE
        // ======================================================

        if (
          Array.isArray(selected)
        ) {
          return (
            sum +
            selected.reduce(
              (
                optionSum: number,
                option: any
              ) =>
                optionSum +
                toSafeNumber(
                  getOptionPrice(
                    option,
                    safeVariantId
                  )
                ),
              0
            )
          );
        }

        // ======================================================
        // SINGLE
        // ======================================================

        return (
          sum +
          toSafeNumber(
            getOptionPrice(
              selected,
              safeVariantId
            )
          )
        );
      },
      0
    );

  // ============================================================
  // 15. FINAL PRICE
  // ============================================================
  //
  // CÔNG THỨC DUY NHẤT:
  //
  // unitPrice =
  //
  //   variant.price
  //   + option prices
  //
  // HOẶC nếu không có variant:
  //
  //   product.price
  //   + option prices
  //
  // Ví dụ:
  //
  // Regular     ¥790
  // Egg         +¥100
  //
  // unitPrice   ¥890
  //
  // ============================================================

  const unitPrice =
    basePrice +
    optionsPrice;

  // ============================================================
  // 16. TOTAL PRICE
  // ============================================================

  const totalPrice =
    unitPrice *
    safeQuantity;

  // ============================================================
  // 17. CART ITEM
  // ============================================================

  return {
    // ==========================================================
    // IDENTIFICATION
    // ==========================================================

    cartKey,

    menuItemId:
      product.id,

    itemId:
      product.id,

    id:
      product.id,

    // ==========================================================
    // PRODUCT NAME
    // ==========================================================

    name:
      getName(
        product,
        locale
      ),

    name_vi:
      product?.name_vi,

    name_ja:
      product?.name_ja,

    name_en:
      product?.name_en,

    name_zh:
      product?.name_zh,

    // ==========================================================
    // IMAGE
    // ==========================================================

    image_url:
      product?.image_url,

    // ==========================================================
    // VARIANT
    // ==========================================================

    variantId:
      safeVariantId,

    variantCode:
      selectedVariant?.code ??
      null,

    variantName:
      selectedVariant
        ? getName(
            selectedVariant,
            locale
          )
        : null,

    variantName_vi:
      selectedVariant?.name_vi ??
      null,

    variantName_ja:
      selectedVariant?.name_ja ??
      null,

    variantName_en:
      selectedVariant?.name_en ??
      null,

    variantName_zh:
      selectedVariant?.name_zh ??
      null,

    // ==========================================================
    // VARIANT PRICE
    // ==========================================================
    //
    // Đây là GIÁ CỦA VARIANT.
    //
    // Regular = 790
    // Mini    = 500
    //
    // KHÔNG phải giá cộng thêm.
    // ==========================================================

    variantAdditionalPrice:
      selectedVariant
        ? selectedVariantPrice
        : 0,

    // Giữ field cũ để tương thích.
    //
    // Nhưng giá trị hiện tại phải là
    // GIÁ CỦA VARIANT.
    variantPrice:
      selectedVariant
        ? selectedVariantPrice
        : productPrice,

    // ==========================================================
    // PRICING
    // ==========================================================

    // Giá món sau khi xác định variant.
    //
    // Regular = 790
    // Mini    = 500
    basePrice,

    // Tổng option cộng thêm.
    //
    // Egg = 100
    optionsPrice,

    // Giá cuối của 1 món.
    //
    // Regular + Egg:
    //
    // 790 + 100 = 890
    unitPrice,

    // Alias cho code cũ.
    price:
      unitPrice,

    // Tổng dòng hàng.
    totalPrice,

    // Alias cho code cũ.
    total:
      totalPrice,

    // ==========================================================
    // OPTIONS
    // ==========================================================

    selectedOptions:
      cartSelectedOptions,

    selectedOptionIds,

    selectedOptionSnapshot,

    optionGroups,

    // ==========================================================
    // NOTE / QUANTITY
    // ==========================================================

    note:
      String(note ?? "").trim(),

    quantity:
      safeQuantity,
  };
}

