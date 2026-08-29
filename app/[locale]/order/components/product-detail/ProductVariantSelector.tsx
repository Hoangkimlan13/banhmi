// components/product-detail/ProductVariantSelector.tsx
"use client";

import { getName } from "../shared/menu-helpers";

interface ProductVariantSelectorProps {
  product: any;
  selectedVariant: any;
  locale: string;
  onSelectVariant: (variant: any) => void;
  requiredLabel: string; // thêm
  optionalLabel: string; // thêm
}

export default function ProductVariantSelector({
  product,
  selectedVariant,
  locale,
  onSelectVariant,
  requiredLabel,
  optionalLabel,
}: ProductVariantSelectorProps) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];

  if (variants.length === 0) {
    return null;
  }

  // TODO: Sau này có thể lấy tên nhóm từ database (product.variantGroupName)
  // Hiện tại hardcode theo locale
  const groupName =
    locale === "ja"
      ? "サイズを選択"
      : locale === "vi"
      ? "Chọn kích thước"
      : locale === "zh"
      ? "选择尺寸"
      : "Choose size";

  // Variant thường là bắt buộc (phải chọn 1 size)
  const required = true;

  return (
    <div className="modal-variant-section" style={{ marginBottom: "20px" }}>
      <div className="variant-title-row">
        <div className="variant-title-left">
          <h3 className="variant-title">{groupName}</h3>
          <span className={required ? "badge-required" : "badge-optional"}>
            {required ? requiredLabel : optionalLabel}
          </span>
        </div>
      </div>

      <div className="variant-options">
        {variants.map((variant: any) => {
          const isSelected = selectedVariant?.id === variant.id;
          const variantName = getName(variant, locale);
          const price = variant.price ?? 0;

          return (
            <button
              key={variant.id}
              type="button"
              className={`variant-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectVariant(variant)}
              aria-pressed={isSelected}
            >
              <span className="variant-name">{variantName}</span>
              <span className="variant-price">
                ¥{Number(price).toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}