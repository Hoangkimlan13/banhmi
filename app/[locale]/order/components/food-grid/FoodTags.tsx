// components/food-grid/FoodTags.tsx
"use client";

import { type Locale } from "@/app/i18n";
import { getTagName } from "../shared/menu-helpers";

interface FoodTagsProps {
  tags: any[];
  locale: Locale;
}

export default function FoodTags({ tags, locale }: FoodTagsProps) {
  if (tags.length === 0) return null;

  return (
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
  );
}