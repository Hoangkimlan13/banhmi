// components/product-detail/ProductDetailModal.tsx
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

import {
  getGroupName,
  getOptionName,
  getOptionPrice,
} from "../shared/menu-helpers";

import { useProductModal } from "./hooks/useProductModal";
import { useProductDetail } from "./hooks/useProductDetail";
import { useProductSelection } from "./hooks/useProductSelection";

import { buildCartItem } from "./utils/cart-builder";
import { validateCartItem } from "./utils/cart-validator";
import { isFormValid } from "./utils/product-validation";

import ProductHeader from "./ProductHeader";
import ProductStickyTop from "./ProductStickyTop";
import { ProductBody } from "./ProductBody";
import ProductModalFooter from "./ProductModalFooter";

import "@/app/[locale]/order/product-modal.css";

// ============================================================
// TYPES
// ============================================================

interface ProductDetailModalProps {
  isOpen: boolean;
  itemId: number | string | null;
  locale: string;
  storeSlug?: string | null; // ✅ THÊM PROP
  onClose: () => void;
  onAddToCart: (cartItem: any) => void;
}

// ============================================================
// TRANSLATIONS
// ============================================================

const t = {
  vi: {
    loading: "Đang tải thông tin món ăn...",
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

    itemUnavailable:
      "Món này hiện không còn phục vụ. Vui lòng chọn món khác.",

    loadFailed:
      "Không thể tải thông tin món ăn. Vui lòng thử lại.",

    networkError:
      "Không thể kết nối đến máy chủ. Vui lòng thử lại.",

    variantUnavailable:
      "Lựa chọn này hiện đã hết món.",

    variantNotFound:
      "Lựa chọn món không còn tồn tại.",

    invalidVariant:
      "Lựa chọn món không hợp lệ.",

    genericError:
      "Món này không thể thêm vào giỏ hàng.",

    validationError:
      "Không thể kiểm tra tình trạng món. Vui lòng thử lại.",

    close: "Đóng",
    retry: "Thử lại",
  },

  ja: {
    loading: "商品の情報を読み込み中...",
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

    itemUnavailable:
      "この商品は現在ご利用いただけません。別の商品をお選びください。",

    loadFailed:
      "商品の情報を読み込めませんでした。もう一度お試しください。",

    networkError:
      "サーバーに接続できませんでした。もう一度お試しください。",

    variantUnavailable:
      "選択したサイズ・バリエーションは現在売り切れです。",

    variantNotFound:
      "選択したバリエーションは存在しません。",

    invalidVariant:
      "選択したバリエーションが無効です。",

    genericError:
      "この商品をカートに追加できません。",

    validationError:
      "商品の在庫状況を確認できませんでした。もう一度お試しください。",

    close: "閉じる",
    retry: "再試行",
  },

  en: {
    loading: "Loading product information...",
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

    itemUnavailable:
      "This item is currently unavailable. Please choose another item.",

    loadFailed:
      "Unable to load product information. Please try again.",

    networkError:
      "Unable to connect to the server. Please try again.",

    variantUnavailable:
      "The selected option is currently sold out.",

    variantNotFound:
      "The selected variation no longer exists.",

    invalidVariant:
      "The selected variation is invalid.",

    genericError:
      "This item cannot be added to the cart.",

    validationError:
      "Unable to check item availability. Please try again.",

    close: "Close",
    retry: "Retry",
  },

  zh: {
    loading: "正在加载商品信息...",
    required: "必填",
    optional: "可选",
    allergens: "过敏原",
    noteLabel: "您的特殊要求（请用日语或英语填写）",
    notePlaceholder: "例如：不要香菜，少冰...（日语或英语）",
    quantity: "数量",
    free: "免费",
    selectRequired: "请选择",
    continueShopping: "继续点餐",
    checkoutNow: "立即结账",
    total: "总计:",
    size: "尺寸",
    selectSize: "请选择尺寸。",

    itemUnavailable:
      "该商品目前无法购买，请选择其他商品。",

    loadFailed:
      "无法加载商品信息，请稍后重试。",

    networkError:
      "无法连接服务器，请稍后重试。",

    variantUnavailable:
      "您选择的规格目前已售罄。",

    variantNotFound:
      "所选规格不存在。",

    invalidVariant:
      "所选规格无效。",

    genericError:
      "无法将该商品加入购物车。",

    validationError:
      "无法确认商品状态，请重试。",

    close: "关闭",
    retry: "重试",
  },
} as const;

type LocaleKey = keyof typeof t;

// ============================================================
// COMPONENT
// ============================================================

export default function ProductDetailModal({
  isOpen,
  itemId,
  locale,
  storeSlug, // ✅ NHẬN PROP
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const router = useRouter();

  // ============================================================
  // LANGUAGE
  // ============================================================

  const currentLang: LocaleKey =
    locale in t ? (locale as LocaleKey) : "vi";

  const dict = t[currentLang];

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  const getErrorMessage = useCallback(
    (loc: string) => {
      switch (loc) {
        case "ja":
          return t.ja.loadFailed;
        case "en":
          return t.en.loadFailed;
        case "zh":
          return t.zh.loadFailed;
        case "vi":
        default:
          return t.vi.loadFailed;
      }
    },
    []
  );

  // ============================================================
  // VALIDATION ERROR MESSAGE
  // ============================================================

  const getValidationMessage = useCallback(
    (key: string) => {
      const messages: Record<
        LocaleKey,
        Record<string, string>
      > = {
        vi: {
          ITEM_UNAVAILABLE: t.vi.itemUnavailable,
          VARIANT_UNAVAILABLE: t.vi.variantUnavailable,
          VARIANT_NOT_FOUND: t.vi.variantNotFound,
          INVALID_VARIANT: t.vi.invalidVariant,
          GENERIC_ERROR: t.vi.genericError,
          NETWORK_ERROR: t.vi.validationError,
        },
        ja: {
          ITEM_UNAVAILABLE: t.ja.itemUnavailable,
          VARIANT_UNAVAILABLE: t.ja.variantUnavailable,
          VARIANT_NOT_FOUND: t.ja.variantNotFound,
          INVALID_VARIANT: t.ja.invalidVariant,
          GENERIC_ERROR: t.ja.genericError,
          NETWORK_ERROR: t.ja.validationError,
        },
        en: {
          ITEM_UNAVAILABLE: t.en.itemUnavailable,
          VARIANT_UNAVAILABLE: t.en.variantUnavailable,
          VARIANT_NOT_FOUND: t.en.variantNotFound,
          INVALID_VARIANT: t.en.invalidVariant,
          GENERIC_ERROR: t.en.genericError,
          NETWORK_ERROR: t.en.validationError,
        },
        zh: {
          ITEM_UNAVAILABLE: t.zh.itemUnavailable,
          VARIANT_UNAVAILABLE: t.zh.variantUnavailable,
          VARIANT_NOT_FOUND: t.zh.variantNotFound,
          INVALID_VARIANT: t.zh.invalidVariant,
          GENERIC_ERROR: t.zh.genericError,
          NETWORK_ERROR: t.zh.validationError,
        },
      };

      return (
        messages[currentLang]?.[key] ??
        messages[currentLang]?.GENERIC_ERROR ??
        t.en.genericError
      );
    },
    [currentLang]
  );

  // ============================================================
  // MODAL HOOK
  // ============================================================

  const {
    isClosing,
    isScrolled,
    modalBodyRef,
    handleScroll,
    handleTriggerClose,
  } = useProductModal({
    isOpen,
    onClose,
  });

  // ============================================================
  // PRODUCT DETAIL HOOK
  // ============================================================

  const {
    product,
    loading,
    errorMessage: productError,
    loadProduct,
  } = useProductDetail({
    isOpen,
    itemId,
    locale,
    getErrorMessage,
  });

  // ============================================================
  // PRODUCT SELECTION
  // ============================================================

  const {
    selectedOptions,
    selectedVariant,
    note,
    quantity,
    errorMessage: selectionError,

    basePrice,
    optionsPrice,
    unitPrice,
    totalPrice,

    handleSelectVariant,
    handleSelectOption,

    setNote,
    setQuantity,
    setErrorMessage: setSelectionError,

    setDefaultVariant,
    resetSelection,
  } = useProductSelection({
    product,
    locale,
    dict,
  });

  // ============================================================
  // LOCAL STATE
  // ============================================================

  const [showAllergens, setShowAllergens] =
    useState(false);

  const [isLoadingTriggered, setIsLoadingTriggered] =
    useState(false);

  const [validating, setValidating] =
    useState(false);

  const [loadAttempt, setLoadAttempt] =
    useState(0);

  // ============================================================
  // PREVENT DUPLICATE LOAD
  // ============================================================

  const loadingKeyRef = useRef<string | null>(null);

  // ============================================================
  // LOAD PRODUCT
  // ============================================================

  useEffect(() => {
    if (!isOpen || !itemId) {
      return;
    }

    const normalizedItemId = String(itemId);

    const loadingKey =
      `${normalizedItemId}:${locale}:${loadAttempt}`;

    if (loadingKeyRef.current === loadingKey) {
      return;
    }

    loadingKeyRef.current = loadingKey;

    let cancelled = false;

    const load = async () => {
      setIsLoadingTriggered(true);

      try {
        console.log(
          "[ProductDetailModal] Loading product:",
          {
            itemId: normalizedItemId,
            locale,
          }
        );

        const result = await loadProduct();

        if (cancelled) {
          return;
        }

        if (result?.defaultVariant) {
          setDefaultVariant(result.defaultVariant);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "[ProductDetailModal] Load failed:",
            error
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTriggered(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    itemId,
    locale,
    loadAttempt,
    loadProduct,
    setDefaultVariant,
  ]);

  // ============================================================
  // RESET WHEN PRODUCT CHANGES
  // ============================================================

  useEffect(() => {
    if (!product) {
      return;
    }

    resetSelection();
    setShowAllergens(false);
  }, [product, resetSelection]);

  // ============================================================
  // RETRY
  // ============================================================

  const handleRetry = useCallback(() => {
    loadingKeyRef.current = null;
    setLoadAttempt((prev) => prev + 1);
  }, []);

  // ============================================================
  // SCROLL TO OPTION GROUP
  // ============================================================

  const scrollToGroup = useCallback(
    (groupKey: string) => {
      const element = document.querySelector(
        `[data-option-group-key="${groupKey}"]`
      );

      element?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    []
  );

  // ============================================================
  // BUILD CART
  // ============================================================

  const buildCart = useCallback(() => {
    return buildCartItem({
      product,
      selectedOptions,
      selectedVariant,
      note,
      quantity,
      locale,
      dict,
      setError: setSelectionError,
      scrollToGroup,
    });
  }, [
    product,
    selectedOptions,
    selectedVariant,
    note,
    quantity,
    locale,
    dict,
    setSelectionError,
    scrollToGroup,
  ]);

  // ============================================================
  // VALIDATE CART (THÊM storeSlug)
  // ============================================================

  const validateCart = useCallback(
    async (cartItem: any) => {
      return validateCartItem({
        cartItem,
        locale,
        storeSlug: storeSlug || undefined, // ✅ TRUYỀN storeSlug
        setValidating,
        setError: setSelectionError,
        getLocalizedMessage: getValidationMessage,
      });
    },
    [locale, storeSlug, setSelectionError, getValidationMessage]
  );

  // ============================================================
  // ADD TO CART
  // ============================================================

  const handleAddToCartOnly = useCallback(async () => {
    if (!product) {
      return;
    }

    const cartItem = buildCart();

    if (!cartItem) {
      return;
    }

    const valid = await validateCart(cartItem);

    if (!valid) {
      return;
    }

    onAddToCart(cartItem);

    handleTriggerClose();
  }, [
    product,
    buildCart,
    validateCart,
    onAddToCart,
    handleTriggerClose,
  ]);

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckoutNow = useCallback(async () => {
    if (!product) {
      return;
    }

    const cartItem = buildCart();

    if (!cartItem) {
      return;
    }

    const valid = await validateCart(cartItem);

    if (!valid) {
      return;
    }

    onAddToCart(cartItem);

    handleTriggerClose();

    router.push(`/${locale}/checkout`);
  }, [
    product,
    buildCart,
    validateCart,
    onAddToCart,
    handleTriggerClose,
    router,
    locale,
  ]);

  // ============================================================
  // FORM VALIDATION
  // ============================================================

  const formValid = isFormValid({
    product,
    selectedVariant,
    selectedOptions,
  });

  // ============================================================
  // CLOSED
  // ============================================================

  if (!isOpen) {
    return null;
  }

  // ============================================================
  // ERROR
  // ============================================================

  const errorMessage =
    productError || selectionError;

  // ============================================================
  // PRODUCT LOAD ERROR
  // ============================================================

  const renderError = () => {
    let displayMessage: string;

    if (productError && typeof productError === 'string') {
      const lower = productError.toLowerCase();
      if (
        lower.includes("not found") ||
        lower.includes("inactive") ||
        lower.includes("unavailable")
      ) {
        displayMessage = dict.itemUnavailable;
      } else {
        displayMessage = productError;
      }
    } else {
      displayMessage = dict.loadFailed;
    }

    return (
      <div className="modal-error">
        <div className="modal-error-content">
          <span
            className="modal-error-icon"
            aria-hidden="true"
          >
            ⚠️
          </span>

          <p className="modal-error-text">
            {displayMessage}
          </p>

          <div className="modal-error-actions">
            <button
              type="button"
              className="modal-error-retry"
              onClick={handleRetry}
            >
              {dict.retry}
            </button>

            <button
              type="button"
              className="modal-error-close"
              onClick={handleTriggerClose}
            >
              {dict.close}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className={`modal-overlay ${
        isClosing ? "closing" : ""
      }`}
      onClick={handleTriggerClose}
    >
      <div
        className={`modal-content ${
          isClosing ? "closing" : ""
        }`}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ================================================
            LOADING
        ================================================= */}

        {loading || isLoadingTriggered ? (
          <div className="modal-loading">
            <div
              className="spinner"
              aria-hidden="true"
            />
            <p>{dict.loading}</p>
          </div>
        ) : product ? (
          /* ================================================
             PRODUCT
          ================================================= */
          <>
            <ProductHeader
              product={product}
              locale={locale}
              onClose={handleTriggerClose}
            />

            <ProductStickyTop
              product={product}
              locale={locale}
              isScrolled={isScrolled}
              totalPrice={totalPrice}
              quantity={quantity}
              setQuantity={setQuantity}
              totalLabel={dict.total} 
            />

            <ProductBody
              ref={modalBodyRef}
              product={product}
              locale={locale}
              selectedOptions={selectedOptions}
              selectedVariant={selectedVariant}
              note={note}
              errorMessage={errorMessage}
              showAllergens={showAllergens}
              dict={dict}
              onSetNote={setNote}
              onToggleAllergens={() =>
                setShowAllergens(
                  (previous) => !previous
                )
              }
              onSelectOption={handleSelectOption}
              onSelectVariant={handleSelectVariant}
              getOptionPrice={(option) =>
                getOptionPrice(
                  option,
                  selectedVariant?.id
                )
              }
              getGroupName={(group) =>
                getGroupName(group, locale)
              }
              getOptionName={(option) =>
                getOptionName(option, locale)
              }
              onScroll={handleScroll}
            />

            <ProductModalFooter
              validating={validating}
              formValid={formValid}
              continueLabel={
                dict.continueShopping
              }
              checkoutLabel={
                dict.checkoutNow
              }
              validatingLabel={
                currentLang === "vi"
                  ? "Đang kiểm tra..."
                  : currentLang === "ja"
                  ? "確認中..."
                  : currentLang === "zh"
                  ? "确认中..."
                  : "Checking..."
              }
              onContinue={
                handleAddToCartOnly
              }
              onCheckout={
                handleCheckoutNow
              }
            />
          </>
        ) : errorMessage ? (
          /* ================================================
             ERROR
          ================================================= */
          renderError()
        ) : (
          /* ================================================
             FALLBACK
          ================================================= */
          <div className="modal-loading">
            <p>{dict.loadFailed}</p>
          </div>
        )}
      </div>
    </div>
  );
}