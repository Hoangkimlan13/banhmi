import { orderRepository } from '@/repositories/order.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { isLocale, localizePath } from '@/app/i18n';
import './checkout-failure.css';

interface CancelPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    orderToken?: string;
    store?: string;
  }>;
}

const translations = {
  ja: {
    title: 'お支払いは完了しませんでした',
    description: '支払いはキャンセルされました。注文はまだ確定していません。',
    retry: 'もう一度支払う',
    back: '店舗に戻る',
    orderNumber: '注文番号',
    status: '注文状態',
    notFound: '注文が見つかりません。',
    cannotRetry: 'この注文はすでにキャンセルまたは完了しています。',
    statuses: {
      WAITING_PAYMENT: '支払い待ち',
      PAID: '支払い済み',
      CANCELED: 'キャンセル済み',
      COMPLETED: '完了',
      FAILED: '失敗',
    },
  },
  en: {
    title: 'Payment was not completed',
    description: 'The payment was canceled. Your order has not been confirmed yet.',
    retry: 'Try payment again',
    back: 'Back to store',
    orderNumber: 'Order number',
    status: 'Order status',
    notFound: 'Order not found.',
    cannotRetry: 'This order has already been canceled or completed.',
    statuses: {
      WAITING_PAYMENT: 'Waiting for payment',
      PAID: 'Paid',
      CANCELED: 'Canceled',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
    },
  },
  vi: {
    title: 'Thanh toán chưa hoàn tất',
    description: 'Thanh toán đã bị hủy. Đơn hàng vẫn chưa được xác nhận.',
    retry: 'Thanh toán lại',
    back: 'Quay lại cửa hàng',
    orderNumber: 'Mã đơn',
    status: 'Trạng thái đơn hàng',
    notFound: 'Không tìm thấy đơn hàng.',
    cannotRetry: 'Đơn hàng này đã bị hủy hoặc đã hoàn tất.',
    statuses: {
      WAITING_PAYMENT: 'Đang chờ thanh toán',
      PAID: 'Đã thanh toán',
      CANCELED: 'Đã hủy',
      COMPLETED: 'Hoàn tất',
      FAILED: 'Thất bại',
    },
  },
  zh: {
    title: '付款未完成',
    description: '付款已取消，您的订单尚未确认。',
    retry: '再次付款',
    back: '返回门店',
    orderNumber: '订单号',
    status: '订单状态',
    notFound: '找不到订单。',
    cannotRetry: '此订单已取消或已完成，无法再次付款。',
    statuses: {
      WAITING_PAYMENT: '等待付款',
      PAID: '已付款',
      CANCELED: '已取消',
      COMPLETED: '已完成',
      FAILED: '失败',
    },
  },
};

type LocaleKey = keyof typeof translations;

function getTranslation(locale: string) {
  return translations[locale as LocaleKey] ?? translations.en;
}

export default async function CheckoutCancelPage({
  params,
  searchParams,
}: CancelPageProps) {
  const { locale: localeParam } = await params;
  const query = await searchParams;

  const locale = isLocale(localeParam) ? localeParam : 'en';
  const t = getTranslation(locale);

  const orderToken = typeof query.orderToken === 'string' ? query.orderToken : null;
  const storeSlug = typeof query.store === 'string' ? query.store : null;

  const order = orderToken ? await orderRepository.findOrderSummaryByToken(orderToken) : null;
  const payment = order ? await paymentRepository.findLatestPaymentForOrder(order.id) : null;

  const resolvedStoreSlug = storeSlug || order?.tbl_store?.slug || null;

  const orderStatus = order && 'status' in order ? String(order.status) : '';

  const canRetry =
    !!order &&
    orderStatus !== 'PAID' &&
    orderStatus !== 'CANCELED' &&
    orderStatus !== 'COMPLETED';

  const retryLink =
    orderToken && canRetry
      ? localizePath(
          `/checkout?${new URLSearchParams({
            ...(resolvedStoreSlug ? { store: resolvedStoreSlug } : {}),
            orderToken,
          }).toString()}`,
          locale
        )
      : null;

  const backLink = resolvedStoreSlug
    ? localizePath(`/checkout?store=${encodeURIComponent(resolvedStoreSlug)}`, locale)
    : localizePath('/store-select', locale);

  const orderNumber = order && 'order_number' in order && order.order_number != null ? Number(order.order_number) : null;

  // Lấy chuỗi hiển thị trạng thái đã được dịch (mặc định fallback về chuỗi gốc nếu không tìm thấy)
  const localizedStatusText = 
    t.statuses[orderStatus as keyof typeof t.statuses] || orderStatus || t.statuses.WAITING_PAYMENT;

  return (
    <main className="checkout-failure-page">
      <div className="checkout-failure-card">
        
        <div className="failure-icon-wrapper cancel-theme">
          <span className="material-symbols-outlined">error_outline</span>
        </div>

        <h1>{t.title}</h1>
        <p className="failure-description">
          {canRetry ? t.description : t.cannotRetry}
        </p>

        {order ? (
          <div className="checkout-failure-summary">
            <div className="summary-item highlight-order">
              <span>{t.orderNumber}</span>
              <strong>{orderNumber !== null ? orderNumber : '-'}</strong>
            </div>
            <div className="summary-item">
              <span>{t.status}</span>
              <span className="status-badge cancel">
                {localizedStatusText}
              </span>
            </div>
          </div>
        ) : (
          <p className="not-found-text">{t.notFound}</p>
        )}

        <div className="checkout-failure-actions">
          {retryLink && (
            <a className="button button-primary" href={retryLink}>
              <span className="material-symbols-outlined">replay</span>
              {t.retry}
            </a>
          )}
          <a className="button button-ghost" href={backLink}>
            <span className="material-symbols-outlined">storefront</span>
            {t.back}
          </a>
        </div>

      </div>
    </main>
  );
}