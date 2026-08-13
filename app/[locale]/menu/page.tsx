'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import "./menu.css";

import { getMenuItems, getMenuCategories } from "@/app/web/actions/menu.action";
import { submitOrder } from "@/app/web/actions/order.action";
import { type Locale } from "@/app/i18n";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default function MenuPage({ params }: Props) {
  const [locale, setLocale] = useState<Locale>("ja");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); // Trạng thái mở popup giỏ hàng trên mobile
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setLocale(p.locale);
    });
  }, [params]);

  useEffect(() => {
    getMenuCategories().then((data) => setCategories(data));
    getMenuItems().then((data) => setMenuItems(data));
  }, []);

  const getName = (item: any) => {
    if (locale === "ja") return item.name_ja;
    if (locale === "vi") return item.name_vi || item.name_ja;
    if (locale === "en") return item.name_en || item.name_ja;
    if (locale === "zh") return item.name_zh || item.name_ja;
    return item.name_ja;
  };

  const getCategoryName = (cat: any) => {
    if (locale === "ja") return cat.name_ja;
    if (locale === "vi") return cat.name_vi || cat.name_ja;
    if (locale === "en") return cat.name_en || cat.name_ja;
    if (locale === "zh") return cat.name_zh || cat.name_ja;
    return cat.name_ja;
  };

  const filteredItems = selectedCategory
    ? menuItems.filter((i) => i.category_id === selectedCategory)
    : menuItems;

  const addCart = (item: any) => {
    setCart((prev) => {
      const old = prev.find((x) => x.id === item.id);
      if (old) {
        return prev.map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: getName(item),
          price: Number(item.price),
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalItemsCount = cart.reduce((a, b) => a + b.quantity, 0);
  const total = cart.reduce((a, b) => a + b.price * b.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const customerNameMsg = locale === 'vi' ? "Khách hàng" : locale === 'en' ? "Customer" : "お客様";
    const res = await submitOrder(cart, total, customerNameMsg, undefined);
    setLoading(false);

    if (res.success) {
      alert(`🎉 Đặt hàng thành công! Mã đơn: #${res.orderId}`);
      setCart([]);
      setIsCartOpen(false);
    } else {
      alert(res.error);
    }
  };

  return (
    <section className="menu-page">
      <header className="menu-header">
        <div className="menu-header-inner">
          <h1>{locale === "ja" ? "バインミー＆ドリンク" : "Banh Mi & Drinks Menu"}</h1>
          <p>{locale === "ja" ? "本格的なベトナムの味をお楽しみください" : "Authentic Vietnamese flavors"}</p>
        </div>
      </header>

      <main className="menu-layout">
        <section className="food-area">
          {/* Thanh danh mục cuộn ngang */}
          <div className="category-tabs">
            <button
              className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              ✨ {locale === "ja" ? "すべて" : "All"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {getCategoryName(cat)}
              </button>
            ))}
          </div>

          <div className="food-grid">
            {filteredItems.map((item) => (
              <article className="food-card" key={item.id}>
                <div className="food-image">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={getName(item)}
                      fill
                      sizes="(max-width:768px) 50vw, 33vw"
                      className="image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="no-image">🥖</div>
                  )}
                </div>

                <div className="food-content">
                  <h2>{getName(item)}</h2>
                  <p className="price">¥{Number(item.price).toLocaleString()}</p>
                  <button onClick={() => addCart(item)} className="add-button">
                    ＋ {locale === "ja" ? "追加" : "Add"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Backdrop mờ khi mở giỏ hàng trên mobile */}
        <div 
          className={`cart-overlay ${isCartOpen ? 'active' : ''}`} 
          onClick={() => setIsCartOpen(false)}
        />

        {/* Hộp giỏ hàng (Desktop bên phải / Mobile Drawer Popup) */}
        <aside className={`cart-box ${isCartOpen ? 'mobile-open' : ''}`}>
          <div className="cart-header-row">
            <h2>🛒 {locale === "ja" ? "カート" : "Cart"}</h2>
            <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>✕</button>
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <div>🛒</div>
              <p>{locale === "ja" ? "カートは空です" : "Your cart is empty"}</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <span className="cart-item-price">¥{item.price.toLocaleString()}</span>
                    </div>
                    <div className="cart-item-controls">
                      <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <span>{locale === "ja" ? "合計" : "Total"}</span>
                <strong>¥{total.toLocaleString()}</strong>
              </div>

              <button className="checkout" onClick={handleCheckout} disabled={loading}>
                {loading ? (locale === "ja" ? "処理中..." : "Processing...") : (locale === "ja" ? "注文を確定する" : "Checkout")}
              </button>
            </>
          )}
        </aside>
      </main>

      {/* Thanh nổi dưới màn hình mobile khi đã có món */}
      {cart.length > 0 && !isCartOpen && (
        <div className="mobile-floating-cart" onClick={() => setIsCartOpen(true)}>
          <div className="mobile-cart-info">
            <span className="mobile-cart-badge">{totalItemsCount}</span>
            <span className="mobile-cart-total">¥{total.toLocaleString()}</span>
          </div>
          <div className="mobile-cart-action">
            {locale === "ja" ? "カートを見る" : "View Cart"} →
          </div>
        </div>
      )}
    </section>
  );
}