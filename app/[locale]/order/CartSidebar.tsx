'use client';

import Image from "next/image";
import { useRouter } from "next/navigation"; 
import { type Locale } from "@/app/i18n";
import { getSelectedStore } from "@/app/web/store/selected-store";
import "./cart-sidebar.css";

interface CartSidebarProps {
  locale: Locale;
  cart: any[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  updateQuantity: (cartKey: string, delta: number) => void;
  totalItemsCount: number;
  total: number;
  loading: boolean;
  onCheckout?: () => void; // Cho phép optional vì ta có thể chuyển trang trực tiếp
}

export default function CartSidebar({
  locale,
  cart,
  isCartOpen,
  setIsCartOpen,
  updateQuantity,
  totalItemsCount,
  total,
  loading,
  onCheckout,
}: CartSidebarProps) {
  const router = useRouter(); // 2. Khởi tạo router

  const dict = {
    ja: {
      cartTitle: "ご注文内容",
      emptyCart: "カートに商品はありません",
      total: "合計（税込）",
      checkout: "ご注文を確定する",
      processing: "送信中...",
      viewCart: "カートを見る",
      noteLabel: "ご希望・ご要望",
    },
    vi: {
      cartTitle: "Giỏ hàng của bạn",
      emptyCart: "Chưa có món ăn nào trong giỏ",
      total: "Tổng cộng (Đã gồm thuế)",
      checkout: "Xác nhận đặt món",
      processing: "Đang xử lý...",
      viewCart: "Xem giỏ hàng",
      noteLabel: "Ghi chú món",
    },
    zh: {
      cartTitle: "购物车内容",
      emptyCart: "购物车是空的",
      total: "总计 (含税)",
      checkout: "确认下单",
      processing: "处理中...",
      viewCart: "查看购物车",
      noteLabel: "备注要求",
    },
    en: {
      cartTitle: "Order Summary",
      emptyCart: "Your cart is empty",
      total: "Total (Tax incl.)",
      checkout: "Proceed to Checkout",
      processing: "Processing...",
      viewCart: "View Cart",
      noteLabel: "Special Request",
    },
    ko: {
      cartTitle: "주문 요약",
      emptyCart: "장바구니가 비어 있습니다",
      total: "총액 (세금 포함)",
      checkout: "결제하기",
      processing: "처리 중...",
      viewCart: "장바구니 보기",
      noteLabel: "요청 사항",
    }
  };

  const t = dict[locale] || dict.en;

  const getLocalizedText = (obj: any, currentLocale: Locale) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;

    return (
      obj[`name_${currentLocale}`] ||
      obj[`title_${currentLocale}`] ||
      obj.name_ja ||
      obj.title_ja ||
      obj.name_vi ||
      obj.title_vi ||
      obj.name_en ||
      obj.title_en ||
      obj.name_zh ||
      obj.title_zh ||
      obj.name ||
      obj.title ||
      ""
    );
  };

  const renderSelectedOptions = (item: any, currentLocale: Locale) => {
    const selectedOptions = item.selectedOptions;
    const optionGroups = item.optionGroups || [];

    if (!selectedOptions) return null;

    return (
      <div className="cart-item-options">
        {Object.entries(selectedOptions).map(([groupId, val]: [string, any], idx) => {
          const cleanGroupId = groupId.replace('group-', '');
          const groupInfo = optionGroups.find((g: any) => 
            String(g.id) === String(cleanGroupId) || String(g.id) === String(groupId)
          );
          
          const groupName = getLocalizedText(groupInfo, currentLocale);
          const optionsList = Array.isArray(val) ? val : [val];
          
          if (optionsList.length === 0 || !optionsList[0]) return null;

          return (
            <div key={idx} className="option-group-container" style={{ marginBottom: '6px' }}>
              <div className="option-row-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                {/* Chỉ hiển thị tên nhóm 1 lần duy nhất cho mỗi nhóm */}
                {groupName && (
                  <span className="option-group-title" style={{ fontWeight: '600', fontSize: '0.9em', whiteSpace: 'nowrap' }}>
                    {groupName}:
                  </span>
                )}
                
                {/* Danh sách các tags nằm cạnh tên nhóm */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {optionsList.map((opt: any, oIdx: number) => {
                    let realOpt = opt;
                    if (groupInfo && groupInfo.options) {
                      const found = groupInfo.options.find((o: any) => String(o.id) === String(opt.id));
                      if (found) realOpt = found;
                    }

                    const optName = getLocalizedText(realOpt, currentLocale);
                    const optPrice = Number(realOpt.price || opt.price || 0);

                    return (
                      <span key={oIdx} className="option-tag-pill" style={{ fontSize: '0.9em' }}>
                        {optName} {optPrice > 0 ? `(+¥${optPrice.toLocaleString()})` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 3. Hàm xử lý khi bấm nút Checkout: Lấy store từ URL hoặc localStorage rồi chuyển hướng sang /[locale]/checkout?store=...
  const handleGoToCheckout = () => {
    const searchParams = new URLSearchParams(window.location.search);
    // Lấy slug từ URL, ưu tiên dùng key "store"
    let storeSlug: string | null = searchParams.get("store");

    // Nếu không có trên URL, lấy từ localStorage
    if (!storeSlug) {
      const savedStore = getSelectedStore();
      storeSlug = savedStore?.slug ?? null;
    }

    setIsCartOpen(false);

    if (storeSlug) {
      // Luôn chuyển hướng với ?store=slug
      router.push(`/${locale}/checkout?store=${storeSlug}`);
    } else {
      router.push(`/${locale}/store-select`);
    }
  };

  return (
    <>
      <div 
        className={`cart-overlay ${isCartOpen ? 'active' : ''}`} 
        onClick={() => setIsCartOpen(false)}
      />

      <aside className={`cart-box ${isCartOpen ? 'mobile-open' : ''}`}>
        <div className="cart-header-row">
          <h2>🛒 {t.cartTitle}</h2>
          <button className="close-cart-btn" onClick={() => setIsCartOpen(false)} aria-label="Close cart">✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <p>{t.emptyCart}</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => {
                const itemName = getLocalizedText(item, locale);

                return (
                  <div className="cart-item" key={item.cartKey}>
                    <div className="cart-item-image-wrapper">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={itemName || "Product image"}
                          width={72}
                          height={72}
                          className="cart-item-image"
                        />
                      ) : (
                        <div className="cart-item-no-image">
                          <Image
                            src="/images/logo_header.png"
                            alt="Logo"
                            width={36}
                            height={36}
                            className="cart-item-logo"
                          />
                        </div>
                      )}
                    </div>

                    <div className="cart-item-content">
                      <div className="cart-item-top-row">
                        <h4 className="cart-item-title">{itemName}</h4>
                        <span className="cart-item-price">
                          ¥{Number(item.totalPrice || 0).toLocaleString()}
                        </span>
                      </div>

                      {renderSelectedOptions(item, locale)}

                      {item.note && (
                        <div className="cart-item-note">
                          <span className="note-label-tag">{t.noteLabel}:</span> {item.note}
                        </div>
                      )}

                      <div className="cart-item-bottom-row">
                        <div className="cart-item-controls">
                          <button 
                            className="control-btn"
                            onClick={() => updateQuantity(item.cartKey, -1)}
                            aria-label="Decrease"
                          >
                            -
                          </button>
                          <span className="control-count">{item.quantity}</span>
                          <button 
                            className="control-btn"
                            onClick={() => updateQuantity(item.cartKey, 1)}
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>{t.total}</span>
                <strong>¥{Number(total || 0).toLocaleString()}</strong>
              </div>

              {/* 4. Gắn sự kiện chuyển trang vào nút Checkout */}
              <button className="checkout-btn" onClick={handleGoToCheckout} disabled={loading}>
                {loading ? t.processing : t.checkout}
              </button>
            </div>
          </>
        )}
      </aside>

      {cart.length > 0 && !isCartOpen && (
        <div className="mobile-floating-cart" onClick={() => setIsCartOpen(true)}>
          <div className="mobile-cart-left">
            <span className="mobile-cart-badge">{totalItemsCount}</span>
            <span className="mobile-cart-label">{t.viewCart}</span>
          </div>
          <div className="mobile-cart-right">
            <span className="mobile-cart-total">¥{Number(total || 0).toLocaleString()}</span>
            <div className="mobile-cart-icon-wrapper">
              <svg className="mobile-cart-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
          </div>
        </div>
      )}
    </>
  );
}