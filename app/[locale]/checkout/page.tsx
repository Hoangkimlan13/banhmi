'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import './checkout.css';
import OrderHeader from '../order/OrderHeader';
import CheckoutLayout from './components/CheckoutLayout';
import PickupSection from './components/PickupSection';
import CustomerInfoSection from './components/CustomerInfoSection';
import PaymentMethodSection from './components/PaymentMethodSection';
import OrderSummarySection from './components/OrderSummarySection';
import CheckoutFooter from './components/CheckoutFooter';
import { getStoreInfoBySlug } from '@/app/web/actions/menu.action';
import {
  getSelectedStore,
  saveSelectedStore,
} from '@/app/web/store/selected-store';
import { getInitialCart } from '@/lib/cartStorage';
import { type Locale, isLocale } from '@/app/i18n';

interface Props {
  params: Promise<{ locale: string }>;
}

interface CheckoutStoreInfo {
  id: number;
  title?: string;
  type?: string;
  slug?: string | null;
  name?: string;
  locationName?: string | null;
  address?: string | null;
  openTime?: string | Date | null;
  closeTime?: string | Date | null;
}

interface CheckoutCartItem {
  totalPrice?: number | string;
  menuItemId?: number | string;
  name?: string;
  foodNameSnapshot?: string;
  [key: string]: unknown;
}

const translations = {
  ja: {
    title: 'お支払い手続き',
    subtitle: 'お受取り情報の入力と安全な決済を行ってください',
  },
  vi: {
    title: 'Thanh toán đơn hàng',
    subtitle: 'Hoàn tất thông tin nhận món và thanh toán bảo mật',
  },
  zh: {
    title: '订单结算',
    subtitle: '请完成取餐信息填写与安全支付',
  },
  ko: {
    title: '결제',
    subtitle: '픽업 정보와 안전한 결제를 완료하세요',
  },
  en: {
    title: 'Checkout',
    subtitle: 'Complete your pickup details and secure payment',
  },
};



// ============================================================
// HÀM DỊCH LỖI CỤ THỂ
// ============================================================

function getLocalizedItemUnavailableMessage(
  locale: Locale,
  itemName: string | null
): string {
  switch (locale) {
    case 'ja':
      return itemName
        ? `「${itemName}」は現在ご注文いただけません。`
        : '選択した商品は現在ご注文いただけません。';
    case 'vi':
      return itemName
        ? `Món “${itemName}” hiện không thể đặt.`
        : 'Sản phẩm bạn chọn hiện không thể đặt.';
    case 'en':
      return itemName
        ? `“${itemName}” is currently unavailable.`
        : 'The selected product is currently unavailable.';
    case 'zh':
      return itemName
        ? `「${itemName}」目前无法订购。`
        : '您选择的商品目前无法订购。';
    default:
      return 'The selected product is currently unavailable.';
  }
}


// Thêm Record<Locale, string> hoặc bổ sung đầy đủ các key của hệ thống i18n
const systemNotificationLabels: Record<string, string> = {
  ja: 'システム通知',
  en: 'System Notification',
  zh: '系统通知',
  vi: 'Thông báo hệ thống',
  ko: '시스템 알림' 
};




function createOrderToken() {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export default function CheckoutPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale: localeParam } = use(params);
  const storeSlugParam = searchParams.get('store');

  /*
  ============================================================
  LOCALE & STORE
  ============================================================
  */
  const locale: Locale = isLocale(localeParam) ? localeParam : 'ja';
  const [storeId, setStoreId] = useState<number | null>(null);
  const [storeInfo, setStoreInfo] = useState<CheckoutStoreInfo | null>(null);
  const [cart, setCart] = useState<CheckoutCartItem[]>([]);

  /*
  ============================================================
  PICKUP & CUSTOMER
  ============================================================
  */
  const [orderType, setOrderType] = useState<'IMMEDIATE' | 'SCHEDULED_TIME'>(
    'IMMEDIATE'
  );
  const [scheduledTime, setScheduledTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const isValidJapanesePhone = (value: string) => {
    const clean = value.replace(/[-ー\s]/g, '');
    return /^0[1-9][0-9]{8,9}$/.test(clean);
  };

  /*
  ============================================================
  PAYMENT & TOKEN
  ============================================================
  */
  const paymentMethod = 'stripe';
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [orderToken] = useState(() => {
    const queryOrderToken = searchParams.get('orderToken');
    if (queryOrderToken && /^[a-f0-9]{64}$/i.test(queryOrderToken)) {
      return queryOrderToken;
    }
    return createOrderToken();
  });

  useEffect(() => {
    setCart(getInitialCart() as CheckoutCartItem[]);
  }, []);

  useEffect(() => {
    let slug = storeSlugParam;
    if (!slug) {
      const saved = getSelectedStore();
      if (saved?.slug) {
        slug = saved.slug;
        router.replace(`/${locale}/checkout?store=${encodeURIComponent(slug)}`);
        return;
      }
      router.replace(`/${locale}/store-select`);
      return;
    }

    getStoreInfoBySlug(slug).then((info) => {
      if (info) {
        setStoreId(info.id);
        setStoreInfo(info);
        saveSelectedStore({
          id: info.id,
          title: info.title,
          type: info.type,
          slug: info.slug || slug,
        });
      } else {
        router.replace(`/${locale}/store-select`);
      }
    });
  }, [storeSlugParam, locale, router]);

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    [cart]
  );

  const currentSlug = storeSlugParam || storeInfo?.slug || '';

  /*
  ============================================================
  FORM VALIDATION
  ============================================================
  */
  const isFormValid = useMemo(() => {
    if (cart.length === 0 || storeId === null) return false;

    if (orderType === 'IMMEDIATE') {
      if (phone.trim() !== '' && !isValidJapanesePhone(phone)) {
        return false;
      }
      return true;
    } else {
      return (
        name.trim() !== '' &&
        isValidJapanesePhone(phone) &&
        scheduledTime.trim() !== ''
      );
    }
  }, [cart.length, storeId, orderType, name, phone, scheduledTime]);

  /*
  ============================================================
  HANDLER: Bấm / Tự động tạo clientSecret
  ============================================================
  */
  const handlePaymentSubmit = async () => {
    if (!isFormValid || loading) return;
    if (clientSecret) return;

    setLoading(true);
    setInitError(null);

    try {
      const payload = {
        storeId,
        locale,
        orderType,
        scheduledTime, 
        customer: orderType === 'IMMEDIATE'
          ? null
          : {
              name: name.trim(),
              phone: phone.trim(),
            },
        paymentMethod,
        items: cart,
        orderToken,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (
        res.ok &&
        typeof data?.clientSecret === 'string' &&
        data.clientSecret.length > 0
      ) {
        setClientSecret(data.clientSecret);
        return;
      }

      // Xử lý lỗi (giữ nguyên)
      if (data?.error) {
        const { code, item } = data.error;
        if (code === 'ITEM_UNAVAILABLE' && item?.menuItemId) {
          const cartItem = cart.find(
            (ci) => Number(ci.menuItemId) === Number(item.menuItemId)
          );
          const itemName = cartItem?.name || cartItem?.foodNameSnapshot || null;
          const message = getLocalizedItemUnavailableMessage(locale, itemName);
          setInitError(message);
          console.log('[Checkout] ITEM_UNAVAILABLE:', { item, cartItem, message });
        } else {
          setInitError(data.error.message || 'Unable to initialize payment.');
        }
      } else {
        setInitError('Unable to initialize payment.');
      }
    } catch (error) {
      console.error('[Checkout] initialization error', error);
      setInitError(
        error instanceof Error
          ? error.message
          : 'Unable to initialize payment.'
      );
    } finally {
      setLoading(false);
    }
  };

  const t = translations[locale] || translations.ja;

  return (
    <>
      <OrderHeader locale={locale} storeInfo={storeInfo} />

      <CheckoutLayout
        locale={locale}
        title={t.title}
        subtitle={t.subtitle}
        summary={
          <OrderSummarySection
            cart={cart}
            total={total}
            locale={locale}
          />
        }
        footer={
          <CheckoutFooter
            total={total}
            locale={locale}
          >
            <OrderSummarySection
              cart={cart}
              total={total}
              locale={locale}
            />
          </CheckoutFooter>
        }
      >
        {storeInfo && (
          <div className="checkout-store-card">
            <div className="store-card-left">
              <div className="store-card-icon-wrapper">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <div className="store-card-badge-dot" />
            </div>

            <div className="store-card-info">
              <div className="store-card-header-meta">
                <span className="store-card-tag">
                  {locale === 'ja'
                    ? 'お受取り店舗'
                    : locale === 'vi'
                      ? 'Cửa hàng nhận món'
                      : locale === 'zh'
                        ? '取货门店'
                        : 'Pickup Store'}
                </span>

                {storeInfo.locationName && (
                  <span className="store-card-location-sub">
                    {storeInfo.locationName}
                  </span>
                )}
              </div>

              <h3 className="store-card-title">{storeInfo.name}</h3>

              <div className="store-card-details">
                {storeInfo.address && (
                  <div className="store-card-detail-item">
                    <span className="material-symbols-outlined">
                      location_on
                    </span>
                    <span className="store-card-text">{storeInfo.address}</span>
                  </div>
                )}

                {(storeInfo.openTime || storeInfo.closeTime) && (
                  <div className="store-card-detail-item">
                    <span className="material-symbols-outlined">schedule</span>
                    <span className="store-card-text">
                      {locale === 'ja'
                        ? '営業時間: '
                        : locale === 'vi'
                          ? 'Giờ mở cửa: '
                          : locale === 'zh'
                            ? '营业时间: '
                            : 'Hours: '}

                      {storeInfo.openTime
                        ? new Date(storeInfo.openTime)
                            .toISOString()
                            .substring(11, 16)
                        : '--:--'}

                      {' — '}

                      {storeInfo.closeTime
                        ? new Date(storeInfo.closeTime)
                            .toISOString()
                            .substring(11, 16)
                        : '--:--'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ① 受取方法 */}
        <PickupSection
          orderType={orderType}
          setOrderType={setOrderType}
          scheduledTime={scheduledTime}
          setScheduledTime={setScheduledTime}
          storeInfo={
            storeInfo
              ? {
                  openTime: storeInfo.openTime ?? undefined,
                  closeTime: storeInfo.closeTime ?? undefined,
                }
              : undefined
          }
          locale={locale}
        />

        {/* ② お客様情報 */}
        <CustomerInfoSection
          orderType={orderType}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          locale={locale}
        />

        {/* ③ ERROR BANNER */}
        {initError && (
          <div className="error-banner animate-fade-in">
            <div className="error-banner__icon">
              {/* Sửa lại URL xmlns chuẩn của W3C */}
              <svg xmlns="http://w3.org" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.289 4.5-2.599 4.5H4.645c-2.31 0-3.753-2.5-2.599-4.5L9.401 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="error-banner__content">
              {/* Tự động dịch tiêu đề, nếu lỗi hoặc trống sẽ fallback về tiếng Nhật 'ja' */}
              <h4 className="error-banner__title">
                {systemNotificationLabels[locale as string] || systemNotificationLabels['ja']}
              </h4>
              <p className="error-banner__message">{initError}</p>
            </div>
            
            <button onClick={() => setInitError(null)} className="error-banner__close" aria-label="Close error">
              {/* Sửa lại URL xmlns chuẩn của W3C */}
              <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}




        {/* ③ お支払い方法 */}
        {!clientSecret ? (
          <div className="payment-method-card" style={{ padding: '24px', textAlign: 'center' }}>
            <div className="payment-method-header" style={{ justifyContent: 'center', marginBottom: '16px' }}>
              <div className="payment-header-icon-wrapper">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <h3>
                {locale === 'ja'
                  ? 'お支払い手続きへ進む'
                  : locale === 'vi'
                    ? 'Tiến hành thanh toán'
                    : locale === 'zh'
                      ? '前往支付结算'
                      : 'Proceed to Payment'}
              </h3>
            </div>

            <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
              {locale === 'ja'
                ? 'ボタンを押すと注文が確定され、決済画面へ進みます。'
                : locale === 'vi'
                  ? 'Nhấn nút bên dưới để khởi tạo đơn hàng và chuyển đến trang thanh toán.'
                  : locale === 'zh'
                    ? '点击下方按钮确认订单并前往支付页面。'
                    : 'Click the button below to initialize your order and proceed to payment.'}
            </p>

            <button
              type="button"
              onClick={handlePaymentSubmit}
              disabled={loading || !isFormValid}
              style={{
                background: isFormValid ? '#000' : '#ccc',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: isFormValid ? 'pointer' : 'not-allowed',
                width: '100%',
                fontSize: '16px'
              }}
            >
              {loading
                ? (locale === 'ja'
                    ? '処理中...'
                    : locale === 'vi'
                      ? 'Đang xử lý...'
                      : locale === 'zh'
                        ? '处理中...'
                        : 'Processing...')
                : (locale === 'ja'
                    ? '決済に進む'
                    : locale === 'vi'
                      ? 'Tiến hành thanh toán'
                      : locale === 'zh'
                        ? '前往支付'
                        : 'Proceed to Payment')}
            </button>
          </div>
        ) : (
          <PaymentMethodSection
            clientSecret={clientSecret}
            successUrl={`/${locale}/checkout/success?orderToken=${encodeURIComponent(
              orderToken
            )}&store=${encodeURIComponent(currentSlug)}`}
            failureUrl={`/${locale}/checkout/failure?orderToken=${encodeURIComponent(
              orderToken
            )}&store=${encodeURIComponent(currentSlug)}`}
            locale={locale}
          />
        )}
      </CheckoutLayout>
    </>
  );
}