// components/food-grid/FoodPrice.tsx
"use client";

import { type Locale } from "@/app/i18n";
import { getTaxLabel } from "../shared/menu-helpers";

interface FoodPriceProps {
  price: number;
  hasRange: boolean;
  hasVariants: boolean;
  variantLabel: string;
  locale: Locale;
}

export default function FoodPrice({
  price,
  hasRange,
  hasVariants,
  variantLabel,
  locale,
}: FoodPriceProps) {
  return (
    <div className="food-price-wrapper">
      <div className="food-price-row">
        <span className="food-price">
          ¥{price.toLocaleString("ja-JP")}
          {hasRange && <span className="food-price-from">〜</span>}
        </span>
        <span className="tax-included">{getTaxLabel(locale)}</span>
      </div>

      {hasVariants && variantLabel && (
        <div className="food-variant-hint">
          <span className="material-symbols-outlined">tune</span>
          <span>{variantLabel}</span>
        </div>
      )}
    </div>
  );
}