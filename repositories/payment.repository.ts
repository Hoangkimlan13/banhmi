import { Prisma } from '@prisma/client';
import { db } from '@/lib/prisma';
import { TransactionClient } from './order.repository';

export const paymentRepository = {
  findPaymentByTransactionId(transactionId: string) {
    return db.tbl_order_payments.findFirst({
      where: { transaction_id: transactionId },
    });
  },

  findLatestPaymentForOrder(orderId: bigint) {
    return db.tbl_order_payments.findFirst({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
    });
  },

  createPendingPayment(tx: TransactionClient, data: {
    orderId: bigint;
    amount: Prisma.Decimal | number | string;
    currency: string;
    paymentMethod: string;
  }) {
    return tx.tbl_order_payments.create({
      data: {
        order_id: data.orderId,
        provider: 'STRIPE',
        payment_method: data.paymentMethod,
        amount: data.amount,
        currency: data.currency,
        status: 'PENDING',
      },
    });
  },

  updatePaymentIntent(paymentId: bigint, data: {
    transactionId: string;
    clientSecret: string | null;
  }) {
    return db.tbl_order_payments.update({
      where: { id: paymentId },
      data: {
        transaction_id: data.transactionId,
        client_secret: data.clientSecret,
        updated_at: new Date(),
      },
    });
  },

  updatePaymentIntentTx(tx: TransactionClient, paymentId: bigint, data: {
    transactionId: string;
    clientSecret: string | null;
  }) {
    return tx.tbl_order_payments.update({
      where: { id: paymentId },
      data: {
        transaction_id: data.transactionId,
        client_secret: data.clientSecret,
        updated_at: new Date(),
      },
    });
  },

  markPaymentSuccess(tx: TransactionClient, paymentId: bigint) {
    return tx.tbl_order_payments.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCESS',
        paid_at: new Date(),
        failure_code: null,
        failure_message: null,
        updated_at: new Date(),
      },
    });
  },

  markPaymentFailed(tx: TransactionClient, paymentId: bigint, data: {
    failureCode?: string | null;
    failureMessage?: string | null;
  }) {
    return tx.tbl_order_payments.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failure_code: data.failureCode || null,
        failure_message: data.failureMessage || null,
        updated_at: new Date(),
      },
    });
  },

  markPaymentCanceled(tx: TransactionClient, paymentId: bigint) {
    return tx.tbl_order_payments.update({
      where: { id: paymentId },
      data: {
        status: 'CANCELLED',
        updated_at: new Date(),
      },
    });
  },
};
