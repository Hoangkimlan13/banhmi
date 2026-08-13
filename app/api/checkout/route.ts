import { NextResponse } from 'next/server';

import {
  initializeStripeCheckout,
} from '@/services/payment.service';

import {
  parseCheckoutInput,
  ValidationError,
} from '@/validators/order.schema';

import {
  PaymentConfigurationError,
} from '@/validators/payment.schema';


export async function POST(req: Request) {

  try {

    const body = await req.json();

    // =====================================================
    // 1. NORMALIZE CHECKOUT INPUT
    // =====================================================

    const input =
      parseCheckoutInput(body);


    // =====================================================
    // 2. CLIENT TOTAL - CHỈ LOG
    // =====================================================

    const clientTotal =
      typeof body.totalAmount === 'number'
        ? body.totalAmount
        : typeof body.totalAmount === 'string'
          ? Number(body.totalAmount)
          : null;


    if (
      Number.isFinite(
        clientTotal ?? Number.NaN
      )
    ) {

      console.info(
        '[Checkout] client total received',
        {
          clientTotal,
        }
      );

    }


    // =====================================================
    // 3. INITIALIZE STRIPE CHECKOUT
    // =====================================================

    const result =
      await initializeStripeCheckout(
        input
      );


    // =====================================================
    // 4. RESPONSE
    // =====================================================

    return NextResponse.json({

      success: true,

      orderId:
        result.orderId,

      // Mã bảo mật để đối chiếu DB
      orderToken:
        result.orderToken,

      // 注文番号
      orderNumber:
        result.orderNumber,

      paymentId:
        result.paymentId,

      paymentIntentId:
        result.paymentIntentId,

      clientSecret:
        result.clientSecret,

      amount:
        result.amount,

      currency:
        result.currency,

    });

  } catch (error) {

    const isValidationError =
      error instanceof ValidationError;


    const isPaymentConfigError =
      error instanceof PaymentConfigurationError;


    console.error(
      '[Checkout] failed',
      {
        message:
          error instanceof Error
            ? error.message
            : 'Unknown checkout error',
      }
    );


    return NextResponse.json(
      {
        success: false,

        error: {

          code:
            isValidationError
              ? 'INVALID_CHECKOUT_REQUEST'
              : isPaymentConfigError
                ? 'STRIPE_CONFIG_ERROR'
                : 'CHECKOUT_FAILED',

          message:
            error instanceof Error
              ? error.message
              : 'Unable to process your order.',
        },
      },

      {
        status:
          isValidationError
            ? 400
            : 500,
      }
    );
  }
}