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
  formatCurrency: (amount: any, currency: any, locale: Locale) => string;
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
  const isImmediate = order.order_type === 'IMMEDIATE' || !order.order_type;

  return (
    <div className="order-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Header của thẻ đơn hàng */}
      <div className="order-card-top">
        <div className="order-header-info">
          <div className="order-number-row">
            <span className="order-number">
              {t.order} <span className="highlight-number">#{orderNumber}</span>
            </span>
            <span className={`status-badge ${getStatusClass(order.status)}`}>
              {getStatusLabel(order.status, t)}
            </span>
          </div>
          {order.storeName && <div className="order-store-name">{order.storeName}</div>}
        </div>
      </div>

      {/* Khối thông tin meta */}
      <div className="order-meta-grid">
        <div className="order-meta-badge-wrapper">
          <span className={`order-type-badge ${isImmediate ? 'type-immediate' : 'type-scheduled'}`}>
            {isImmediate ? `${t.immediate}` : `${t.scheduled}`}
          </span>
        </div>

        {!isImmediate && order.scheduled_for && (
          <div className="order-meta-row">
            <span className="order-meta-label">{t.scheduledFor}:</span>
            <span className="order-meta-value">{formatDate(order.scheduled_for, locale)}</span>
          </div>
        )}

        {order.customer_name && (
          <div className="order-meta-row">
            <span className="order-meta-label">{t.customerLabel}:</span>
            <span className="order-meta-value">
              {order.customer_name} {order.customer_phone ? `(${order.customer_phone})` : ''}
            </span>
          </div>
        )}

        <div className="order-meta-row">
          <span className="order-meta-label">
            {locale === 'ja' ? '注文日時' : locale === 'vi' ? 'Thời gian đặt' : locale === 'zh' ? '下单时间' : 'Ordered at'}:
          </span>
          <span className="order-meta-value">{formatDate(orderDate, locale)}</span>
        </div>
      </div>

      {/* Danh sách món ăn rút gọn */}
      <div className="order-items-list">
        {order.tbl_customer_order_items?.map((item) => {
          // Gom nhóm các option theo group_name_snap để hiển thị dạng: トッピング: チーズ, 卵, 肉追加
          const groupedOptions = item.tbl_customer_order_item_options?.reduce((acc: Record<string, string[]>, opt) => {
            const groupKey = opt.group_name_snap || 'OTHER_GROUP';
            if (!acc[groupKey]) {
              acc[groupKey] = [];
            }
            if (opt.option_name_snap) {
              acc[groupKey].push(opt.option_name_snap);
            }
            return acc;
          }, {}) || {};

          return (
            <div key={String(item.id)} className="order-item-row">
              {item.image_snap ? (
                <div className="order-item-image-wrapper">
                  <Image
                    src={item.image_snap}
                    alt={item.food_name_snap}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
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
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="order-item-no-image-logo"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="order-item-info">
                <div className="order-item-header">
                  <span className="order-item-name">{item.food_name_snap}</span>
                  
                  {/* Icon huy hiệu số lượng trực quan thay cho chữ x */}
                  <span className="modal-item-qty-badge">
                    ｘ
                    <span className="modal-qty-number">{item.quantity}</span>
                  </span>
                </div>

                {/* Hiển thị các nhóm option đã được gộp phân cách bằng dấu phẩy */}
                {Object.keys(groupedOptions).length > 0 && (
                  <div className="order-options-list">
                    {Object.entries(groupedOptions).map(([groupKey, optionNames]) => {
                      const displayGroupName = groupKey !== 'OTHER_GROUP' ? groupKey : '';
                      const joinedOptions = optionNames.join(', ');

                      return (
                        <div key={groupKey} className="order-option-item">
                          <span className="order-option-name">
                            {displayGroupName ? <strong>{displayGroupName}: </strong> : ''}
                            <span>{joinedOptions}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {item.note && <div className="order-item-note">{t.note}: {item.note}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer tổng tiền */}
      <div className="order-card-footer">
        <span className="order-total-label">{t.total}</span>
        <span className="order-total-amount">{formatCurrency(order.total_amount, order.currency, locale)}</span>
      </div>
    </div>
  );
}