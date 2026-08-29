"use client";

import Image from "next/image";
import { type Locale } from "@/app/i18n";
import "./food-grid.css";
import {
  getTaxLabel,
  getSoldOutLabel,
  getTagName,
  getItemTags,
  getItemVariants,
  getDisplayPrice,
  getVariantLabel,
  getItemQuantity,
  getFirstCartKeyForItem,
  isSoldOut,
} from "./components/shared/menu-helpers";

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
  // ITEM CLICK
  // ============================================================

  const handleItemClick = (item: any) => {
    if (isSoldOut(item)) {
      return;
    }

    // Nếu có options / variants mở modal để khách chọn
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
          const quantity = getItemQuantity(cartItems, item.id);
          const soldOut = isSoldOut(item);
          const displayPrice = getDisplayPrice(item, locale);
          const variantLabel = getVariantLabel(item, locale);
          const tags = getItemTags(item);

          return (
            <article
              key={item.id}
              className={`food-card ${soldOut ? "food-card-sold-out" : ""}`}
              onClick={() => handleItemClick(item)}
              aria-disabled={soldOut}
            >
              {/* ==================================================
                  IMAGE
              ================================================== */}

              <div className="food-image-wrapper">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
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

                {!soldOut && tags.length > 0 && (
                  <div className="food-tags">
                    {tags.slice(0, 3).map((tag: any) => {
                      const tagName = getTagName(tag, locale);
                      if (!tagName) return null;

                      return (
                        <span
                          key={tag.id}
                          className="food-tag"
                          style={
                            tag.color
                              ? ({
                                  "--tag-color": tag.color,
                                } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {tag.icon && (
                            <span className="material-symbols-outlined food-tag-icon">
                              {tag.icon}
                            </span>
                          )}
                          <span className="food-tag-label">{tagName}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* ==================================================
                    SOLD OUT
                ================================================== */}

                {soldOut && (
                  <div
                    className="sold-out-overlay"
                    aria-label={getSoldOutLabel(locale)}
                  >
                    <div className="sold-out-badge">
                      <span className="sold-out-text">
                        {getSoldOutLabel(locale)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ==================================================
                  CONTENT
              ================================================== */}

              <div className="food-content">
                <h3 className="food-title">{getName(item)}</h3>

                {item.description && (
                  <p className="food-desc">{item.description}</p>
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
                        ¥{displayPrice.price.toLocaleString("ja-JP")}
                        {displayPrice.hasRange && (
                          <span className="food-price-from">〜</span>
                        )}
                      </span>
                      <span className="tax-included">
                        {getTaxLabel(locale)}
                      </span>
                    </div>

                    {/* ------------------------------------------------
                        VARIANT HINT
                    ------------------------------------------------ */}

                    {displayPrice.hasVariants && variantLabel && (
                      <div className="food-variant-hint">
                        <span className="material-symbols-outlined">
                          tune
                        </span>
                        <span>{variantLabel}</span>
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
                      <span>{getSoldOutLabel(locale)}</span>
                    </div>
                  ) : quantity === 0 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => {
                          const cartKey = getFirstCartKeyForItem(
                            cartItems,
                            item.id
                          );
                          if (cartKey && onDecreaseCart) {
                            onDecreaseCart(cartKey, -1);
                          }
                        }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="stepper-count">{quantity}</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => handleItemClick(item)}
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