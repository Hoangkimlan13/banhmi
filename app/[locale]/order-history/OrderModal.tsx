'use client';

import Image from 'next/image';
import { DisplayOrder, Locale } from './types';
import './order-modal.css';

interface OrderModalProps {
  order: DisplayOrder | null;
  onClose: () => void;
  locale: Locale;
  t: any;
  getStatusLabel: (status: string | null, t: any) => string;
  getStatusClass: (status: string | null) => string;
  formatCurrency: (amount: any, currency: any, locale: Locale) => string;
  formatDate: (date: any, locale: Locale) => string;
}

const modalLabels: Record<Locale, {
  store: string;
  orderType: string;
  itemsList: string;
  orderedAt: string;
}> = {
  ja: {
    store: 'ご利用店舗', 
    orderType: '受取方法', 
    itemsList: 'ご注文内容',
    orderedAt: '注文日時', 
  },
  en: {
    store: 'Store Location',
    orderType: 'Pickup Option',
    itemsList: 'Ordered Items', 
    orderedAt: 'Order Date & Time', 
  },
  vi: {
    store: 'Cửa hàng nhận', 
    orderType: 'Hình thức nhận món', 
    itemsList: 'Danh sách món ăn', 
    orderedAt: 'Thời gian đặt món', 
  },
  zh: {
    store: '就餐门店',
    orderType: '取餐方式', 
    itemsList: '菜品详情', 
    orderedAt: '下单时间', 
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

  const labels = modalLabels[locale] || modalLabels.ja;
  const orderNumber = order.order_number || order.id;
  const orderDate = order.localCreatedAt || order.created_at;
  const isImmediate = order.order_type === 'IMMEDIATE' || !order.order_type;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>

        {/* Header cố định trên cùng */}
        <div className="modal-header">
          <h2 className="modal-title">
            {t.order} <span className="modal-order-highlight">#{orderNumber}</span>
          </h2>
          <div>
            <span className={`status-badge ${getStatusClass(order.status)}`}>
              {getStatusLabel(order.status, t)}
            </span>
          </div>
        </div>

        {/* Thông tin chung */}
        <div className="order-meta-grid">
          {order.storeName && (
            <div className="order-meta-row">
              <span className="order-meta-label">{labels.store}:</span>
              <span className="order-meta-value">{order.storeName}</span>
            </div>
          )}
          <div className="order-meta-row">
            <span className="order-meta-label">{labels.orderType}:</span>
            <span className="order-meta-value">{isImmediate ? t.immediate : t.scheduled}</span>
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
              <span className="order-meta-value">{order.customer_name} {order.customer_phone ? `(${order.customer_phone})` : ''}</span>
            </div>
          )}
          <div className="order-meta-row">
            <span className="order-meta-label">{labels.orderedAt}:</span>
            <span className="order-meta-value">{formatDate(orderDate, locale)}</span>
          </div>
        </div>

        <hr className="modal-divider" />

        {/* Phần danh sách món cuộn riêng khi quá dài */}
        <div className="modal-scrollable-body">
          <h3 className="modal-section-title">{labels.itemsList}</h3>
          <div className="modal-items-container">
            {order.tbl_customer_order_items?.map((item) => {
              // Gom nhóm các option theo group_name_snap (nếu nhóm null/rỗng thì đưa vào 'OTHER_GROUP')
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
                <div key={String(item.id)} className="modal-item-row">
                  <div className="modal-item-info">
                    <div className="modal-item-header">
                      <span className="modal-item-name">{item.food_name_snap}</span>
                      
                      {/* Huy hiệu số lượng thay thế chữ x */}
                      <span className="modal-item-qty-badge">
                        ｘ
                        <span className="modal-qty-number">{item.quantity}</span>
                      </span>
                    </div>

                    {/* Hiển thị option sau khi gộp, phân cách bằng dấu phẩy */}
                    {Object.entries(groupedOptions).map(([groupKey, optionNames]) => {
                      const displayGroupName = groupKey !== 'OTHER_GROUP' ? groupKey : '';
                      const joinedOptions = optionNames.join(', ');

                      return (
                        <div key={groupKey} className="modal-option-list">
                          • {displayGroupName ? `${displayGroupName}: ` : ''}{joinedOptions}
                        </div>
                      );
                    })}

                    {/* Ghi chú món ăn nếu có */}
                    {item.note && (
                      <div className="modal-option-list modal-item-note">
                        {t.note}: {item.note}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer ghim cố định tổng tiền */}
        <div className="modal-footer">
          <span>{t.total}</span>
          <span className="modal-total-amount">{formatCurrency(order.total_amount, order.currency, locale)}</span>
        </div>
      </div>
    </div>
  );
}