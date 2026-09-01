import { Prisma } from '@prisma/client';

import { db } from '@/lib/prisma';

// ============================================================
// TYPES
// ============================================================

export type TransactionClient = Prisma.TransactionClient;

// ============================================================
// ORDER REPOSITORY
// ============================================================

export const orderRepository = {
  // ==========================================================
  // FIND ORDER
  // ==========================================================

  /**
   * Tìm order theo ID.
   *
   * Dùng DB trực tiếp vì đây là SELECT ngoài transaction.
   */
  findOrderById(orderId: bigint) {
    return db.tbl_customer_orders.findUnique({
      where: {
        id: orderId,
      },
    });
  },

  /**
   * Tìm order theo order token.
   */
  findOrderByToken(orderToken: string) {
    return db.tbl_customer_orders.findUnique({
      where: {
        order_token: orderToken,
      },
    });
  },

  // ==========================================================
  // STORE
  // ==========================================================

  /**
   * Chỉ lấy thông tin store cần thiết cho checkout.
   *
   * Không lấy toàn bộ store record để giảm query payload.
   */
  findStore(storeId: number) {
    return db.tbl_store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });
  },

  // ==========================================================
  // ORDER SUMMARY
  // ==========================================================

  /**
   * Lấy order summary dùng cho trang success / order status.
   *
   * Bao gồm:
   * - store
   * - order items
   *
   * Không include payment ở đây vì payment có repository riêng.
   */
  findOrderSummaryByToken(orderToken: string) {
    return db.tbl_customer_orders.findUnique({
      where: {
        order_token: orderToken,
      },
      include: {
        tbl_store: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },

        tbl_customer_order_items: true,
      },
    });
  },

  // ==========================================================
  // ORDER STATUS
  // ==========================================================

  /**
   * Đánh dấu order đã thanh toán thành công.
   *
   * Hàm này PHẢI được gọi bên trong transaction webhook
   * cùng với việc cập nhật payment.
   */
  markOrderPaid(tx: TransactionClient, orderId: bigint) {
    return tx.tbl_customer_orders.update({
      where: {
        id: orderId,
      },
      data: {
        status: 'PAID',
        paid_at: new Date(),
      },
    });
  },

  /**
   * Đánh dấu order thanh toán thất bại.
   */
  markOrderPaymentFailed(
    tx: TransactionClient,
    orderId: bigint
  ) {
    return tx.tbl_customer_orders.update({
      where: {
        id: orderId,
      },
      data: {
        status: 'PAYMENT_FAILED',
      },
    });
  },

  /**
   * Hủy order.
   *
   * QUAN TRỌNG:
   * Không được ghi PAYMENT_FAILED ở đây.
   *
   * PAYMENT_FAILED = thanh toán thất bại.
   * CANCELLED = order bị hủy.
   */
  markOrderCancelled(
    tx: TransactionClient,
    orderId: bigint
  ) {
    return tx.tbl_customer_orders.update({
      where: {
        id: orderId,
      },
      data: {
        status: 'CANCELED',
      },
    });
  },
};