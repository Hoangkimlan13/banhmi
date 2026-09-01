'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import OrderHeader from '../order/OrderHeader';
import OrderCard from './OrderCard';
import OrderModal from './OrderModal';
import ClearOrderHistoryButton from './ClearOrderHistoryButton';

import { getStoreInfoBySlug } from '@/app/web/actions/menu.action';

import {
  DisplayOrder,
  Order,
  StoredOrder,
  Locale,
} from './types';

import './order-history.css';

const translations: Record<Locale, any> = {
  ja: {
    title: '注文履歴',
    loading: '注文履歴を読み込んでいます…',
    empty: '過去のご注文履歴はありません。',
    goHome: 'メニューへ戻って注文する',
    order: '呼び出し番号',
    total: '合計金額',
    note: 'ご要望・メモ',
    noImage: '画像なし',
    paid: 'お支払い完了',
    waitingPayment: '支払い確認中',
    cancelled: 'キャンセル済み',
    preparing: '調理中',
    completed: '受取完了',
    unknownStatus: 'ステータス',
    allTime: '全期間',
    allMonths: 'すべての月',
    yearLabel: '年',
    monthLabel: '月',
    immediate: '今すぐ受取',
    scheduled: '日時指定受取',
    scheduledFor: '受取予定日時',
    customerLabel: 'お受取人名',
  },

  en: {
    title: 'Order History',
    loading: 'Loading your order history…',
    empty: 'You have no recent orders.',
    goHome: 'Back to Menu to Order',
    order: 'Order Number',
    total: 'Total',
    note: 'Special Instructions',
    noImage: 'No image',
    paid: 'Paid',
    waitingPayment: 'Awaiting payment',
    cancelled: 'Canceled',
    preparing: 'Preparing in Kitchen',
    completed: 'Picked up',
    unknownStatus: 'Status',
    allTime: 'All time',
    allMonths: 'All months',
    yearLabel: 'Year',
    monthLabel: 'Month',
    immediate: 'ASAP Pickup',
    scheduled: 'Schedule for Later',
    scheduledFor: 'Scheduled Pickup Time',
    customerLabel: 'Customer Name',
  },

  vi: {
    title: 'Lịch sử đặt món',
    loading: 'Đang tải lịch sử đặt món…',
    empty: 'Quý khách chưa có lịch sử đặt món nào.',
    goHome: 'Quay lại thực đơn đặt món',
    order: 'Số thứ tự / Mã đơn',
    total: 'Tổng tiền',
    note: 'Ghi chú món ăn',
    noImage: 'Không có ảnh',
    paid: 'Đã thanh toán',
    waitingPayment: 'Chờ thanh toán',
    cancelled: 'Đã hủy đơn',
    preparing: 'Nhà bếp đang chuẩn bị',
    completed: 'Đã nhận món',
    unknownStatus: 'Trạng thái',
    allTime: 'Tất cả thời gian',
    allMonths: 'Tất cả các tháng',
    yearLabel: 'Năm',
    monthLabel: 'Tháng',
    immediate: 'Lấy ngay',
    scheduled: 'Hẹn giờ nhận',
    scheduledFor: 'Thời gian hẹn lấy',
    customerLabel: 'Tên người nhận',
  },

  zh: {
    title: '历史账单',
    loading: '正在加载点餐记录…',
    empty: '您还没有相关的点餐记录。',
    goHome: '返回菜单点餐',
    order: '取餐号 / 订单号',
    total: '实付金额',
    note: '整单备注',
    noImage: '暂无图片',
    paid: '已付款',
    waitingPayment: '等待付款',
    cancelled: '订单已取消',
    preparing: '后厨准备中',
    completed: '已取餐',
    unknownStatus: '订单状态',
    allTime: '全部时间',
    allMonths: '全部月份',
    yearLabel: '年',
    monthLabel: '月',
    immediate: '立即取餐',
    scheduled: '预约取餐',
    scheduledFor: '预约取餐时间',
    customerLabel: '取餐人姓名',
  },
};

function getSafeLocale(
  value: string | string[] | undefined
): Locale {
  const locale = Array.isArray(value)
    ? value[0]
    : value;

  if (
    locale === 'ja' ||
    locale === 'en' ||
    locale === 'vi' ||
    locale === 'zh'
  ) {
    return locale;
  }

  return 'ja';
}

function getStatusLabel(
  status: string | null,
  t: any
): string {
  switch (status) {
    case 'PAID':
      return t.paid;

    case 'WAITING_PAYMENT':
      return t.waitingPayment;

    case 'CANCELLED':
      return t.cancelled;

    case 'PREPARING':
      return t.preparing;

    case 'COMPLETED':
      return t.completed;

    default:
      return status || t.unknownStatus;
  }
}

function getStatusClass(
  status: string | null
): string {
  switch (status) {
    case 'PAID':
      return 'status-paid';

    case 'WAITING_PAYMENT':
      return 'status-waiting';

    case 'CANCELLED':
      return 'status-cancelled';

    case 'PREPARING':
      return 'status-preparing';

    case 'COMPLETED':
      return 'status-completed';

    default:
      return 'status-default';
  }
}

function formatCurrency(
  amount: any,
  currency: any,
  locale: Locale
): string {
  const numericAmount = Number(amount || 0);
  const currencyCode = (
    currency || 'JPY'
  ).toUpperCase();

  try {
    return new Intl.NumberFormat(
      locale === 'ja'
        ? 'ja-JP'
        : locale === 'zh'
          ? 'zh-CN'
          : locale === 'vi'
            ? 'vi-VN'
            : 'en-US',
      {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits:
          currencyCode === 'JPY' ? 0 : 2,
      }
    ).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString()} ${currencyCode}`;
  }
}

function formatDate(
  date: any,
  locale: Locale
): string {
  if (!date) return '';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const localeCode =
    locale === 'ja'
      ? 'ja-JP'
      : locale === 'zh'
        ? 'zh-CN'
        : locale === 'vi'
          ? 'vi-VN'
          : 'en-US';

  return new Intl.DateTimeFormat(
    localeCode,
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(parsed);
}

function formatDateOnly(
  date: any,
  locale: Locale
): string {
  if (!date) return '';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const localeCode =
    locale === 'ja'
      ? 'ja-JP'
      : locale === 'zh'
        ? 'zh-CN'
        : locale === 'vi'
          ? 'vi-VN'
          : 'en-US';

  return new Intl.DateTimeFormat(
    localeCode,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  ).format(parsed);
}

export default function OrderHistoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const locale = getSafeLocale(params?.locale);
  const t = translations[locale];

  const currentStoreSlug =
    searchParams.get('store');

  const [storeInfo, setStoreInfo] =
    useState<any>(null);

  const [orders, setOrders] =
    useState<DisplayOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedYear, setSelectedYear] =
    useState<string>('ALL');

  const [selectedMonth, setSelectedMonth] =
    useState<string>('ALL');

  const [selectedOrder, setSelectedOrder] =
    useState<DisplayOrder | null>(null);

  // ============================================================
  // STORE INFO
  // ============================================================

  useEffect(() => {
    if (!currentStoreSlug) return;

    getStoreInfoBySlug(currentStoreSlug)
      .then((info) => {
        if (info) {
          setStoreInfo(info);
        }
      })
      .catch((err) => {
        console.error(
          '[OrderHistory] Failed to load store info',
          err
        );
      });
  }, [currentStoreSlug]);

  // ============================================================
  // LOAD ORDERS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      try {
        const raw =
          localStorage.getItem(
            'orderHistory'
          );

        if (!raw) {
          if (!cancelled) {
            setOrders([]);
            setLoading(false);
          }

          return;
        }

        const storedData =
          JSON.parse(raw);

        if (!Array.isArray(storedData)) {
          if (!cancelled) {
            setOrders([]);
            setLoading(false);
          }

          return;
        }

        const storedOrders: StoredOrder[] =
          storedData
            .map((item: any) =>
              typeof item === 'string'
                ? { orderToken: item }
                : item
            )
            .filter(
              (
                item
              ): item is StoredOrder =>
                item !== null &&
                item?.orderToken?.length > 0
            );

        if (storedOrders.length === 0) {
          if (!cancelled) {
            setOrders([]);
            setLoading(false);
          }

          return;
        }

        const uniqueTokens = [
          ...new Set(
            storedOrders.map(
              (item) =>
                item.orderToken
            )
          ),
        ];

        const res = await fetch(
          '/api/customer/orders',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              tokens: uniqueTokens,
            }),
          }
        );

        if (!res.ok) {
          throw new Error(
            `Order API failed: ${res.status}`
          );
        }

        const data = await res.json();

        if (
          !data.success ||
          !Array.isArray(data.orders)
        ) {
          throw new Error(
            'Invalid order API response'
          );
        }

        const dbOrderMap =
          new Map<string, Order>();

        for (
          const order of data.orders
        ) {
          if (order.order_token) {
            dbOrderMap.set(
              order.order_token,
              order
            );
          }
        }

        const mergedOrders =
          storedOrders.reduce<
            DisplayOrder[]
          >(
            (
              result,
              stored
            ) => {
              const dbOrder =
                dbOrderMap.get(
                  stored.orderToken
                );

              if (!dbOrder) {
                if (!stored.orderId) {
                  return result;
                }

                result.push({
                  id: String(
                    stored.orderId
                  ),
                  order_token:
                    stored.orderToken,
                  order_number:
                    stored.orderNumber ??
                    null,
                  store_id:
                    stored.storeId ??
                    null,
                  status: null,
                  total_amount:
                    stored.totalAmount ??
                    0,
                  currency:
                    stored.currency ||
                    'JPY',
                  created_at:
                    stored.createdAt ||
                    new Date().toISOString(),
                  storeName:
                    stored.storeName ||
                    null,
                  localCreatedAt:
                    stored.createdAt ||
                    null,
                  tbl_customer_order_items:
                    [],
                });

                return result;
              }

              result.push({
                ...dbOrder,
                storeName:
                  stored.storeName ||
                  null,
                localCreatedAt:
                  stored.createdAt ||
                  null,
                store_id:
                  dbOrder.store_id ??
                  stored.storeId ??
                  null,
              });

              return result;
            },
            []
          );

        mergedOrders.sort(
          (a, b) =>
            new Date(
              b.localCreatedAt ||
                b.created_at
            ).getTime() -
            new Date(
              a.localCreatedAt ||
                a.created_at
            ).getTime()
        );

        if (!cancelled) {
          setOrders(mergedOrders);
        }
      } catch (error) {
        console.error(
          '[OrderHistory] Failed to load orders',
          error
        );

        if (!cancelled) {
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // LISTEN FOR HISTORY CLEAR EVENT
  // ============================================================

  useEffect(() => {
    const handleHistoryUpdated =
      () => {
        const raw =
          localStorage.getItem(
            'orderHistory'
          );

        if (!raw) {
          setOrders([]);
          setSelectedOrder(null);
        }
      };

    window.addEventListener(
      'order-history-updated',
      handleHistoryUpdated
    );

    return () => {
      window.removeEventListener(
        'order-history-updated',
        handleHistoryUpdated
      );
    };
  }, []);

  // ============================================================
  // AVAILABLE YEARS
  // ============================================================

  const availableYears =
    useMemo(() => {
      const years =
        new Set<string>();

      orders.forEach((order) => {
        const year =
          new Date(
            order.localCreatedAt ||
              order.created_at
          ).getFullYear();

        if (!isNaN(year)) {
          years.add(
            String(year)
          );
        }
      });

      return Array.from(years).sort(
        (a, b) =>
          Number(b) - Number(a)
      );
    }, [orders]);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const dateObj =
            new Date(
              order.localCreatedAt ||
                order.created_at
            );

          if (
            isNaN(
              dateObj.getTime()
            )
          ) {
            return false;
          }

          const orderYear =
            String(
              dateObj.getFullYear()
            );

          const orderMonth =
            String(
              dateObj.getMonth() + 1
            );

          if (
            selectedYear !== 'ALL' &&
            orderYear !==
              selectedYear
          ) {
            return false;
          }

          if (
            selectedMonth !== 'ALL' &&
            orderMonth !==
              selectedMonth
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      orders,
      selectedYear,
      selectedMonth,
    ]);

  // ============================================================
  // GROUP BY DATE
  // ============================================================

  const groupedOrdersByDate =
    useMemo(() => {
      const map = new Map<
        string,
        DisplayOrder[]
      >();

      filteredOrders.forEach(
        (order) => {
          const dateObj =
            new Date(
              order.localCreatedAt ||
                order.created_at
            );

          if (
            isNaN(
              dateObj.getTime()
            )
          ) {
            return;
          }

          const dateKey =
            `${dateObj.getFullYear()}-${String(
              dateObj.getMonth() + 1
            ).padStart(
              2,
              '0'
            )}-${String(
              dateObj.getDate()
            ).padStart(
              2,
              '0'
            )}`;

          if (!map.has(dateKey)) {
            map.set(
              dateKey,
              []
            );
          }

          map
            .get(dateKey)!
            .push(order);
        }
      );

      const groups: {
        dateKey: string;
        formattedDate: string;
        orders: DisplayOrder[];
      }[] = [];

      map.forEach(
        (
          groupOrders,
          dateKey
        ) => {
          groups.push({
            dateKey,
            formattedDate:
              formatDateOnly(
                dateKey,
                locale
              ),
            orders:
              groupOrders,
          });
        }
      );

      return groups.sort(
        (a, b) =>
          b.dateKey.localeCompare(
            a.dateKey
          )
      );
    }, [
      filteredOrders,
      locale,
    ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="order-loading-screen">
        <div className="order-spinner" />

        <p>
          {t.loading}
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="order-history-container">
      <OrderHeader
        locale={locale}
        storeInfo={storeInfo}
      />

      <div className="order-history-wrapper">

        {/* ======================================================
            PAGE HEADER
        ====================================================== */}

        <div className="order-history-header">

          <div className="order-history-title-area">
            <h1 className="order-history-title">
              {t.title}
            </h1>
          </div>

          {/* ==================================================
              CLEAR HISTORY BUTTON
          ================================================== */}

          {orders.length > 0 && (
            <ClearOrderHistoryButton
              locale={locale}
            />
          )}

        </div>

        {/* ======================================================
            FILTER BAR
        ====================================================== */}

        {orders.length > 0 && (
          <div className="order-filter-bar">

            <select
              value={selectedYear}
              onChange={(e) => {
                const value =
                  e.target.value;

                setSelectedYear(value);

                if (
                  value === 'ALL'
                ) {
                  setSelectedMonth(
                    'ALL'
                  );
                }
              }}
              className="order-filter-select"
            >
              <option value="ALL">
                {t.allTime}
              </option>

              {availableYears.map(
                (year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}{' '}
                    {t.yearLabel}
                  </option>
                )
              )}
            </select>

            {selectedYear !==
              'ALL' && (
              <select
                value={
                  selectedMonth
                }
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value
                  )
                }
                className="order-filter-select"
              >
                <option value="ALL">
                  {t.allMonths}
                </option>

                {Array.from(
                  {
                    length: 12,
                  },
                  (_, i) =>
                    i + 1
                ).map((m) => (
                  <option
                    key={m}
                    value={String(
                      m
                    )}
                  >
                    {m}{' '}
                    {t.monthLabel}
                  </option>
                ))}
              </select>
            )}

          </div>
        )}

        {/* ======================================================
            EMPTY
        ====================================================== */}

        {orders.length === 0 ||
        filteredOrders.length ===
          0 ? (
          <div className="order-empty-state">

            <p>
              {t.empty}
            </p>

            <Link
              href={
                currentStoreSlug &&
                currentStoreSlug.trim() !==
                  ''
                  ? `/${locale}/order?store=${currentStoreSlug}`
                  : `/${locale}/store-select`
              }
              className="order-empty-btn"
            >
              {t.goHome}
            </Link>

          </div>
        ) : (

          /* ====================================================
             ORDER LIST
          ==================================================== */

          <div className="order-date-groups">

            {groupedOrdersByDate.map(
              (group) => (
                <div
                  key={
                    group.dateKey
                  }
                  className="order-date-group-section"
                >

                  <div className="order-date-divider">
                    <span>
                      {
                        group.formattedDate
                      }
                    </span>
                  </div>

                  <div className="orders-grid">

                    {group.orders.map(
                      (order) => (
                        <OrderCard
                          key={
                            order.order_token
                          }
                          order={order}
                          locale={locale}
                          t={t}
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          getStatusLabel={
                            getStatusLabel
                          }
                          getStatusClass={
                            getStatusClass
                          }
                          formatCurrency={
                            formatCurrency
                          }
                          formatDate={
                            formatDate
                          }
                        />
                      )
                    )}

                  </div>
                </div>
              )
            )}

          </div>
        )}
      </div>

      {/* ========================================================
          ORDER MODAL
      ======================================================== */}

      <OrderModal
        order={selectedOrder}
        onClose={() =>
          setSelectedOrder(null)
        }
        locale={locale}
        t={t}
        getStatusLabel={
          getStatusLabel
        }
        getStatusClass={
          getStatusClass
        }
        formatCurrency={
          formatCurrency
        }
        formatDate={
          formatDate
        }
      />
    </div>
  );
}

