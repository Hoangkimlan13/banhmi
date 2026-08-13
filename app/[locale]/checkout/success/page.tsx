import { isLocale, localizePath } from '@/app/i18n';
import { orderRepository } from '@/repositories/order.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import SaveOrderHistory from './SaveOrderHistory';
import OrderStatusChecker from './OrderStatusChecker';
import './checkout-success.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    orderToken?: string;
    store?: string;
  }>;
}

const translations = {
  ja: {
    title: 'ご注文ありがとうございます',
    subtitle: 'お支払いが無事に完了いたしました。ただいまお料理をご準備しておりますので、呼び出し番号が表示されるまでお待ちください。', 
    processing: '決済を確認中です...',
    processingSub: '決済システムからの完了通知を待っています。しばらくこのままお待ちいただくか、お急ぎの場合はもう一度お支払いをお試しください。',
    orderNumberLabel: '呼び出し番号', 
    store: 'ご利用店舗',
    total: 'お支払い金額',
    status: '現在のステータス', 
    customerName: 'お受取人名', 
    customerPhone: 'ご連絡先電話番号',
    orderType: '受取方法', 
    scheduledFor: '受取予定日時',
    orderTypes: {
      IMMEDIATE: '今すぐ受取', 
      SCHEDULED_TIME: '日時指定受取', 
    },
    backToStore: '注文履歴へ戻る',
    refresh: 'ステータスを更新する',
    retryPayment: 'もう一度お支払いへ進む',
    notFound: '指定された注文情報が見つかりませんでした。',
    hospitalityNote: 'まもなく調理・ご準備いたします。出来立てをどうぞお楽しみに。', 
    statuses: {
      WAITING_PAYMENT: '支払い確認中',
      PAID: 'お支払い完了',
      CANCELED: 'キャンセル済み',
      COMPLETED: '受取完了',
      FAILED: '決済失敗',
    },
  },
  en: {
    title: 'Thank you for your order!',
    subtitle: 'Payment completed successfully. Our kitchen is preparing your meal. Please wait for your order number to be called.', 
    processing: 'Confirming your payment...',
    processingSub: 'Waiting for authorization from the payment gateway. Please wait, or retry if it takes too long.',
    orderNumberLabel: 'Order Number',
    store: 'Store Location',
    total: 'Total Amount',
    status: 'Order Status',
    customerName: 'Customer Name',
    customerPhone: 'Phone Number',
    orderType: 'Pickup Option', 
    scheduledFor: 'Scheduled Pickup Time',
    orderTypes: {
      IMMEDIATE: 'ASAP Pickup', 
      SCHEDULED_TIME: 'Schedule for Later',
    },
    backToStore: 'Back to Order History',
    refresh: 'Refresh Status',
    retryPayment: 'Retry Payment',
    notFound: 'Order details could not be found.',
    hospitalityNote: 'Your meal will be ready shortly. Thank you for waiting!',
    statuses: {
      WAITING_PAYMENT: 'Awaiting payment',
      PAID: 'Paid & Confirming',
      CANCELED: 'Canceled',
      COMPLETED: 'Picked up', 
      FAILED: 'Payment failed',
    },
  },
  vi: {
    title: 'Cảm ơn quý khách đã đặt món!',
    subtitle: 'Thanh toán thành công. Nhà bếp đang chuẩn bị món ăn cho bạn, vui lòng đợi gọi số thứ tự tại quầy.', 
    processing: 'Đang xác thực thanh toán...',
    processingSub: 'Đang chờ phản hồi từ cổng thanh toán. Vui lòng giữ nguyên màn hình hoặc thử lại nếu quá thời gian.',
    orderNumberLabel: 'Số thứ tự nhận món', 
    store: 'Cửa hàng nhận',
    total: 'Tổng tiền thanh toán',
    status: 'Trạng thái đơn hàng',
    customerName: 'Tên người nhận',
    customerPhone: 'Số điện thoại',
    orderType: 'Hình thức nhận món', 
    scheduledFor: 'Thời gian hẹn lấy',
    orderTypes: {
      IMMEDIATE: 'Lấy ngay ', 
      SCHEDULED_TIME: 'Hẹn giờ nhận', 
    },
    backToStore: 'Quay lại lịch sử đơn hàng',
    refresh: 'Cập nhật trạng thái',
    retryPayment: 'Thử lại thanh toán',
    notFound: 'Không tìm thấy thông tin đơn hàng này.',
    hospitalityNote: 'Món ăn của bạn sẽ sớm hoàn thành. Chúc bạn ngon miệng!',
    statuses: {
      WAITING_PAYMENT: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      CANCELED: 'Đã hủy đơn',
      COMPLETED: 'Đã nhận món', // Tinh chỉnh: Khách đã đến lấy hàng xong
      FAILED: 'Thanh toán thất bại',
    },
  },
  zh: {
    title: '感谢您的光临与点餐！', 
    subtitle: '支付已成功。后厨正在为您精心准备餐点，请凭取餐号在柜台耐心等待。',
    processing: '正在确认付款状态...',
    processingSub: '正在等待支付系统的确认通知，请稍候。如等待时间过长，您可以选择重新尝试支付。',
    orderNumberLabel: '取餐号', 
    store: '就餐门店',
    total: '实付金额', 
    status: '订单状态',
    customerName: '取餐人姓名',
    customerPhone: '联系电话',
    orderType: '取餐方式', 
    scheduledFor: '预约取餐时间',
    orderTypes: {
      IMMEDIATE: '立即取餐 (ASAP)', 
      SCHEDULED_TIME: '预约取餐', 
    },
    backToStore: '返回订单历史',
    refresh: '刷新订单状态',
    retryPayment: '重新支付',
    notFound: '未找到相关订单信息。',
    hospitalityNote: '餐点稍后即好，祝您用餐愉快！', 
    statuses: {
      WAITING_PAYMENT: '等待付款',
      PAID: '已接单 / 已付款', 
      CANCELED: '订单已取消',
      COMPLETED: '已取餐', 
      FAILED: '支付失败',
    },
  },
};

type LocaleKey = keyof typeof translations;

function getTranslation(locale: string) {
  return translations[locale as LocaleKey] ?? translations.en;
}

function formatDateTime(dateInput: any, locale: string) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  // Định dạng theo chuẩn Nhật Bản: YYYY/MM/DD HH:mm
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/\//g, '/');
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { locale: localeParam } = await params;
  const query = await searchParams;

  const locale = isLocale(localeParam) ? localeParam : 'en';
  const t = getTranslation(locale);

  const orderToken =
    typeof query.orderToken === 'string' && query.orderToken.length > 0
      ? query.orderToken
      : null;

  const storeSlug = typeof query.store === 'string' ? query.store : null;

  const order = orderToken
    ? await orderRepository.findOrderSummaryByToken(orderToken)
    : null;

  const payment = order
    ? await paymentRepository.findLatestPaymentForOrder(order.id)
    : null;

  const orderStatus =
    order && 'status' in order && order.status != null
      ? String(order.status)
      : '';

  const paymentStatus =
    payment && 'status' in payment && payment.status != null
      ? String(payment.status)
      : '';

  const isPaid =
    orderStatus === 'PAID' &&
    paymentStatus === 'SUCCESS';

  const resolvedStoreSlug = storeSlug || order?.tbl_store?.slug || null;

  const backLink = resolvedStoreSlug
    ? localizePath(`/order-history?store=${encodeURIComponent(resolvedStoreSlug)}`, locale)
    : localizePath('/store-select', locale);

  const checkoutLink = resolvedStoreSlug
    ? localizePath(`/checkout?store=${encodeURIComponent(resolvedStoreSlug)}${orderToken ? `&orderToken=${encodeURIComponent(orderToken)}` : ''}`, locale)
    : backLink;

  const refreshLink = orderToken
    ? localizePath(
        `/checkout/success?orderToken=${encodeURIComponent(orderToken)}${
          resolvedStoreSlug ? `&store=${encodeURIComponent(resolvedStoreSlug)}` : ''
        }`,
        locale
      )
    : backLink;

  const orderNumber = order && 'order_number' in order && order.order_number != null ? Number(order.order_number) : null;

  const localizedStatusText =
    t.statuses[orderStatus as keyof typeof t.statuses] || orderStatus || t.statuses.WAITING_PAYMENT;

  // Lấy các thông tin bổ sung từ order object (nếu có trong DB model)
  const customerName = order && 'customer_name' in order ? order.customer_name : null;
  const customerPhone = order && 'customer_phone' in order ? order.customer_phone : null;
  const orderType = order && 'order_type' in order ? String(order.order_type || 'IMMEDIATE') : 'IMMEDIATE';
  const scheduledFor = order && 'scheduled_for' in order ? order.scheduled_for : null;
  

  const localizedOrderType = t.orderTypes[orderType as keyof typeof t.orderTypes] || orderType;

  return (
    <>
      <OrderStatusChecker isPaid={isPaid} orderToken={orderToken} />

      <main className="checkout-success-page">
        <div className={`checkout-success-card ${isPaid ? 'is-success' : 'is-processing'}`}>
          
          <div className="success-icon-wrapper">
            <span className="material-symbols-outlined">
              {isPaid ? 'check_circle' : 'hourglass_top'}
            </span>
          </div>

          <h1>{isPaid ? t.title : t.processing}</h1>
          <p className="success-subtitle">{isPaid ? t.subtitle : t.processingSub}</p>

          {isPaid && order && orderToken && orderNumber !== null ? (
            <>
              <SaveOrderHistory
                orderToken={orderToken}
                orderNumber={orderNumber}
                orderId={order.id.toString()}
                storeId={order.tbl_store?.id ?? null}
                storeName={order.tbl_store?.title ?? null}
                totalAmount={Number(order.total_amount || 0)}
                currency={String(order.currency || 'JPY')}
              />

              <div className="order-number-badge-box">
                <span className="order-number-title">{t.orderNumberLabel}</span>
                <div className="order-number-value">#{orderNumber}</div>
              </div>

              <div className="checkout-success-summary">
                <div className="summary-item">
                  <span>{t.store}</span>
                  <strong>{order.tbl_store?.title || '-'}</strong>
                </div>

                {/* Hiển thị tên khách hàng nếu có */}
                {customerName && (
                  <div className="summary-item">
                    <span>{t.customerName}</span>
                    <strong>{customerName}</strong>
                  </div>
                )}

                {/* Hiển thị số điện thoại nếu có */}
                {customerPhone && (
                  <div className="summary-item">
                    <span>{t.customerPhone}</span>
                    <strong>{customerPhone}</strong>
                  </div>
                )}

                {/* Hình thức đơn hàng (Lấy ngay / Đặt lịch) */}
                <div className="summary-item">
                  <span>{t.orderType}</span>
                  <strong>{localizedOrderType}</strong>
                </div>

                {/* Thời gian nhận hàng nếu là đặt lịch (SCHEDULED_TIME) */}
                {orderType === 'SCHEDULED_TIME' && scheduledFor && (
                  <div className="summary-item">
                    <span>{t.scheduledFor}</span>
                    <strong>{formatDateTime(scheduledFor, locale)}</strong>
                  </div>
                )}

                <div className="summary-item">
                  <span>{t.total}</span>
                  <strong>
                    {Number(order.total_amount || 0).toLocaleString()}{' '}
                    {String(order.currency || 'JPY')}
                  </strong>
                </div>
                <div className="summary-item">
                  <span>{t.status}</span>
                  <span className="status-badge paid">{localizedStatusText}</span>
                </div>
              </div>

              <div className="hospitality-message">
                <span className="material-symbols-outlined">restaurant</span>
                <p>{t.hospitalityNote}</p>
              </div>
            </>
          ) : (
            <div className="checkout-success-summary">
              {order ? (
                <>
                  <div className="summary-item">
                    <span>{t.status}</span>
                    <span className="status-badge pending">
                      {localizedStatusText}
                    </span>
                  </div>
                </>
              ) : (
                <p className="not-found-text">{t.notFound}</p>
              )}
            </div>
          )}

          <div className="checkout-success-actions">
            {isPaid ? (
              <a className="button button-primary" href={backLink}>
                {t.backToStore}
              </a>
            ) : (
              <>
                <a className="button button-primary" href={checkoutLink}>
                  <span className="material-symbols-outlined">payment</span>
                  {t.retryPayment}
                </a>
                <a className="button button-ghost" href={refreshLink}>
                  <span className="material-symbols-outlined">refresh</span>
                  {t.refresh}
                </a>
              </>
            )}
          </div>

        </div>
      </main>
    </>
  );
}