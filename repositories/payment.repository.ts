import { Prisma } from '@prisma/client';

import { db } from '@/lib/prisma';

// ============================================================
// TYPES
// ============================================================

export type PaymentTransactionClient = Prisma.TransactionClient;

export interface CreatePendingPaymentInput {
  orderId: bigint;
  amount: Prisma.Decimal | number | string;
  currency: string;
  paymentMethod: string;
}

export interface UpdatePaymentIntentInput {
  transactionId: string;
  clientSecret: string | null;
}

export interface MarkPaymentFailedInput {
  failureCode?: string | null;
  failureMessage?: string | null;
}

// ============================================================
// HELPERS
// ============================================================

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();

  if (!normalized) {
    return 'JPY';
  }

  return normalized;
}

// ============================================================
// PAYMENT REPOSITORY
// ============================================================

export const paymentRepository = {
  // ==========================================================
  // FIND PAYMENT
  // ==========================================================

  /**
   * Tìm payment theo Stripe PaymentIntent ID.
   */
  findPaymentByTransactionId(transactionId: string) {
    return db.tbl_order_payments.findFirst({
      where: {
        transaction_id: transactionId,
      },
    });
  },

  /**
   * Lấy payment mới nhất của order.
   */
  findLatestPaymentForOrder(orderId: bigint) {
    return db.tbl_order_payments.findFirst({
      where: {
        order_id: orderId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  },

  // ==========================================================
  // CREATE PAYMENT
  // ==========================================================

  /**
   * Tạo payment PENDING.
   * Có thể chạy trong hoặc ngoài transaction.
   */
  createPendingPayment(
    tx: PaymentTransactionClient | undefined,
    data: CreatePendingPaymentInput
  ) {
    const client = tx ?? db;

    return client.tbl_order_payments.create({
      data: {
        order_id: data.orderId,
        provider: 'STRIPE',
        payment_method: data.paymentMethod,
        amount: data.amount,
        currency: normalizeCurrency(data.currency),
        status: 'PENDING',
      },
    });
  },

  // ==========================================================
  // PAYMENT INTENT
  // ==========================================================

  /**
   * Cập nhật Stripe PaymentIntent information (ngoài transaction).
   */
  updatePaymentIntent(
    paymentId: bigint,
    data: UpdatePaymentIntentInput
  ) {
    return db.tbl_order_payments.update({
      where: {
        id: paymentId,
      },
      data: {
        transaction_id: data.transactionId,
        client_secret: data.clientSecret,
      },
    });
  },

  /**
   * Cập nhật Stripe PaymentIntent information (trong transaction).
   */
  updatePaymentIntentTx(
    tx: PaymentTransactionClient,
    paymentId: bigint,
    data: UpdatePaymentIntentInput
  ) {
    return tx.tbl_order_payments.update({
      where: {
        id: paymentId,
      },
      data: {
        transaction_id: data.transactionId,
        client_secret: data.clientSecret,
      },
    });
  },

  // ==========================================================
  // SUCCESS
  // ==========================================================

  /**
   * Đánh dấu payment thành công.
   */
  markPaymentSuccess(
    tx: PaymentTransactionClient,
    paymentId: bigint
  ) {
    return tx.tbl_order_payments.update({
      where: {
        id: paymentId,
      },
      data: {
        status: 'SUCCESS',
        paid_at: new Date(),
        failure_code: null,
        failure_message: null,
      },
    });
  },

  // ==========================================================
  // FAILED
  // ==========================================================

  /**
   * Đánh dấu payment thất bại.
   */
  markPaymentFailed(
    tx: PaymentTransactionClient,
    paymentId: bigint,
    data: MarkPaymentFailedInput
  ) {
    return tx.tbl_order_payments.update({
      where: {
        id: paymentId,
      },
      data: {
        status: 'FAILED',
        failure_code: data.failureCode ?? null,
        failure_message: data.failureMessage ?? null,
      },
    });
  },

  // ==========================================================
  // CANCELLED
  // ==========================================================

  /**
   * Đánh dấu payment bị hủy.
   */
  markPaymentCanceled(
    tx: PaymentTransactionClient,
    paymentId: bigint
  ) {
    return tx.tbl_order_payments.update({
      where: {
        id: paymentId,
      },
      data: {
        status: 'CANCELLED',
      },
    });
  },
};