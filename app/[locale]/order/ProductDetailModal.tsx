'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { generateCartKey } from '@/lib/cartHelper';

import './product-modal.css';

interface ProductDetailModalProps {
  isOpen: boolean;
  itemId: any;
  locale: string;
  onClose: () => void;
  onAddToCart: (cartItem: any) => void;
}

const t = {
  vi: {
    loading: 'Đang tải tùy chọn...',
    required: 'Bắt buộc',
    optional: 'Tùy chọn',
    allergens: 'Dị ứng',
    noteLabel: 'Yêu cầu thêm của quý khách',
    notePlaceholder: 'Ví dụ: Không hành, ít đá...',
    quantity: 'Số lượng',
    free: 'Miễn phí',
    selectRequired: 'Vui lòng chọn',
    continueShopping: 'Chọn thêm món',
    checkoutNow: 'Thanh toán ngay',
    total: 'Tổng cộng:',
    size: 'Kích thước',
    selectSize: 'Vui lòng chọn kích thước.',
  },

  ja: {
    loading: 'オプションを読み込み中...',
    required: '必須',
    optional: '任意',
    allergens: 'アレルゲン',
    noteLabel: 'ご希望・ご要望',
    notePlaceholder: '例：ネギ抜き、氷少なめ...',
    quantity: '数量',
    free: '無料',
    selectRequired: 'ご選択ください：',
    continueShopping: 'お買い物を続ける',
    checkoutNow: 'お会計に進む',
    total: '合計:',
    size: 'サイズ',
    selectSize: 'サイズを選択してください。',
  },

  en: {
    loading: 'Loading options...',
    required: 'Required',
    optional: 'Optional',
    allergens: 'Allergens',
    noteLabel: 'Special Requests',
    notePlaceholder: 'E.g., No onion, less ice...',
    quantity: 'Quantity',
    free: 'Free',
    selectRequired: 'Please select',
    continueShopping: 'Continue Shopping',
    checkoutNow: 'Proceed to Checkout',
    total: 'Total:',
    size: 'Size',
    selectSize: 'Please select a size.',
  },

  zh: {
    loading: '正在加载选项...',
    required: '必填',
    optional: '可选',
    allergens: '过敏原',
    noteLabel: '您的特殊要求',
    notePlaceholder: '例如：不要香菜，少冰...',
    quantity: '数量',
    free: '免费',
    selectRequired: '请选择',
    continueShopping: '继续点餐',
    checkoutNow: '立即结账',
    total: '总计:',
    size: '尺寸',
    selectSize: '请选择尺寸。',
  },
};

type LocaleKey = keyof typeof t;

type SelectedOptions = Record<
  string,
  any | any[]
>;

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

  const [product, setProduct] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const [selectedOptions, setSelectedOptions] =
    useState<SelectedOptions>({});

  // ============================================================
  // SIZE / VARIANT ĐANG CHỌN
  // ============================================================

  const [selectedVariant, setSelectedVariant] =
    useState<any>(null);

  const [note, setNote] =
    useState('');

  const [quantity, setQuantity] =
    useState(1);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [isScrolled, setIsScrolled] =
    useState(false);

  const [isClosing, setIsClosing] =
    useState(false);

  const modalBodyRef =
    useRef<HTMLDivElement>(null);

  const lastScrollTopRef =
    useRef(0);

  // ============================================================
  // LANGUAGE
  // ============================================================

  const currentLang: LocaleKey =
    (t as Record<string, any>)[locale]
      ? (locale as LocaleKey)
      : 'vi';

  const dict = t[currentLang];

  // ============================================================
  // GET PRODUCT NAME
  // ============================================================

  const getName = (item: any) => {
    if (!item) return '';

    switch (locale) {
      case 'ja':
        return (
          item.name_ja ||
          item.title_ja ||
          item.name ||
          item.title ||
          item.name_vi ||
          ''
        );

      case 'en':
        return (
          item.name_en ||
          item.title_en ||
          item.name ||
          item.title ||
          item.name_vi ||
          ''
        );

      case 'zh':
        return (
          item.name_zh ||
          item.title_zh ||
          item.name ||
          item.title ||
          item.name_vi ||
          ''
        );

      case 'vi':
      default:
        return (
          item.name_vi ||
          item.title_vi ||
          item.name ||
          item.title ||
          ''
        );
    }
  };

  // ============================================================
  // GET GROUP REQUIRED
  // ============================================================

  const getGroupRequired = (
    group: any
  ) => {
    if (!group) return false;

    if (
      group.is_required !== undefined &&
      group.is_required !== null
    ) {
      return (
        group.is_required === true ||
        group.is_required === 1 ||
        group.is_required === '1' ||
        group.is_required === 'true'
      );
    }

    if (
      group.required !== undefined &&
      group.required !== null
    ) {
      return (
        group.required === true ||
        group.required === 1 ||
        group.required === '1' ||
        group.required === 'true'
      );
    }

    return false;
  };

  // ============================================================
  // GET GROUP NAME
  // ============================================================

  const getGroupName = (
    group: any
  ) => {
    if (!group) return '';

    switch (locale) {
      case 'ja':
        return (
          group.name_ja ||
          group.title_ja ||
          group.name ||
          group.title ||
          group.name_vi ||
          ''
        );

      case 'en':
        return (
          group.name_en ||
          group.title_en ||
          group.name ||
          group.title ||
          group.name_vi ||
          ''
        );

      case 'zh':
        return (
          group.name_zh ||
          group.title_zh ||
          group.name ||
          group.title ||
          group.name_vi ||
          ''
        );

      case 'vi':
      default:
        return (
          group.name_vi ||
          group.title_vi ||
          group.name ||
          group.title ||
          ''
        );
    }
  };

  // ============================================================
  // GET OPTION NAME
  // ============================================================

  const getOptionName = (
    option: any
  ) => {
    if (!option) return '';

    switch (locale) {
      case 'ja':
        return (
          option.name_ja ||
          option.name ||
          option.name_vi ||
          ''
        );

      case 'en':
        return (
          option.name_en ||
          option.name ||
          option.name_vi ||
          ''
        );

      case 'zh':
        return (
          option.name_zh ||
          option.name ||
          option.name_vi ||
          ''
        );

      case 'vi':
      default:
        return (
          option.name_vi ||
          option.name ||
          ''
        );
    }
  };

  // ============================================================
  // GROUP KEY
  // ============================================================

  const getGroupKey = (
    group: any,
    index: number
  ) => {
    if (
      group?.id !== undefined &&
      group?.id !== null
    ) {
      return `group-${String(group.id)}`;
    }

    if (
      group?.group_id !== undefined &&
      group?.group_id !== null
    ) {
      return `group-${String(group.group_id)}`;
    }

    return `group-index-${index}`;
  };

  // ============================================================
  // MULTIPLE GROUP
  // ============================================================

  const isMultipleGroup = (
    group: any
  ) => {
    const type = String(
      group?.type ??
        group?.selection_type ??
        group?.select_type ??
        'single'
    ).toLowerCase();

    return (
      type === 'multiple' ||
      type === 'checkbox' ||
      type === 'multi'
    );
  };

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

    setNote('');

    setSelectedOptions({});

    setSelectedVariant(null);

    setErrorMessage('');

    fetch(
      `/api/menu-items/${itemId}?locale=${encodeURIComponent(
        locale
      )}`
    )
      .then(async (res) => {
        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              `Failed to load product: ${res.status}`
          );
        }

        return data;
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(
            data.message ||
              'Failed to load product'
          );
        }

        const loadedProduct =
          data.data;

        setProduct(
          loadedProduct
        );

        // ======================================================
        // TỰ CHỌN VARIANT MẶC ĐỊNH
        // ======================================================

        const availableVariants =
          Array.isArray(
            loadedProduct?.variants
          )
            ? loadedProduct.variants.filter(
                (variant: any) =>
                  variant?.is_available !==
                    false &&
                  String(
                    variant?.stock_status ??
                      'available'
                  ).toLowerCase() !==
                    'sold_out' &&
                  String(
                    variant?.stock_status ??
                      'available'
                  ).toLowerCase() !==
                    'unavailable' &&
                  String(
                    variant?.stock_status ??
                      'available'
                  ).toLowerCase() !==
                    'out_of_stock'
              )
            : [];

        if (
          availableVariants.length >
          0
        ) {
          const defaultVariant =
            availableVariants.find(
              (variant: any) =>
                variant?.is_default ===
                true
            ) ??
            availableVariants[0];

          setSelectedVariant(
            defaultVariant
          );
        } else {
          setSelectedVariant(null);
        }
      })
      .catch((error) => {
        console.error(
          '[ProductDetailModal] Failed to load product:',
          error
        );

        setErrorMessage(
          currentLang === 'vi'
            ? 'Không thể tải thông tin món ăn.'
            : currentLang === 'ja'
            ? '商品の情報を読み込めませんでした。'
            : currentLang === 'zh'
            ? '无法加载商品信息。'
            : 'Failed to load product information.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    isOpen,
    itemId,
    locale,
  ]);

  // ============================================================
  // SCROLL
  // ============================================================

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>
  ) => {
    const el =
      e.currentTarget;

    const currentScrollTop =
      el.scrollTop;

    const canScroll =
      el.scrollHeight >
      el.clientHeight + 10;

    if (!canScroll) {
      if (isScrolled) {
        setIsScrolled(false);
      }

      return;
    }

    const isScrollingDown =
      currentScrollTop >
      lastScrollTopRef.current;

    if (
      isScrollingDown &&
      currentScrollTop > 40
    ) {
      setIsScrolled(true);
    } else if (
      !isScrollingDown &&
      currentScrollTop <= 10
    ) {
      setIsScrolled(false);
    }

    lastScrollTopRef.current =
      currentScrollTop;
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
  // OPTION PRICE THEO VARIANT
  // ============================================================

  const getOptionPrice = (
    option: any
  ): number => {
    const variantId =
      selectedVariant?.id;

    // ----------------------------------------------------------
    // Không có variant
    // ----------------------------------------------------------

    if (
      variantId === undefined ||
      variantId === null
    ) {
      return Number(
        option?.price ?? 0
      );
    }

    // ----------------------------------------------------------
    // Có variantPrices
    //
    // Ví dụ:
    //
    // variantPrices:
    // {
    //   "1": 50,
    //   "2": 80
    // }
    // ----------------------------------------------------------

    if (
      option?.variantPrices &&
      typeof option.variantPrices ===
        'object'
    ) {
      const variantPrice =
        option.variantPrices[
          String(variantId)
        ];

      if (
        variantPrice !== undefined &&
        variantPrice !== null
      ) {
        return Number(
          variantPrice
        );
      }
    }

    // ----------------------------------------------------------
    // FALLBACK
    // ----------------------------------------------------------

    return Number(
      option?.price ?? 0
    );
  };

  // ============================================================
  // BASE PRICE
  //
  // Variant S = ¥500
  // Variant L = ¥700
  // ============================================================

  const basePrice =
    selectedVariant
      ? Number(
          selectedVariant.price ??
            0
        )
      : Number(
          product?.price ?? 0
        );

  // ============================================================
  // OPTIONS PRICE
  //
  // S + Ngò = 500 + 50
  // L + Ngò = 700 + 80
  // ============================================================

  const optionsPrice =
    Object.values(
      selectedOptions
    ).reduce(
      (
        sum: number,
        selected: any
      ) => {
        if (
          Array.isArray(
            selected
          )
        ) {
          return (
            sum +
            selected.reduce(
              (
                optionSum: number,
                option: any
              ) => {
                return (
                  optionSum +
                  getOptionPrice(
                    option
                  )
                );
              },
              0
            )
          );
        }

        return (
          sum +
          getOptionPrice(
            selected
          )
        );
      },
      0
    );

  // ============================================================
  // UNIT PRICE
  // ============================================================

  const unitPrice =
    basePrice +
    optionsPrice;

  // ============================================================
  // TOTAL
  // ============================================================

  const totalPrice =
    unitPrice *
    quantity;

  // ============================================================
  // SELECT VARIANT
  // ============================================================

  const handleSelectVariant = (
    variant: any
  ) => {
    if (!variant) return;

    const isAvailable =
      variant?.is_available !==
      false;

    const stockStatus =
      String(
        variant?.stock_status ??
          'available'
      ).toLowerCase();

    const unavailableStatuses = [
      'sold_out',
      'unavailable',
      'out_of_stock',
      'paused',
      'inactive',
    ];

    if (
      !isAvailable ||
      unavailableStatuses.includes(
        stockStatus
      )
    ) {
      return;
    }

    setSelectedVariant(
      variant
    );

    setErrorMessage('');
  };

  // ============================================================
  // FORM VALID
  // ============================================================

  const isFormValid = () => {
    // ----------------------------------------------------------
    // PRODUCT CÓ VARIANT
    // ----------------------------------------------------------

    if (
      Array.isArray(
        product?.variants
      ) &&
      product.variants.length >
        0
    ) {
      if (
        !selectedVariant
      ) {
        return false;
      }
    }

    // ----------------------------------------------------------
    // OPTION GROUP
    // ----------------------------------------------------------

    if (
      !product?.optionGroups ||
      !Array.isArray(
        product.optionGroups
      )
    ) {
      return true;
    }

    for (
      let index = 0;
      index <
      product.optionGroups
        .length;
      index++
    ) {
      const group =
        product.optionGroups[
          index
        ];

      if (
        !getGroupRequired(
          group
        )
      ) {
        continue;
      }

      const groupKey =
        getGroupKey(
          group,
          index
        );

      const selected =
        selectedOptions[
          groupKey
        ];

      const multiple =
        isMultipleGroup(
          group
        );

      if (multiple) {
        if (
          !Array.isArray(
            selected
          ) ||
          selected.length ===
            0
        ) {
          return false;
        }
      } else {
        if (
          !selected ||
          Array.isArray(
            selected
          )
        ) {
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
    const groupKey =
      getGroupKey(
        group,
        groupIndex
      );

    const multiple =
      isMultipleGroup(
        group
      );

    setSelectedOptions(
      (previous) => {
        const next = {
          ...previous,
        };

        if (multiple) {
          const current =
            Array.isArray(
              previous[
                groupKey
              ]
            )
              ? previous[
                  groupKey
                ]
              : [];

          const exists =
            current.some(
              (item: any) =>
                String(
                  item?.id
                ) ===
                String(
                  option?.id
                )
            );

          if (exists) {
            next[groupKey] =
              current.filter(
                (item: any) =>
                  String(
                    item?.id
                  ) !==
                  String(
                    option?.id
                  )
              );
          } else {
            next[groupKey] = [
              ...current,
              option,
            ];
          }

          if (
            Array.isArray(
              next[groupKey]
            ) &&
            next[groupKey]
              .length === 0
          ) {
            delete next[
              groupKey
            ];
          }
        } else {
          next[groupKey] =
            option;
        }

        return next;
      }
    );

    setErrorMessage('');
  };

  // ============================================================
  // BUILD CART ITEM
  // ============================================================

  const buildCartItem = () => {
    // ==========================================================
    // 1. REQUIRED VARIANT
    // ==========================================================

    if (
      Array.isArray(
        product?.variants
      ) &&
      product.variants.length >
        0 &&
      !selectedVariant
    ) {
      setErrorMessage(
        dict.selectSize
      );

      return null;
    }

    // ==========================================================
    // 2. REQUIRED OPTION GROUP
    // ==========================================================

    if (
      product?.optionGroups &&
      Array.isArray(
        product.optionGroups
      )
    ) {
      for (
        let index = 0;
        index <
        product.optionGroups
          .length;
        index++
      ) {
        const group =
          product.optionGroups[
            index
          ];

        if (
          !getGroupRequired(
            group
          )
        ) {
          continue;
        }

        const groupKey =
          getGroupKey(
            group,
            index
          );

        const selected =
          selectedOptions[
            groupKey
          ];

        const multiple =
          isMultipleGroup(
            group
          );

        const valid =
          multiple
            ? Array.isArray(
                selected
              ) &&
              selected.length >
                0
            : !!selected &&
              !Array.isArray(
                selected
              );

        if (!valid) {
          setErrorMessage(
            `${dict.selectRequired} ${getGroupName(
              group
            )}`
          );

          setTimeout(() => {
            const element =
              document.querySelector(
                `[data-option-group-key="${groupKey}"]`
              );

            element?.scrollIntoView(
              {
                behavior:
                  'smooth',
                block:
                  'center',
              }
            );
          }, 50);

          return null;
        }
      }
    }

    // ==========================================================
    // 3. COPY SELECTED OPTIONS
    // ==========================================================

    const cartSelectedOptions =
      {
        ...selectedOptions,
      };

    // ==========================================================
    // 4. CART KEY
    //
    // variantId phải nằm trong key.
    //
    // S + Ngò
    // khác
    // L + Ngò
    // ==========================================================

    const cartKey =
      generateCartKey(
        product.id,
        {
          variantId:
            selectedVariant?.id ??
            null,

          selectedOptions:
            cartSelectedOptions,
        },
        note
      );

    // ==========================================================
    // 5. SNAPSHOT OPTION
    //
    // Lưu GIÁ ĐÃ TÍNH THEO VARIANT.
    // ==========================================================

    const selectedOptionSnapshot: Record<
      string,
      any
    > = {};

    Object.entries(
      cartSelectedOptions
    ).forEach(
      ([
        groupKey,
        selected,
      ]) => {
        if (
          Array.isArray(
            selected
          )
        ) {
          selectedOptionSnapshot[
            groupKey
          ] = selected.map(
            (
              option: any
            ) => ({
              id: option.id,

              code:
                option.code ??
                null,

              name_vi:
                option.name_vi ??
                '',

              name_ja:
                option.name_ja ??
                '',

              name_en:
                option.name_en ??
                '',

              name_zh:
                option.name_zh ??
                '',

              price:
                getOptionPrice(
                  option
                ),

              variantId:
                selectedVariant?.id ??
                null,
            })
          );
        } else if (
          selected
        ) {
          selectedOptionSnapshot[
            groupKey
          ] = {
            id: selected.id,

            code:
              selected.code ??
              null,

            name_vi:
              selected.name_vi ??
              '',

            name_ja:
              selected.name_ja ??
              '',

            name_en:
              selected.name_en ??
              '',

            name_zh:
              selected.name_zh ??
              '',

            price:
              getOptionPrice(
                selected
              ),

            variantId:
              selectedVariant?.id ??
              null,
          };
        }
      }
    );

    // ==========================================================
    // 6. CART ITEM
    // ==========================================================

    return {
      // --------------------------------------------------------
      // KEY
      // --------------------------------------------------------

      cartKey,

      // --------------------------------------------------------
      // PRODUCT
      // --------------------------------------------------------

      menuItemId:
        product.id,

      itemId:
        product.id,

      name:
        getName(product),

      name_vi:
        product.name_vi,

      name_ja:
        product.name_ja,

      name_en:
        product.name_en,

      name_zh:
        product.name_zh,

      image_url:
        product.image_url,

      // --------------------------------------------------------
      // VARIANT
      // --------------------------------------------------------

      variantId:
        selectedVariant?.id ??
        null,

      variantCode:
        selectedVariant?.code ??
        null,

      variantName:
        selectedVariant
          ? getName(
              selectedVariant
            )
          : null,

      variantName_vi:
        selectedVariant?.name_vi ??
        null,

      variantName_ja:
        selectedVariant?.name_ja ??
        null,

      variantName_en:
        selectedVariant?.name_en ??
        null,

      variantName_zh:
        selectedVariant?.name_zh ??
        null,

      variantPrice:
        basePrice,

      // --------------------------------------------------------
      // PRICE
      // --------------------------------------------------------

      basePrice,

      optionsPrice,

      unitPrice,

      totalPrice,

      // --------------------------------------------------------
      // OPTIONS
      // --------------------------------------------------------

      selectedOptions:
        cartSelectedOptions,

      selectedOptionSnapshot,

      optionGroups:
        product.optionGroups,

      // --------------------------------------------------------
      // OTHER
      // --------------------------------------------------------

      note,

      quantity,
    };
  };

  // ============================================================
  // ADD CART
  // ============================================================

  const handleAddToCartOnly =
    () => {
      const cartItem =
        buildCartItem();

      if (!cartItem) return;

      onAddToCart(
        cartItem
      );

      handleTriggerClose();
    };

  // ============================================================
  // CHECKOUT
  // ============================================================

  const handleCheckoutNow =
    () => {
      const cartItem =
        buildCartItem();

      if (!cartItem) return;

      onAddToCart(
        cartItem
      );

      handleTriggerClose();

      router.push(
        `/${locale}/checkout`
      );
    };

  const formValid =
    isFormValid();

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
      className={`modal-overlay ${
        isClosing
          ? 'closing'
          : ''
      }`}
      onClick={
        handleTriggerClose
      }
    >
      <div
        className={`modal-content ${
          isClosing
            ? 'closing'
            : ''
        }`}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {loading ? (
          <div className="modal-loading">
            <div className="spinner" />

            <p>
              {dict.loading}
            </p>
          </div>
        ) : product ? (
          <>
            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="modal-header">
              <h2>
                {getName(
                  product
                )}
              </h2>

              {/* TAGS */}
              {product.tags && product.tags.length > 0 && (
                <div className="tag-list">
                  {product.tags.map((tag: any) => {
                    const tagName = tag.name_ja || tag.name_vi || tag.name_en || '';
                    const isTop1 = tagName.toUpperCase().includes('TOP 1');

                    return (
                      <span
                        key={tag.id}
                        className={`tag-badge ${isTop1 ? 'top-1' : ''}`}
                        style={{ '--tag-bg': tag.color || '#f97316' } as React.CSSProperties}
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
                onClick={
                  handleTriggerClose
                }
              >
                ✕
              </button>
            </div>

            {/* ==================================================
                STICKY TOP HEADER
            ================================================== */}
            <div className={`modal-sticky-top ${isScrolled ? 'scrolled' : ''}`}>
              {/* Banner Ảnh Chính */}
              {product.image_url && (
                <div className="modal-image-container">
                  <Image
                    src={product.image_url}
                    alt={getName(product)}
                    fill
                    sizes="(max-width: 640px) 100vw, 380px"
                    className="modal-image"
                    priority
                  />
                </div>
              )}

              {/* Thanh Tổng Tiền & Số Lượng */}
              <div className="modal-price-quantity-bar">
                {/* Ảnh Thumbnail nhỏ (Chỉ hiện khi Scroll) */}
                {product.image_url && (
                  <div className="modal-sticky-thumb">
                    <Image
                      src={product.image_url}
                      alt={getName(product)}
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
                        <path d="M1 1H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
                        <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
              ref={
                modalBodyRef
              }
              onScroll={
                handleScroll
              }
            >
              {/* DESCRIPTION */}

              {product.description && (
                <p
                  className="modal-desc"
                >
                  {
                    product.description
                  }
                </p>
              )}

              {/* ALLERGENS */}
              {product.allergens && product.allergens.length > 0 && (
                <div className="modal-allergens-section">
                  <div className="allergens-title-box">
                    <svg
                      className="allergens-icon"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <h3>
                      {dict?.allergens ||
                        (locale === 'ja'
                          ? 'アレルゲン'
                          : locale === 'vi'
                          ? 'Dị ứng'
                          : locale === 'zh'
                          ? '过敏原'
                          : 'Allergens')}
                    </h3>
                  </div>

                  <div className="allergen-list">
                    {product.allergens.map((allergen: any) => (
                      <span key={allergen.id} className="allergen-badge">
                        {allergen.name_ja || allergen.name_vi || allergen.name_en}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* =================================================
                  VARIANTS / SIZE
              ================================================= */}

              {/* ALLERGENS */}
              {Array.isArray(product.allergens) &&
                product.allergens.length > 0 && (
                  <div className="modal-allergens-section">
                    <div className="allergens-title-box">
                      <svg
                        className="allergens-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line
                          x1="12"
                          y1="8"
                          x2="12"
                          y2="12"
                        />
                        <line
                          x1="12"
                          y1="16"
                          x2="12.01"
                          y2="16"
                        />
                      </svg>

                      <h3>{dict.allergens}</h3>
                    </div>

                    <div className="allergen-list">
                      {product.allergens.map(
                        (allergen: any) => (
                          <span
                            key={allergen.id}
                            className="allergen-badge"
                          >
                            {locale === 'ja'
                              ? allergen.name_ja ||
                                allergen.name_vi ||
                                allergen.name_en
                              : locale === 'en'
                              ? allergen.name_en ||
                                allergen.name_vi ||
                                allergen.name_ja
                              : locale === 'zh'
                              ? allergen.name_zh ||
                                allergen.name_vi ||
                                allergen.name_en
                              : allergen.name_vi ||
                                allergen.name_ja ||
                                allergen.name_en}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* =================================================
                  OPTION GROUPS
              ================================================= */}

              {product.optionGroups &&
                Array.isArray(
                  product.optionGroups
                ) &&
                product.optionGroups.map(
                  (
                    group: any,
                    groupIndex: number
                  ) => {
                    const groupKey =
                      getGroupKey(
                        group,
                        groupIndex
                      );

                    const multiple =
                      isMultipleGroup(
                        group
                      );

                    const required =
                      getGroupRequired(
                        group
                      );

                    const currentSelected =
                      selectedOptions[
                        groupKey
                      ];

                    return (
                      <div
                        key={
                          groupKey
                        }
                        data-option-group-key={
                          groupKey
                        }
                        className={`option-group-section ${
                          required
                            ? 'option-group-required'
                            : 'option-group-optional'
                        }`}
                        style={{
                          marginBottom:
                            '28px',
                        }}
                      >
                        <div className="group-title-row">
                          <div className="group-title-left">
                            <h3>
                              {getGroupName(
                                group
                              )}
                            </h3>

                            <span
                              className={
                                required
                                  ? 'badge-required'
                                  : 'badge-optional'
                              }
                            >
                              {required
                                ? dict.required
                                : dict.optional}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`options-grid ${
                            multiple
                              ? 'options-multiple'
                              : 'options-single'
                          }`}
                        >
                          {Array.isArray(
                            group.options
                          ) &&
                            group.options.map(
                              (
                                opt: any,
                                optIndex: number
                              ) => {
                                const isSelected =
                                  multiple
                                    ? Array.isArray(
                                        currentSelected
                                      ) &&
                                      currentSelected.some(
                                        (
                                          item: any
                                        ) =>
                                          String(
                                            item?.id
                                          ) ===
                                          String(
                                            opt?.id
                                          )
                                      )
                                    : !!currentSelected &&
                                      !Array.isArray(
                                        currentSelected
                                      ) &&
                                      String(
                                        currentSelected?.id
                                      ) ===
                                        String(
                                          opt?.id
                                        );

                                // =================================================
                                // QUAN TRỌNG:
                                // GIÁ OPTION THEO VARIANT
                                // =================================================

                                const optPrice =
                                  getOptionPrice(
                                    opt
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      opt.id ??
                                      `${groupKey}-option-${optIndex}`
                                    }
                                    className={`option-card ${
                                      isSelected
                                        ? 'selected'
                                        : ''
                                    }`}
                                    onClick={() =>
                                      handleSelectOption(
                                        group,
                                        groupIndex,
                                        opt
                                      )
                                    }
                                    aria-pressed={
                                      isSelected
                                    }
                                  >
                                    <span className="option-card-left">
                                      <span
                                        className={`opt-checkbox-icon ${
                                          isSelected
                                            ? 'checked'
                                            : ''
                                        }`}
                                        aria-hidden="true"
                                      >
                                        {multiple
                                          ? isSelected
                                            ? '☑'
                                            : '☐'
                                          : isSelected
                                          ? '●'
                                          : '○'}
                                      </span>

                                      <span className="opt-text">
                                        {getOptionName(
                                          opt
                                        )}
                                      </span>
                                    </span>

                                    <span className="opt-price">
                                      {optPrice ===
                                      0
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
                style={{
                  marginBottom:
                    '32px',
                }}
              >
                <h3
                  style={{
                    marginBottom:
                      '10px',
                  }}
                >
                  {
                    dict.noteLabel
                  }
                </h3>

                <input
                  type="text"
                  className="note-input"
                  placeholder={
                    dict.notePlaceholder
                  }
                  value={note}
                  onChange={(e) =>
                    setNote(
                      e.target
                        .value
                    )
                  }
                />
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              {errorMessage && (
                <div
                  className="error-message"
                  role="alert"
                >
                  {
                    errorMessage
                  }
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
                  !formValid
                    ? 'disabled'
                    : ''
                }`}
                onClick={
                  handleAddToCartOnly
                }
                disabled={
                  !formValid
                }
              >
                <span>
                  {
                    dict.continueShopping
                  }
                </span>
              </button>

              <button
                type="button"
                className={`action-btn-primary ${
                  !formValid
                    ? 'disabled'
                    : ''
                }`}
                onClick={
                  handleCheckoutNow
                }
                disabled={
                  !formValid
                }
              >
                <span>
                  {
                    dict.checkoutNow
                  }
                </span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
