'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OrderStatusCheckerProps {
  isPaid: boolean;
  orderToken: string | null;
}

export default function OrderStatusChecker({
  isPaid,
  orderToken,
}: OrderStatusCheckerProps) {
  const router = useRouter();

  useEffect(() => {
    if (isPaid || !orderToken) {
      return;
    }

    let attempts = 0;

    // 20 lần x 1.5 giây = khoảng 30 giây
    const maxAttempts = 20;

    const checkStatus = async () => {
      attempts += 1;

      console.log(
        `[OrderStatusChecker] Checking payment status ${attempts}/${maxAttempts}`
      );

      try {
        const response = await fetch(
          `/api/orders/reconcile?orderToken=${encodeURIComponent(
            orderToken
          )}`,
          {
            method: 'GET',

            /*
             * Không lấy response cũ từ browser/CDN.
             */
            cache: 'no-store',
          }
        );

        const data = await response.json();

        console.log(
          '[OrderStatusChecker] API response',
          data
        );

        // -----------------------------------------------------
        // PAYMENT + ORDER ĐÃ PAID
        // -----------------------------------------------------

        if (
          response.ok &&
          data.isPaid === true &&
          data.orderStatus === 'PAID'
        ) {
          console.log(
            '[OrderStatusChecker] Payment confirmed'
          );

          /*
           * Refresh Server Component để SuccessPage
           * đọc lại DB.
           */
          router.refresh();

          return true;
        }

        // -----------------------------------------------------
        // HẾT SỐ LẦN THỬ
        // -----------------------------------------------------

        if (attempts >= maxAttempts) {
          console.warn(
            '[OrderStatusChecker] Maximum polling attempts reached'
          );

          return true;
        }

        return false;
      } catch (error) {
        console.error(
          '[OrderStatusChecker] Polling failed',
          error
        );

        if (attempts >= maxAttempts) {
          return true;
        }

        return false;
      }
    };

    /*
     * Check ngay lần đầu.
     *
     * Không cần đợi 1.5 giây.
     */
    let stopped = false;

    checkStatus().then((done) => {
      if (done) {
        stopped = true;
      }
    });

    const interval = setInterval(async () => {
      if (stopped) {
        clearInterval(interval);
        return;
      }

      const done = await checkStatus();

      if (done) {
        stopped = true;
        clearInterval(interval);
      }
    }, 1500);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [isPaid, orderToken, router]);

  return null;
}