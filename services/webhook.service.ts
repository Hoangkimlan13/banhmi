import Stripe from 'stripe';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/prisma';
import { paymentRepository } from '@/repositories/payment.repository';
import { orderRepository } from '@/repositories/order.repository';
import { webhookRepository } from '@/repositories/webhook.repository';
import { getStripePaymentFailure } from '@/services/payment.service';
import { printJobRepository } from '@/repositories/print-job.repository';


export interface WebhookProcessResult {
  duplicate: boolean;
  processed: boolean;
  paymentId?: string;
}

/**
 * Chỉ xử lý các PaymentIntent event mà hệ thống order cần.
 */
function isPaymentIntentEvent(event: Stripe.Event): boolean {
  return (
    event.type === 'payment_intent.succeeded' ||
    event.type === 'payment_intent.payment_failed' ||
    event.type === 'payment_intent.canceled'
  );
}

export async function processStripeWebhook(
  event: Stripe.Event,
  rawPayload: string
): Promise<WebhookProcessResult> {
  try {
    return await db.$transaction(async (tx) => {
      /*
       * ============================================================
       * 1. IDEMPOTENCY
       * ============================================================
       *
       * Stripe có thể gửi cùng một event nhiều lần.
       *
       * Nếu event đã processed = 1:
       *   → bỏ qua hoàn toàn.
       *
       * Nếu event tồn tại nhưng processed = 0:
       *   → cho phép xử lý lại.
       */

      const existing = await webhookRepository.findWebhook(
        tx,
        event.id
      );

      if (existing) {
        console.log(
          '[Stripe Webhook] Existing event found',
          {
            eventId: event.id,
            eventType: event.type,
            processed: existing.processed,
            paymentId:
              existing.payment_id?.toString() ?? null,
          }
        );

        /*
         * Event đã xử lý hoàn chỉnh.
         */
        if (existing.processed === 1) {
          console.log(
            '[Stripe Webhook] Event already processed',
            {
              eventId: event.id,
              paymentId:
                existing.payment_id?.toString() ?? null,
            }
          );

          return {
            duplicate: true,
            processed: true,
            paymentId:
              existing.payment_id?.toString(),
          };
        }

        /*
         * Event tồn tại nhưng chưa processed.
         *
         * Không return.
         * Tiếp tục xử lý lại event.
         */
        console.warn(
          '[Stripe Webhook] Existing event is NOT processed. Reprocessing...',
          {
            eventId: event.id,
            processed: existing.processed,
          }
        );
      }

      /*
       * ============================================================
       * 2. CREATE WEBHOOK RECORD
       * ============================================================
       */

      let webhook = existing;

      if (!webhook) {
        webhook =
          await webhookRepository.createWebhook(tx, {
            eventId: event.id,
            eventType: event.type,
            payload: rawPayload,
          });

        console.log(
          '[Stripe Webhook] Webhook record created',
          {
            webhookId: webhook.id.toString(),
            eventId: event.id,
            eventType: event.type,
          }
        );
      }

      let paymentId: bigint | null = null;

      /*
       * ============================================================
       * 3. IGNORE NON-PAYMENT-INTENT EVENTS
       * ============================================================
       */

      if (!isPaymentIntentEvent(event)) {
        console.log(
          '[Stripe Webhook] Event ignored',
          {
            eventId: event.id,
            eventType: event.type,
          }
        );

        await webhookRepository.markProcessed(
          tx,
          webhook.id,
          null
        );

        console.log(
          '[Stripe Webhook] Non-payment event marked processed',
          {
            eventId: event.id,
            eventType: event.type,
          }
        );

        return {
          duplicate: false,
          processed: true,
        };
      }

      /*
       * ============================================================
       * 4. PAYMENT INTENT
       * ============================================================
       */

      const intent =
        event.data.object as Stripe.PaymentIntent;

      const metadataOrderId =
        intent.metadata?.order_id;

      const metadataPaymentId =
        intent.metadata?.payment_id;

      console.log(
        '[Stripe Webhook] Processing PaymentIntent',
        {
          eventId: event.id,
          eventType: event.type,

          paymentIntentId: intent.id,

          stripeStatus: intent.status,

          metadataOrderId:
            metadataOrderId ?? null,

          metadataPaymentId:
            metadataPaymentId ?? null,

          amount: intent.amount,

          currency: intent.currency,
        }
      );

      /*
       * ============================================================
       * 5. FIND PAYMENT
       * ============================================================
       *
       * Ưu tiên:
       *
       *   transaction_id = PaymentIntent.id
       *
       * Fallback:
       *
       *   metadata.payment_id
       */

      let payment =
        await tx.tbl_order_payments.findFirst({
          where: {
            transaction_id: intent.id,
          },
        });

      /*
       * Fallback bằng metadata.payment_id.
       */

      if (!payment && metadataPaymentId) {
        let metadataPaymentIdBigInt: bigint;

        try {
          metadataPaymentIdBigInt =
            BigInt(metadataPaymentId);
        } catch {
          throw new Error(
            `Invalid metadata.payment_id: ${metadataPaymentId}`
          );
        }

        payment =
          await tx.tbl_order_payments.findUnique({
            where: {
              id: metadataPaymentIdBigInt,
            },
          });

        if (payment) {
          console.warn(
            '[Stripe Webhook] Payment found by metadata.payment_id',
            {
              eventId: event.id,
              paymentIntentId: intent.id,

              paymentId:
                payment.id.toString(),

              currentTransactionId:
                payment.transaction_id,
            }
          );
        }
      }

      /*
       * ============================================================
       * 6. PAYMENT NOT FOUND
       * ============================================================
       */

      if (!payment) {
        console.error(
          '[Stripe Webhook] PAYMENT RECORD NOT FOUND',
          {
            eventId: event.id,
            eventType: event.type,

            paymentIntentId: intent.id,

            metadataOrderId:
              metadataOrderId ?? null,

            metadataPaymentId:
              metadataPaymentId ?? null,
          }
        );

        /*
         * Không mark processed.
         *
         * Throw → transaction rollback → HTTP 500
         * → Stripe có thể retry webhook.
         */

        throw new Error(
          `Payment record not found for PaymentIntent ${intent.id}`
        );
      }

      paymentId = payment.id;

      console.log(
        '[Stripe Webhook] Payment found',
        {
          paymentId:
            payment.id.toString(),

          orderId:
            payment.order_id.toString(),

          status:
            payment.status,

          transactionId:
            payment.transaction_id,

          amount:
            payment.amount?.toString() ?? null,

          currency:
            payment.currency,
        }
      );

      /*
       * ============================================================
       * 7. VERIFY PAYMENT / ORDER / AMOUNT / CURRENCY
       * ============================================================
       */

      const stripeAmount =
        Number(intent.amount ?? 0);

      const paymentAmount =
        Number(
          payment.amount?.toString() ?? 0
        );

      const stripeCurrency =
        (
          intent.currency || ''
        ).toUpperCase();

      const paymentCurrency =
        (
          payment.currency || 'JPY'
        ).toUpperCase();

      const matchesOrderId =
        !metadataOrderId ||
        metadataOrderId ===
          payment.order_id.toString();

      const matchesPaymentId =
        !metadataPaymentId ||
        metadataPaymentId ===
          payment.id.toString();

      const amountMatches =
        stripeAmount === paymentAmount;

      const currencyMatches =
        stripeCurrency === paymentCurrency;

      console.log(
        '[Stripe Webhook] Payment validation',
        {
          paymentId:
            payment.id.toString(),

          orderId:
            payment.order_id.toString(),

          amount: {
            stripe: stripeAmount,
            database: paymentAmount,
            matches: amountMatches,
          },

          currency: {
            stripe: stripeCurrency,
            database: paymentCurrency,
            matches: currencyMatches,
          },

          metadata: {
            orderId:
              metadataOrderId ?? null,

            paymentId:
              metadataPaymentId ?? null,

            orderMatches:
              matchesOrderId,

            paymentMatches:
              matchesPaymentId,
          },
        }
      );

      /*
       * ============================================================
       * 8. SECURITY VALIDATION
       * ============================================================
       */

      if (
        !amountMatches ||
        !currencyMatches ||
        !matchesOrderId ||
        !matchesPaymentId
      ) {
        console.error(
          '[Stripe Webhook] PAYMENT VALIDATION FAILED',
          {
            eventId: event.id,

            paymentIntentId:
              intent.id,

            expectedAmount:
              paymentAmount,

            actualAmount:
              stripeAmount,

            expectedCurrency:
              paymentCurrency,

            actualCurrency:
              stripeCurrency,

            expectedOrderId:
              payment.order_id.toString(),

            metadataOrderId,

            expectedPaymentId:
              payment.id.toString(),

            metadataPaymentId,
          }
        );

        throw new Error(
          `Stripe payment validation failed for PaymentIntent ${intent.id}`
        );
      }

      /*
       * ============================================================
       * 9. PAYMENT SUCCEEDED
       * ============================================================
       */

      if (
        event.type ===
        'payment_intent.succeeded'
      ) {
        console.log(
          '[Stripe Webhook] ===== PAYMENT SUCCEEDED =====',
          {
            eventId: event.id,

            paymentId:
              payment.id.toString(),

            orderId:
              payment.order_id.toString(),

            paymentIntentId:
              intent.id,

            currentPaymentStatus:
              payment.status,
          }
        );

        /*
         * ========================================================
         * 9.1 UPDATE TRANSACTION ID
         * ========================================================
         */

        if (
          payment.transaction_id !==
          intent.id
        ) {
          console.log(
            '[Stripe Webhook] Updating transaction_id',
            {
              paymentId:
                payment.id.toString(),

              oldTransactionId:
                payment.transaction_id,

              newTransactionId:
                intent.id,
            }
          );

          await tx.tbl_order_payments.update({
            where: {
              id: payment.id,
            },

            data: {
              transaction_id:
                intent.id,
            },
          });
        }

        /*
         * ========================================================
         * 9.2 PAYMENT → SUCCESS
         * ========================================================
         */

        console.log(
          '[Stripe Webhook] STEP 1: Updating payment → SUCCESS',
          {
            paymentId:
              payment.id.toString(),

            currentStatus:
              payment.status,
          }
        );

        if (payment.status !== 'SUCCESS') {
          await paymentRepository.markPaymentSuccess(
            tx,
            payment.id
          );
        }

        /*
         * ĐỌC LẠI DB để xác nhận.
         */

        const updatedPayment =
          await tx.tbl_order_payments.findUnique({
            where: {
              id: payment.id,
            },
          });

        console.log(
          '[Stripe Webhook] STEP 1 RESULT: Payment after update',
          {
            paymentId:
              payment.id.toString(),

            status:
              updatedPayment?.status ?? null,

            paidAt:
              updatedPayment?.paid_at ?? null,

            transactionId:
              updatedPayment?.transaction_id ?? null,
          }
        );

        /*
         * Nếu DB không thật sự SUCCESS → throw.
         */

        if (
          !updatedPayment ||
          updatedPayment.status !== 'SUCCESS'
        ) {
          throw new Error(
            `Payment ${payment.id.toString()} was not updated to SUCCESS`
          );
        }

        /*
         * ========================================================
         * 9.3 FIND ORDER
         * ========================================================
         */

        console.log(
          '[Stripe Webhook] STEP 2: Loading order',
          {
            orderId:
              payment.order_id.toString(),
          }
        );

        const order =
          await tx.tbl_customer_orders.findUnique({
            where: {
              id: payment.order_id,
            },
          });

        if (!order) {
          throw new Error(
            `Order ${payment.order_id.toString()} not found`
          );
        }

        console.log(
          '[Stripe Webhook] STEP 2 RESULT: Order before update',
          {
            orderId:
              order.id.toString(),

            orderToken:
              order.order_token,

            orderNumber:
              order.order_number,

            currentStatus:
              order.status,

            paidAt:
              order.paid_at,
          }
        );

        /*
         * ========================================================
         * 9.4 ORDER → PAID
         * ========================================================
         */

        console.log(
          '[Stripe Webhook] STEP 3: Updating order → PAID',
          {
            orderId:
              order.id.toString(),

            currentStatus:
              order.status,
          }
        );

        if (order.status !== 'PAID') {
          await orderRepository.markOrderPaid(
            tx,
            order.id
          );
        }

        /*
         * ========================================================
         * 9.5 VERIFY ORDER AFTER UPDATE
         * ========================================================
         */

        const updatedOrder =
          await tx.tbl_customer_orders.findUnique({
            where: {
              id: order.id,
            },
          });

        console.log(
          '[Stripe Webhook] STEP 3 RESULT: Order after update',
          {
            orderId:
              updatedOrder?.id.toString() ??
              null,

            orderToken:
              updatedOrder?.order_token ??
              null,

            status:
              updatedOrder?.status ??
              null,

            paidAt:
              updatedOrder?.paid_at ??
              null,

            updatedAt:
              updatedOrder?.updated_at ??
              null,
          }
        );

        /*
         * Nếu order vẫn WAITING_PAYMENT
         * → chắc chắn có vấn đề ở repository / DB.
         */

        if (
          !updatedOrder ||
          updatedOrder.status !== 'PAID'
        ) {
          throw new Error(
            `Order ${order.id.toString()} was not updated to PAID. Current status: ${updatedOrder?.status ?? 'NOT_FOUND'}`
          );
        }


        /* 
        * ========================================================
        * 9.5.1 CREATE KITCHEN PRINT JOB
        * ========================================================
        */

        console.log(
          '[Stripe Webhook] STEP 3.5: Creating KITCHEN print job',
          {
            orderId: order.id.toString(),
            storeId: order.store_id,
          }
        );

        const printJobResult =
          await printJobRepository.createKitchenJobIfNotExists(
            tx,
            {
              orderId: order.id,
              storeId: order.store_id,
            }
          );

        console.log(
          '[Stripe Webhook] STEP 3.5 RESULT: KITCHEN print job',
          {
            orderId: order.id.toString(),
            created: printJobResult.created,
            printJobId:
              printJobResult.job.id.toString(),
            jobType:
              printJobResult.job.job_type,
            status:
              printJobResult.job.status,
          }
        );

        /*
         * ========================================================
         * 9.6 MARK WEBHOOK PROCESSED
         * ========================================================
         */

        console.log(
          '[Stripe Webhook] STEP 4: Marking webhook processed',
          {
            webhookId:
              webhook.id.toString(),

            eventId:
              event.id,

            paymentId:
              payment.id.toString(),
          }
        );

        await webhookRepository.markProcessed(
          tx,
          webhook.id,
          paymentId
        );

        console.log(
          '[Stripe Webhook] STEP 4 RESULT: webhook processed',
          {
            webhookId:
              webhook.id.toString(),

            eventId:
              event.id,
          }
        );

        /*
         * ========================================================
         * FINAL SUCCESS
         * ========================================================
         */

        console.log(
          '[Stripe Webhook] ===== PAYMENT FLOW COMPLETED =====',
          {
            eventId:
              event.id,

            paymentId:
              payment.id.toString(),

            orderId:
              order.id.toString(),

            paymentStatus:
              updatedPayment.status,

            orderStatus:
              updatedOrder.status,
          }
        );

        return {
          duplicate: false,
          processed: true,
          paymentId:
            payment.id.toString(),
        };
      }

      /*
       * ============================================================
       * 10. PAYMENT FAILED
       * ============================================================
       */

      if (
        event.type ===
        'payment_intent.payment_failed'
      ) {
        console.log(
          '[Stripe Webhook] ===== PAYMENT FAILED =====',
          {
            eventId:
              event.id,

            paymentId:
              payment.id.toString(),

            orderId:
              payment.order_id.toString(),

            paymentIntentId:
              intent.id,
          }
        );

        const failure =
          getStripePaymentFailure(intent);

        /*
         * PAYMENT → FAILED
         */

        await paymentRepository.markPaymentFailed(
          tx,
          payment.id,
          failure
        );

        /*
         * ORDER → PAYMENT_FAILED
         */

        await orderRepository.markOrderPaymentFailed(
          tx,
          payment.order_id
        );

        /*
         * VERIFY PAYMENT
         */

        const updatedPayment =
          await tx.tbl_order_payments.findUnique({
            where: {
              id: payment.id,
            },
          });

        console.log(
          '[Stripe Webhook] Failed payment result',
          {
            paymentId:
              payment.id.toString(),

            status:
              updatedPayment?.status ??
              null,

            failureCode:
              updatedPayment?.failure_code ??
              null,
          }
        );

        /*
         * VERIFY ORDER
         */

        const updatedOrder =
          await tx.tbl_customer_orders.findUnique({
            where: {
              id: payment.order_id,
            },
          });

        console.log(
          '[Stripe Webhook] Failed order result',
          {
            orderId:
              payment.order_id.toString(),

            status:
              updatedOrder?.status ??
              null,
          }
        );

        /*
         * Nếu update DB thất bại → retry webhook.
         */

        if (
          !updatedPayment ||
          updatedPayment.status !== 'FAILED'
        ) {
          throw new Error(
            `Payment ${payment.id.toString()} was not updated to FAILED`
          );
        }

        if (
          !updatedOrder ||
          updatedOrder.status !== 'PAYMENT_FAILED'
        ) {
          throw new Error(
            `Order ${payment.order_id.toString()} was not updated to PAYMENT_FAILED`
          );
        }

        /*
         * WEBHOOK → PROCESSED
         */

        await webhookRepository.markProcessed(
          tx,
          webhook.id,
          paymentId
        );

        console.log(
          '[Stripe Webhook] Payment failed processed successfully',
          {
            eventId:
              event.id,

            paymentId:
              payment.id.toString(),

            orderId:
              payment.order_id.toString(),
          }
        );

        return {
          duplicate: false,
          processed: true,
          paymentId:
            payment.id.toString(),
        };
      }

      /*
       * ============================================================
       * 11. PAYMENT CANCELED
       * ============================================================
       */

      if (
        event.type ===
        'payment_intent.canceled'
      ) {
        console.log(
          '[Stripe Webhook] ===== PAYMENT CANCELED =====',
          {
            eventId:
              event.id,

            paymentId:
              payment.id.toString(),

            orderId:
              payment.order_id.toString(),

            paymentIntentId:
              intent.id,
          }
        );

        /*
         * PAYMENT → CANCELED
         */

        await paymentRepository.markPaymentCanceled(
          tx,
          payment.id
        );

        /*
         * ORDER → CANCELED
         */

        await orderRepository.markOrderCancelled(
          tx,
          payment.order_id
        );

        /*
         * VERIFY PAYMENT
         */

        const updatedPayment =
          await tx.tbl_order_payments.findUnique({
            where: {
              id: payment.id,
            },
          });

        /*
         * VERIFY ORDER
         */

        const updatedOrder =
          await tx.tbl_customer_orders.findUnique({
            where: {
              id: payment.order_id,
            },
          });

        console.log(
          '[Stripe Webhook] Canceled result',
          {
            paymentId:
              payment.id.toString(),

            paymentStatus:
              updatedPayment?.status ??
              null,

            orderId:
              payment.order_id.toString(),

            orderStatus:
              updatedOrder?.status ??
              null,
          }
        );

        /*
         * Nếu update DB thất bại → retry.
         */

        if (
          !updatedPayment ||
          updatedPayment.status !== 'CANCELLED'
        ) {
          throw new Error(
            `Payment ${payment.id.toString()} was not updated to CANCELLED`
          );
        }

        if (!updatedOrder) {
          throw new Error(
            `Order ${payment.order_id.toString()} was not found after cancellation`
          );
        }

        /*
         * WEBHOOK → PROCESSED
         */

        await webhookRepository.markProcessed(
          tx,
          webhook.id,
          paymentId
        );

        console.log(
          '[Stripe Webhook] Payment canceled processed successfully',
          {
            eventId:
              event.id,

            paymentId:
              payment.id.toString(),

            orderId:
              payment.order_id.toString(),
          }
        );

        return {
          duplicate: false,
          processed: true,
          paymentId:
            payment.id.toString(),
        };
      }

      /*
       * ============================================================
       * 12. SHOULD NEVER REACH HERE
       * ============================================================
       */

      throw new Error(
        `Unhandled PaymentIntent event: ${event.type}`
      );
    });
  } catch (error) {
    /*
     * ============================================================
     * 13. DUPLICATE EVENT RACE CONDITION
     * ============================================================
     */

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target =
        error.meta?.target;

      const targetString = Array.isArray(target)
        ? target.join(',')
        : String(target ?? '');

      if (
        targetString.includes('event_id')
      ) {
        console.warn(
          '[Stripe Webhook] Duplicate event detected by database',
          {
            eventId:
              event.id,

            eventType:
              event.type,
          }
        );

        /*
         * Event đã được một request khác xử lý.
         *
         * Trường hợp này coi là duplicate.
         */

        return {
          duplicate: true,
          processed: true,
        };
      }
    }

    /*
     * ============================================================
     * 14. FINAL ERROR
     * ============================================================
     */

    console.error(
      '[Stripe Webhook] Processing failed',
      {
        eventId:
          event.id,

        eventType:
          event.type,

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

    /*
     * QUAN TRỌNG:
     *
     * Phải throw tiếp.
     *
     * Route webhook sẽ trả HTTP 500.
     *
     * Stripe sẽ biết webhook chưa xử lý
     * thành công và có thể retry.
     */

    throw error;
  }
}