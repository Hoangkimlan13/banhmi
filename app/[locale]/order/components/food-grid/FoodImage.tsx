// components/food-grid/FoodImage.tsx
"use client";

import Image from "next/image";
import { type Locale } from "@/app/i18n";
import { getSoldOutLabel } from "../shared/menu-helpers";
import FoodTags from "./FoodTags";

interface FoodImageProps {
  imageUrl: string | null | undefined;
  name: string;
  soldOut: boolean;
  tags: any[];
  locale: Locale;
}

export default function FoodImage({
  imageUrl,
  name,
  soldOut,
  tags,
  locale,
}: FoodImageProps) {
  return (
    <div className="food-image-wrapper">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="food-image"
          loading="lazy"
        />
      ) : (
        <div className="food-no-image-wrapper">
          <span className="material-symbols-outlined">restaurant</span>
        </div>
      )}

      {!soldOut && <FoodTags tags={tags} locale={locale} />}

      {soldOut && (
        <div className="sold-out-overlay" aria-label={getSoldOutLabel(locale)}>
          <div className="sold-out-badge">
            <span className="sold-out-text">{getSoldOutLabel(locale)}</span>
          </div>
        </div>
      )}
    </div>
  );
}