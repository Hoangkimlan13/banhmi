// components/food-grid/FoodGrid.tsx
"use client";

import { type Locale } from "@/app/i18n";
import "@/app/[locale]/order/food-grid.css";
import FoodCard from "./FoodCard";

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
  return (
    <section className="food-area">
      <div className="food-grid">
        {items.map((item) => (
          <FoodCard
            key={item.id}
            item={item}
            locale={locale}
            cartItems={cartItems}
            onAddToCart={onAddToCart}
            onDecreaseCart={onDecreaseCart}
            onOpenOptions={onOpenOptions}
          />
        ))}
      </div>
    </section>
  );
}