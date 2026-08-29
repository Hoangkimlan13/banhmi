// components/food-grid/FoodCartControl.tsx
"use client";

import { type Locale } from "@/app/i18n";
import { getSoldOutLabel } from "../shared/menu-helpers";

interface FoodCartControlProps {
  locale: Locale;
  quantity: number;
  soldOut: boolean;
  cartKey: string | null;
  onDecreaseCart?: (cartKey: string, delta: number) => void;
  onAddClick: () => void;
}

export default function FoodCartControl({
  locale,
  quantity,
  soldOut,
  cartKey,
  onDecreaseCart,
  onAddClick,
}: FoodCartControlProps) {
  if (soldOut) {
    return (
      <div className="food-sold-out-btn" aria-disabled="true">
        <span>{getSoldOutLabel(locale)}</span>
      </div>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddClick();
        }}
        className="food-cart-btn"
        aria-label="Add to cart"
      >
        <span className="material-symbols-outlined cart-icon-symbol">add</span>
      </button>
    );
  }

  return (
    <div className="food-stepper" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => {
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
        onClick={() => onAddClick()}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}