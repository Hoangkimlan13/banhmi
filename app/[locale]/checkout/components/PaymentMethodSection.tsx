'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import StripePaymentForm from './StripePaymentForm';
import './payment-method.css';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface PaymentMethodSectionProps {
  clientSecret: string | null;
  successUrl: string;
  failureUrl: string;
  locale?: string;
}

const translations = {
  ja: {
    title: 'お支払い方法',
    loading: '決済フォームを準備しています...',
    missingKey: 'Stripeの公開設定が見つかりません。',
    secureTitle: '安全な決済',
    secureDescription: 'Stripeによって安全に処理されます',
  },
  vi: {
    title: 'Phương thức thanh toán',
    loading: 'Đang chuẩn bị biểu mẫu thanh toán...',
    missingKey: 'Thiếu cấu hình Stripe công khai.',
    secureTitle: 'Thanh toán an toàn',
    secureDescription: 'Được xử lý an toàn bởi Stripe',
  },
  en: {
    title: 'Payment Method',
    loading: 'Preparing the payment form...',
    missingKey: 'Stripe publishable key is not configured.',
    secureTitle: 'Secure payment',
    secureDescription: 'Processed securely by Stripe',
  },
  zh: {
    title: '支付方式',
    loading: '正在准备支付表单...',
    missingKey: '未配置 Stripe 公钥。',
    secureTitle: '安全支付',
    secureDescription: '由 Stripe 安全处理',
  },
  ko: {
    title: '결제 방법',
    loading: '결제 양식을 준비 중입니다...',
    missingKey: 'Stripe 공개 키가 설정되지 않았습니다.',
    secureTitle: '안전한 결제',
    secureDescription: 'Stripe를 통해 안전하게 처리됩니다',
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

function getStripeLocale(locale?: string) {
  const normalized = normalizeLocale(locale);
  switch (normalized) {
    case 'ja': return 'ja';
    case 'vi': return 'vi';
    case 'zh': return 'zh';
    case 'ko': return 'ko';
    case 'en':
    default: return 'en';
  }
}

export default function PaymentMethodSection({
  clientSecret,
  successUrl,
  failureUrl,
  locale = 'ja',
}: PaymentMethodSectionProps) {
  const normalizedLocale = normalizeLocale(locale);
  const stripeLocale = getStripeLocale(normalizedLocale);
  const t = translations[normalizedLocale];

  return (
    <section id="checkout-payment-method" className="payment-method-card">
      <div className="payment-method-header">
        <div className="payment-header-icon-wrapper">
          <span className="material-symbols-outlined">payments</span>
        </div>
        <h3>{t.title}</h3>
      </div>

      {!publishableKey ? (
        <div className="payment-method-error" role="alert">
          {t.missingKey}
        </div>
      ) : !clientSecret ? (
        <div className="payment-method-loading" role="status" aria-live="polite">
          {t.loading}
        </div>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            locale: stripeLocale,
            appearance: {
              theme: 'stripe',
            },
          }}
        >
          <StripePaymentForm
            onSuccessRedirectUrl={successUrl}
            onFailureRedirectUrl={failureUrl}
            locale={normalizedLocale}
          />
        </Elements>
      )}

      <div className="payment-method-secure">
        <span className="material-symbols-outlined">lock</span>
        <div>
          <strong>{t.secureTitle}</strong>
          <span>{t.secureDescription}</span>
        </div>
      </div>
    </section>
  );
}