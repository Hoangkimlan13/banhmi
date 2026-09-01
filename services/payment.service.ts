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

// ============================================================
// TYPES
// ============================================================

export interface CheckoutPaymentResult {
  success: true;
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  orderToken: string;
  orderNumber: number;
  paymentId: string;
  amount: number;
  currency: string;
}

/**
 * Internal error when Stripe operation status is unknown.
 * Never treat as payment failed.
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

// FIX: Only these statuses are considered reusable.
const PAYMENT_INTENT_REUSABLE_STATUSES = new Set<Stripe.PaymentIntent.Status>([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
]);

// FIX: Terminal statuses that cannot be reused.
const PAYMENT_INTENT_TERMINAL_STATUSES = new Set<Stripe.PaymentIntent.Status>([
  'succeeded',
  'canceled',
]);

// ============================================================
// HELPERS
// ============================================================

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as any).toNumber === 'function'
  ) {
    return (value as any).toNumber();
  }
  const numberValue = Number(
    typeof value === 'object' && value !== null && 'toString' in value
      ? String(value)
      : value
  );
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function buildIdempotencyKey(context: CheckoutOrderPaymentContext): string {
  return `checkout-order-${context.order.id}-payment-${context.payment.id}`;
}

function isStripeResourceMissingError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === 'resource_missing'
  );
}

function isPotentiallyUnknownStripeState(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeAPIError ||
    error instanceof Stripe.errors.StripeConnectionError ||
    error instanceof Stripe.errors.StripeRateLimitError
  );
}

function getSafeStripeErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeCardError) return error.message || 'Stripe card payment failed.';
  if (error instanceof Stripe.errors.StripeInvalidRequestError)
    return error.message || 'Stripe request was invalid.';
  if (error instanceof Stripe.errors.StripeAuthenticationError) return 'Stripe authentication failed.';
  if (error instanceof Stripe.errors.StripePermissionError) return 'Stripe permission was denied.';
  if (error instanceof Stripe.errors.StripeRateLimitError) return 'Stripe rate limit was exceeded.';
  if (error instanceof Stripe.errors.StripeConnectionError) return 'Unable to connect to Stripe.';
  if (error instanceof Stripe.errors.StripeAPIError) return error.message || 'Stripe API error.';
  if (error instanceof Error) return error.message;
  return 'Unknown Stripe error.';
}

// ============================================================
// CREATE/REUSE PAYMENT INTENT
// ============================================================

async function createPaymentIntent(
  context: CheckoutOrderPaymentContext,
  storeId: number
): Promise<Stripe.PaymentIntent> {
  const amount = Math.round(context.order.totalAmount);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(`Invalid payment amount: ${amount}`);
  }

  // FIX: Ensure payment record is still PENDING before creating PaymentIntent
  if (context.payment.status !== 'PENDING') {
    throw new StripeOperationUnknownError(
      `Payment status is ${context.payment.status}, not PENDING. Cannot create PaymentIntent.`
    );
  }

  const idempotencyKey = buildIdempotencyKey(context);

  console.info('[Stripe] Creating PaymentIntent', {
    orderId: context.order.id.toString(),
    paymentId: context.payment.id.toString(),
    amount,
    currency: 'jpy',
    idempotencyKey,
  });

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'jpy',
        automatic_payment_methods: { enabled: true },
        metadata: {
          order_id: context.order.id.toString(),
          order_number: String(context.order.orderNumber),
          payment_id: context.payment.id.toString(),
          store_id: String(storeId),
        },
      },
      { idempotencyKey }
    );
  } catch (error) {
    // FIX: Treat network/timeout errors as unknown state.
    if (isPotentiallyUnknownStripeState(error)) {
      console.error('[Stripe] PaymentIntent creation failed (unknown state)', {
        orderId: context.order.id.toString(),
        paymentId: context.payment.id.toString(),
        error: getSafeStripeErrorMessage(error),
      });
      throw new StripeOperationUnknownError(
        'Stripe request failed but state may be inconsistent. Please retry with same idempotency key.'
      );
    }
    console.error('[Stripe] PaymentIntent creation failed', {
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
      error: getSafeStripeErrorMessage(error),
    });
    throw error;
  }

  if (!paymentIntent.client_secret) {
    throw new StripeOperationUnknownError('Stripe PaymentIntent was created without a client secret.');
  }

  // Update DB outside transaction (safe)
  try {
    await paymentRepository.updatePaymentIntent(context.payment.id, {
      transactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('[Stripe] PaymentIntent created but DB update failed', {
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
      paymentIntentId: paymentIntent.id,
      error: error instanceof Error ? error.message : 'Unknown database error',
    });
    throw new StripeOperationUnknownError('PaymentIntent was created but could not be saved.');
  }

  return paymentIntent;
}

// ============================================================
// REUSE EXISTING PAYMENT INTENT
// ============================================================

async function reuseExistingPaymentIntent(
  context: CheckoutOrderPaymentContext
): Promise<Stripe.PaymentIntent | null> {
  const transactionId = context.payment.transactionId;
  if (!transactionId) return null;

  // FIX: Check if payment is still PENDING
  if (context.payment.status !== 'PENDING') {
    console.warn('[Stripe] Cannot reuse PaymentIntent: payment status not PENDING', {
      paymentId: context.payment.id.toString(),
      status: context.payment.status,
    });
    return null;
  }

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
  } catch (error) {
    if (isStripeResourceMissingError(error)) {
      console.warn('[Stripe] Existing PaymentIntent not found', {
        paymentIntentId: transactionId,
        orderId: context.order.id.toString(),
        paymentId: context.payment.id.toString(),
      });
      return null;
    }
    console.error('[Stripe] Failed to retrieve existing PaymentIntent', {
      paymentIntentId: transactionId,
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
      error: getSafeStripeErrorMessage(error),
    });
    throw error;
  }

  if (!paymentIntent.client_secret) {
    throw new StripeOperationUnknownError('Existing PaymentIntent has no client secret.');
  }

  // FIX: Check amount match
  const expectedAmount = Math.round(context.order.totalAmount);
  if (paymentIntent.amount !== expectedAmount) {
    console.warn('[Stripe] PaymentIntent amount mismatch', {
      paymentIntentId: paymentIntent.id,
      stripeAmount: paymentIntent.amount,
      expectedAmount,
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
    });
    return null;
  }

  // FIX: Check currency match (assuming JPY)
  if (paymentIntent.currency !== 'jpy') {
    console.warn('[Stripe] PaymentIntent currency mismatch', {
      paymentIntentId: paymentIntent.id,
      stripeCurrency: paymentIntent.currency,
      expectedCurrency: 'jpy',
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
    });
    return null;
  }

  // FIX: Only reuse if status is in reusable set
  if (PAYMENT_INTENT_REUSABLE_STATUSES.has(paymentIntent.status)) {
    // Update DB if needed
    if (
      context.payment.transactionId !== paymentIntent.id ||
      context.payment.clientSecret !== paymentIntent.client_secret
    ) {
      try {
        await paymentRepository.updatePaymentIntent(context.payment.id, {
          transactionId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error) {
        console.error('[Stripe] Failed to synchronize PaymentIntent with DB', {
          paymentIntentId: paymentIntent.id,
          orderId: context.order.id.toString(),
          paymentId: context.payment.id.toString(),
          error: error instanceof Error ? error.message : 'Unknown database error',
        });
        throw new StripeOperationUnknownError('PaymentIntent exists but could not be synchronized.');
      }
    }

    console.info('[Stripe] Reusing existing PaymentIntent', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
    });
    return paymentIntent;
  }

  // FIX: Terminal statuses or other statuses are not reusable
  if (PAYMENT_INTENT_TERMINAL_STATUSES.has(paymentIntent.status)) {
    console.info('[Stripe] Existing PaymentIntent is terminal', {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
    });
    return null;
  }

  // FIX: Unknown status -> treat as not reusable to be safe
  console.warn('[Stripe] Existing PaymentIntent has unknown/unexpected status', {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    orderId: context.order.id.toString(),
    paymentId: context.payment.id.toString(),
  });
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
  const clientSecret = paymentIntent.client_secret ?? context.payment.clientSecret ?? '';
  if (!clientSecret) {
    throw new StripeOperationUnknownError('PaymentIntent client secret is unavailable.');
  }
  return {
    success: true,
    clientSecret,
    paymentIntentId: paymentIntent.id,
    orderId: context.order.id.toString(),
    orderToken: context.order.orderToken,
    orderNumber: context.order.orderNumber,
    paymentId: (paymentId ?? context.payment.id).toString(),
    amount: context.order.totalAmount,
    currency: context.order.currency,
  };
}

// ============================================================
// MAIN CHECKOUT FLOW
// ============================================================

export async function initializeStripeCheckout(
  input: NormalizedCheckoutInput
): Promise<CheckoutPaymentResult> {
  console.info('[Checkout] Preparing Stripe checkout', {
    storeId: input.storeId,
    orderId: input.orderId ?? null,
    hasOrderToken: Boolean(input.orderToken),
    orderType: input.orderType,
    paymentMethod: input.paymentMethod,
    itemCount: input.items.length,
    locale: input.locale,
  });

  assertStripeServerConfiguration();

  // 1. Prepare order/payment (no Stripe)
  const context = await prepareCheckoutPayment(input);
  if (!context.order.orderNumber) {
    throw new Error('Order number was not generated for this order.');
  }

  // FIX: Ensure payment is PENDING before proceeding
  if (context.payment.status !== 'PENDING') {
    throw new StripeOperationUnknownError(
      `Payment status is ${context.payment.status}, not PENDING. Cannot proceed with checkout.`
    );
  }

  // 2. Check existing PaymentIntent
  if (context.payment.transactionId) {
    const existingPaymentIntent = await reuseExistingPaymentIntent(context);
    if (existingPaymentIntent) {
      return buildCheckoutPaymentResult(context, existingPaymentIntent);
    }

    // Terminal PaymentIntent or cannot reuse: create new payment record
    const newPayment = await db.$transaction(
      (tx) =>
        paymentRepository.createPendingPayment(tx, {
          orderId: context.order.id,
          amount: new Prisma.Decimal(context.order.totalAmount),
          currency: context.order.currency || 'JPY',
          paymentMethod: input.paymentMethod,
        }),
      {
        maxWait: 2000,
        timeout: 5000,
        isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel,
      }
    );

    const newContext = {
      ...context,
      payment: {
        id: newPayment.id,
        status: newPayment.status ?? null,
        transactionId: newPayment.transaction_id ?? null,
        clientSecret: newPayment.client_secret ?? null,
        amount: toNumber(newPayment.amount),
        currency: (newPayment.currency ?? 'JPY').toLowerCase(),
      },
      shouldCreatePaymentIntent: true,
      createdNewPayment: true,
    };

    try {
      const paymentIntent = await createPaymentIntent(newContext, input.storeId);
      return buildCheckoutPaymentResult(newContext, paymentIntent, newPayment.id);
    } catch (error) {
      // FIX: If error is StripeOperationUnknownError, we should not create another PaymentIntent.
      if (error instanceof StripeOperationUnknownError) {
        console.error('[Checkout] Stripe operation unknown, payment remains PENDING', {
          orderId: context.order.id.toString(),
          paymentId: newPayment.id.toString(),
          error: error.message,
        });
        throw error;
      }
      console.error('[Checkout] New PaymentIntent creation failed', {
        orderId: context.order.id.toString(),
        paymentId: newPayment.id.toString(),
        error: getSafeStripeErrorMessage(error),
      });
      throw error;
    }
  }

  // 3. No PaymentIntent yet: create new
  try {
    const paymentIntent = await createPaymentIntent(context, input.storeId);
    return buildCheckoutPaymentResult(context, paymentIntent);
  } catch (error) {
    if (error instanceof StripeOperationUnknownError) {
      console.error('[Checkout] Stripe operation unknown, payment remains PENDING', {
        orderId: context.order.id.toString(),
        paymentId: context.payment.id.toString(),
        error: error.message,
      });
      throw error;
    }
    console.error('[Checkout] PaymentIntent creation failed', {
      orderId: context.order.id.toString(),
      paymentId: context.payment.id.toString(),
      error: getSafeStripeErrorMessage(error),
    });
    throw error;
  }
}

// ============================================================
// PAYMENT FAILURE HELPERS
// ============================================================

export function getStripePaymentFailure(intent: Stripe.PaymentIntent) {
  return {
    failureCode: intent.last_payment_error?.code ?? null,
    failureMessage: intent.last_payment_error?.message ?? null,
  };
}