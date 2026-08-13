'use client';

import Image from "next/image";
import { type Locale } from "@/app/i18n";
import "./food-grid.css";

interface FoodGridProps {
  locale: Locale;
  items: any[];
  cartItems?: any[];
  getName: (item: any) => string;
  onAddToCart?: (item: any, options?: any[]) => void;
  onDecreaseCart?: (cartKey: string, delta: number) => void; // Sửa nhận cartKey và delta
  onOpenOptions?: (item: any) => void;
}

export default function FoodGrid({ 
  locale, 
  items, 
  cartItems = [], 
  getName, 
  onAddToCart,
  onDecreaseCart,
  onOpenOptions
}: FoodGridProps) {
  
  const getTaxLabel = (loc: Locale) => {
    switch (loc) {
      case 'ja': return '（税込）';
      case 'vi': return '(Đã gồm thuế)';
      case 'zh': return '(含税)';
      default: return '(Tax incl.)';
    }
  };

  // Tính tổng số lượng của món ăn dựa trên itemId trong giỏ hàng
  const getItemQuantity = (itemId: any) => {
    if (!cartItems || !Array.isArray(cartItems)) return 0;
    
    return cartItems.reduce((total, ci) => {
      const ciId = ci.menuItemId ?? ci.itemId ?? ci.id ?? ci.dish_id;
      if (String(ciId) === String(itemId)) {
        return total + Number(ci.quantity || 0);
      }
      return total;
    }, 0);
  };

  // Lấy cartKey đầu tiên của món ăn này trong giỏ hàng để phục vụ việc giảm số lượng nhanh
  const getFirstCartKeyForItem = (itemId: any) => {
    if (!cartItems || !Array.isArray(cartItems)) return null;
    const found = cartItems.find((ci) => {
      const ciId = ci.menuItemId ?? ci.itemId ?? ci.id ?? ci.dish_id;
      return String(ciId) === String(itemId);
    });
    return found ? found.cartKey : null;
  };

  const handleItemClick = (item: any) => {
    if (onOpenOptions) {
      onOpenOptions(item);
    } else if (onAddToCart) {
      onAddToCart(item);
    }
  };

  return (
    <section className="food-area">
      <div className="food-grid">
        {items.map((item) => {
          const quantity = getItemQuantity(item.id);

          return (
            <article 
              className="food-card" 
              key={item.id} 
              onClick={() => handleItemClick(item)}
            >
              <div className="food-image-wrapper">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={getName(item)}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="food-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="food-no-image-wrapper">
                    <Image
                      src="/images/logo_header.png"
                      alt="Logo"
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="food-no-image-logo"
                    />
                  </div>
                )}
              </div>

              <div className="food-content">
                <h3 className="food-title">{getName(item)}</h3>
                
                {item.description && (
                  <p className="food-desc">{item.description}</p>
                )}

                <div className="food-footer">
                  <div className="food-price-wrapper">
                    <span className="food-price">¥{Number(item.price).toLocaleString()}</span>
                    <span className="tax-included">{getTaxLabel(locale)}</span>
                  </div>
                  
                  {quantity === 0 ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }} 
                      className="food-cart-btn"
                      aria-label="Add to cart"
                    >
                      <span className="material-symbols-outlined cart-icon-symbol">add_shopping_cart</span>
                    </button>
                  ) : (
                    <div className="food-stepper" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="stepper-btn" 
                        onClick={() => {
                          const cartKey = getFirstCartKeyForItem(item.id);
                          if (cartKey && onDecreaseCart) {
                            onDecreaseCart(cartKey, -1);
                          }
                        }}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="stepper-count">{quantity}</span>
                      <button 
                        className="stepper-btn" 
                        onClick={() => handleItemClick(item)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </article>
          );
        })}
      </div>
    </section>
  );
}
