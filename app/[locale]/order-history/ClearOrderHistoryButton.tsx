'use client';

import { useState } from 'react';
import './ClearOrderHistoryButton.css';

interface ClearOrderHistoryButtonProps {
  locale: 'ja' | 'en' | 'vi' | 'zh';
}

const labels = {
  ja: {
    button: '注文履歴を削除',
    confirm:
      'この端末に保存されている注文履歴をすべて削除しますか？',
    aria: '注文履歴をすべて削除',
  },

  vi: {
    button: 'Xóa lịch sử đơn hàng',
    confirm:
      'Bạn có chắc muốn xóa toàn bộ lịch sử đơn hàng được lưu trên thiết bị này?',
    aria: 'Xóa toàn bộ lịch sử đơn hàng',
  },

  en: {
    button: 'Clear Order History',
    confirm:
      'Are you sure you want to delete all order history stored on this device?',
    aria: 'Clear all order history',
  },

  zh: {
    button: '删除订单记录',
    confirm:
      '确定要删除此设备上保存的所有订单记录吗？',
    aria: '删除所有订单记录',
  },
};

export default function ClearOrderHistoryButton({
  locale,
}: ClearOrderHistoryButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const currentLabels = labels[locale] ?? labels.ja;

  const handleClearHistory = () => {
    if (isDeleting) return;

    const confirmed = window.confirm(
      currentLabels.confirm
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);

      localStorage.removeItem('orderHistory');

      // Báo cho component cha biết dữ liệu localStorage đã thay đổi
      window.dispatchEvent(
        new CustomEvent('order-history-updated')
      );
    } catch (error) {
      console.error(
        '[OrderHistory] Failed to clear order history',
        error
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      className="clear-order-history-btn"
      onClick={handleClearHistory}
      disabled={isDeleting}
      aria-label={currentLabels.aria}
    >
      <svg
        className="clear-order-history-icon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 7h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M9 7V4.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M7 7l.7 12.1c.05.5.47.9.98.9h6.64c.51 0 .93-.4.98-.9L17 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M10 11v5.5M14 11v5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>

      <span>
        {isDeleting
          ? locale === 'ja'
            ? '削除中…'
            : locale === 'vi'
              ? 'Đang xóa…'
              : locale === 'zh'
                ? '删除中…'
                : 'Deleting…'
          : currentLabels.button}
      </span>
    </button>
  );
}