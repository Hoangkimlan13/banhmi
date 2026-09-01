
'use client';

import Image from 'next/image';
import { DisplayOrder, Locale } from './types';

interface OrderCardProps {
  order: DisplayOrder;
  locale: Locale;
  t: any;
  onClick: () => void;
  getStatusLabel: (status: string | null, t: any) => string;
  getStatusClass: (status: string | null) => string;
  formatCurrency: (
    amount: any,
    currency: any,
    locale: Locale
  ) => string;
  formatDate: (date: any, locale: Locale) => string;
}

export default function OrderCard({
  order,
  locale,
  t,
  onClick,
  getStatusLabel,
  getStatusClass,
  formatCurrency,
  formatDate,
}: OrderCardProps) {
  const orderNumber = order.order_number || order.id;
  const orderDate = order.localCreatedAt || order.created_at;

  const isImmediate =
    order.order_type === 'IMMEDIATE' || !order.order_type;

  // ============================================================
  // HELPERS
  // ============================================================

  const getOptionName = (option: {
    option_name_snap: string;
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


  const getNumber = (value: unknown): number => {
    if (value === null || value === undefined) {
      return 0;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
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
  // LOCALIZED LABELS
  // ============================================================

  const sizeLabel =
    locale === 'ja'
      ? 'サイズ'
      : locale === 'vi'
        ? 'Size'
        : locale === 'zh'
          ? '尺寸'
          : 'Size';

  const toppingLabel =
    locale === 'ja'
      ? 'トッピング'
      : locale === 'vi'
        ? 'Topping'
        : locale === 'zh'
          ? '配料'
          : 'Toppings';

  const freeLabel =
    locale === 'ja'
      ? '無料'
      : locale === 'vi'
        ? 'Miễn phí'
        : locale === 'zh'
          ? '免费'
          : 'Free';

  const orderedAtLabel =
    locale === 'ja'
      ? '注文日時'
      : locale === 'vi'
        ? 'Thời gian đặt'
        : locale === 'zh'
          ? '下单时间'
          : 'Ordered at';
  


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="order-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="order-card-top">
        <div className="order-header-info">
          <div className="order-number-row">
            <div className="order-number-block">
              <span className="order-number-label">
                {t.order}
              </span>

              <span className="highlight-number">
                #{orderNumber}
              </span>
            </div>

            <span
              className={`status-badge ${getStatusClass(
                order.status
              )}`}
            >
              {getStatusLabel(order.status, t)}
            </span>
          </div>

          {order.storeName && (
            <div className="order-store-name">
              <span className="store-dot" />
              <span className="order-store-name-text">
                {order.storeName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================
          META
      ====================================================== */}

      <div className="order-meta-grid">
        <div className="order-meta-top">
          <span
            className={`order-type-badge ${
              isImmediate
                ? 'type-immediate'
                : 'type-scheduled'
            }`}
          >
            <span className="order-type-dot" />

            {isImmediate
              ? t.immediate
              : t.scheduled}
          </span>
        </div>

        {!isImmediate && order.scheduled_for && (
          <div className="order-meta-row">
            <span className="order-meta-label">
              {t.scheduledFor}
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
              {t.customerLabel}
            </span>

            <span className="order-meta-value">
              {order.customer_name}

              {order.customer_phone && (
                <span className="customer-phone">
                  {order.customer_phone}
                </span>
              )}
            </span>
          </div>
        )}

        <div className="order-meta-row">
          <span className="order-meta-label">
            {orderedAtLabel}
          </span>

          <span className="order-meta-value">
            {formatDate(orderDate, locale)}
          </span>
        </div>
      </div>

      {/* ======================================================
          ITEMS
      ====================================================== */}

      <div className="order-items-list">
        {order.tbl_customer_order_items?.map(
          (item) => {
            const options =
              item.tbl_customer_order_item_options ||
              [];

            // --------------------------------------------------
            // GROUP OPTIONS
            // --------------------------------------------------

            const groupedOptions = options.reduce(
              (
                acc: Record<
                  string,
                  typeof options
                >,
                option
              ) => {
                const groupKey =
                  option.group_name_snap ||
                  option.group_name_ja_snap ||
                  'OTHER_GROUP';

                if (!acc[groupKey]) {
                  acc[groupKey] = [];
                }

                acc[groupKey].push(option);

                return acc;
              },
              {}
            );

            // --------------------------------------------------
            // OPTION TOTAL
            // --------------------------------------------------

            const calculatedOptionTotal =
              options.reduce(
                (sum, option) =>
                  sum +
                  getNumber(option.price_snap),
                0
              );

            const optionTotal =
              item.option_total !== null &&
              item.option_total !== undefined
                ? getNumber(item.option_total)
                : calculatedOptionTotal;
            const basePrice = getNumber(item.price_at_time);

            const unitPriceWithOptions =
              basePrice + optionTotal;

            // --------------------------------------------------
            // VARIANT
            // --------------------------------------------------

            const variantLabel =
              getVariantLabel(item);

            const hasOptions =
              Object.keys(groupedOptions).length > 0;

            return (
              <article
                key={String(item.id)}
                className="order-item"
              >
                {/* =================================================
                    PRODUCT MAIN ROW
                ================================================= */}

                <div className="order-item-main">
                  {/* IMAGE */}

                  {item.image_snap ? (
                    <div className="order-item-image-wrapper">
                      <Image
                        src={item.image_snap}
                        alt={item.food_name_snap}
                        fill
                        sizes="
                          (max-width: 480px) 78px,
                          (max-width: 768px) 86px,
                          92px
                        "
                        className="order-item-image"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="order-item-no-image-wrapper">
                      <Image
                        src="/images/logo_header.png"
                        alt="Logo"
                        fill
                        sizes="
                          (max-width: 480px) 78px,
                          (max-width: 768px) 86px,
                          92px
                        "
                        className="order-item-no-image-logo"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* PRODUCT INFO */}

                  <div className="order-item-info">
                    <div className="order-item-header">
                      <div className="order-item-title-wrap">
                        <h3 className="order-item-name">
                          {item.food_name_snap}
                        </h3>

                        {variantLabel && (
                          <span className="item-size-badge">
                            <span className="item-size-label">
                              {sizeLabel}:
                            </span>

                            <span className="item-size-value">
                              {variantLabel}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="order-item-right">
                        <span className="modal-item-qty-badge">
                          ×{item.quantity}
                        </span>

                        <span className="order-item-price">
                          {formatPrice(unitPriceWithOptions)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    OPTIONS
                    NẰM DƯỚI TOÀN BỘ IMAGE + NAME
                ================================================= */}

                {hasOptions && (
                  <div className="order-options-box">
                    <div className="order-options-heading">

                      <span className="order-options-title">
                        {toppingLabel}
                      </span>

                      <span className="order-options-total-inline">
                        +{formatPrice(optionTotal)}
                      </span>
                    </div>

                    <div className="order-options-list">
                      {Object.entries(
                        groupedOptions
                      ).map(
                        ([
                          groupKey,
                          groupOptions,
                        ]) => (
                          <div
                            key={groupKey}
                            className="order-option-group"
                          >
                            {groupKey !==
                              'OTHER_GROUP' && (
                              <div className="order-option-group-title">
                                {groupKey}
                              </div>
                            )}

                            <div className="order-option-group-items">
                              {groupOptions.map(
                                (option) => {
                                  const optionPrice =
                                    getNumber(
                                      option.price_snap
                                    );

                                  return (
                                    <div
                                      key={String(
                                        option.id
                                      )}
                                      className="order-option-item"
                                    >
                                      <span className="order-option-name">
                                        <span className="option-check">
                                          ✓
                                        </span>

                                        <span className="option-name-text">
                                          {
                                            option.option_name_snap
                                          }
                                        </span>
                                      </span>

                                      <span
                                        className={`order-option-price ${
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
                                          : freeLabel}
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
                  </div>
                )}

                {/* =================================================
                    NOTE
                ================================================= */}

                {item.note && (
                  <div className="order-item-note">
                    <span className="note-label">
                      {t.note}
                    </span>

                    <span className="note-text">
                      {item.note}
                    </span>
                  </div>
                )}
              </article>
            );
          }
        )}
      </div>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="order-card-footer">
        <div className="order-total-left">
          <span className="order-total-label">
            {t.total}
          </span>

          <span className="order-total-item-count">
            {order.tbl_customer_order_items
              ?.length || 0}{' '}
            {locale === 'ja'
              ? '品'
              : locale === 'vi'
                ? 'món'
                : locale === 'zh'
                  ? '件商品'
                  : 'items'}
          </span>
        </div>

        <span className="order-total-amount">
          {formatCurrency(
            order.total_amount,
            order.currency,
            locale
          )}
        </span>
      </div>
    </div>
  );
}
