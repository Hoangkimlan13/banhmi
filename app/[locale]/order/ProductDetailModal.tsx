"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { generateCartKey } from "@/lib/cartHelper";
import {
  getName,
  getGroupRequired,
  getGroupName,
  getOptionName,
  getGroupKey,
  isMultipleGroup,
  getOptionPrice,
  isSoldOut,
} from "./components/shared/menu-helpers";
import "./product-modal.css";

interface ProductDetailModalProps {
  isOpen: boolean;
  itemId: any;
  locale: string;
  onClose: () => void;
  onAddToCart: (cartItem: any) => void;
}

const t = {
  vi: {
    loading: "Đang tải tùy chọn...",
    required: "Bắt buộc",
    optional: "Tùy chọn",
    allergens: "Dị ứng",
    noteLabel: "Yêu cầu thêm của quý khách",
    notePlaceholder: "Ví dụ: Không hành, ít đá...",
    quantity: "Số lượng",
    free: "Miễn phí",
    selectRequired: "Vui lòng chọn",
    continueShopping: "Chọn thêm món",
    checkoutNow: "Thanh toán ngay",
    total: "Tổng cộng:",
    size: "Kích thước",
    selectSize: "Vui lòng chọn kích thước.",
  },

  ja: {
    loading: "オプションを読み込み中...",
    required: "必須",
    optional: "任意",
    allergens: "アレルゲン",
    noteLabel: "ご希望・ご要望",
    notePlaceholder: "例：ネギ抜き、氷少なめ...",
    quantity: "数量",
    free: "無料",
    selectRequired: "ご選択ください：",
    continueShopping: "お買い物を続ける",
    checkoutNow: "お会計に進む",
    total: "合計:",
    size: "サイズ",
    selectSize: "サイズを選択してください。",
  },

  en: {
    loading: "Loading options...",
    required: "Required",
    optional: "Optional",
    allergens: "Allergens",
    noteLabel: "Special Requests",
    notePlaceholder: "E.g., No onion, less ice...",
    quantity: "Quantity",
    free: "Free",
    selectRequired: "Please select",
    continueShopping: "Continue Shopping",
    checkoutNow: "Proceed to Checkout",
    total: "Total:",
    size: "Size",
    selectSize: "Please select a size.",
  },

  zh: {
    loading: "正在加载选项...",
    required: "必填",
    optional: "可选",
    allergens: "过敏原",
    noteLabel: "您的特殊要求",
    notePlaceholder: "例如：不要香菜，少冰...",
    quantity: "数量",
    free: "免费",
    selectRequired: "请选择",
    continueShopping: "继续点餐",
    checkoutNow: "立即结账",
    total: "总计:",
    size: "尺寸",
    selectSize: "请选择尺寸。",
  },
};

type LocaleKey = keyof typeof t;

type SelectedOptions = Record<string, any | any[]>;

export default function ProductDetailModal({
  isOpen,
  itemId,
  locale,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAllergens, setShowAllergens] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const modalBodyRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  // ============================================================
  // LANGUAGE
  // ============================================================

  const currentLang: LocaleKey = (t as Record<string, any>)[locale]
    ? (locale as LocaleKey)
    : "vi";

  const dict = t[currentLang];

  // ============================================================
  // LOAD PRODUCT
  // ============================================================

  useEffect(() => {
    if (!isOpen || !itemId) return;

    setIsClosing(false);
    setIsScrolled(false);

    lastScrollTopRef.current = 0;

    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }

    setLoading(true);
    setProduct(null);
    setQuantity(1);
    setNote("");
    setSelectedOptions({});
    setSelectedVariant(null);
    setShowAllergens(false);
    setErrorMessage("");

    fetch(
      `/api/menu-items/${itemId}?locale=${encodeURIComponent(locale)}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.message || data?.error || `Failed to load product: ${res.status}`
          );
        }
        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to load product");
        }

        const loadedProduct = data.data;
        setProduct(loadedProduct);

        // ======================================================
        // TỰ CHỌN VARIANT MẶC ĐỊNH
        // ======================================================

        // Dùng isVariantAvailable từ helper (import từ menu-helpers)
        const availableVariants = Array.isArray(loadedProduct?.variants)
          ? loadedProduct.variants.filter((variant: any) => {
              if (variant?.is_available === false) return false;
              if (variant.deleted_at) return false;
              const stockStatus = String(
                variant?.stock_status ?? "available"
              ).toLowerCase();
              return ![
                "sold_out",
                "unavailable",
                "out_of_stock",
                "paused",
                "inactive",
              ].includes(stockStatus);
            })
          : [];

        if (availableVariants.length > 0) {
          const defaultVariant =
            availableVariants.find((variant: any) => variant?.is_default === true) ??
            availableVariants[0];
          setSelectedVariant(defaultVariant);
        } else {
          setSelectedVariant(null);
        }
      })
      .catch((error) => {
        console.error("[ProductDetailModal] Failed to load product:", error);
        setErrorMessage(
          currentLang === "vi"
            ? "Không thể tải thông tin món ăn."
            : currentLang === "ja"
            ? "商品の情報を読み込めませんでした。"
            : currentLang === "zh"
            ? "无法加载商品信息。"
            : "Failed to load product information."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, itemId, locale]);

  // ============================================================
  // SCROLL
  // ============================================================

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const currentScrollTop = el.scrollTop;
    const canScroll = el.scrollHeight > el.clientHeight + 10;

    if (!canScroll) {
      if (isScrolled) {
        setIsScrolled(false);
      }
      return;
    }

    const isScrollingDown = currentScrollTop > lastScrollTopRef.current;

    if (isScrollingDown && currentScrollTop > 40) {
      setIsScrolled(true);
    } else if (!isScrollingDown && currentScrollTop <= 10) {
      setIsScrolled(false);
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  // ============================================================
  // CLOSE
  // ============================================================

  const handleTriggerClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  // ============================================================
  // BASE PRICE
  // ============================================================

  const basePrice = selectedVariant
    ? Number(selectedVariant.price ?? 0)
    : Number(product?.price ?? 0);

  // ============================================================
  // OPTIONS PRICE
  // ============================================================

  const optionsPrice = Object.values(selectedOptions).reduce(
    (sum: number, selected: any) => {
      if (Array.isArray(selected)) {
        return (
          sum +
          selected.reduce(
            (optionSum: number, option: any) =>
              optionSum + getOptionPrice(option, selectedVariant?.id),
            0
          )
        );
      }
      return sum + getOptionPrice(selected, selectedVariant?.id);
    },
    0
  );

  // ============================================================
  // UNIT PRICE & TOTAL PRICE
  // ============================================================

  const unitPrice = basePrice + optionsPrice;
  const totalPrice = unitPrice * quantity;

  // ============================================================
  // SELECT VARIANT
  // ============================================================

  const handleSelectVariant = (variant: any) => {
    if (!variant) return;

    const isAvailable = variant?.is_available !== false;
    const stockStatus = String(variant?.stock_status ?? "available").toLowerCase();
    const unavailableStatuses = [
      "sold_out",
      "unavailable",
      "out_of_stock",
      "paused",
      "inactive",
    ];

    if (!isAvailable || unavailableStatuses.includes(stockStatus)) {
      return;
    }

    setSelectedVariant(variant);
    setErrorMessage("");
  };

  // ============================================================
  // FORM VALID
  // ============================================================

  const isFormValid = () => {
    // ----------------------------------------------------------
    // PRODUCT CÓ VARIANT
    // ----------------------------------------------------------

    if (
      Array.isArray(product?.variants) &&
      product.variants.length > 0
    ) {
      if (!selectedVariant) {
        return false;
      }
    }

    // ----------------------------------------------------------
    // OPTION GROUP
    // ----------------------------------------------------------

    if (
      !product?.optionGroups ||
      !Array.isArray(product.optionGroups)
    ) {
      return true;
    }

    for (let index = 0; index < product.optionGroups.length; index++) {
      const group = product.optionGroups[index];

      if (!getGroupRequired(group)) {
        continue;
      }

      const groupKey = getGroupKey(group, index);
      const selected = selectedOptions[groupKey];
      const multiple = isMultipleGroup(group);

      if (multiple) {
        if (!Array.isArray(selected) || selected.length === 0) {
          return false;
        }
      } else {
        if (!selected || Array.isArray(selected)) {
          return false;
        }
      }
    }

    return true;
  };

  // ============================================================
  // SELECT OPTION
  // ============================================================

  const handleSelectOption = (
    group: any,
    groupIndex: number,
    option: any
  ) => {
    const groupKey = getGroupKey(group, groupIndex);
    const multiple = isMultipleGroup(group);

    setSelectedOptions((previous) => {
      const next = { ...previous };

      if (multiple) {
        const current = Array.isArray(previous[groupKey])
          ? previous[groupKey]
          : [];

        const exists = current.some(
          (item: any) => String(item?.id) === String(option?.id)
        );

        if (exists) {
          next[groupKey] = current.filter(
            (item: any) => String(item?.id) !== String(option?.id)
          );
        } else {
          next[groupKey] = [...current, option];
        }

        if (Array.isArray(next[groupKey]) && next[groupKey].length === 0) {
          delete next[groupKey];
        }
      } else {
        next[groupKey] = option;
      }

      return next;
    });

    setErrorMessage("");
  };

  // ============================================================
  // BUILD CART ITEM
  // ============================================================

  const buildCartItem = () => {
    // ==========================================================
    // 1. REQUIRED VARIANT
    // ==========================================================

    if (
      Array.isArray(product?.variants) &&
      product.variants.length > 0 &&
      !selectedVariant
    ) {
      setErrorMessage(dict.selectSize);
      return null;
    }

    // ==========================================================
    // 2. REQUIRED OPTION GROUP
    // ==========================================================

    if (
      product?.optionGroups &&
      Array.isArray(product.optionGroups)
    ) {
      for (let index = 0; index < product.optionGroups.length; index++) {
        const group = product.optionGroups[index];

        if (!getGroupRequired(group)) {
          continue;
        }

        const groupKey = getGroupKey(group, index);
        const selected = selectedOptions[groupKey];
        const multiple = isMultipleGroup(group);

        const valid = multiple
          ? Array.isArray(selected) && selected.length > 0
          : !!selected && !Array.isArray(selected);

        if (!valid) {
          setErrorMessage(
            `${dict.selectRequired} ${getGroupName(group, locale)}`
          );

          setTimeout(() => {
            const element = document.querySelector(
              `[data-option-group-key="${groupKey}"]`
            );
            element?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 50);

          return null;
        }
      }
    }

    // ==========================================================
    // 3. COPY SELECTED OPTIONS
    // ==========================================================

    const cartSelectedOptions = { ...selectedOptions };

    // ==========================================================
    // 4. CART KEY
    // ==========================================================

    const cartKey = generateCartKey(
      product.id,
      {
        variantId: selectedVariant?.id ?? null,
        selectedOptions: cartSelectedOptions,
      },
      note
    );

    // ==========================================================
    // 5. SNAPSHOT OPTION
    // ==========================================================

    const selectedOptionSnapshot: Record<string, any> = {};

    Object.entries(cartSelectedOptions).forEach(([groupKey, selected]) => {
      if (Array.isArray(selected)) {
        selectedOptionSnapshot[groupKey] = selected.map((option: any) => ({
          id: option.id,
          code: option.code ?? null,
          name_vi: option.name_vi ?? "",
          name_ja: option.name_ja ?? "",
          name_en: option.name_en ?? "",
          name_zh: option.name_zh ?? "",
          price: getOptionPrice(option, selectedVariant?.id),
          variantId: selectedVariant?.id ?? null,
        }));
      } else if (selected) {
        selectedOptionSnapshot[groupKey] = {
          id: selected.id,
          code: selected.code ?? null,
          name_vi: selected.name_vi ?? "",
          name_ja: selected.name_ja ?? "",
          name_en: selected.name_en ?? "",
          name_zh: selected.name_zh ?? "",
          price: getOptionPrice(selected, selectedVariant?.id),
          variantId: selectedVariant?.id ?? null,
        };
      }
    });

    // ==========================================================
    // 6. CART ITEM
    // ==========================================================

    return {
      cartKey,
      menuItemId: product.id,
      itemId: product.id,
      name: getName(product, locale),
      name_vi: product.name_vi,
      name_ja: product.name_ja,
      name_en: product.name_en,
      name_zh: product.name_zh,
      image_url: product.image_url,
      variantId: selectedVariant?.id ?? null,
      variantCode: selectedVariant?.code ?? null,
      variantName: selectedVariant ? getName(selectedVariant, locale) : null,
      variantName_vi: selectedVariant?.name_vi ?? null,
      variantName_ja: selectedVariant?.name_ja ?? null,
      variantName_en: selectedVariant?.name_en ?? null,
      variantName_zh: selectedVariant?.name_zh ?? null,
      variantPrice: basePrice,
      basePrice,
      optionsPrice,
      unitPrice,
      totalPrice,
      selectedOptions: cartSelectedOptions,
      selectedOptionSnapshot,
      optionGroups: product.optionGroups,
      note,
      quantity,
    };
  };

  // ============================================================
  // VALIDATE CART ITEM
  // ============================================================

  const validateCartItem = async (cartItem: any): Promise<boolean> => {
    try {
      setValidating(true);
      setErrorMessage("");

      const response = await fetch("/api/cart/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              menuItemId: Number(cartItem.menuItemId),
              variantId: cartItem.variantId ?? null,
              quantity: Number(cartItem.quantity),
              selectedOptions: cartItem.selectedOptions ?? {},
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Validation failed");
      }

      if (!data?.success || !data?.valid) {
        const result = Array.isArray(data?.items) ? data.items[0] : null;

        if (result?.reason === "ITEM_UNAVAILABLE") {
          setErrorMessage(
            currentLang === "vi"
              ? "Món này hiện không còn phục vụ."
              : currentLang === "ja"
              ? "この商品は現在ご利用いただけません。"
              : currentLang === "zh"
              ? "该商品目前无法购买。"
              : "This item is currently unavailable."
          );
          return false;
        }

        if (result?.reason === "VARIANT_UNAVAILABLE") {
          setErrorMessage(
            currentLang === "vi"
              ? "Lựa chọn này hiện đã hết món."
              : currentLang === "ja"
              ? "選択したサイズ・バリエーションは現在売り切れです。"
              : currentLang === "zh"
              ? "您选择的规格目前已售罄。"
              : "The selected option is currently sold out."
          );
          return false;
        }

        if (result?.reason === "VARIANT_NOT_FOUND") {
          setErrorMessage(
            currentLang === "vi"
              ? "Lựa chọn món không còn tồn tại."
              : currentLang === "ja"
              ? "選択したバリエーションは存在しません。"
              : currentLang === "zh"
              ? "所选规格不存在。"
              : "The selected variation no longer exists."
          );
          return false;
        }

        if (result?.reason === "INVALID_VARIANT") {
          setErrorMessage(
            currentLang === "vi"
              ? "Lựa chọn món không hợp lệ."
              : currentLang === "ja"
              ? "選択したバリエーションが無効です。"
              : currentLang === "zh"
              ? "所选规格无效。"
              : "The selected variation is invalid."
          );
          return false;
        }

        setErrorMessage(
          currentLang === "vi"
            ? "Món này không thể thêm vào giỏ hàng."
            : currentLang === "ja"
            ? "この商品をカートに追加できません。"
            : currentLang === "zh"
            ? "无法将该商品加入购物车。"
            : "This item cannot be added to the cart."
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("[ProductDetailModal] Cart validation failed:", error);
      setErrorMessage(
        currentLang === "vi"
          ? "Không thể kiểm tra tình trạng món. Vui lòng thử lại."
          : currentLang === "ja"
          ? "商品の在庫状況を確認できませんでした。もう一度お試しください。"
          : currentLang === "zh"
          ? "无法确认商品状态，请重试。"
          : "Unable to check item availability. Please try again."
      );
      return false;
    } finally {
      setValidating(false);
    }
  };

  // ============================================================
  // ADD CART
  // ============================================================

  const handleAddToCartOnly = async () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;

    const valid = await validateCartItem(cartItem);
    if (!valid) return;

    onAddToCart(cartItem);
    handleTriggerClose();
  };

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckoutNow = async () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;

    const valid = await validateCartItem(cartItem);
    if (!valid) return;

    onAddToCart(cartItem);
    handleTriggerClose();
    router.push(`/${locale}/checkout`);
  };

  const formValid = isFormValid();

  // ============================================================
  // CLOSED
  // ============================================================

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className={`modal-overlay ${isClosing ? "closing" : ""}`}
      onClick={handleTriggerClose}
    >
      <div
        className={`modal-content ${isClosing ? "closing" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="modal-loading">
            <div className="spinner" />
            <p>{dict.loading}</p>
          </div>
        ) : product ? (
          <>
            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="modal-header">
              <h2>{getName(product, locale)}</h2>

              {/* TAGS */}
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

              <button
                type="button"
                className="close-btn"
                onClick={handleTriggerClose}
              >
                ✕
              </button>
            </div>

            {/* ==================================================
                STICKY TOP HEADER
            ================================================== */}

            <div className={`modal-sticky-top ${isScrolled ? "scrolled" : ""}`}>
              {/* Banner Ảnh Chính */}
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

              {/* Thanh Tổng Tiền & Số Lượng */}
              <div className="modal-price-quantity-bar">
                {/* Ảnh Thumbnail nhỏ */}
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

                {/* Tổng Tiền */}
                <div className="modal-current-price-box">
                  <span className="price-label">{dict.total}</span>
                  <div className="price-value-wrapper">
                    <span className="currency-symbol">¥</span>
                    <span className="modal-total-price">
                      {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Bộ Chọn Số Lượng */}
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
                        <path
                          d="M1 1H11"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
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
                        <path
                          d="M6 1V11M1 6H11"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                BODY
            ================================================== */}

            <div
              className="modal-body"
              ref={modalBodyRef}
              onScroll={handleScroll}
            >
              {/* DESCRIPTION */}
              {product.description && (
                <p className="modal-desc">{product.description}</p>
              )}

              {/* =================================================
                  ALLERGENS
              ================================================= */}

              {Array.isArray(product.allergens) &&
                product.allergens.length > 0 && (
                  <section
                    className={`modal-allergens-section ${
                      showAllergens ? "is-open" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="allergens-toggle"
                      onClick={() => setShowAllergens((prev) => !prev)}
                      aria-expanded={showAllergens}
                    >
                      <span className="allergens-toggle-left">
                        <span className="allergens-icon-wrap">
                          <svg
                            className="allergens-icon"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <circle cx="12" cy="12" r="9.5" />
                            <path d="M12 7.5v5" />
                            <circle
                              cx="12"
                              cy="16.5"
                              r=".7"
                              fill="currentColor"
                              stroke="none"
                            />
                          </svg>
                        </span>
                        <span className="allergens-title-wrap">
                          <span className="allergens-title">
                            {locale === "ja" ? "アレルギー情報" : dict.allergens}
                          </span>
                          {locale === "ja" && (
                            <span className="allergens-subtitle">
                              アレルギーをお持ちの方はご確認ください
                            </span>
                          )}
                        </span>
                      </span>
                      <span
                        className={`allergens-chevron ${
                          showAllergens ? "open" : ""
                        }`}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </button>

                    <div
                      className={`allergens-content ${
                        showAllergens ? "open" : ""
                      }`}
                    >
                      <div className="allergen-list">
                        {product.allergens.map((allergen: any) => {
                          const allergenName =
                            locale === "ja"
                              ? allergen.name_ja ||
                                allergen.name_vi ||
                                allergen.name_en
                              : locale === "en"
                              ? allergen.name_en ||
                                allergen.name_vi ||
                                allergen.name_ja
                              : locale === "zh"
                              ? allergen.name_zh ||
                                allergen.name_vi ||
                                allergen.name_en
                              : allergen.name_vi ||
                                allergen.name_ja ||
                                allergen.name_en;

                          return (
                            <span
                              key={allergen.id}
                              className="allergen-badge"
                            >
                              <svg
                                className="allergen-badge-icon"
                                width="11"
                                height="11"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M12 3v18" />
                                <path d="M5.5 7.5c2.2 0 4.2 1 6.5 3" />
                                <path d="M18.5 7.5c-2.2 0-4.2 1-6.5 3" />
                                <path d="M5.5 16.5c2.2 0 4.2-1 6.5-3" />
                                <path d="M18.5 16.5c-2.2 0-4.2-1-6.5-3" />
                              </svg>
                              <span>{allergenName}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

              {/* =================================================
                  OPTION GROUPS
              ================================================= */}

              {product.optionGroups &&
                Array.isArray(product.optionGroups) &&
                product.optionGroups.map(
                  (group: any, groupIndex: number) => {
                    const groupKey = getGroupKey(group, groupIndex);
                    const multiple = isMultipleGroup(group);
                    const required = getGroupRequired(group);
                    const currentSelected = selectedOptions[groupKey];

                    return (
                      <div
                        key={groupKey}
                        data-option-group-key={groupKey}
                        className={`option-group-section ${
                          required
                            ? "option-group-required"
                            : "option-group-optional"
                        }`}
                        style={{ marginBottom: "28px" }}
                      >
                        <div className="group-title-row">
                          <div className="group-title-left">
                            <h3>{getGroupName(group, locale)}</h3>
                            <span
                              className={
                                required ? "badge-required" : "badge-optional"
                              }
                            >
                              {required ? dict.required : dict.optional}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`options-grid ${
                            multiple ? "options-multiple" : "options-single"
                          }`}
                        >
                          {Array.isArray(group.options) &&
                            group.options.map(
                              (opt: any, optIndex: number) => {
                                const isSelected = multiple
                                  ? Array.isArray(currentSelected) &&
                                    currentSelected.some(
                                      (item: any) =>
                                        String(item?.id) === String(opt?.id)
                                    )
                                  : !!currentSelected &&
                                    !Array.isArray(currentSelected) &&
                                    String(currentSelected?.id) ===
                                      String(opt?.id);

                                const optPrice = getOptionPrice(
                                  opt,
                                  selectedVariant?.id
                                );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      opt.id ??
                                      `${groupKey}-option-${optIndex}`
                                    }
                                    className={`option-card ${
                                      isSelected ? "selected" : ""
                                    }`}
                                    onClick={() =>
                                      handleSelectOption(
                                        group,
                                        groupIndex,
                                        opt
                                      )
                                    }
                                    aria-pressed={isSelected}
                                  >
                                    <span className="option-card-left">
                                      <span
                                        className={`opt-checkbox-icon ${
                                          isSelected ? "checked" : ""
                                        }`}
                                        aria-hidden="true"
                                      >
                                        {multiple
                                          ? isSelected
                                            ? "☑"
                                            : "☐"
                                          : isSelected
                                          ? "●"
                                          : "○"}
                                      </span>
                                      <span className="opt-text">
                                        {getOptionName(opt, locale)}
                                      </span>
                                    </span>
                                    <span className="opt-price">
                                      {optPrice === 0
                                        ? dict.free
                                        : `+¥${optPrice.toLocaleString()}`}
                                    </span>
                                  </button>
                                );
                              }
                            )}
                        </div>
                      </div>
                    );
                  }
                )}

              {/* =================================================
                  NOTE
              ================================================= */}

              <div
                className="modal-section"
                style={{ marginBottom: "32px" }}
              >
                <h3 style={{ marginBottom: "10px" }}>{dict.noteLabel}</h3>
                <input
                  type="text"
                  className="note-input"
                  placeholder={dict.notePlaceholder}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {errorMessage && (
                <div className="error-message" role="alert">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="modal-footer-dual">
              <button
                type="button"
                className={`action-btn-secondary ${
                  !formValid || validating ? "disabled" : ""
                }`}
                onClick={handleAddToCartOnly}
                disabled={!formValid || validating}
              >
                <span>
                  {validating
                    ? currentLang === "vi"
                      ? "Đang kiểm tra..."
                      : currentLang === "ja"
                      ? "確認中..."
                      : currentLang === "zh"
                      ? "確認中..."
                      : "Checking..."
                    : dict.continueShopping}
                </span>
              </button>

              <button
                type="button"
                className={`action-btn-primary ${
                  !formValid || validating ? "disabled" : ""
                }`}
                onClick={handleCheckoutNow}
                disabled={!formValid || validating}
              >
                <span>
                  {validating
                    ? currentLang === "vi"
                      ? "Đang kiểm tra..."
                      : currentLang === "ja"
                      ? "確認中..."
                      : currentLang === "zh"
                      ? "確認中..."
                      : "Checking..."
                    : dict.checkoutNow}
                </span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}