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
    noteLabel: 'Yêu cầu thêm của quý khách',
    notePlaceholder: 'Ví dụ: Không hành, ít đá...',
    quantity: 'Số lượng',
    free: 'Miễn phí',
    selectRequired: 'Vui lòng chọn',
    continueShopping: 'Chọn thêm món',
    checkoutNow: 'Thanh toán ngay',
    total: 'Tổng cộng:',
  },
  ja: {
    loading: 'オプションを読み込み中...',
    required: '必須',
    optional: '任意',
    noteLabel: 'ご希望・ご要望',
    notePlaceholder: '例：ネギ抜き、氷少なめ...',
    quantity: '数量',
    free: '無料',
    selectRequired: 'ご選択ください：',
    continueShopping: 'お買い物を続ける',
    checkoutNow: 'お会計に進む',
    total: '合計:',
  },
  en: {
    loading: 'Loading options...',
    required: 'Required',
    optional: 'Optional',
    noteLabel: 'Special Requests',
    notePlaceholder: 'E.g., No onion, less ice...',
    quantity: 'Quantity',
    free: 'Free',
    selectRequired: 'Please select',
    continueShopping: 'Continue Shopping',
    checkoutNow: 'Proceed to Checkout',
    total: 'Total:',
  },
  zh: {
    loading: '正在加载选项...',
    required: '必填',
    optional: '可选',
    noteLabel: '您的特殊要求',
    notePlaceholder: '例如：不要香菜，少冰...',
    quantity: '数量',
    free: '免费',
    selectRequired: '请选择',
    continueShopping: '继续点餐',
    checkoutNow: '立即结账',
    total: '总计:',
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

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>({});
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const modalBodyRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  const currentLang: LocaleKey = (t as Record<string, any>)[locale] ? (locale as LocaleKey) : 'vi';
  const dict = t[currentLang];

  const getName = (item: any) => {
    if (!item) return '';
    switch (locale) {
      case 'ja':
        return item.name_ja || item.title_ja || item.name || item.title || item.name_vi || '';
      case 'en':
        return item.name_en || item.title_en || item.name || item.title || item.name_vi || '';
      case 'zh':
        return item.name_zh || item.title_zh || item.name || item.title || item.name_vi || '';
      case 'vi':
      default:
        return item.name_vi || item.title_vi || item.name || item.title || '';
    }
  };

  const getGroupRequired = (group: any) => {
    if (!group) return false;
    if (group.is_required !== undefined && group.is_required !== null) {
      return (
        group.is_required === true ||
        group.is_required === 1 ||
        group.is_required === '1' ||
        group.is_required === 'true'
      );
    }
    if (group.required !== undefined && group.required !== null) {
      return (
        group.required === true ||
        group.required === 1 ||
        group.required === '1' ||
        group.required === 'true'
      );
    }
    return false;
  };

  const getGroupName = (group: any) => {
    if (!group) return '';
    switch (locale) {
      case 'ja':
        return group.name_ja || group.title_ja || group.name || group.title || group.name_vi || '';
      case 'en':
        return group.name_en || group.title_en || group.name || group.title || group.name_vi || '';
      case 'zh':
        return group.name_zh || group.title_zh || group.name || group.title || group.name_vi || '';
      case 'vi':
      default:
        return group.name_vi || group.title_vi || group.name || group.title || '';
    }
  };

  const getOptionName = (option: any) => {
    if (!option) return '';
    switch (locale) {
      case 'ja':
        return option.name_ja || option.name || option.name_vi || '';
      case 'en':
        return option.name_en || option.name || option.name_vi || '';
      case 'zh':
        return option.name_zh || option.name || option.name_vi || '';
      case 'vi':
      default:
        return option.name_vi || option.name || '';
    }
  };

  const getGroupKey = (group: any, index: number) => {
    if (group?.id !== undefined && group?.id !== null) {
      return `group-${String(group.id)}`;
    }
    if (group?.group_id !== undefined && group?.group_id !== null) {
      return `group-${String(group.group_id)}`;
    }
    return `group-index-${index}`;
  };

  const isMultipleGroup = (group: any) => {
    const type = String(
      group?.type ?? group?.selection_type ?? group?.select_type ?? 'single'
    ).toLowerCase();
    return type === 'multiple' || type === 'checkbox' || type === 'multi';
  };

  useEffect(() => {
    if (!isOpen || !itemId) return;

    setIsClosing(false);
    setIsScrolled(false);
    lastScrollTopRef.current = 0;

    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }

    setLoading(true);
    setQuantity(1);
    setNote('');
    setSelectedOptions({});
    setErrorMessage('');

    fetch(`/api/menu-items/${itemId}?locale=${encodeURIComponent(locale)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load product: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setProduct(data.data);
        } else {
          console.error('[ProductDetailModal] API error:', data);
        }
      })
      .catch((error) => {
        console.error('[ProductDetailModal] Failed to load product:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, itemId, locale]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const currentScrollTop = el.scrollTop;
    const canScroll = el.scrollHeight > el.clientHeight + 10;

    if (!canScroll) {
      if (isScrolled) setIsScrolled(false);
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

  const handleTriggerClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  if (!isOpen) return null;

  const basePrice = Number(product?.price || 0);

  const optionsPrice = Object.values(selectedOptions).reduce((sum: number, selected: any) => {
    if (Array.isArray(selected)) {
      return (
        sum +
        selected.reduce(
          (optionSum: number, option: any) => optionSum + Number(option?.price || 0),
          0
        )
      );
    }
    return sum + Number(selected?.price || 0);
  }, 0);

  const totalPrice = (basePrice + optionsPrice) * quantity;

  const isFormValid = () => {
    if (!product?.optionGroups || !Array.isArray(product.optionGroups)) {
      return true;
    }

    for (let index = 0; index < product.optionGroups.length; index++) {
      const group = product.optionGroups[index];
      if (!getGroupRequired(group)) continue;

      const groupKey = getGroupKey(group, index);
      const selected = selectedOptions[groupKey];
      const multiple = isMultipleGroup(group);

      if (multiple) {
        if (!Array.isArray(selected) || selected.length === 0) return false;
      } else {
        if (!selected || Array.isArray(selected)) return false;
      }
    }

    return true;
  };

  const handleSelectOption = (group: any, groupIndex: number, option: any) => {
    const groupKey = getGroupKey(group, groupIndex);
    const multiple = isMultipleGroup(group);

    setSelectedOptions((previous) => {
      const next = { ...previous };

      if (multiple) {
        const current = Array.isArray(previous[groupKey]) ? previous[groupKey] : [];
        const exists = current.some((item: any) => String(item?.id) === String(option?.id));

        if (exists) {
          next[groupKey] = current.filter((item: any) => String(item?.id) !== String(option?.id));
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

    setErrorMessage('');
  };

  const buildCartItem = () => {
    if (product?.optionGroups && Array.isArray(product.optionGroups)) {
      for (let index = 0; index < product.optionGroups.length; index++) {
        const group = product.optionGroups[index];
        if (!getGroupRequired(group)) continue;

        const groupKey = getGroupKey(group, index);
        const selected = selectedOptions[groupKey];
        const multiple = isMultipleGroup(group);

        const valid = multiple
          ? Array.isArray(selected) && selected.length > 0
          : !!selected && !Array.isArray(selected);

        if (!valid) {
          setErrorMessage(`${dict.selectRequired} ${getGroupName(group)}`);
          setTimeout(() => {
            const element = document.querySelector(`[data-option-group-key="${groupKey}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return null;
        }
      }
    }

    const cartSelectedOptions = { ...selectedOptions };
    const cartKey = generateCartKey(product.id, cartSelectedOptions, note);

    return {
      cartKey,
      menuItemId: product.id,
      itemId: product.id,
      name: getName(product),
      name_vi: product.name_vi,
      name_ja: product.name_ja,
      name_en: product.name_en,
      name_zh: product.name_zh,
      image_url: product.image_url,
      basePrice,
      selectedOptions: cartSelectedOptions,
      optionGroups: product.optionGroups,
      note,
      quantity,
      totalPrice,
    };
  };

  const handleAddToCartOnly = () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;
    onAddToCart(cartItem);
    handleTriggerClose();
  };

  const handleCheckoutNow = () => {
    const cartItem = buildCartItem();
    if (!cartItem) return;
    onAddToCart(cartItem);
    handleTriggerClose();
    router.push(`/${locale}/checkout`);
  };

  const formValid = isFormValid();

  return (
    <div
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleTriggerClose}
    >
      <div
        className={`modal-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="modal-loading">
            <div className="spinner" />
            <p>{dict.loading}</p>
          </div>
        ) : product ? (
          <>
            <div className="modal-header">
              <h2>{getName(product)}</h2>
              <button
                type="button"
                className="close-btn"
                onClick={handleTriggerClose}
              >
                ✕
              </button>
            </div>

            <div className={`modal-sticky-top ${isScrolled ? 'scrolled' : ''}`}>
              {product.image_url && (
                <div className="modal-image-container">
                  <Image
                    src={product.image_url}
                    alt={getName(product)}
                    fill
                    className="modal-image"
                  />
                </div>
              )}

              <div className="modal-price-quantity-bar">
                {product.image_url && (
                  <div className="modal-sticky-thumb">
                    <Image
                      src={product.image_url}
                      alt={getName(product)}
                      fill
                      className="modal-image"
                    />
                  </div>
                )}

                <div className="modal-current-price-box">
                  <span className="price-label">{dict.total}</span>
                  <span className="modal-total-price">¥{totalPrice.toLocaleString()}</span>
                </div>

                <div
                  className="modal-section quantity-row-inline"
                  style={{ marginBottom: '0px' }}
                >
                  <span className="quantity-label">{dict.quantity}:</span>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modal-body"
              ref={modalBodyRef}
              onScroll={handleScroll}
            >
              {product.description && (
                <p
                  className="modal-desc"
                  style={{ marginBottom: '24px' }}
                >
                  {product.description}
                </p>
              )}

              {product.optionGroups &&
                Array.isArray(product.optionGroups) &&
                product.optionGroups.map((group: any, groupIndex: number) => {
                  const groupKey = getGroupKey(group, groupIndex);
                  const multiple = isMultipleGroup(group);
                  const required = getGroupRequired(group);
                  const currentSelected = selectedOptions[groupKey];

                  return (
                    <div
                      key={groupKey}
                      data-option-group-key={groupKey}
                      className={`option-group-section ${
                        required ? 'option-group-required' : 'option-group-optional'
                      }`}
                      style={{ marginBottom: '28px' }}
                    >
                      <div className="group-title-row">
                        <div className="group-title-left">
                          <h3>{getGroupName(group)}</h3>
                          <span className={required ? 'badge-required' : 'badge-optional'}>
                            {required ? dict.required : dict.optional}
                          </span>
                        </div>
                      </div>

                      <div className={`options-grid ${multiple ? 'options-multiple' : 'options-single'}`}>
                        {Array.isArray(group.options) &&
                          group.options.map((opt: any, optIndex: number) => {
                            const isSelected = multiple
                              ? Array.isArray(currentSelected) &&
                                currentSelected.some(
                                  (item: any) => String(item?.id) === String(opt?.id)
                                )
                              : !!currentSelected &&
                                !Array.isArray(currentSelected) &&
                                String(currentSelected?.id) === String(opt?.id);

                            const optPrice = Number(opt?.price || 0);

                            return (
                              <button
                                type="button"
                                key={opt.id ?? `${groupKey}-option-${optIndex}`}
                                className={`option-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelectOption(group, groupIndex, opt)}
                                aria-pressed={isSelected}
                              >
                                <span className="option-card-left">
                                  <span
                                    className={`opt-checkbox-icon ${isSelected ? 'checked' : ''}`}
                                    aria-hidden="true"
                                  >
                                    {multiple ? (isSelected ? '☑' : '☐') : (isSelected ? '●' : '○')}
                                  </span>
                                  <span className="opt-text">{getOptionName(opt)}</span>
                                </span>

                                <span className="opt-price">
                                  {optPrice === 0 ? dict.free : `+¥${optPrice.toLocaleString()}`}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}

              <div
                className="modal-section"
                style={{ marginBottom: '32px' }}
              >
                <h3 style={{ marginBottom: '10px' }}>{dict.noteLabel}</h3>
                <input
                  type="text"
                  className="note-input"
                  placeholder={dict.notePlaceholder}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {errorMessage && (
                <div
                  className="error-message"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="modal-footer-dual">
              <button
                type="button"
                className={`action-btn-secondary ${!formValid ? 'disabled' : ''}`}
                onClick={handleAddToCartOnly}
                disabled={!formValid}
              >
                <span>{dict.continueShopping}</span>
              </button>

              <button
                type="button"
                className={`action-btn-primary ${!formValid ? 'disabled' : ''}`}
                onClick={handleCheckoutNow}
                disabled={!formValid}
              >
                <span>{dict.checkoutNow}</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}