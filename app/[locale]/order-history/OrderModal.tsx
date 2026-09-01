'use client';

import Image from 'next/image';
import { DisplayOrder, Locale } from './types';
import './order-modal.css';
import ClearOrderHistoryButton from './ClearOrderHistoryButton';

interface OrderModalProps {
  order: DisplayOrder | null;
  onClose: () => void;
  locale: Locale;
  t: any;
  getStatusLabel: (status: string | null, t: any) => string;
  getStatusClass: (status: string | null) => string;
  formatCurrency: (
    amount: any,
    currency: any,
    locale: Locale
  ) => string;
  formatDate: (date: any, locale: Locale) => string;
}

const modalLabels: Record<
  Locale,
  {
    store: string;
    orderType: string;
    itemsList: string;
    orderedAt: string;
    size: string;
    options: string;
    free: string;
  }
> = {
  ja: {
    store: 'ご利用店舗',
    orderType: '受取方法',
    itemsList: 'ご注文内容',
    orderedAt: '注文日時',
    size: 'サイズ',
    options: 'トッピング',
    free: '無料',
  },

  en: {
    store: 'Store Location',
    orderType: 'Pickup Option',
    itemsList: 'Ordered Items',
    orderedAt: 'Order Date & Time',
    size: 'Size',
    options: 'Toppings',
    free: 'Free',
  },

  vi: {
    store: 'Cửa hàng nhận',
    orderType: 'Hình thức nhận món',
    itemsList: 'Danh sách món ăn',
    orderedAt: 'Thời gian đặt món',
    size: 'Size',
    options: 'Topping',
    free: 'Miễn phí',
  },

  zh: {
    store: '就餐门店',
    orderType: '取餐方式',
    itemsList: '菜品详情',
    orderedAt: '下单时间',
    size: '尺寸',
    options: '配料',
    free: '免费',
  },
};

export default function OrderModal({
  order,
  onClose,
  locale,
  t,
  getStatusLabel,
  getStatusClass,
  formatCurrency,
  formatDate,
}: OrderModalProps) {
  if (!order) return null;

  const labels =
    modalLabels[locale] || modalLabels.ja;

  const orderNumber =
    order.order_number || order.id;

  const orderDate =
    order.localCreatedAt || order.created_at;

  const isImmediate =
    order.order_type === 'IMMEDIATE' ||
    !order.order_type;

  // ============================================================
  // HELPERS
  // ============================================================

  const getNumber = (value: unknown): number => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 0;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  const formatPrice = (value: unknown) => {
    return formatCurrency(
      getNumber(value),
      order.currency,
      locale
    );
  };

  // ============================================================
  // VARIANT / SIZE
  // Ưu tiên tên theo ngôn ngữ khách đã order
  // ============================================================

  const getVariantLabel = (item: {
    variant_name_snap?: string | null;
    variant_name_ja_snap?: string | null;
    variant_code_snap?: string | null;
  }) => {
    if (locale === 'ja') {
      return (
        item.variant_name_ja_snap ||
        item.variant_name_snap ||
        item.variant_code_snap ||
        null
      );
    }

    return (
      item.variant_name_snap ||
      item.variant_name_ja_snap ||
      item.variant_code_snap ||
      null
    );
  };

  // ============================================================
  // OPTION NAME
  // Ưu tiên tên theo ngôn ngữ khách đã order
  // ============================================================

  const getOptionName = (option: {
    option_name_snap?: string | null;
    option_name_ja_snap?: string | null;
    option_name_vi_snap?: string | null;
    option_name_en_snap?: string | null;
    option_name_zh_snap?: string | null;
  }) => {
    if (locale === 'ja') {
      return (
        option.option_name_ja_snap ||
        option.option_name_snap ||
        option.option_name_vi_snap ||
        option.option_name_en_snap ||
        option.option_name_zh_snap ||
        ''
      );
    }

    if (locale === 'vi') {
      return (
        option.option_name_vi_snap ||
        option.option_name_snap ||
        option.option_name_ja_snap ||
        option.option_name_en_snap ||
        option.option_name_zh_snap ||
        ''
      );
    }

    if (locale === 'zh') {
      return (
        option.option_name_zh_snap ||
        option.option_name_snap ||
        option.option_name_ja_snap ||
        option.option_name_en_snap ||
        option.option_name_vi_snap ||
        ''
      );
    }

    return (
      option.option_name_en_snap ||
      option.option_name_snap ||
      option.option_name_ja_snap ||
      option.option_name_vi_snap ||
      option.option_name_zh_snap ||
      ''
    );
  };

  // ============================================================
  // OPTION GROUP NAME
  // ============================================================

  const getOptionGroupName = (option: {
    group_name_snap?: string | null;
    group_name_ja_snap?: string | null;
  }) => {
    if (locale === 'ja') {
      return (
        option.group_name_ja_snap ||
        option.group_name_snap ||
        ''
      );
    }

    return (
      option.group_name_snap ||
      option.group_name_ja_snap ||
      ''
    );
  };

  

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ======================================================
            CLOSE
        ====================================================== */}

        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="modal-header">
          <h2 className="modal-title">
            {t.order}

            <span className="modal-order-highlight">
              #{orderNumber}
            </span>
          </h2>

          <div>
            <span
              className={`status-badge ${getStatusClass(
                order.status
              )}`}
            >
              {getStatusLabel(
                order.status,
                t
              )}
            </span>
          </div>
        </div>

        {/* ======================================================
            ORDER META
        ====================================================== */}

        <div className="order-meta-grid">
          {order.storeName && (
            <div className="order-meta-row">
              <span className="order-meta-label">
                {labels.store}:
              </span>

              <span className="order-meta-value">
                {order.storeName}
              </span>
            </div>
          )}

          <div className="order-meta-row">
            <span className="order-meta-label">
              {labels.orderType}:
            </span>

            <span className="order-meta-value">
              {isImmediate
                ? t.immediate
                : t.scheduled}
            </span>
          </div>

          {order.scheduled_for && (
            <div className="order-meta-row">
              <span className="order-meta-label">
                {t.scheduledFor}:
              </span>

              <span className="order-meta-value">
                {formatDate(
                  order.scheduled_for,
                  locale
                )}
              </span>
            </div>
          )}

          {order.customer_name && (
            <div className="order-meta-row">
              <span className="order-meta-label">
                {t.customerLabel}:
              </span>

              <span className="order-meta-value">
                {order.customer_name}

                {order.customer_phone && (
                  <span className="customer-phone">
                    {' '}
                    ({order.customer_phone})
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="order-meta-row">
            <span className="order-meta-label">
              {labels.orderedAt}:
            </span>

            <span className="order-meta-value">
              {formatDate(
                orderDate,
                locale
              )}
            </span>
          </div>
        </div>

        <hr className="modal-divider" />

        {/* ======================================================
            SCROLLABLE BODY
        ====================================================== */}

        <div className="modal-scrollable-body">
          <h3 className="modal-section-title">
            {labels.itemsList}
          </h3>

          <div className="modal-items-container">
            {order.tbl_customer_order_items?.map(
              (item) => {
                // ==================================================
                // OPTIONS
                // ==================================================

                const options =
                  item.tbl_customer_order_item_options ||
                  [];

                // ==================================================
                // GROUP OPTIONS
                // ==================================================

                const groupedOptions =
                  options.reduce(
                    (
                      acc: Record<
                        string,
                        typeof options
                      >,
                      option
                    ) => {
                      const groupKey =
                        getOptionGroupName(
                          option
                        ) ||
                        'OTHER_GROUP';

                      if (!acc[groupKey]) {
                        acc[groupKey] = [];
                      }

                      acc[groupKey].push(
                        option
                      );

                      return acc;
                    },
                    {}
                  );

                // ==================================================
                // OPTION TOTAL
                //
                // Ưu tiên option_total đã snapshot trong DB.
                // Nếu null thì tính lại từ options.
                // ==================================================

                const calculatedOptionTotal =
                  options.reduce(
                    (
                      sum,
                      option
                    ) =>
                      sum +
                      getNumber(
                        option.price_snap
                      ),
                    0
                  );

                const optionTotal =
                  item.option_total !==
                    null &&
                  item.option_total !==
                    undefined
                    ? getNumber(
                        item.option_total
                      )
                    : calculatedOptionTotal;

                // ==================================================
                // BASE PRICE
                // ==================================================

                const basePrice =
                  getNumber(
                    item.price_at_time
                  );

                // ==================================================
                // UNIT PRICE
                //
                // Giá 1 món bao gồm:
                // giá món + option
                // ==================================================

                const unitPriceWithOptions =
                  basePrice +
                  optionTotal;

                // ==================================================
                // VARIANT / SIZE
                // ==================================================

                const variantLabel =
                  getVariantLabel(item);

                const hasVariant =
                  Boolean(
                    variantLabel
                  );

                const hasOptions =
                  options.length > 0;

                // ==================================================
                // RENDER ITEM
                // ==================================================

                return (
                  <div
                    key={String(item.id)}
                    className="modal-item-row"
                  >
                    <div className="modal-item-info">

                      {/* ==================================================
                          PRODUCT HEADER
                      ================================================== */}

                      <div className="modal-item-header">
                        <div className="modal-item-title-area">

                          <span className="modal-item-name">
                            {item.food_name_snap}
                          </span>

                          {/* SIZE */}
                          {hasVariant && (
                            <span className="modal-item-size">
                              <span className="modal-item-size-label">
                                {labels.size}
                              </span>

                              <span className="modal-item-size-value">
                                {variantLabel}
                              </span>
                            </span>
                          )}

                        </div>

                        <div className="modal-item-right">

                          {/* QUANTITY */}

                          <span className="modal-item-qty-badge">
                            ×
                            <span className="modal-qty-number">
                              {item.quantity}
                            </span>
                          </span>

                          {/* UNIT PRICE INCLUDING OPTIONS */}

                          <span className="modal-item-price">
                            {formatPrice(
                              unitPriceWithOptions
                            )}
                          </span>

                        </div>
                      </div>




                      {/* ==================================================
                          OPTIONS
                      ================================================== */}

                      {hasOptions && (
                        <div className="modal-options-container">

                          {Object.entries(
                            groupedOptions
                          ).map(
                            ([
                              groupKey,
                              groupOptions,
                            ]) => (
                              <div
                                key={groupKey}
                                className="modal-option-group"
                              >

                                {/* GROUP NAME */}

                                {groupKey !==
                                  'OTHER_GROUP' && (
                                  <div className="modal-option-group-name">
                                    {groupKey}
                                  </div>
                                )}

                                {/* OPTIONS */}

                                <div className="modal-option-items">

                                  {groupOptions.map(
                                    (
                                      option
                                    ) => {
                                      const optionPrice =
                                        getNumber(
                                          option.price_snap
                                        );

                                      const optionName =
                                        getOptionName(
                                          option
                                        );

                                      return (
                                        <div
                                          key={String(
                                            option.id
                                          )}
                                          className="modal-option-item"
                                        >

                                          <div className="modal-option-name">

                                            <span>
                                              {
                                                optionName
                                              }
                                            </span>
                                          </div>

                                          <span
                                            className={`modal-option-price ${
                                              optionPrice >
                                              0
                                                ? 'has-price'
                                                : 'free'
                                            }`}
                                          >
                                            {optionPrice >
                                            0
                                              ? `+${formatPrice(
                                                  optionPrice
                                                )}`
                                              : labels.free}
                                          </span>

                                        </div>
                                      );
                                    }
                                  )}

                                </div>
                              </div>
                            )
                          )}

                        </div>
                      )}

                      {/* ==================================================
                          NOTE
                      ================================================== */}

                      {item.note && (
                        <div className="modal-option-list modal-item-note">
                          <span className="modal-note-label">
                            {t.note}:
                          </span>

                          <span>
                            {item.note}
                          </span>
                        </div>
                      )}

                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="modal-footer">
          <span>{t.total}</span>

          <span className="modal-total-amount">
            {formatCurrency(
              order.total_amount,
              order.currency,
              locale
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

