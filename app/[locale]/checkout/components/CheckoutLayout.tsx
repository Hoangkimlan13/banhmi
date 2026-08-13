'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { type Locale } from '@/app/i18n';
import './checkout-layout.css';

interface CheckoutLayoutProps {
  children: ReactNode;
  summary: ReactNode;
  footer: ReactNode;
  locale?: Locale;
  title?: string;
  subtitle?: string;
}

const layoutSubtitles: Record<Locale, { subtitle: string }> = {
  ja: { subtitle: 'お受取り情報の入力と安全な決済を行ってください' },
  en: { subtitle: 'Complete your pickup details and secure checkout' },
  vi: { subtitle: 'Hoàn tất thông tin nhận món và thanh toán bảo mật' },
  zh: { subtitle: '请完成取餐信息填写与安全支付' },
};

export default function CheckoutLayout({
  children,
  summary,
  footer,
  locale = 'ja',
  title,
  subtitle,
}: CheckoutLayoutProps) {
  const displaySubtitle = subtitle || layoutSubtitles[locale].subtitle;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="checkout-layout-wrapper"
    >
      <div className="checkout-layout-container">
        <div className="checkout-header-block">
          {title && <h1 className="checkout-main-title">{title}</h1>}
          <p className="checkout-main-subtitle">{displaySubtitle}</p>
        </div>

        <div className="checkout-grid">
          <div className="checkout-content-area">{children}</div>
          <div className="checkout-summary-area">{summary}</div>
        </div>
      </div>

      <div className="checkout-mobile-footer">{footer}</div>
    </motion.div>
  );
}