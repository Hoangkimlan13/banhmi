// components/food-grid/FoodCard.tsx
"use client";

import { type Locale } from "@/app/i18n";
import {
  getName,
  getItemTags,
  isSoldOut,
  getDisplayPrice,
  getVariantLabel,
  getItemQuantity,
  getFirstCartKeyForItem,
} from "../shared/menu-helpers";
import FoodImage from "./FoodImage";
import FoodPrice from "./FoodPrice";
import FoodCartControl from "./FoodCartControl";

interface FoodCardProps {
  item: any;
  locale: Locale;
  cartItems: any[];
  onAddToCart?: (item: any, options?: any[]) => void;
  onDecreaseCart?: (cartKey: string, delta: number) => void;
  onOpenOptions?: (item: any) => void;
}

export default function FoodCard({
  item,
  locale,
  cartItems,
  onAddToCart,
  onDecreaseCart,
  onOpenOptions,
}: FoodCardProps) {
  const soldOut = isSoldOut(item);
  const tags = getItemTags(item);
  const displayPrice = getDisplayPrice(item, locale);
  const variantLabel = getVariantLabel(item, locale);
  const quantity = getItemQuantity(cartItems, item.id);
  const cartKey = getFirstCartKeyForItem(cartItems, item.id);

  const handleItemClick = () => {
    if (soldOut) return;
    if (onOpenOptions) {
      onOpenOptions(item);
      return;
    }
    if (onAddToCart) {
      onAddToCart(item);
    }
  };

  return (
    <article
      className={`food-card ${soldOut ? "food-card-sold-out" : ""}`}
      onClick={handleItemClick}
      aria-disabled={soldOut}
    >
      <FoodImage
        imageUrl={item.image_url}
        name={getName(item, locale)}
        soldOut={soldOut}
        tags={tags}
        locale={locale}
      />

      <div className="food-content">
        <h3 className="food-title">{getName(item, locale)}</h3>
        {item.description && <p className="food-desc">{item.description}</p>}

        <div className="food-footer">
          <FoodPrice
            price={displayPrice.price}
            hasRange={displayPrice.hasRange}
            hasVariants={displayPrice.hasVariants}
            variantLabel={variantLabel}
            locale={locale}
          />

          <FoodCartControl
            locale={locale}
            quantity={quantity}
            soldOut={soldOut}
            cartKey={cartKey}
            onDecreaseCart={onDecreaseCart}
            onAddClick={handleItemClick}
          />
        </div>
      </div>
    </article>
  );
}