import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { orderRepository } from '@/repositories/order.repository';
import { paymentRepository } from '@/repositories/payment.repository';

import {
  CheckoutOrderPaymentContext,
  prepareCheckoutPayment,
} from '@/services/order.service';

import { NormalizedCheckoutInput } from '@/validators/order.schema';
import { assertStripeServerConfiguration } from '@/validators/payment.schema';


export interface CheckoutPaymentResult {
  success: true;

  clientSecret: string;
  paymentIntentId: string;

  orderId: string;
  orderToken: string;

  // 注文番号
  orderNumber: number;

  paymentId: string;

  amount: number;
  currency: string;
}


/**
 * Mỗi payment record có đúng 1 PaymentIntent chính.
 *
 * Vì vậy idempotency key phải phụ thuộc vào:
 *
 *   order + payment
 *
 * Khi thanh toán lại:
 *
 *   Order #300
 *      Payment #2 -> PaymentIntent cũ
 *      Payment #3 -> PaymentIntent mới
 *
 * Order không bị tạo lại.
 */
function buildIdempotencyKey(
  context: CheckoutOrderPaymentContext
) {
  return `checkout-order-${context.order.id.toString()}-payment-${context.payment.id.toString()}`;
}


/**
 * Tạo PaymentIntent mới trên Stripe.
 *
 * Hàm này được sử dụng:
 *
 * 1. Lần thanh toán đầu tiên.
 * 2. Thanh toán lại sau khi PaymentIntent cũ
 *    đã chuyển sang terminal state.
 */
async function createPaymentIntent(
  context: CheckoutOrderPaymentContext,
  storeId: number
) {
  const paymentIntent =
    await stripe.paymentIntents.create(
      {
        amount: Math.round(
          context.order.totalAmount
        ),

        currency: 'jpy',

        automatic_payment_methods: {
          enabled: true,
        },

        metadata: {
          order_id:
            context.order.id.toString(),

          order_token:
            context.order.orderToken,

          // 注文番号
          order_number:
            String(
              context.order.orderNumber
            ),

          payment_id:
            context.payment.id.toString(),

          store_id:
            String(storeId),
        },
      },
      {
        idempotencyKey:
          buildIdempotencyKey(context),
      }
    );


  if (!paymentIntent.client_secret) {
    throw new Error(
      'Stripe PaymentIntent is missing a client secret'
    );
  }


  await paymentRepository.updatePaymentIntent(
    context.payment.id,
    {
      transactionId:
        paymentIntent.id,

      clientSecret:
        paymentIntent.client_secret,
    }
  );


  return paymentIntent;
}


/**
 * Kiểm tra PaymentIntent hiện tại có thể tiếp tục
 * được dùng với Stripe Elements hay không.
 *
 * PaymentIntent terminal không được reuse.
 */
function canReusePaymentIntent(
  paymentIntent: Stripe.PaymentIntent
) {
  return (
    paymentIntent.status ===
      'requires_payment_method' ||
    paymentIntent.status ===
      'requires_confirmation' ||
    paymentIntent.status ===
      'requires_action'
  );
}


/**
 * Lấy PaymentIntent cũ.
 *
 * Nếu PaymentIntent còn usable:
 *
 *   -> trả về PaymentIntent cũ
 *
 * Nếu PaymentIntent đã terminal:
 *
 *   -> trả null
 *
 * Khi trả null, initializeStripeCheckout()
 * sẽ tạo PaymentIntent mới.
 */
async function reuseExistingPaymentIntent(
  context: CheckoutOrderPaymentContext
) {
  if (!context.payment.transactionId) {
    return null;
  }


  const paymentIntent =
    await stripe.paymentIntents.retrieve(
      context.payment.transactionId
    );


  if (
    !paymentIntent.client_secret
  ) {
    throw new Error(
      'Existing Stripe PaymentIntent is missing a client secret'
    );
  }


  if (
    !canReusePaymentIntent(
      paymentIntent
    )
  ) {
    console.info(
      '[Stripe] Existing PaymentIntent is terminal. A new PaymentIntent is required.',
      {
        paymentIntentId:
          paymentIntent.id,

        status:
          paymentIntent.status,

        orderId:
          context.order.id.toString(),

        paymentId:
          context.payment.id.toString(),
      }
    );

    return null;
  }


  if (
    context.payment.clientSecret !==
    paymentIntent.client_secret
  ) {
    await paymentRepository.updatePaymentIntent(
      context.payment.id,
      {
        transactionId:
          paymentIntent.id,

        clientSecret:
          paymentIntent.client_secret,
      }
    );
  }


  return paymentIntent;
}


/**
 * Khởi tạo checkout/payment.
 *
 * Quy tắc:
 *
 * =====================================================
 *
 * ORDER MỚI
 *
 *   Order #300
 *      ↓
 *   Payment #1
 *      ↓
 *   PaymentIntent #1
 *
 *
 * =====================================================
 *
 * THANH TOÁN THẤT BẠI
 *
 *   Order #300
 *      ↓
 *   Payment #1
 *      ↓
 *   PaymentIntent #1 = terminal
 *
 *
 * =====================================================
 *
 * THANH TOÁN LẠI
 *
 *   Order #300
 *      ↓
 *   Payment #2
 *      ↓
 *   PaymentIntent #2
 *
 *
 * KHÔNG tạo Order #301.
 */
export async function initializeStripeCheckout(
  input: NormalizedCheckoutInput
): Promise<CheckoutPaymentResult> {
   console.log('[Checkout] normalized input', {
    storeId: input.storeId,
    orderId: input.orderId ?? null,
    orderToken: input.orderToken ?? null,
    orderType: input.orderType,
    paymentMethod: input.paymentMethod,
    itemCount: input.items.length,
  });
  
  assertStripeServerConfiguration();


  const context =
    await prepareCheckoutPayment(
      input
    );


  if (!context.order.orderNumber) {
    throw new Error(
      'Order number was not generated for this order.'
    );
  }


  /**
   * Nếu payment hiện tại có PaymentIntent,
   * thử kiểm tra xem PaymentIntent đó còn dùng được không.
   */
  if (
    context.payment.transactionId
  ) {
    const paymentIntent =
      await reuseExistingPaymentIntent(
        context
      );


    /**
     * PaymentIntent còn dùng được.
     *
     * -> Không tạo PaymentIntent mới.
     */
    if (paymentIntent) {
      return {
        success: true,

        clientSecret:
          paymentIntent.client_secret ??
          context.payment.clientSecret ??
          '',

        paymentIntentId:
          paymentIntent.id,

        orderId:
          context.order.id.toString(),

        orderToken:
          context.order.orderToken,

        orderNumber:
          context.order.orderNumber,

        paymentId:
          context.payment.id.toString(),

        amount:
          context.order.totalAmount,

        currency:
          context.order.currency,
      };
    }


    /**
     * Nếu chạy tới đây:
     *
     * PaymentIntent cũ đã terminal.
     *
     * Nhưng context.payment hiện tại vẫn đang
     * giữ transactionId cũ.
     *
     * Không được tạo PaymentIntent mới trên
     * cùng payment record nếu payment record
     * đó đã đại diện cho transaction cũ.
     *
     * Vì vậy cần tạo payment record mới cho
     * cùng Order.
     */
    const newPayment =
      await db.$transaction(
        (tx) =>
          paymentRepository.createPendingPayment(
            tx,
            {
              orderId:
                context.order.id,

              amount:
                new Prisma.Decimal(
                  context.order.totalAmount
                ),

              currency:
                context.order.currency ||
                'JPY',

              paymentMethod:
                input.paymentMethod,
            }
          )
      );


    /**
     * Tạo context mới cho Payment record mới.
     */
    const newContext: CheckoutOrderPaymentContext =
      {
        order: {
          ...context.order,
        },

        payment: {
          id:
            newPayment.id,

          status:
            newPayment.status ||
            null,

          transactionId:
            newPayment.transaction_id ||
            null,

          clientSecret:
            newPayment.client_secret ||
            null,

          amount:
            Number(
              newPayment.amount
            ),

          currency:
            (
              newPayment.currency ||
              'JPY'
            ).toLowerCase(),
        },

        shouldCreatePaymentIntent:
          true,

        createdNewPayment:
          true,
      };


    try {
      const newPaymentIntent =
        await createPaymentIntent(
          newContext,
          input.storeId
        );


      return {
        success: true,

        // SỬA TẠI ĐÂY: Thêm toán tử fallback `?? ''` để xử lý kiểu `string | null`
        clientSecret:
          newPaymentIntent.client_secret ?? '',

        paymentIntentId:
          newPaymentIntent.id,

        orderId:
          context.order.id.toString(),

        orderToken:
          context.order.orderToken,

        orderNumber:
          context.order.orderNumber,

        paymentId:
          newPayment.id.toString(),

        amount:
          context.order.totalAmount,

        currency:
          context.order.currency,
      };
    } catch (error) {
      await db.$transaction(
        async (tx) => {
          await paymentRepository.markPaymentFailed(
            tx,
            newPayment.id,
            {
              failureMessage:
                error instanceof Error
                  ? error.message
                  : 'PaymentIntent creation failed',
            }
          );

          await orderRepository.markOrderPaymentFailed(
            tx,
            context.order.id
          );
        }
      );

      throw error;
    }
  }


  /**
   * Không có PaymentIntent.
   *
   * Đây là trường hợp bình thường:
   *
   * Order mới
   * hoặc Payment record mới.
   */
  try {
    const paymentIntent =
      await createPaymentIntent(
        context,
        input.storeId
      );


    return {
      success: true,

      clientSecret:
        paymentIntent.client_secret ?? '',

      paymentIntentId:
        paymentIntent.id,

      orderId:
        context.order.id.toString(),

      orderToken:
        context.order.orderToken,

      orderNumber:
        context.order.orderNumber,

      paymentId:
        context.payment.id.toString(),

      amount:
        context.order.totalAmount,

      currency:
        context.order.currency,
    };
  } catch (error) {
    await db.$transaction(
      async (tx) => {
        await paymentRepository.markPaymentFailed(
          tx,
          context.payment.id,
          {
            failureMessage:
              error instanceof Error
                ? error.message
                : 'PaymentIntent creation failed',
          }
        );


        await orderRepository.markOrderPaymentFailed(
          tx,
          context.order.id
        );
      }
    );


    throw error;
  }
}


/**
 * Lấy thông tin lỗi cuối cùng của Stripe PaymentIntent.
 */
export function getStripePaymentFailure(
  intent: Stripe.PaymentIntent
) {
  return {
    failureCode:
      intent.last_payment_error?.code ||
      null,

    failureMessage:
      intent.last_payment_error?.message ||
      null,
  };
}