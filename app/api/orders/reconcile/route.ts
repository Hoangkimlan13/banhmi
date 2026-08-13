import { NextResponse } from 'next/server';

import { db } from '@/lib/prisma';
import { orderRepository } from '@/repositories/order.repository';
import { paymentRepository } from '@/repositories/payment.repository';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const orderToken = url.searchParams.get('orderToken');

    // =========================================================
    // 1. VALIDATE ORDER TOKEN
    // =========================================================

    if (!orderToken) {
      return NextResponse.json(
        {
          error: 'Missing orderToken',
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 2. FIND ORDER
    // =========================================================

    const order =
      await orderRepository.findOrderSummaryByToken(
        orderToken
      );

    if (!order) {
      return NextResponse.json(
        {
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    // =========================================================
    // 3. FIND LATEST PAYMENT
    // =========================================================

    const payment =
      await paymentRepository.findLatestPaymentForOrder(
        order.id
      );

    // ---------------------------------------------------------
    // Không có payment
    // ---------------------------------------------------------

    if (!payment) {
      return NextResponse.json({
        isPaid: false,
        repaired: false,
        orderStatus: String(order.status),
        paymentStatus: null,
      });
    }

    // =========================================================
    // 4. NORMAL SUCCESS
    //
    // Payment SUCCESS
    // Order PAID
    //
    // => Mọi thứ bình thường
    // =========================================================

    if (
      order.status === 'PAID' &&
      payment.status === 'SUCCESS'
    ) {
      return NextResponse.json({
        isPaid: true,
        repaired: false,
        orderStatus: 'PAID',
        paymentStatus: 'SUCCESS',
      });
    }

    // =========================================================
    // 5. SELF-HEALING
    //
    // Payment đã SUCCESS
    // nhưng Order vẫn WAITING_PAYMENT
    //
    // Đây chính là trường hợp bạn đang muốn bắt.
    // =========================================================

    if (
      payment.status === 'SUCCESS' &&
      order.status === 'WAITING_PAYMENT'
    ) {
      console.warn(
        '[Order Reconcile] PAYMENT SUCCESS but ORDER WAITING_PAYMENT',
        {
          orderId: order.id.toString(),
          orderToken,
          paymentId: payment.id.toString(),
        }
      );

      /*
       * -------------------------------------------------------
       * QUAN TRỌNG
       *
       * Không được:
       *
       *   markOrderPaid(undefined, order.id)
       *
       * Vì repository của bạn cần Prisma transaction client.
       *
       * Phải tạo transaction và truyền tx vào.
       * -------------------------------------------------------
       */

      await db.$transaction(async (tx) => {
        // Đọc lại order trong transaction để tránh dùng
        // trạng thái cũ từ lần query trước.
        const currentOrder =
          await tx.tbl_customer_orders.findUnique({
            where: {
              id: order.id,
            },
          });

        if (!currentOrder) {
          throw new Error(
            `Order ${order.id.toString()} not found during reconciliation`
          );
        }

        // -----------------------------------------------------
        // Chỉ repair nếu order vẫn WAITING_PAYMENT
        // -----------------------------------------------------

        if (
          currentOrder.status === 'WAITING_PAYMENT'
        ) {
          await orderRepository.markOrderPaid(
            tx,
            order.id
          );

          console.log(
            '[Order Reconcile] Order successfully repaired to PAID',
            {
              orderId: order.id.toString(),
              paymentId: payment.id.toString(),
            }
          );
        } else {
          console.log(
            '[Order Reconcile] Order status changed before repair',
            {
              orderId: order.id.toString(),
              currentStatus: currentOrder.status,
            }
          );
        }
      });

      // -------------------------------------------------------
      // Trả kết quả sau khi repair
      // -------------------------------------------------------

      return NextResponse.json({
        isPaid: true,
        repaired: true,
        orderStatus: 'PAID',
        paymentStatus: 'SUCCESS',
      });
    }

    // =========================================================
    // 6. PAYMENT CHƯA SUCCESS
    //
    // Không được tự chuyển Order → PAID
    // =========================================================

    return NextResponse.json({
      isPaid: false,
      repaired: false,
      orderStatus: String(order.status),
      paymentStatus: String(payment.status),
    });
  } catch (error) {
    console.error(
      '[Order Reconcile] Failed',
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',

        stack:
          error instanceof Error
            ? error.stack
            : undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Order reconciliation failed',
      },
      { status: 500 }
    );
  }
}