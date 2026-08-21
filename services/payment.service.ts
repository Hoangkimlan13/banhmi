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

/**
 * ============================================================
 * CHECKOUT PAYMENT SERVICE
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Prepare order/payment from database.
 * 2. Create or reuse Stripe PaymentIntent.
 * 3. Never call Stripe inside a DB transaction.
 * 4. Use Stripe idempotency to prevent duplicate PaymentIntent.
 * 5. Never mark an order as FAILED merely because a network
 *    request to Stripe failed.
 * 6. Keep payment retry safe.
 *
 * IMPORTANT:
 *
 * Stripe payment confirmation/result is finally trusted from
 * Stripe webhook, NOT only from this API request.
 *
 * Supported customer locales:
 *
 *   ja
 *   vi
 *   en
 *   zh
 *
 * ============================================================
 */


// ============================================================
// TYPES
// ============================================================

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
 * Internal error used when Stripe operation failed but the
 * final Stripe state is unknown.
 *
 * IMPORTANT:
 *
 * This is intentionally NOT treated as "payment failed".
 *
 * Example:
 *
 *   Your server
 *      ↓
 *   Stripe creates PaymentIntent
 *      ↓
 *   network timeout
 *      ↓
 *   server does not receive response
 *
 * In this case Stripe may already have created the PaymentIntent.
 *
 * Therefore:
 *
 *   Payment = keep PENDING
 *   Order   = keep WAITING_PAYMENT
 *
 * Retry will use the same idempotency key.
 */
class StripeOperationUnknownError extends Error {
  readonly code = 'STRIPE_OPERATION_UNKNOWN';

  constructor(message = 'Stripe operation status is unknown.') {
    super(message);
    this.name = 'StripeOperationUnknownError';
  }
}


// ============================================================
// CONSTANTS
// ============================================================

const PAYMENT_INTENT_REUSABLE_STATUSES = new Set<
  Stripe.PaymentIntent.Status
>([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
]);

/**
 * `processing` is not terminal.
 *
 * Do NOT create another PaymentIntent simply because the
 * current PaymentIntent is processing.
 */
const PAYMENT_INTENT_PROCESSING_STATUS =
  'processing' as Stripe.PaymentIntent.Status;


// ============================================================
// BASIC HELPERS
// ============================================================

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber?: unknown }).toNumber === 'function'
  ) {
    return (
      value as {
        toNumber: () => number;
      }
    ).toNumber();
  }

  const numberValue = Number(
    typeof value === 'object' &&
      value !== null &&
      'toString' in value
      ? String(value)
      : value
  );

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}


// ============================================================
// IDEMPOTENCY
// ============================================================

/**
 * One Payment DB record owns exactly one Stripe PaymentIntent.
 *
 * Therefore:
 *
 *   order + payment
 *
 * becomes the idempotency scope.
 *
 * Example:
 *
 * Order #300
 *
 * Payment #10
 *   -> checkout-order-57-payment-10
 *
 * Payment #11
 *   -> checkout-order-57-payment-11
 *
 * This allows retrying Payment #10 safely without creating
 * another Stripe PaymentIntent.
 */
function buildIdempotencyKey(
  context: CheckoutOrderPaymentContext
): string {
  return [
    'checkout',
    'order',
    context.order.id.toString(),
    'payment',
    context.payment.id.toString(),
  ].join('-');
}


// ============================================================
// STRIPE ERROR HELPERS
// ============================================================

function isStripeResourceMissingError(
  error: unknown
): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === 'resource_missing'
  );
}


/**
 * Stripe SDK/network errors can mean:
 *
 *   - request definitely failed
 *   - OR Stripe received the request but the response was lost
 *
 * We intentionally keep the error classification conservative.
 */
function isPotentiallyUnknownStripeState(
  error: unknown
): boolean {
  if (
    error instanceof Stripe.errors.StripeAPIError
  ) {
    return true;
  }

  if (
    error instanceof Stripe.errors.StripeConnectionError
  ) {
    return true;
  }

  if (
    error instanceof Stripe.errors.StripeRateLimitError
  ) {
    return true;
  }

  return false;
}


/**
 * Return a safe server-side error description.
 *
 * Never expose:
 *
 * - client_secret
 * - order_token
 * - full Stripe request details
 * - stack trace
 */
function getSafeStripeErrorMessage(
  error: unknown
): string {
  if (error instanceof Stripe.errors.StripeCardError) {
    return (
      error.message ||
      'Stripe card payment failed.'
    );
  }

  if (
    error instanceof Stripe.errors.StripeInvalidRequestError
  ) {
    return (
      error.message ||
      'Stripe request was invalid.'
    );
  }

  if (
    error instanceof Stripe.errors.StripeAuthenticationError
  ) {
    return 'Stripe authentication failed.';
  }

  if (
    error instanceof Stripe.errors.StripePermissionError
  ) {
    return 'Stripe permission was denied.';
  }

  if (
    error instanceof Stripe.errors.StripeRateLimitError
  ) {
    return 'Stripe rate limit was exceeded.';
  }

  if (
    error instanceof Stripe.errors.StripeConnectionError
  ) {
    return 'Unable to connect to Stripe.';
  }

  if (
    error instanceof Stripe.errors.StripeAPIError
  ) {
    return (
      error.message ||
      'Stripe API error.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown Stripe error.';
}


// ============================================================
// PAYMENT INTENT CREATION
// ============================================================

/**
 * Create a Stripe PaymentIntent.
 *
 * IMPORTANT:
 *
 * This function NEVER runs inside a Prisma transaction.
 *
 * Stripe is an external network service and must not hold a
 * database transaction open while waiting for the network.
 */
async function createPaymentIntent(
  context: CheckoutOrderPaymentContext,
  storeId: number
): Promise<Stripe.PaymentIntent> {
  const amount = Math.round(
    context.order.totalAmount
  );

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(
      `Invalid payment amount: ${amount}`
    );
  }

  const idempotencyKey =
    buildIdempotencyKey(context);

  console.info(
    '[Stripe] Creating PaymentIntent',
    {
      orderId:
        context.order.id.toString(),

      paymentId:
        context.payment.id.toString(),

      amount,

      currency: 'jpy',

      idempotencyKey,
    }
  );

  let paymentIntent: Stripe.PaymentIntent;

  try {
    paymentIntent =
      await stripe.paymentIntents.create(
        {
          amount,

          currency: 'jpy',

          automatic_payment_methods: {
            enabled: true,
          },

          metadata: {
            order_id:
              context.order.id.toString(),

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
          idempotencyKey,
        }
      );
  } catch (error) {
    /**
     * VERY IMPORTANT:
     *
     * Do NOT mark the Payment FAILED here.
     *
     * If this is a network/Stripe API timeout, Stripe may already
     * have processed the request.
     *
     * The same idempotency key will make a retry safe.
     */
    console.error(
      '[Stripe] PaymentIntent creation failed',
      {
        orderId:
          context.order.id.toString(),

        paymentId:
          context.payment.id.toString(),

        error:
          getSafeStripeErrorMessage(error),

        unknownState:
          isPotentiallyUnknownStripeState(
            error
          ),
      }
    );

    throw error;
  }

  if (!paymentIntent.client_secret) {
    /**
     * PaymentIntent exists, but cannot be used by Stripe Elements.
     *
     * Keep DB payment state pending.
     *
     * A retry will use the same idempotency key.
     */
    throw new StripeOperationUnknownError(
      'Stripe PaymentIntent was created without a client secret.'
    );
  }

  /**
   * Persist Stripe PaymentIntent ID + client secret.
   *
   * This is intentionally outside any long-running DB
   * transaction.
   */
  try {
    await paymentRepository.updatePaymentIntent(
      context.payment.id,
      {
        transactionId:
          paymentIntent.id,

        clientSecret:
          paymentIntent.client_secret,
      }
    );
  } catch (error) {
    /**
     * IMPORTANT:
     *
     * Stripe already created the PaymentIntent.
     *
     * DB update failed.
     *
     * Therefore DO NOT create another PaymentIntent.
     *
     * Retry will call Stripe with the SAME idempotency key.
     */
    console.error(
      '[Stripe] PaymentIntent created but DB update failed',
      {
        orderId:
          context.order.id.toString(),

        paymentId:
          context.payment.id.toString(),

        paymentIntentId:
          paymentIntent.id,

        error:
          error instanceof Error
            ? error.message
            : 'Unknown database error',
      }
    );

    throw new StripeOperationUnknownError(
      'PaymentIntent was created but could not be saved.'
    );
  }

  return paymentIntent;
}


// ============================================================
// PAYMENT INTENT STATUS
// ============================================================

/**
 * Determine whether the existing PaymentIntent can be returned
 * to Stripe Elements.
 *
 * Reusable:
 *
 *   requires_payment_method
 *   requires_confirmation
 *   requires_action
 *
 * Processing:
 *
 *   not terminal
 *   do NOT create another PaymentIntent
 *
 * Terminal:
 *
 *   succeeded
 *   canceled
 *
 * These require webhook/state handling rather than blindly
 * creating another intent.
 */
function canReusePaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): boolean {
  if (
    PAYMENT_INTENT_REUSABLE_STATUSES.has(
      paymentIntent.status
    )
  ) {
    return true;
  }

  if (
    paymentIntent.status ===
    PAYMENT_INTENT_PROCESSING_STATUS
  ) {
    return true;
  }

  return false;
}


/**
 * Processing is different from a normal reusable checkout
 * state.
 *
 * We return the PaymentIntent but mark the result internally
 * so the frontend can continue polling/order-status logic.
 */
function isPaymentIntentProcessing(
  paymentIntent: Stripe.PaymentIntent
): boolean {
  return (
    paymentIntent.status ===
    PAYMENT_INTENT_PROCESSING_STATUS
  );
}


// ============================================================
// EXISTING PAYMENT INTENT
// ============================================================

/**
 * Retrieve an existing Stripe PaymentIntent.
 *
 * Returns:
 *
 *   PaymentIntent
 *      -> reusable / processing
 *
 *   null
 *      -> terminal or missing resource
 *
 * Throws:
 *      -> network/API problem where Stripe state is uncertain
 */
async function reuseExistingPaymentIntent(
  context: CheckoutOrderPaymentContext
): Promise<Stripe.PaymentIntent | null> {
  const transactionId =
    context.payment.transactionId;

  if (!transactionId) {
    return null;
  }

  let paymentIntent: Stripe.PaymentIntent;

  try {
    paymentIntent =
      await stripe.paymentIntents.retrieve(
        transactionId
      );
  } catch (error) {
    /**
     * If Stripe explicitly says the resource does not exist,
     * it is safe to create a new Payment record.
     *
     * For all other errors, DO NOT create another PaymentIntent.
     */
    if (
      isStripeResourceMissingError(error)
    ) {
      console.warn(
        '[Stripe] Existing PaymentIntent not found',
        {
          paymentIntentId:
            transactionId,

          orderId:
            context.order.id.toString(),

          paymentId:
            context.payment.id.toString(),
        }
      );

      return null;
    }

    console.error(
      '[Stripe] Failed to retrieve existing PaymentIntent',
      {
        paymentIntentId:
          transactionId,

        orderId:
          context.order.id.toString(),

        paymentId:
          context.payment.id.toString(),

        error:
          getSafeStripeErrorMessage(error),
      }
    );

    throw error;
  }

  /**
   * PaymentIntent must always have a client secret for
   * Stripe Elements.
   */
  if (!paymentIntent.client_secret) {
    throw new StripeOperationUnknownError(
      'Existing PaymentIntent has no client secret.'
    );
  }

  /**
   * Reusable or processing.
   */
  if (
    canReusePaymentIntent(
      paymentIntent
    )
  ) {
    if (
      context.payment.transactionId !==
        paymentIntent.id ||
      context.payment.clientSecret !==
        paymentIntent.client_secret
    ) {
      try {
        await paymentRepository.updatePaymentIntent(
          context.payment.id,
          {
            transactionId:
              paymentIntent.id,

            clientSecret:
              paymentIntent.client_secret,
          }
        );
      } catch (error) {
        console.error(
          '[Stripe] Failed to synchronize PaymentIntent with DB',
          {
            paymentIntentId:
              paymentIntent.id,

            orderId:
              context.order.id.toString(),

            paymentId:
              context.payment.id.toString(),

            error:
              error instanceof Error
                ? error.message
                : 'Unknown database error',
          }
        );

        throw new StripeOperationUnknownError(
          'PaymentIntent exists but could not be synchronized.'
        );
      }
    }

    console.info(
      '[Stripe] Reusing existing PaymentIntent',
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

    return paymentIntent;
  }

  /**
   * Terminal PaymentIntent.
   *
   * Do not reuse:
   *
   * succeeded
   * canceled
   */
  console.info(
    '[Stripe] Existing PaymentIntent is terminal',
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


// ============================================================
// PAYMENT RESPONSE BUILDER
// ============================================================

function buildCheckoutPaymentResult(
  context: CheckoutOrderPaymentContext,
  paymentIntent: Stripe.PaymentIntent,
  paymentId?: bigint
): CheckoutPaymentResult {
  const clientSecret =
    paymentIntent.client_secret ??
    context.payment.clientSecret ??
    '';

  if (!clientSecret) {
    throw new StripeOperationUnknownError(
      'PaymentIntent client secret is unavailable.'
    );
  }

  return {
    success: true,

    clientSecret,

    paymentIntentId:
      paymentIntent.id,

    orderId:
      context.order.id.toString(),

    orderToken:
      context.order.orderToken,

    orderNumber:
      context.order.orderNumber,

    paymentId:
      (
        paymentId ??
        context.payment.id
      ).toString(),

    amount:
      context.order.totalAmount,

    currency:
      context.order.currency,
  };
}


// ============================================================
// CREATE NEW PAYMENT RECORD
// ============================================================

/**
 * Create a new Payment DB record.
 *
 * This transaction is intentionally tiny.
 *
 * No Stripe call is made inside it.
 */
async function createNewPaymentRecord(
  context: CheckoutOrderPaymentContext,
  input: NormalizedCheckoutInput
) {
  return db.$transaction(
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
      ),
    {
      maxWait: 3000,
      timeout: 5000,
    }
  );
}


// ============================================================
// BUILD PAYMENT CONTEXT
// ============================================================

function buildPaymentContext(
  context: CheckoutOrderPaymentContext,
  payment: {
    id: bigint;
    status: string | null;
    transaction_id: string | null;
    client_secret: string | null;
    amount: unknown;
    currency: string | null;
  }
): CheckoutOrderPaymentContext {
  return {
    order: {
      ...context.order,
    },

    payment: {
      id:
        payment.id,

      status:
        payment.status ??
        null,

      transactionId:
        payment.transaction_id ??
        null,

      clientSecret:
        payment.client_secret ??
        null,

      amount:
        toNumber(
          payment.amount
        ),

      currency:
        (
          payment.currency ||
          'JPY'
        ).toLowerCase(),
    },

    shouldCreatePaymentIntent:
      true,

    createdNewPayment:
      true,
  };
}


// ============================================================
// MAIN CHECKOUT FLOW
// ============================================================

/**
 * Initialize Stripe checkout.
 *
 * FINAL ARCHITECTURE:
 *
 * ┌───────────────────────────────┐
 * │ prepareCheckoutPayment()      │
 * │                               │
 * │ DB transactions are short     │
 * └───────────────┬───────────────┘
 *                 │
 *                 ▼
 * ┌───────────────────────────────┐
 * │ Stripe PaymentIntent          │
 * │                               │
 * │ NO DB transaction open        │
 * └───────────────┬───────────────┘
 *                 │
 *                 ▼
 * ┌───────────────────────────────┐
 * │ Stripe Elements               │
 * └───────────────┬───────────────┘
 *                 │
 *                 ▼
 * ┌───────────────────────────────┐
 * │ Stripe Webhook                │
 * │                               │
 * │ PAID is finally confirmed     │
 * └───────────────────────────────┘
 */
export async function initializeStripeCheckout(
  input: NormalizedCheckoutInput
): Promise<CheckoutPaymentResult> {
  console.info(
    '[Checkout] Preparing Stripe checkout',
    {
      storeId:
        input.storeId,

      orderId:
        input.orderId ??
        null,

      hasOrderToken:
        Boolean(
          input.orderToken
        ),

      orderType:
        input.orderType,

      paymentMethod:
        input.paymentMethod,

      itemCount:
        input.items.length,

      locale:
        input.locale,
    }
  );

  /**
   * Fail fast if Stripe environment variables/configuration
   * are missing.
   */
  assertStripeServerConfiguration();

  /**
   * prepareCheckoutPayment() handles:
   *
   * - existing order
   * - new order
   * - short DB transactions
   * - payment DB record
   *
   * It does NOT call Stripe.
   */
  const context =
    await prepareCheckoutPayment(
      input
    );

  if (
    !context.order.orderNumber
  ) {
    throw new Error(
      'Order number was not generated for this order.'
    );
  }

  /**
   * ==========================================================
   * EXISTING PAYMENT INTENT
   * ==========================================================
   */
  if (
    context.payment.transactionId
  ) {
    const existingPaymentIntent =
      await reuseExistingPaymentIntent(
        context
      );

    /**
     * PaymentIntent still usable.
     *
     * No new PaymentIntent.
     * No new Payment DB record.
     */
    if (
      existingPaymentIntent
    ) {
      return buildCheckoutPaymentResult(
        context,
        existingPaymentIntent
      );
    }

    /**
     * Existing PaymentIntent is terminal.
     *
     * Create a NEW payment record for the SAME order.
     *
     * Never create a new order.
     */
    const newPayment =
      await createNewPaymentRecord(
        context,
        input
      );

    const newContext =
      buildPaymentContext(
        context,
        {
          id:
            newPayment.id,

          status:
            newPayment.status ??
            null,

          transaction_id:
            newPayment.transaction_id ??
            null,

          client_secret:
            newPayment.client_secret ??
            null,

          amount:
            newPayment.amount,

          currency:
            newPayment.currency ??
            'JPY',
        }
      );

    try {
      const paymentIntent =
        await createPaymentIntent(
          newContext,
          input.storeId
        );

      return buildCheckoutPaymentResult(
        newContext,
        paymentIntent,
        newPayment.id
      );
    } catch (error) {
      /**
       * IMPORTANT:
       *
       * Do NOT:
       *
       *   markPaymentFailed()
       *   markOrderPaymentFailed()
       *
       * here.
       *
       * Why?
       *
       * Stripe may have created the PaymentIntent even if our
       * HTTP request timed out.
       *
       * The payment record must remain recoverable.
       */
      console.error(
        '[Checkout] New PaymentIntent creation failed',
        {
          orderId:
            context.order.id.toString(),

          paymentId:
            newPayment.id.toString(),

          error:
            getSafeStripeErrorMessage(
              error
            ),
        }
      );

      throw error;
    }
  }


  /**
   * ==========================================================
   * NO PAYMENT INTENT YET
   * ==========================================================
   *
   * Normal case:
   *
   * Order #300
   *   ↓
   * Payment #1
   *   ↓
   * PaymentIntent #1
   */
  try {
    const paymentIntent =
      await createPaymentIntent(
        context,
        input.storeId
      );

    return buildCheckoutPaymentResult(
      context,
      paymentIntent
    );
  } catch (error) {
    /**
     * IMPORTANT:
     *
     * Keep payment/order recoverable.
     *
     * Do not mark them FAILED here.
     *
     * Retry uses:
     *
     * checkout-order-{orderId}-payment-{paymentId}
     *
     * so Stripe will not create a duplicate PaymentIntent.
     */
    console.error(
      '[Checkout] PaymentIntent creation failed',
      {
        orderId:
          context.order.id.toString(),

        paymentId:
          context.payment.id.toString(),

        error:
          getSafeStripeErrorMessage(
            error
          ),
      }
    );

    throw error;
  }
}


// ============================================================
// STRIPE PAYMENT FAILURE INFORMATION
// ============================================================

/**
 * Get the latest payment failure information from a Stripe
 * PaymentIntent.
 *
 * Used by webhook/payment result handling.
 *
 * This function does not mutate the database.
 */
export function getStripePaymentFailure(
  intent: Stripe.PaymentIntent
) {
  return {
    failureCode:
      intent.last_payment_error?.code ??
      null,

    failureMessage:
      intent.last_payment_error?.message ??
      null,
  };
}