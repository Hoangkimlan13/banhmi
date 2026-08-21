import { NextResponse } from 'next/server';

import {
  initializeStripeCheckout,
} from '@/services/payment.service';

import {
  parseCheckoutInput,
  ValidationError,
} from '@/validators/order.schema';

import {
  SupportedLocale,
  normalizeLocale,
  getErrorCode,
  getItem,
  getDetails,
  getLocalizedErrorMessage,
  getHttpStatus,
} from '@/lib/checkout-error.handler';


// ============================================================
// POST /api/checkout
// ============================================================

export async function POST(
  req: Request
) {

  /**
   * Nếu request chưa parse được locale,
   * fallback về tiếng Nhật.
   */
  let locale: SupportedLocale = 'ja';


  try {

    // ========================================================
    // 1. READ REQUEST
    // ========================================================

    const body =
      await req.json();


    // ========================================================
    // 2. VALIDATE / NORMALIZE
    // ========================================================

    const input =
      parseCheckoutInput(body);

    locale =
      normalizeLocale(
        input.locale
      );


    // ========================================================
    // 3. CLIENT TOTAL
    // ========================================================

    /**
     * TUYỆT ĐỐI KHÔNG DÙNG clientTotal
     * để tạo PaymentIntent.
     *
     * Server phải tự tính giá từ DB.
     */
    const clientTotal =
      typeof body.totalAmount === 'number'
        ? body.totalAmount
        : typeof body.totalAmount === 'string'
          ? Number(body.totalAmount)
          : null;


    if (
      clientTotal !== null &&
      Number.isFinite(clientTotal)
    ) {

      console.info(
        '[Checkout] client total received',
        {
          clientTotal,
          serverWillRecalculate: true,
        }
      );
    }


    // ========================================================
    // 4. CREATE / PREPARE STRIPE PAYMENT
    // ========================================================

    const result =
      await initializeStripeCheckout(
        input
      );


    // ========================================================
    // 5. SUCCESS
    // ========================================================

    return NextResponse.json(
      {
        success: true,

        orderId:
          result.orderId,

        /**
         * Security token.
         *
         * Không log token.
         */
        orderToken:
          result.orderToken,

        /**
         * 注文番号
         */
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
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store',
        },
      }
    );

  } catch (error) {

    // ========================================================
    // 6. ERROR CLASSIFICATION
    // ========================================================

    const errorCode =
      getErrorCode(error);

    const item =
      getItem(error);

    const details =
      getDetails(error);


    // ========================================================
    // 7. SERVER LOG
    // ========================================================

    /**
     * Server log có thể chứa technical error.
     *
     * Customer KHÔNG nhận error.message trực tiếp.
     */
    console.error(
      '[Checkout] failed',
      {
        code:
          errorCode,

        locale,

        error:
          error instanceof Error
            ? error.message
            : 'Unknown checkout error',

        stack:
          process.env.NODE_ENV === 'development' &&
          error instanceof Error
            ? error.stack
            : undefined,

        /**
         * Trả về menuItemId nếu có,
         * frontend sẽ dùng để tra cứu tên từ giỏ hàng.
         */
        item,

        details,
      }
    );


    // ========================================================
    // 8. LOCALIZED CUSTOMER MESSAGE
    // ========================================================

    /**
     * Nếu errorCode = ITEM_UNAVAILABLE và item?.menuItemId có giá trị
     * nhưng item?.name = null, thì frontend sẽ dùng menuItemId
     * để tìm tên trong giỏ hàng và hiển thị.
     *
     * Backend không có tên vì không tìm thấy trong DB.
     */
    const message =
      getLocalizedErrorMessage(
        errorCode,
        locale,
        item?.name ?? null,
        details
      );


    // ========================================================
    // 9. RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        success: false,

        error: {
          code:
            errorCode,

          message,

          /**
           * Frontend dùng để:
           *
           * - highlight product
           * - scroll tới product
           * - hiển thị tên product (tra cứu từ cart)
           */
          item,

          /**
           * Frontend dùng để:
           *
           * - highlight option group
           * - hiển thị tên group
           */
          details,
        },
      },
      {
        status:
          getHttpStatus(error),

        headers: {
          'Cache-Control':
            'no-store',
        },
      }
    );
  }
}