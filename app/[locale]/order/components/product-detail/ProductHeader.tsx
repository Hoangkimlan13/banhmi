// components/product-detail/ProductHeader.tsx
"use client";

import { getName } from "../shared/menu-helpers";

interface ProductHeaderProps {
  product: any;
  locale: string;
  onClose: () => void;
}

export default function ProductHeader({
  product,
  locale,
  onClose,
}: ProductHeaderProps) {
  return (
    <div className="modal-header">
      <h2>{getName(product, locale)}</h2>

      {product.tags && product.tags.length > 0 && (
        <div className="tag-list">
          {product.tags.map((tag: any) => {
            const tagName = tag.name_ja || tag.name_vi || tag.name_en || "";
            const isTop1 = tagName.toUpperCase().includes("TOP 1");

            return (
              <span
                key={tag.id}
                className={`tag-badge ${isTop1 ? "top-1" : ""}`}
                style={
                  { "--tag-bg": tag.color || "#f97316" } as React.CSSProperties
                }
              >
                {tag.icon && (
                  <span className="material-symbols-outlined tag-icon">
                    {tag.icon}
                  </span>
                )}
                <span className="tag-text">{tagName}</span>
              </span>
            );
          })}
        </div>
      )}

      <button type="button" className="close-btn" onClick={onClose}>
        ✕
      </button>
    </div>
  );
}