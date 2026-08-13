import type { Locale } from "../i18n";

type LocalizedText = Record<Locale, string>;

export type NewsItem = {
  date: string;
  slug: string;
  title: LocalizedText;
  category: LocalizedText;
};

export const news: NewsItem[] = [
  {
    date: "2026.08.15",
    slug: "obon-holiday-notice",
    title: {
      ja: "夏季休業（お盆期間）のお知らせ",
      en: "Notice regarding Obon holiday closures",
      vi: "Thông báo lịch nghỉ lễ Obon",
      zh: "盂兰盆节休假通知",
      ko: "오봉 연휴 휴무 안내",
    },
    category: {
      ja: "お知らせ",
      en: "Notice",
      vi: "Thông báo",
      zh: "公告",
      ko: "공지사항",
    },
  },
  {
    date: "2026.07.10",
    slug: "special-operating-hours",
    title: {
      ja: "連休に伴う営業時間変更のお知らせ",
      en: "Special operating hours for the long weekend",
      vi: "Thay đổi giờ hoạt động dịp cuối tuần kéo dài",
      zh: "长周末特别营业时间通知",
      ko: "연휴 기간 특별 영업 시간 안내",
    },
    category: {
      ja: "お知らせ",
      en: "Notice",
      vi: "Thông báo",
      zh: "公告",
      ko: "공지사항",
    },
  },
  {
    date: "2026.07.01",
    slug: "summer-limited-tonkatsu",
    title: {
      ja: "夏季限定「夏野菜と厚切りロースかつ」を提供開始",
      en: "Summer limited 'Summer Vegetable & Thick-cut Loin Katsu' now available",
      vi: "Mở bán món giới hạn mùa hè: Tonkatsu thăn dày và rau củ",
      zh: "夏季限定“夏日蔬菜与厚切里脊炸猪排”现已上市",
      ko: "여름 한정 '여름 야채와 두툼한 등심 돈카츠' 출시",
    },
    category: {
      ja: "メニュー",
      en: "Menu",
      vi: "Thực đơn",
      zh: "菜单",
      ko: "메뉴",
    },
  },
  {
    date: "2026.06.18",
    slug: "shinjuku-main-store-renewal",
    title: {
      ja: "新宿本店：ディナータイムのネット予約を開始しました",
      en: "Shinjuku Main Store: Online dinner reservations are now open",
      vi: "Cửa hàng chính Shinjuku: Đã mở đặt bàn trực tuyến cho bữa tối",
      zh: "新宿总店：开放晚餐在线预约",
      ko: "신주쿠 본점: 디너 타임 온라인 예약 시작",
    },
    category: {
      ja: "店舗",
      en: "Store",
      vi: "Cửa hàng",
      zh: "门店",
      ko: "매장",
    },
  },
];