import type { Locale } from "../i18n";

export type LocalizedText = Record<Locale, string>;

export interface ReservationDictionary {
  eyebrow: string;
  title: string;
  subtitle: string;
  btnReserve: string;
  btnDelivery: string;
  phoneLabel: string;
  phoneNo: string;
  phoneNote: string;
}

export const reservationData: Record<Locale, ReservationDictionary> = {
  ja: {
    eyebrow: "RESERVATION & ORDER",
    title: "こだわりの空間でのご予約、\nまたはご自宅での贅沢な味わいを。",
    // Đã sửa: "ご店内でのご予約" (đặt bàn tại quán chung) hoặc "お席のご予約" thay cho "カウンター席"
    subtitle: "お席のご予約、お持ち帰り・デリバリーのご注文、お電話での対応も承っております。",
    btnReserve: "ご予約 ",
    btnDelivery: "テイクアウト・デリバリー ",
    phoneLabel: "お電話でのご予約・お問い合わせ",
    phoneNo: "03-3200-5900",
    phoneNote: "（受付時間 11:00～23:00）",
  },
  en: {
    eyebrow: "RESERVATION & ORDER",
    title: "Reserve a table in our refined space,\nor enjoy premium flavor at home.",
    // Đã sửa: "Book a table" thay vì "Book a premium counter seat"
    subtitle: "Book your table, order take-out/delivery, or contact us directly via phone.",
    btnReserve: "Book a Table",
    btnDelivery: "Takeout & Delivery",
    phoneLabel: "Call to Reserve & Inquire",
    phoneNo: "03-3200-5900",
    phoneNote: "(Available 11:00 - 23:00)",
  },
  vi: {
    eyebrow: "ĐẶT BÀN & GIAO HÀNG",
    title: "Đặt bàn trong không gian sang trọng,\nhoặc thưởng thức hương vị đẳng cấp tại gia.",
    // Đã sửa: "Hỗ trợ đặt chỗ ngồi" thay vì chỉ "quầy counter"
    subtitle: "Hỗ trợ đặt bàn dùng bữa, đặt món mang về/giao tận nơi hoặc liên hệ qua hotline.",
    btnReserve: "Đặt Bàn Ngay",
    btnDelivery: "Mang Về & Giao Hàng",
    phoneLabel: "Đặt bàn & Hỗ trợ qua hotline",
    phoneNo: "03-3200-5900",
    phoneNote: "(Thời gian nhận cuộc gọi: 11:00 - 23:00)",
  },
  zh: {
    eyebrow: "RESERVATION & ORDER",
    title: "在精致的空间预订席位，\n或在舒适的家中享受奢华美味。",
    // Đã sửa: "店内席位预订" (đặt chỗ ngồi nói chung) thay vì "吧台席位"
    subtitle: "我们提供店内席位预订、外卖配送服务，同时也支持电话预订与咨询。",
    btnReserve: "立即预订 / Reserve",
    btnDelivery: "外卖与配送 / Order",
    phoneLabel: "电话预订与咨询",
    phoneNo: "03-3200-5900",
    phoneNote: "（服务时间 11:00～23:00）",
  },
  ko: {
    eyebrow: "RESERVATION & ORDER",
    title: "정갈하게 준비된 공간에서의 예약,\n또는 가정에서 즐기는 특별한 한 끼를.",
    // Đã sửa: "매장 테이블 예약" (đặt bàn tại quán) thay vì "카운터 석"
    subtitle: "매장 테이블 예약, 포장 및 배달 주문, 전화 안내 서비스도 함께 제공하고 있습니다.",
    btnReserve: "예약하기 / Reserve",
    btnDelivery: "테이크아웃·배달 주문 / Order",
    phoneLabel: "전화 예약 및 문의",
    phoneNo: "03-3200-5900",
    phoneNote: "（접수 시간 11:00~23:00）",
  },
};