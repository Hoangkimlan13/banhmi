'use client';

import { useState, type FormEvent } from 'react';
import {
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  onSuccessRedirectUrl: string;
  onFailureRedirectUrl: string;
  locale?: string;
}

const translations = {
  ja: {
    walletTitle: 'ウォレット決済',
    paymentDetails: 'お支払い方法',
    pay: '支払う',
    processing: '決済処理中...',
    loading: '決済フォームを準備しています...',
    notReady: '決済フォームの読み込みがまだ完了していません。',
    genericError: '決済を完了できませんでした。',
    paymentSuccess: '決済が完了しました。',
  },
  vi: {
    walletTitle: 'Thanh toán ví',
    paymentDetails: 'Phương thức thanh toán',
    pay: 'Thanh toán',
    processing: 'Đang xử lý thanh toán...',
    loading: 'Đang chuẩn bị biểu mẫu thanh toán...',
    notReady: 'Biểu mẫu thanh toán chưa sẵn sàng.',
    genericError: 'Không thể hoàn tất thanh toán.',
    paymentSuccess: 'Thanh toán thành công.',
  },
  en: {
    walletTitle: 'Wallet checkout',
    paymentDetails: 'Payment methods',
    pay: 'Pay',
    processing: 'Processing payment...',
    loading: 'Preparing payment form...',
    notReady: 'Payment form is not ready yet.',
    genericError: 'Payment could not be completed.',
    paymentSuccess: 'Payment successful.',
  },
  zh: {
    walletTitle: '钱包支付',
    paymentDetails: '支付方式',
    pay: '支付',
    processing: '正在处理支付...',
    loading: '正在准备支付表单...',
    notReady: '支付表单尚未准备好。',
    genericError: '无法完成支付。',
    paymentSuccess: '支付成功。',
  },
  ko: {
    walletTitle: '간편 결제',
    paymentDetails: '결제 방법',
    pay: '결제',
    processing: '결제 처리 중...',
    loading: '결제 양식을 준비하고 있습니다...',
    notReady: '결제 양식을 아직 사용할 수 없습니다.',
    genericError: '결제를 완료할 수 없습니다.',
    paymentSuccess: '결제가 완료되었습니다.',
  },
};

type LocaleKey = keyof typeof translations;

function normalizeLocale(locale?: string): LocaleKey {
  if (
    locale === 'ja' ||
    locale === 'vi' ||
    locale === 'en' ||
    locale === 'zh' ||
    locale === 'ko'
  ) {
    return locale;
  }

  return 'en';
}

export default function StripePaymentForm({
  onSuccessRedirectUrl,
  locale = 'en',
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const normalizedLocale = normalizeLocale(locale);
  const t = translations[normalizedLocale];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const redirectToSuccess = () => {
    const url = new URL(
      onSuccessRedirectUrl,
      window.location.origin
    );

    window.location.assign(url.toString());
  };

  const confirmPayment = async () => {
    if (isSubmitting) {
      return;
    }

    if (!stripe) {
      console.error('[Stripe] stripe is not ready');
      setMessage(t.notReady);
      return;
    }

    if (!elements) {
      console.error('[Stripe] elements is not ready');
      setMessage(t.notReady);
      return;
    }

    if (!isElementReady) {
      console.error('[Stripe] PaymentElement is not ready');
      setMessage(t.notReady);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      /*
       * Validate the PaymentElement before confirmation.
       *
       * This is useful because it can reveal client-side
       * validation problems before confirmPayment().
       */
      const { error: submitError } = await elements.submit();

      if (submitError) {
        console.error('[Stripe] elements.submit() failed', {
          type: submitError.type,
          code: submitError.code,
          decline_code: submitError.decline_code,
          message: submitError.message,
          param: submitError.param,
        });

        setMessage(
          submitError.message || t.genericError
        );

        return;
      }

      console.log('[Stripe] confirming payment...');

      const result = await stripe.confirmPayment({
        elements,

        confirmParams: {
          return_url: new URL(
            onSuccessRedirectUrl,
            window.location.origin
          ).toString(),
        },

        /*
         * Card payments normally complete without redirect.
         * 3DS / other redirect-based methods can still redirect.
         */
        redirect: 'if_required',
      });

      const error = result.error;

      if (error) {
        /*
         * DO NOT use:
         *
         * console.error(error)
         *
         * because StripeError may appear as {}
         * in the browser console.
         */
        console.error('[Stripe] Payment failed', {
          type: error.type,
          code: error.code,
          decline_code: error.decline_code,
          message: error.message,
          param: error.param,
          payment_intent: error.payment_intent,
          payment_method: error.payment_method,
        });

        console.error(
          '[Stripe] Payment error JSON:',
          JSON.stringify(
            {
              type: error.type,
              code: error.code,
              decline_code: error.decline_code,
              message: error.message,
              param: error.param,
            },
            null,
            2
          )
        );

        setMessage(
          error.message || t.genericError
        );

        return;
      }

      /*
       * With redirect: 'if_required':
       *
       * - normal card payment:
       *   confirmPayment() returns here after success
       *
       * - 3DS / redirect payment:
       *   Stripe handles the redirect
       *
       * Therefore, if no error is returned,
       * we can go to our success page.
       */
      console.log('[Stripe] Payment confirmed successfully');

      redirectToSuccess();
    } catch (error) {
      console.error('[Stripe] Payment confirmation exception', {
        error,
      });

      if (error instanceof Error) {
        console.error('[Stripe] exception message:', error.message);
        console.error('[Stripe] exception stack:', error.stack);
      }

      setMessage(t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await confirmPayment();
  };

  const handleExpressConfirm = async () => {
    await confirmPayment();
  };

  return (
    <div className="stripe-payment-form">

      {/* =========================================
          APPLE PAY / GOOGLE PAY
      ========================================== */}
      <section
        className="stripe-express-checkout"
        aria-label={t.walletTitle}
      >
        <h3 className="stripe-payment-section-title">
          {t.walletTitle}
        </h3>

        <ExpressCheckoutElement
          onConfirm={handleExpressConfirm}
          options={{
            buttonHeight: 48,
            layout: {
              maxColumns: 2,
              maxRows: 2,
              overflow: 'auto',
            },
          }}
        />
      </section>

      {/* =========================================
          CARD / OTHER PAYMENT METHODS
      ========================================== */}
      <form onSubmit={handleSubmit}>
        <h3 className="stripe-payment-section-title">
          {t.paymentDetails}
        </h3>

        <div className="stripe-payment-element">
          <PaymentElement
            onReady={() => {
              console.log('[Stripe] PaymentElement ready');
              setIsElementReady(true);
            }}
            onLoadError={(event) => {
              console.error(
                '[Stripe] PaymentElement load error',
                {
                  error: event.error,
                }
              );

              setMessage(
                event.error?.message ||
                  t.genericError
              );
            }}
            options={{
              layout: {
                type: 'accordion',
                defaultCollapsed: true,
              },
            }}
          />
        </div>

        {!isElementReady && (
          <div
            className="stripe-payment-loading"
            role="status"
            aria-live="polite"
          >
            {t.loading}
          </div>
        )}

        {message && (
          <div
            className="stripe-payment-error"
            role="alert"
            aria-live="assertive"
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          className="stripe-payment-button"
          disabled={
            !stripe ||
            !elements ||
            !isElementReady ||
            isSubmitting
          }
        >
          {isSubmitting
            ? t.processing
            : t.pay}
        </button>
      </form>
    </div>
  );
}
