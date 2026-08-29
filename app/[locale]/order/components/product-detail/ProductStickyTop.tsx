// components/product-detail/ProductStickyTop.tsx
"use client";

import Image from "next/image";
import { getName } from "../shared/menu-helpers";

interface ProductStickyTopProps {
  product: any;
  locale: string;
  isScrolled: boolean;
  totalPrice: number;
  quantity: number;
  setQuantity: (q: number) => void;
  totalLabel: string;
}

export default function ProductStickyTop({
  product,
  locale,
  isScrolled,
  totalPrice,
  quantity,
  setQuantity,
  totalLabel,
}: ProductStickyTopProps) {
  return (
    <div className={`modal-sticky-top ${isScrolled ? "scrolled" : ""}`}>
      {product.image_url && (
        <div className="modal-image-container">
          <Image
            src={product.image_url}
            alt={getName(product, locale)}
            fill
            sizes="(max-width: 640px) 100vw, 380px"
            className="modal-image"
            priority
          />
        </div>
      )}

      <div className="modal-price-quantity-bar">
        {product.image_url && (
          <div className="modal-sticky-thumb">
            <Image
              src={product.image_url}
              alt={getName(product, locale)}
              fill
              sizes="44px"
              className="modal-image"
            />
          </div>
        )}

        <div className="modal-current-price-box">
          <span className="price-label">{totalLabel || "Total:"}</span>
          <div className="price-value-wrapper">
            <span className="currency-symbol">¥</span>
            <span className="modal-total-price">
              {totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="quantity-row-inline">
          <div className="stepper">
            <button
              type="button"
              className="stepper-btn"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                <path d="M1 1H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="stepper-count">{quantity}</span>
            <button
              type="button"
              className="stepper-btn"
              aria-label="Increase quantity"
              onClick={() => setQuantity(quantity + 1)}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}