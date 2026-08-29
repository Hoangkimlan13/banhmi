// components/product-detail/ProductOptionCard.tsx
"use client";

interface ProductOptionCardProps {
  option: any;
  optionName: string;       
  isSelected: boolean;
  multiple: boolean;
  price: number;
  freeLabel: string;
  onSelect: () => void;
}

export default function ProductOptionCard({
  option,
  optionName,
  isSelected,
  multiple,
  price,
  freeLabel,
  onSelect,
}: ProductOptionCardProps) {
  return (
    <button
      type="button"
      className={`option-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
      aria-pressed={isSelected}
    >
      <span className="option-card-left">
        <span
          className={`opt-checkbox-icon ${isSelected ? "checked" : ""}`}
          aria-hidden="true"
        >
          {multiple ? (isSelected ? "☑" : "☐") : isSelected ? "●" : "○"}
        </span>
        <span className="opt-text">{optionName}</span>
      </span>
      <span className="opt-price">
        {price === 0 ? freeLabel : `+¥${price.toLocaleString()}`}
      </span>
    </button>
  );
}