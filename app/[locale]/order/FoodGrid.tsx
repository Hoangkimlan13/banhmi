"use client";

import Image from "next/image";
import { type Locale } from "@/app/i18n";
import "./food-grid.css";

interface FoodGridProps {
  locale: Locale;
  items: any[];
  cartItems?: any[];
  getName: (item: any) => string;
  onAddToCart?: (item: any, options?: any[]) => void;
  onDecreaseCart?: (cartKey: string, delta: number) => void;
  onOpenOptions?: (item: any) => void;
}

export default function FoodGrid({
  locale,
  items,
  cartItems = [],
  getName,
  onAddToCart,
  onDecreaseCart,
  onOpenOptions,
}: FoodGridProps) {
  // ============================================================
  // TAX LABEL
  // ============================================================

  const getTaxLabel = (loc: Locale) => {
    switch (loc) {
      case "ja":
        return "（税込）";

      case "vi":
        return "(Đã gồm thuế)";

      case "zh":
        return "(含税)";

      default:
        return "(Tax incl.)";
    }
  };

  // ============================================================
  // SOLD OUT
  // ============================================================

  const isSoldOut = (item: any) => {
    return item?.status === "PAUSED";
  };

  const getSoldOutLabel = (loc: Locale) => {
    switch (loc) {
      case "ja":
        return "売り切れ";

      case "vi":
        return "Hết món";

      case "zh":
        return "售罄";

      default:
        return "Sold out";
    }
  };

  // ============================================================
  // TAG NAME
  // ============================================================

  const getTagName = (tag: any, loc: Locale) => {
    if (!tag) {
      return "";
    }

    switch (loc) {
      case "ja":
        return (
          tag.name_ja ||
          tag.name_vi ||
          tag.name_en ||
          ""
        );

      case "vi":
        return (
          tag.name_vi ||
          tag.name_ja ||
          tag.name_en ||
          ""
        );

      case "en":
        return (
          tag.name_en ||
          tag.name_ja ||
          tag.name_vi ||
          ""
        );

      case "zh":
        return (
          tag.name_zh ||
          tag.name_ja ||
          tag.name_vi ||
          ""
        );

      default:
        return (
          tag.name_ja ||
          tag.name_vi ||
          tag.name_en ||
          ""
        );
    }
  };

  // ============================================================
  // ITEM TAGS
  // ============================================================

  const getItemTags = (item: any) => {
    // ----------------------------------------------------------
    // New normalized data
    // ----------------------------------------------------------

    if (Array.isArray(item?.tags)) {
      return item.tags.filter(
        (tag: any) =>
          tag &&
          Number(tag.is_active ?? 1) === 1
      );
    }

    // ----------------------------------------------------------
    // Old Prisma relation
    // ----------------------------------------------------------

    if (Array.isArray(item?.tbl_menu_item_tag)) {
      return item.tbl_menu_item_tag
        .map(
          (relation: any) =>
            relation?.tbl_tag
        )
        .filter(
          (tag: any) =>
            tag &&
            Number(tag.is_active ?? 1) === 1
        );
    }

    return [];
  };

  // ============================================================
  // GET VARIANTS
  //
  // Hỗ trợ cả:
  //
  // item.variants
  //
  // và:
  //
  // item.tbl_menu_item_variants
  //
  // ============================================================

  const getItemVariants = (item: any) => {
    let variants: any[] = [];

    if (Array.isArray(item?.variants)) {
      variants = item.variants;
    } else if (
      Array.isArray(
        item?.tbl_menu_item_variants
      )
    ) {
      variants =
        item.tbl_menu_item_variants;
    }

    // ----------------------------------------------------------
    // Chỉ lấy variant đang sử dụng được
    // ----------------------------------------------------------

    return variants.filter(
      (variant: any) => {
        if (!variant) {
          return false;
        }

        // is_available = false => không hiển thị
        if (
          variant.is_available === false
        ) {
          return false;
        }

        // deleted_at có giá trị => bỏ
        if (variant.deleted_at) {
          return false;
        }

        const stockStatus = String(
          variant.stock_status ??
            "available"
        ).toLowerCase();

        const unavailableStatuses = [
          "sold_out",
          "unavailable",
          "out_of_stock",
          "paused",
          "inactive",
        ];

        if (
          unavailableStatuses.includes(
            stockStatus
          )
        ) {
          return false;
        }

        return true;
      }
    );
  };

  // ============================================================
  // DISPLAY PRICE
  //
  // QUAN TRỌNG:
  //
  // tbl_menu_item.price
  //     = giá món cơ bản
  //
  // tbl_menu_item_variants.price
  //     = giá theo size / variant
  //
  // tbl_menu_option_item_variant_prices.price
  //     = PHỤ THU option theo variant
  //
  // Card ngoài chỉ sử dụng:
  //
  //     item.price
  //     hoặc
  //     variant.price
  //
  // KHÔNG lấy option price ở đây.
  // ============================================================

  const getDisplayPrice = (item: any) => {
    const variants =
      getItemVariants(item);

    // ----------------------------------------------------------
    // Không có variant
    // ----------------------------------------------------------

    if (variants.length === 0) {
      const basePrice = Number(
        item?.price ?? 0
      );

      return {
        price: Number.isFinite(
          basePrice
        )
          ? basePrice
          : 0,

        hasRange: false,

        hasVariants: false,

        variantCount: 0,
      };
    }

    // ----------------------------------------------------------
    // Lấy giá của variant
    // ----------------------------------------------------------

    const prices = variants
      .map((variant: any) => {
        return Number(
          variant?.price ?? 0
        );
      })
      .filter((price: number) =>
        Number.isFinite(price)
      );

    // ----------------------------------------------------------
    // Variant không có giá hợp lệ
    // ----------------------------------------------------------

    if (prices.length === 0) {
      const basePrice = Number(
        item?.price ?? 0
      );

      return {
        price: Number.isFinite(
          basePrice
        )
          ? basePrice
          : 0,

        hasRange: false,

        hasVariants: true,

        variantCount: variants.length,
      };
    }

    // ----------------------------------------------------------
    // MIN / MAX
    // ----------------------------------------------------------

    const minPrice = Math.min(
      ...prices
    );

    const maxPrice = Math.max(
      ...prices
    );

    // ----------------------------------------------------------
    // Có nhiều mức giá
    //
    // S ¥500
    // M ¥650
    // L ¥800
    //
    // => ¥500〜
    //
    // Nếu:
    //
    // S ¥500
    // M ¥500
    // L ¥500
    //
    // => ¥500
    // ----------------------------------------------------------

    return {
      price: minPrice,

      hasRange:
        minPrice !== maxPrice,

      hasVariants:
        variants.length > 0,

      variantCount:
        variants.length,
    };
  };

  // ============================================================
  // VARIANT LABEL
  //
  // Dùng để biết món có size hay không.
  //
  // Ví dụ:
  // S / M / L
  // サイズあり
  // ============================================================

  const getVariantLabel = (
    item: any
  ) => {
    const variants =
      getItemVariants(item);

    if (variants.length === 0) {
      return "";
    }

    // ----------------------------------------------------------
    // Nếu có variant name
    // ----------------------------------------------------------

    const names = variants
      .map((variant: any) => {
        switch (locale) {
          case "ja":
            return (
              variant?.name_ja ||
              variant?.name_vi ||
              variant?.name_en ||
              ""
            );

          case "vi":
            return (
              variant?.name_vi ||
              variant?.name_ja ||
              variant?.name_en ||
              ""
            );

          case "en":
            return (
              variant?.name_en ||
              variant?.name_ja ||
              variant?.name_vi ||
              ""
            );

          case "zh":
            return (
              variant?.name_zh ||
              variant?.name_ja ||
              variant?.name_vi ||
              ""
            );

          default:
            return (
              variant?.name_ja ||
              variant?.name_vi ||
              variant?.name_en ||
              ""
            );
        }
      })
      .filter(Boolean);

    // ----------------------------------------------------------
    // Nếu có S / M / L
    // thì hiển thị "サイズあり"
    // thay vì liệt kê quá dài
    // ----------------------------------------------------------

    if (locale === "ja") {
      return names.length > 0
        ? "サイズを選択"
        : "";
    }

    if (locale === "vi") {
      return names.length > 0
        ? "Chọn kích thước"
        : "";
    }

    if (locale === "zh") {
      return names.length > 0
        ? "选择规格"
        : "";
    }

    return names.length > 0
      ? "Choose size"
      : "";
  };

  // ============================================================
  // CART QUANTITY
  // ============================================================

  const getItemQuantity = (
    itemId: any
  ) => {
    if (!Array.isArray(cartItems)) {
      return 0;
    }

    return cartItems.reduce(
      (total, ci) => {
        const ciId =
          ci.menuItemId ??
          ci.itemId ??
          ci.id ??
          ci.dish_id;

        if (
          String(ciId) ===
          String(itemId)
        ) {
          return (
            total +
            Number(
              ci.quantity ?? 0
            )
          );
        }

        return total;
      },
      0
    );
  };

  // ============================================================
  // FIRST CART KEY
  // ============================================================

  const getFirstCartKeyForItem = (
    itemId: any
  ) => {
    if (!Array.isArray(cartItems)) {
      return null;
    }

    const found =
      cartItems.find((ci) => {
        const ciId =
          ci.menuItemId ??
          ci.itemId ??
          ci.id ??
          ci.dish_id;

        return (
          String(ciId) ===
          String(itemId)
        );
      });

    return (
      found?.cartKey ?? null
    );
  };

  // ============================================================
  // ITEM CLICK
  // ============================================================

  const handleItemClick = (
    item: any
  ) => {
    if (isSoldOut(item)) {
      return;
    }

    // Nếu có options / variants
    // mở modal để khách chọn
    if (onOpenOptions) {
      onOpenOptions(item);
      return;
    }

    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="food-area">
      <div className="food-grid">
        {items.map((item) => {
          const quantity =
            getItemQuantity(
              item.id
            );

          const soldOut =
            isSoldOut(item);

          const displayPrice =
            getDisplayPrice(item);

          const variantLabel =
            getVariantLabel(item);

          const tags =
            getItemTags(item);

          return (
            <article
              key={item.id}
              className={`food-card ${
                soldOut
                  ? "food-card-sold-out"
                  : ""
              }`}
              onClick={() =>
                handleItemClick(item)
              }
              aria-disabled={
                soldOut
              }
            >
              {/* ==================================================
                  IMAGE
              ================================================== */}

              <div className="food-image-wrapper">
                {item.image_url ? (
                  <Image
                    src={
                      item.image_url
                    }
                    alt={getName(item)}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="food-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="food-no-image-wrapper">
                    <span className="material-symbols-outlined">
                      restaurant
                    </span>
                  </div>
                )}

                {/* ==================================================
                    TAGS
                ================================================== */}

                {!soldOut &&
                  tags.length > 0 && (
                    <div className="food-tags">
                      {tags
                        .slice(0, 3)
                        .map(
                          (
                            tag: any
                          ) => {
                            const tagName =
                              getTagName(
                                tag,
                                locale
                              );

                            if (
                              !tagName
                            ) {
                              return null;
                            }

                            return (
                              <span
                                key={
                                  tag.id
                                }
                                className="food-tag"
                                style={
                                  tag.color
                                    ? ({
                                        "--tag-color":
                                          tag.color,
                                      } as React.CSSProperties)
                                    : undefined
                                }
                              >
                                {tag.icon && (
                                  <span className="material-symbols-outlined food-tag-icon">
                                    {
                                      tag.icon
                                    }
                                  </span>
                                )}

                                <span className="food-tag-label">
                                  {
                                    tagName
                                  }
                                </span>
                              </span>
                            );
                          }
                        )}
                    </div>
                  )}

                {/* ==================================================
                    SOLD OUT
                ================================================== */}

                {soldOut && (
                  <div
                    className="sold-out-overlay"
                    aria-label={getSoldOutLabel(
                      locale
                    )}
                  >
                    <div className="sold-out-badge">
                      <span className="sold-out-text">
                        {getSoldOutLabel(
                          locale
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================================================
                  CONTENT
              ================================================== */}

              <div className="food-content">
                <h3 className="food-title">
                  {getName(item)}
                </h3>

                {item.description && (
                  <p className="food-desc">
                    {
                      item.description
                    }
                  </p>
                )}

                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="food-footer">
                  {/* ==================================================
                      PRICE
                  ================================================== */}

                  <div className="food-price-wrapper">
                    <div className="food-price-row">
                      <span className="food-price">
                        ¥
                        {displayPrice.price.toLocaleString(
                          "ja-JP"
                        )}

                        {displayPrice.hasRange && (
                          <span className="food-price-from">
                            〜
                          </span>
                        )}
                      </span>

                      <span className="tax-included">
                        {getTaxLabel(
                          locale
                        )}
                      </span>
                    </div>

                    {/* ------------------------------------------------
                        VARIANT HINT

                        Chỉ hiển thị khi món có variant
                    ------------------------------------------------ */}

                    {displayPrice.hasVariants &&
                      variantLabel && (
                        <div className="food-variant-hint">
                          <span className="material-symbols-outlined">
                            tune
                          </span>

                          <span>
                            {
                              variantLabel
                            }
                          </span>
                        </div>
                      )}
                  </div>

                  {/* ==================================================
                      CART
                  ================================================== */}

                  {soldOut ? (
                    <div
                      className="food-sold-out-btn"
                      aria-disabled="true"
                    >
                      <span>
                        {getSoldOutLabel(
                          locale
                        )}
                      </span>
                    </div>
                  ) : quantity === 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();

                        handleItemClick(
                          item
                        );
                      }}
                      className="food-cart-btn"
                      aria-label="Add to cart"
                    >
                      <span className="material-symbols-outlined cart-icon-symbol">
                        add
                      </span>
                    </button>
                  ) : (
                    <div
                      className="food-stepper"
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => {
                          const cartKey =
                            getFirstCartKeyForItem(
                              item.id
                            );

                          if (
                            cartKey &&
                            onDecreaseCart
                          ) {
                            onDecreaseCart(
                              cartKey,
                              -1
                            );
                          }
                        }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span className="stepper-count">
                        {
                          quantity
                        }
                      </span>

                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() =>
                          handleItemClick(
                            item
                          )
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
