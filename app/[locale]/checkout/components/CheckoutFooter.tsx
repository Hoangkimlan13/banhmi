'use client';

import { useState } from 'react';
import styles from './CheckoutFooter.module.css';

interface CheckoutFooterProps {
  total: number;
  locale?: string;
  cartCount?: number;
  children?: React.ReactNode; // Dùng để truyền OrderSummarySection vào bên trong panel trượt
}

const footerTranslations = {
  ja: {
    totalLabel: 'お支払い合計金額',
    detailsToggle: 'ご注文内容',
    close: '閉じる',
  },
  en: {
    totalLabel: 'Total Payment',
    detailsToggle: 'Order Details',
    close: 'Close',
  },
  vi: {
    totalLabel: 'Tổng tiền thanh toán',
    detailsToggle: 'Chi tiết đơn hàng',
    close: 'Đóng',
  },
  zh: {
    totalLabel: '应付总额',
    detailsToggle: '订单详情',
    close: '关闭',
  },
};

export default function CheckoutFooter({
  total,
  locale = 'ja',
  cartCount = 0,
  children,
}: CheckoutFooterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = footerTranslations[locale as keyof typeof footerTranslations] || footerTranslations.ja;

  return (
    <>
      {/* Backdrop mờ khi mở panel tóm tắt đơn hàng trên mobile */}
      {isOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Panel chi tiết trượt từ dưới lên khi bấm vào thanh footer */}
      <div className={`${styles.slideUpPanel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.panelHandleBar} onClick={() => setIsOpen(false)}>
          <div className={styles.handleIndicator} />
          <button type="button" className={styles.closeButton}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className={styles.panelContentScrollable}>
          {children}
        </div>
      </div>

      {/* Thanh Bar cố định ở đáy màn hình */}
      <div className={styles.footerContainer}>
        <div 
          className={styles.footerInner}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className={styles.mobileTotalLeft}>
            <div className={styles.toggleRow}>
              <span className={styles.totalLabel}>{t.totalLabel}</span>
              <span className={styles.detailsToggleText}>
                {t.detailsToggle} 
                <span className={`material-symbols-outlined ${styles.chevronIcon} ${isOpen ? styles.chevronOpen : ''}`}>
                  expand_less
                </span>
              </span>
            </div>
            <span className={styles.totalAmount}>
              ¥{Number(total || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}