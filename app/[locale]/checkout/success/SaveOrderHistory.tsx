'use client';

import { useEffect } from 'react';
import { clearCartStorage } from '@/lib/cartStorage';

interface SaveOrderHistoryProps {
  orderToken: string;
  orderNumber: number;
  orderId: string;
  storeId?: number | null;
  storeName?: string | null;
  totalAmount: number;
  currency: string;
}

interface OrderHistoryItem {
  orderToken: string;
  orderNumber: number;
  orderId: string;
  storeId: number | null;
  storeName: string | null;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

const STORAGE_KEY = 'orderHistory';

export default function SaveOrderHistory({
  orderToken,
  orderNumber,
  orderId,
  storeId,
  storeName,
  totalAmount,
  currency,
}: SaveOrderHistoryProps) {
  useEffect(() => {
    if (!orderToken || !orderNumber || !orderId) {
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      let history: OrderHistoryItem[] = [];

      if (raw) {
        try {
          const parsed = JSON.parse(raw);

          if (Array.isArray(parsed)) {
            history = parsed;
          }
        } catch {
          history = [];
        }
      }

      const newOrder: OrderHistoryItem = {
        orderToken,
        orderNumber,
        orderId,
        storeId: storeId ?? null,
        storeName: storeName ?? null,
        totalAmount,
        currency,
        createdAt: new Date().toISOString(),
      };

      const existingIndex = history.findIndex(
        (item) => item.orderToken === orderToken
      );

      if (existingIndex >= 0) {
        history[existingIndex] = {
          ...history[existingIndex],
          ...newOrder,
        };
      } else {
        history.unshift(newOrder);
      }

      history = history.slice(0, 50);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
      );

      // Chỉ xóa đúng cart sau khi thanh toán thành công.
      clearCartStorage();

      window.dispatchEvent(
        new CustomEvent('order-history-updated')
      );
    } catch (error) {
      console.error(
        '[OrderHistory] Failed to save order history',
        error
      );
    }
  }, [
    orderToken,
    orderNumber,
    orderId,
    storeId,
    storeName,
    totalAmount,
    currency,
  ]);

  return null;
}