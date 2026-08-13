import { Prisma } from '@prisma/client';
import { db } from '@/lib/prisma';

export type TransactionClient = Prisma.TransactionClient;

export const orderRepository = {
  findOrderById(orderId: bigint) {
    return db.tbl_customer_orders.findUnique({
      where: { id: orderId },
    });
  },

  findStore(storeId: number) {
    return db.tbl_store.findUnique({
      where: { id: storeId },
      select: { id: true, title: true, slug: true },
    });
  },

  findOrderByToken(orderToken: string) {
    return db.tbl_customer_orders.findUnique({
      where: { order_token: orderToken },
    });
  },

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

  markOrderPaid(tx: TransactionClient, orderId: bigint) {
    return tx.tbl_customer_orders.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paid_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  markOrderPaymentFailed(tx: TransactionClient, orderId: bigint) {
    return tx.tbl_customer_orders.update({
      where: { id: orderId },
      data: {
        status: 'PAYMENT_FAILED',
        updated_at: new Date(),
      },
    });
  },

  markOrderCancelled(tx: TransactionClient, orderId: bigint) {
    return tx.tbl_customer_orders.update({
      where: { id: orderId },
      data: {
        status: 'PAYMENT_FAILED',
        updated_at: new Date(),
      },
    });
  },
};
