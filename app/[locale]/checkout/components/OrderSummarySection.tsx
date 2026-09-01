"use client";

import "./order-summary.css";

import {
  getOptionPrice,
} from "@/app/[locale]/order/components/shared/menu-helpers";

import {
  generateCartKey,
} from "@/lib/cartHelper";

// ============================================================
// TYPES
// ============================================================

interface OrderSummarySectionProps {
  cart: any[];
  total: number;
  locale?: string;
}

// ============================================================
// TRANSLATIONS
// ============================================================

const translations = {
  ja: {
    title: "ご注文内容の確認",
    quantity: "数量:",
    subtotal: "小計",
    tax: "消費税",
    taxIncluded: "込み",
    total: "合計金額",
    defaultItem: "商品",
    noteLabel: "ご要望",
  },

  vi: {
    title: "Tóm tắt đơn hàng",
    quantity: "Số lượng:",
    subtotal: "Tạm tính",
    tax: "Thuế",
    taxIncluded: "Đã bao gồm",
    total: "Tổng cộng",
    defaultItem: "Món ăn",
    noteLabel: "Ghi chú",
  },

  en: {
    title: "Order Summary",
    quantity: "Qty:",
    subtotal: "Subtotal",
    tax: "Tax (Incl.)",
    taxIncluded: "Included",
    total: "Total",
    defaultItem: "Item",
    noteLabel: "Note",
  },

  zh: {
    title: "订单摘要",
    quantity: "数量:",
    subtotal: "小计",
    tax: "税费",
    taxIncluded: "已包含",
    total: "总计",
    defaultItem: "商品",
    noteLabel: "备注",
  },
} as const;

type LocaleKey =
  keyof typeof translations;

// ============================================================
// NUMBER HELPER
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
// LOCALIZED TEXT
// ============================================================

function getLocalizedText(
  obj: any,
  locale: string,
  fallback: string
): string {
  if (!obj) {
    return fallback;
  }

  if (
    typeof obj === "string"
  ) {
    return obj;
  }

  const currentLocale =
    locale as LocaleKey;

  return (
    obj[`name_${currentLocale}`] ||
    obj[`title_${currentLocale}`] ||
    obj[`display_name_${currentLocale}`] ||

    obj.name_ja ||
    obj.title_ja ||
    obj.display_name_ja ||

    obj.name_vi ||
    obj.title_vi ||
    obj.display_name_vi ||

    obj.name_en ||
    obj.title_en ||
    obj.display_name_en ||

    obj.name_zh ||
    obj.title_zh ||
    obj.display_name_zh ||

    obj.name ||
    obj.title ||
    fallback
  );
}

// ============================================================
// SELECTED OPTIONS
// ============================================================

function getSelectedOptions(
  item: any
): Record<string, any> {
  if (
    !item?.selectedOptions ||
    typeof item.selectedOptions !==
      "object"
  ) {
    return {};
  }

  return item.selectedOptions;
}

// ============================================================
// OPTION GROUPS
// ============================================================

function getOptionGroups(
  item: any
): any[] {
  return Array.isArray(
    item?.optionGroups
  )
    ? item.optionGroups
    : [];
}

// ============================================================
// VARIANT ID
// ============================================================

function getVariantId(
  item: any
): number | null {
  const value =
    item?.variantId;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const id =
    Number(value);

  return Number.isFinite(id)
    ? id
    : null;
}

// ============================================================
// OPTION PRICE
// ============================================================

function getOptionPriceSafe(
  option: any,
  variantId: number | null,
  fallbackOptions: any[] = []
): number {
  if (!option) {
    return 0;
  }

  // ----------------------------------------------------------
  // 1. SNAPSHOT PRICE
  // ----------------------------------------------------------

  /**
   * Nếu cart đã lưu price snapshot,
   * ưu tiên price snapshot.
   *
   * Điều này rất quan trọng:
   * giá tại thời điểm thêm vào cart
   * không bị UI tự tính lại sai.
   */

  if (
    option.price !== undefined &&
    option.price !== null
  ) {
    const snapshotPrice =
      Number(option.price);

    if (
      Number.isFinite(
        snapshotPrice
      )
    ) {
      return snapshotPrice;
    }
  }

  // ----------------------------------------------------------
  // 2. VARIANT PRICES
  // ----------------------------------------------------------

  if (
    Array.isArray(
      option.variantPrices
    )
  ) {
    const price =
      getOptionPrice(
        option,
        variantId
      );

    return Number.isFinite(
      Number(price)
    )
      ? Number(price)
      : 0;
  }

  // ----------------------------------------------------------
  // 3. FALLBACK FROM OPTION GROUP
  // ----------------------------------------------------------

  for (
    const group of fallbackOptions
  ) {
    const groupOptions =
      Array.isArray(
        group?.options
      )
        ? group.options
        : [];

    const found =
      groupOptions.find(
        (candidate: any) =>
          String(candidate?.id) ===
          String(option?.id)
      );

    if (
      found &&
      Array.isArray(
        found.variantPrices
      )
    ) {
      const price =
        getOptionPrice(
          {
            ...found,
            ...option,
            variantPrices:
              found.variantPrices,
          },
          variantId
        );

      return Number.isFinite(
        Number(price)
      )
        ? Number(price)
        : 0;
    }
  }

  // ----------------------------------------------------------
  // 4. FINAL FALLBACK
  // ----------------------------------------------------------

  return toSafeNumber(
    option?.price
  );
}

// ============================================================
// ITEM UNIT PRICE
// ============================================================

function getCartItemUnitPrice(
  item: any
): number {
  // ----------------------------------------------------------
  // 1. unitPrice
  // ----------------------------------------------------------

  if (
    item?.unitPrice !==
      undefined &&
    item?.unitPrice !== null
  ) {
    const value =
      Number(item.unitPrice);

    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }

  // ----------------------------------------------------------
  // 2. price
  // ----------------------------------------------------------

  if (
    item?.price !== undefined &&
    item?.price !== null
  ) {
    const value =
      Number(item.price);

    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }

  // ----------------------------------------------------------
  // 3. basePrice + optionsPrice
  // ----------------------------------------------------------

  const basePrice =
    toSafeNumber(
      item?.basePrice
    );

  const optionsPrice =
    toSafeNumber(
      item?.optionsPrice
    );

  return (
    basePrice +
    optionsPrice
  );
}

// ============================================================
// ITEM TOTAL PRICE
// ============================================================

function getCartItemTotalPrice(
  item: any
): number {
  const quantity = Math.max(
    1,
    Math.floor(
      toSafeNumber(
        item?.quantity,
        1
      )
    )
  );

  // ----------------------------------------------------------
  // 1. totalPrice
  // ----------------------------------------------------------

  if (
    item?.totalPrice !==
      undefined &&
    item?.totalPrice !== null
  ) {
    const value =
      Number(
        item.totalPrice
      );

    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }

  // ----------------------------------------------------------
  // 2. total
  // ----------------------------------------------------------

  if (
    item?.total !== undefined &&
    item?.total !== null
  ) {
    const value =
      Number(item.total);

    if (
      Number.isFinite(value)
    ) {
      return value;
    }
  }

  // ----------------------------------------------------------
  // 3. unit price × quantity
  // ----------------------------------------------------------

  const unitPrice =
    getCartItemUnitPrice(
      item
    );

  return (
    unitPrice *
    quantity
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function OrderSummarySection({
  cart,
  total,
  locale = "ja",
}: OrderSummarySectionProps) {
  const t =
    translations[
      locale as LocaleKey
    ] ||
    translations.ja;

  // ==========================================================
  // RENDER OPTIONS
  // ==========================================================

  const renderSelectedOptions = (
    item: any
  ) => {
    const selectedOptions =
      getSelectedOptions(
        item
      );

    const optionGroups =
      getOptionGroups(
        item
      );

    const variantId =
      getVariantId(
        item
      );

    const groupIds =
      Object.keys(
        selectedOptions
      );

    if (
      groupIds.length === 0
    ) {
      return null;
    }

    // --------------------------------------------------------
    // SORT GROUPS
    // --------------------------------------------------------

    const groupsWithSort =
      groupIds.map(
        (groupId) => {
          const cleanGroupId =
            String(
              groupId
            ).replace(
              "group-",
              ""
            );

          const groupInfo =
            optionGroups.find(
              (group: any) =>
                String(
                  group?.id
                ) ===
                  cleanGroupId ||
                String(
                  group?.id
                ) ===
                  String(groupId)
            );

          const sortOrder =
            Number(
              groupInfo?.sort_order
            ) ||
            Number(
              groupInfo?.id
            ) ||
            999;

          return {
            groupId,
            groupInfo,
            sortOrder,
          };
        }
      );

    groupsWithSort.sort(
      (a, b) =>
        a.sortOrder -
        b.sortOrder
    );

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    return (
      <div className="order-item-options">
        {groupsWithSort.map(
          ({
            groupId,
            groupInfo,
          }) => {
            const value =
              selectedOptions[
                groupId
              ];

            if (
              value === null ||
              value === undefined
            ) {
              return null;
            }

            const optionsList =
              Array.isArray(value)
                ? value
                : [value];

            const validOptions =
              optionsList.filter(
                Boolean
              );

            if (
              validOptions.length ===
              0
            ) {
              return null;
            }

            const groupName =
              getLocalizedText(
                groupInfo,
                locale,
                ""
              );

            // ------------------------------------------------
            // SORT OPTIONS
            // ------------------------------------------------

            let sortedOptions =
              [...validOptions];

            if (
              groupInfo &&
              Array.isArray(
                groupInfo.options
              )
            ) {
              const sortMap =
                new Map<
                  string,
                  number
                >();

              groupInfo.options.forEach(
                (option: any) => {
                  sortMap.set(
                    String(
                      option?.id
                    ),
                    Number(
                      option?.sort_order
                    ) ||
                      Number(
                        option?.id
                      ) ||
                      999
                  );
                }
              );

              sortedOptions.sort(
                (a, b) => {
                  const orderA =
                    sortMap.get(
                      String(
                        a?.id
                      )
                    ) ?? 999;

                  const orderB =
                    sortMap.get(
                      String(
                        b?.id
                      )
                    ) ?? 999;

                  return (
                    orderA -
                    orderB
                  );
                }
              );
            } else {
              sortedOptions.sort(
                (a, b) =>
                  String(
                    a?.id
                  ).localeCompare(
                    String(
                      b?.id
                    )
                  )
              );
            }

            // ------------------------------------------------
            // GROUP ROW
            // ------------------------------------------------

            return (
              <div
                key={groupId}
                className="order-option-group-row"
              >
                <div className="order-option-row-item">
                  {groupName && (
                    <span className="order-option-group-title">
                      {groupName}:
                    </span>
                  )}

                  <div className="order-option-tags">
                    {sortedOptions.map(
                      (
                        option: any,
                        optionIndex: number
                      ) => {
                        const optionName =
                          getLocalizedText(
                            option,
                            locale,
                            t.defaultItem
                          );

                        const displayPrice =
                          getOptionPriceSafe(
                            option,
                            variantId,
                            optionGroups
                          );

                        return (
                          <span
                            key={`${groupId}-${option?.id}-${optionIndex}`}
                            className="order-option-tag-pill"
                          >
                            {optionName}

                            {displayPrice >
                              0 && (
                              <>
                                {" "}
                                (+¥
                                {displayPrice.toLocaleString(
                                  "ja-JP"
                                )}
                                )
                              </>
                            )}
                          </span>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="order-summary-card">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="order-summary-header">
        <div className="order-header-icon-wrapper">
          <span className="material-symbols-outlined">
            receipt_long
          </span>
        </div>

        <h2>
          {t.title}
        </h2>
      </div>

      {/* ======================================================
          ITEMS
      ====================================================== */}

      <div className="order-items-container">
        {Array.isArray(cart) &&
          cart.map(
            (
              item,
              index
            ) => {
              const menuItemId =
                item?.menuItemId ??
                item?.itemId ??
                item?.id;

              // ------------------------------------------------
              // UNIQUE KEY
              // ------------------------------------------------

              const uniqueKey =
                item?.cartKey ||
                generateCartKey(
                  menuItemId,
                  {
                    variantId:
                      item?.variantId ??
                      null,

                    selectedOptions:
                      item?.selectedOptions ??
                      {},
                  },
                  item?.note ??
                    ""
                );

              // ------------------------------------------------
              // NAME
              // ------------------------------------------------

              const itemName =
                getLocalizedText(
                  item,
                  locale,
                  t.defaultItem
                );

              // ------------------------------------------------
              // QUANTITY
              // ------------------------------------------------

              const quantity =
                Math.max(
                  1,
                  Math.floor(
                    toSafeNumber(
                      item?.quantity,
                      1
                    )
                  )
                );

              // ------------------------------------------------
              // UNIT PRICE
              // ------------------------------------------------

              const unitPrice =
                getCartItemUnitPrice(
                  item
                );

              // ------------------------------------------------
              // TOTAL PRICE
              // ------------------------------------------------

              const totalPrice =
                getCartItemTotalPrice(
                  item
                );

              // ------------------------------------------------
              // RENDER
              // ------------------------------------------------

              return (
                <div
                  key={`${uniqueKey}-${index}`}
                  className="order-item-row"
                >
                  <div className="order-item-info">
                    {/* ========================================
                        NAME + PRICE
                    ======================================== */}

                    <div className="order-item-top-line">
                      <h4 className="order-item-name">
                        {itemName}
                      </h4>

                      <span className="order-item-price">
                        ¥
                        {Number.isFinite(
                          totalPrice
                        )
                          ? totalPrice.toLocaleString(
                              "ja-JP"
                            )
                          : "0"}
                      </span>
                    </div>

                    {/* ========================================
                        UNIT PRICE
                    ======================================== */}

                    {quantity > 1 && (
                      <div className="order-item-unit-price">
                        ¥
                        {unitPrice.toLocaleString(
                          "ja-JP"
                        )}{" "}
                        ×{" "}
                        {quantity}
                      </div>
                    )}

                    {/* ========================================
                        VARIANT
                    ======================================== */}

                    {item?.variantName && (
                      <div className="order-item-variant">
                        {item.variantName}
                      </div>
                    )}

                    {/* ========================================
                        QUANTITY
                    ======================================== */}

                    <div className="order-item-qty-row">
                      <span className="order-item-qty-label">
                        {t.quantity}
                      </span>

                      <span className="order-item-qty-value">
                        {quantity}
                      </span>
                    </div>

                    {/* ========================================
                        OPTIONS
                    ======================================== */}

                    {renderSelectedOptions(
                      item
                    )}

                    {/* ========================================
                        NOTE
                    ======================================== */}

                    {item?.note && (
                      <div className="order-item-note">
                        <span className="order-note-tag">
                          {t.noteLabel}:
                        </span>{" "}
                        {item.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="order-summary-footer">
        {/* ----------------------------------------------------
            SUBTOTAL
        ---------------------------------------------------- */}

        <div className="summary-row">
          <span className="summary-label">
            {t.subtotal}
          </span>

          <span className="summary-value">
            ¥
            {Number(
              total || 0
            ).toLocaleString(
              "ja-JP"
            )}
          </span>
        </div>

        {/* ----------------------------------------------------
            TAX
        ---------------------------------------------------- */}

        <div className="summary-row">
          <span className="summary-label">
            {t.tax}
          </span>

          <span className="summary-value-muted">
            ({t.taxIncluded})
          </span>
        </div>

        {/* ----------------------------------------------------
            TOTAL
        ---------------------------------------------------- */}

        <div className="summary-row total-row">
          <span className="summary-label-total">
            {t.total}
          </span>

          <span className="summary-value-total">
            ¥
            {Number(
              total || 0
            ).toLocaleString(
              "ja-JP"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}