export const locales = ['ja', 'en', 'vi', 'zh', 'ko'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ja';

export const languageOptions: {
  code: Locale;
  label: string;
  shortLabel: string;
}[] = [
  {
    code: 'ja',
    label: '日本語',
    shortLabel: 'JA',
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
  },
  {
    code: 'vi',
    label: 'Tiếng Việt',
    shortLabel: 'VI',
  },
  {
    code: 'zh',
    label: '中文',
    shortLabel: 'ZH',
  },
  {
    code: 'ko',
    label: '한국어',
    shortLabel: 'KO',
  },
];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0];

  return segment && isLocale(segment)
    ? segment
    : defaultLocale;
}

export function stripLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] && isLocale(segments[0])) {
    return `/${segments.slice(1).join('/')}` || '/';
  }

  return pathname || '/';
}

export function localizePath(
  href: string,
  locale: Locale
): string {
  if (
    href.startsWith('http') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  ) {
    return href;
  }

  const [path, hash = ''] = href.split('#');

  const cleanPath = stripLocaleFromPathname(
    path || '/'
  );

  const localizedPath =
    cleanPath === '/'
      ? `/${locale}`
      : `/${locale}${cleanPath}`;

  return hash
    ? `${localizedPath}#${hash}`
    : localizedPath;
}

export const dictionary = {
  ja: {
    siteName: 'Banh Mi Sandwiches',

    delivery: 'テイクアウト',
    deliveryAlt: 'デリバリー',

    reservation: '予約',
    phoneReservation: '電話で予約',

    menu: 'メニュー',
    store: '店舗',
    about: '私たちについて',
    news: 'お知らせ',
    contact: 'お問い合わせ',
    home: 'ホーム',

    viewMenu: 'メニューを見る',

    bookingDelivery: '予約・注文',
    reserveOrOrder:
      '店舗でのお受け取りを予約するか、ご自宅からご注文いただけます。',

    chooseMenu: 'メニューを選ぶ',

    corporateOrder: '法人注文',

    sendMessage: 'メッセージを送る',
    askConcierge: 'お問い合わせ',
  },

  en: {
    siteName: 'Banh Mi Sandwiches',

    delivery: 'Takeout',
    deliveryAlt: 'Delivery',

    reservation: 'Reservation',
    phoneReservation: 'Call to book',

    menu: 'Menu',
    store: 'Store',
    about: 'About',
    news: 'News',
    contact: 'Contact',
    home: 'Home',

    viewMenu: 'View full menu',

    bookingDelivery: 'Booking & Delivery',
    reserveOrOrder:
      'Reserve a counter seat or order from home.',

    chooseMenu: 'Choose menu',

    corporateOrder: 'Corporate order',

    sendMessage: 'Send message',
    askConcierge: 'Ask concierge',
  },

  vi: {
    siteName: 'Banh Mi Sandwiches',

    delivery: 'Mang đi',
    deliveryAlt: 'Giao hàng',

    reservation: 'Đặt bàn',
    phoneReservation: 'Đặt qua điện thoại',

    menu: 'Thực đơn',
    store: 'Cửa hàng',
    about: 'Giới thiệu',
    news: 'Tin tức',
    contact: 'Liên hệ',
    home: 'Trang chủ',

    viewMenu: 'Xem toàn bộ thực đơn',

    bookingDelivery: 'Đặt bàn & Giao hàng',
    reserveOrOrder:
      'Đặt chỗ tại quầy hoặc đặt món giao đến tận nơi.',

    chooseMenu: 'Chọn món',

    corporateOrder: 'Đơn hàng doanh nghiệp',

    sendMessage: 'Gửi tin nhắn',
    askConcierge: 'Liên hệ hỗ trợ',
  },

  zh: {
    siteName: 'Banh Mi Sandwiches',

    delivery: '外带',
    deliveryAlt: '配送',

    reservation: '预约',
    phoneReservation: '电话预约',

    menu: '菜单',
    store: '门店',
    about: '关于我们',
    news: '新闻',
    contact: '联系我们',
    home: '首页',

    viewMenu: '查看完整菜单',

    bookingDelivery: '预约与配送',
    reserveOrOrder:
      '您可以预约到店取餐，也可以直接在线下单。',

    chooseMenu: '选择菜单',

    corporateOrder: '企业订单',

    sendMessage: '发送消息',
    askConcierge: '咨询客服',
  },

  ko: {
    siteName: 'Banh Mi Sandwiches',

    delivery: '포장',
    deliveryAlt: '배달',

    reservation: '예약',
    phoneReservation: '전화 예약',

    menu: '메뉴',
    store: '매장',
    about: '소개',
    news: '소식',
    contact: '문의하기',
    home: '홈',

    viewMenu: '전체 메뉴 보기',

    bookingDelivery: '예약 및 배달',
    reserveOrOrder:
      '매장 픽업을 예약하거나 집에서 배달을 주문할 수 있습니다.',

    chooseMenu: '메뉴 선택',

    corporateOrder: '기업 주문',

    sendMessage: '메시지 보내기',
    askConcierge: '고객 센터 문의',
  },
} satisfies Record<Locale, Record<string, string>>;