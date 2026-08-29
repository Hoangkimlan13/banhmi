'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  onCheckout?: () => void;
}

export default function CartSidebar({
  locale,
  cart,
  isCartOpen,
  setIsCartOpen,
  updateQuantity,
  totalItemsCount,
  total,
  loading: parentLoading,
  onCheckout,
}: CartSidebarProps) {
  const router = useRouter();
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const dict = {
    ja: {
      cartTitle: "ご注文内容",
      emptyCart: "カートに商品はありません",
      total: "合計（税込）",
      checkout: "ご注文を確定する",
      processing: "送信中...",
      viewCart: "カートを見る",
      noteLabel: "ご希望・ご要望",
      size: "サイズ",
      validatingCart: "カートを確認中...",
      cartError: "カートに問題があります。",
      itemUnavailable: "現在選択している店舗では注文できない商品があります。",
    },
    vi: {
      cartTitle: "Giỏ hàng của bạn",
      emptyCart: "Chưa có món ăn nào trong giỏ",
      total: "Tổng cộng (Đã gồm thuế)",
      checkout: "Xác nhận đặt món",
      processing: "Đang xử lý...",
      viewCart: "Xem giỏ hàng",
      noteLabel: "Ghi chú món",
      size: "Kích thước",
      validatingCart: "Đang kiểm tra giỏ hàng...",
      cartError: "Có lỗi với giỏ hàng.",
      itemUnavailable: "Giỏ hàng có món không còn bán tại cửa hàng này.",
    },
    zh: {
      cartTitle: "购物车内容",
      emptyCart: "购物车是空的",
      total: "总计 (含税)",
      checkout: "确认下单",
      processing: "处理中...",
      viewCart: "查看购物车",
      noteLabel: "备注要求",
      size: "尺寸",
      validatingCart: "正在验证购物车...",
      cartError: "购物车出现问题。",
      itemUnavailable: "购物车中有商品在当前门店无法购买。",
    },
    en: {
      cartTitle: "Order Summary",
      emptyCart: "Your cart is empty",
      total: "Total (Tax incl.)",
      checkout: "Proceed to Checkout",
      processing: "Processing...",
      viewCart: "View Cart",
      noteLabel: "Special Request",
      size: "Size",
      validatingCart: "Validating cart...",
      cartError: "There is an issue with your cart.",
      itemUnavailable: "Some items in your cart are not available at this store.",
    },
    ko: {
      cartTitle: "주문 요약",
      emptyCart: "장바구니가 비어 있습니다",
      total: "총액 (세금 포함)",
      checkout: "결제하기",
      processing: "처리 중...",
      viewCart: "장바구니 보기",
      noteLabel: "요청 사항",
      size: "사이즈",
      validatingCart: "장바구니 확인 중...",
      cartError: "장바구니에 문제가 있습니다.",
      itemUnavailable: "현재 선택한 매장에서 주문할 수 없는 상품이 있습니다.",
    },
  };

  const t = dict[locale] || dict.en;

  // Cải tiến getLocalizedText: ưu tiên locale, fallback đúng thứ tự
  const getLocalizedText = (obj: any, currentLocale: Locale) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;

    const langMap: Record<string, string[]> = {
      ja: ['name_ja', 'title_ja', 'name_en', 'title_en', 'name_vi', 'title_vi', 'name_zh', 'title_zh', 'name', 'title'],
      en: ['name_en', 'title_en', 'name_vi', 'title_vi', 'name_ja', 'title_ja', 'name_zh', 'title_zh', 'name', 'title'],
      vi: ['name_vi', 'title_vi', 'name_en', 'title_en', 'name_ja', 'title_ja', 'name_zh', 'title_zh', 'name', 'title'],
      zh: ['name_zh', 'title_zh', 'name_en', 'title_en', 'name_vi', 'title_vi', 'name_ja', 'title_ja', 'name', 'title'],
      ko: ['name_ko', 'title_ko', 'name_en', 'title_en', 'name_vi', 'title_vi', 'name_ja', 'title_ja', 'name_zh', 'title_zh', 'name', 'title'],
    };
    const keys = langMap[currentLocale] || langMap.vi;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        return String(obj[key]);
      }
    }
    return "";
  };

  // ============================================================
  // RENDER SELECTED OPTIONS – CẢI TIẾN: ưu tiên snapshot, rồi groupInfo
  // ============================================================

  const renderSelectedOptions = (item: any, currentLocale: Locale) => {
    const selectedOptions = item.selectedOptions;
    const optionGroups = item.optionGroups || [];
    const selectedOptionSnapshot = item.selectedOptionSnapshot || {};

    if (!selectedOptions) return null;

    return (
      <div className="cart-item-options">
        {Object.entries(selectedOptions).map(([groupId, val]: [string, any], idx) => {
          const cleanGroupId = groupId.replace("group-", "");
          const groupInfo = optionGroups.find(
            (g: any) =>
              String(g.id) === String(cleanGroupId) || String(g.id) === String(groupId)
          );

          const groupName = getLocalizedText(groupInfo, currentLocale);
          const optionsList = Array.isArray(val) ? val : [val];
          if (optionsList.length === 0 || !optionsList[0]) return null;

          // Sắp xếp theo sort_order
          let sortedOptions = [...optionsList];
          if (groupInfo && groupInfo.options) {
            const sortMap = new Map();
            groupInfo.options.forEach((opt: any) => {
              sortMap.set(String(opt.id), opt.sort_order ?? 999);
            });
            sortedOptions.sort((a, b) => {
              const orderA = sortMap.get(String(a.id)) ?? 999;
              const orderB = sortMap.get(String(b.id)) ?? 999;
              return orderA - orderB;
            });
          }

          return (
            <div key={idx} className="option-group-container">
              <div className="option-row-item">
                {groupName && (
                  <span className="option-group-title">{groupName}:</span>
                )}
                <div className="option-tags">
                  {sortedOptions.map((opt: any, oIdx: number) => {
                    // =========================================================
                    // 1. Lấy thông tin từ snapshot trước (có tên và giá)
                    // =========================================================
                    let optName = "";
                    let optPrice = 0;

                    const snapshot = selectedOptionSnapshot[groupId];
                    if (Array.isArray(snapshot)) {
                      const found = snapshot.find((s: any) => String(s.id) === String(opt.id));
                      if (found) {
                        // Ưu tiên lấy tên từ snapshot theo locale
                        optName = getLocalizedText(found, currentLocale);
                        optPrice = found.price || 0;
                      }
                    } else if (snapshot && typeof snapshot === "object") {
                      if (String(snapshot.id) === String(opt.id)) {
                        optName = getLocalizedText(snapshot, currentLocale);
                        optPrice = snapshot.price || 0;
                      }
                    }

                    // =========================================================
                    // 2. Nếu không có snapshot, lấy từ groupInfo.options
                    // =========================================================
                    if (!optName) {
                      let realOpt = opt;
                      if (groupInfo && groupInfo.options) {
                        const found = groupInfo.options.find(
                          (o: any) => String(o.id) === String(opt.id)
                        );
                        if (found) realOpt = found;
                      }
                      optName = getLocalizedText(realOpt, currentLocale);
                      // Nếu vẫn không có tên, dùng id
                      if (!optName) {
                        optName = `#${opt.id}`;
                      }
                      // Lấy giá: ưu tiên từ variantPrices nếu có
                      const variantId = item.variantId;
                      if (variantId && realOpt.variantPrices) {
                        optPrice = Number(realOpt.variantPrices[String(variantId)] ?? realOpt.price ?? 0);
                      } else {
                        optPrice = Number(realOpt.price || 0);
                      }
                    }

                    return (
                      <span key={oIdx} className="option-tag-pill">
                        {optName} {optPrice > 0 ? `(+¥${optPrice.toLocaleString()})` : ""}
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

  // ============================================================
  // HELPER: LẤY SUFFIX THEO REASON VÀ LOCALE
  // ============================================================

  const getReasonSuffix = (reason: string | undefined, loc: Locale): string => {
    const map: Record<string, Record<Locale, string>> = {
      ITEM_NOT_AVAILABLE_AT_STORE: {
        ja: "は現在この店舗では注文できません。",
        vi: "hiện không có tại cửa hàng này.",
        zh: "在当前门店无法购买。",
        en: "is not available at this store.",
        ko: "현재 이 매장에서 주문할 수 없습니다.",
      },
      ITEM_UNAVAILABLE: {
        ja: "は現在販売を売り切れになっております。",
        vi: "đã ngừng bán.",
        zh: "已下架。",
        en: "is currently unavailable.",
        ko: "현재 판매 중지되었습니다.",
      },
      VARIANT_UNAVAILABLE: {
        ja: "の選択したサイズは現在ご利用いただけません。",
        vi: "lựa chọn này hiện không khả dụng.",
        zh: "所选规格不可用。",
        en: "selected variant is unavailable.",
        ko: "선택한 사이즈를 현재 사용할 수 없습니다.",
      },
      VARIANT_NOT_FOUND: {
        ja: "の選択したサイズは存在しません。",
        vi: "lựa chọn này không tồn tại.",
        zh: "所选规格不存在。",
        en: "selected variant does not exist.",
        ko: "선택한 사이즈가 존재하지 않습니다.",
      },
      INVALID_VARIANT: {
        ja: "の選択したサイズは無効です。",
        vi: "lựa chọn món không hợp lệ.",
        zh: "所选规格无效。",
        en: "selected variant is invalid.",
        ko: "선택한 사이즈가 유효하지 않습니다.",
      },
      INVALID_QUANTITY: {
        ja: "の数量が不正です。",
        vi: "số lượng không hợp lệ.",
        zh: "数量无效。",
        en: "quantity is invalid.",
        ko: "수량이 잘못되었습니다.",
      },
    };
    const defaultSuffix: Record<Locale, string> = {
      ja: "は注文できません。",
      vi: "không thể đặt.",
      zh: "无法下单。",
      en: "cannot be ordered.",
      ko: "주문할 수 없습니다.",
    };
    return (reason && map[reason]?.[loc]) || defaultSuffix[loc] || defaultSuffix.en;
  };

  // ============================================================
  // HANDLE CHECKOUT – VALIDATE TRƯỚC KHI CHUYỂN
  // ============================================================

  const handleGoToCheckout = async () => {
    if (validating || parentLoading) return;

    const searchParams = new URLSearchParams(window.location.search);
    let storeSlug: string | null = searchParams.get("store");

    if (!storeSlug) {
      const savedStore = getSelectedStore();
      storeSlug = savedStore?.slug ?? null;
    }

    if (!storeSlug) {
      router.push(`/${locale}/store-select`);
      return;
    }

    if (cart.length === 0) {
      return;
    }

    setValidationError(null);
    setValidating(true);

    try {
      const validateRes = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeSlug,
          items: cart.map((item) => ({
            menuItemId: item.menuItemId,
            variantId: item.variantId ?? null,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions || {},
          })),
        }),
      });

      const contentType = validateRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("API returned non-JSON response");
      }

      const result = await validateRes.json();

      if (!result.valid) {
        const invalidItems = (result.items || []).filter((it: any) => !it.valid);
        let errorMsg = t.itemUnavailable;

        if (invalidItems.length > 0) {
          const firstInvalid = invalidItems[0];
          const name = getLocalizedText(
            {
              name_vi: firstInvalid.name_vi,
              name_ja: firstInvalid.name_ja,
              name_en: firstInvalid.name_en,
              name_zh: firstInvalid.name_zh,
            },
            locale
          );

          if (name) {
            const suffix = getReasonSuffix(firstInvalid.reason, locale);
            errorMsg = `${name} ${suffix}`;
          } else {
            errorMsg = result.message || t.cartError;
          }
        } else {
          errorMsg = result.message || t.cartError;
        }

        setValidationError(errorMsg);
        setValidating(false);
        return;
      }

      setIsCartOpen(false);
      router.push(`/${locale}/checkout?store=${storeSlug}`);
    } catch (error) {
      console.error("Checkout validation error:", error);
      setValidationError(t.cartError);
      setValidating(false);
    }
  };

  return (
    <>
      <div
        className={`cart-overlay ${isCartOpen ? "active" : ""}`}
        onClick={() => setIsCartOpen(false)}
      />

      <aside className={`cart-box ${isCartOpen ? "mobile-open" : ""}`}>
        <div className="cart-header-row">
          <h2>🛒 {t.cartTitle}</h2>
          <button className="close-cart-btn" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
            ✕
          </button>
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

                const variantName = getLocalizedText(
                  {
                    name_vi: item.variantName_vi,
                    name_ja: item.variantName_ja,
                    name_en: item.variantName_en,
                    name_zh: item.variantName_zh,
                    name: item.variantName,
                  },
                  locale
                );

                return (
                  <div className="cart-item" key={item.cartKey}>
                    <div className="cart-item-image-wrapper">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={itemName || "Product image"}
                          fill
                          sizes="(max-width: 340px) 78px, (max-width: 390px) 88px, (max-width: 600px) 104px, (max-width: 900px) 120px, 108px"
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

                      {variantName && (
                        <div className="cart-item-variant">
                          <span className="variant-label">{t.size}:</span>
                          <span className="variant-value">{variantName}</span>
                        </div>
                      )}

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
              {validationError && (
                <div className="cart-validation-error" role="alert">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{validationError}</span>
                </div>
              )}

              <div className="cart-total">
                <span>{t.total}</span>
                <strong>¥{Number(total || 0).toLocaleString()}</strong>
              </div>

              <button
                className="checkout-btn"
                onClick={handleGoToCheckout}
                disabled={validating || parentLoading || cart.length === 0}
              >
                {validating ? t.validatingCart : parentLoading ? t.processing : t.checkout}
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
              <svg
                className="mobile-cart-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
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