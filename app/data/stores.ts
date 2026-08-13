import type { Locale } from "../i18n";

type LocalizedText = Record<Locale, string>;

export type Store = {
  id: string;
  name: {
    ja: string;
    en: string;
    vi: string;
    zh: string;
    ko: string;
  };
  address: string;
  tel: string;
  hours: LocalizedText; // Đã chuyển sang LocalizedText để hiển thị đa ngôn ngữ chính xác
  lunch: LocalizedText;
  access: LocalizedText;
  mapsLink: string;
  image: string; 
};

export const stores: Store[] = [
  {
    id: "honten",
    name: {
      ja: "とんかつ にいむら 本店",
      en: "Tonkatsu Niimura Honten (Main)",
      vi: "Tonkatsu Niimura (Trụ sở chính)",
      zh: "炸猪排 新村 总店",
      ko: "돈카츠 니이무라 본점",
    },
    address: "東京都新宿区歌舞伎町1-23-10",
    tel: "03-3200-5900",
    hours: {
      ja: "月〜日 10:30～翌6:00 (木曜日のみ 10:30～翌2:30)",
      en: "Mon-Sun 10:30 AM - 6:00 AM next day (Thu: 10:30 AM - 2:30 AM next day)",
      vi: "T2 - CN: 10:30 - 6:00 sáng hôm sau (Riêng T5: 10:30 - 2:30 sáng hôm sau)",
      zh: "周一至周日 10:30～次日6:00 (仅周四 10:30～次日2:30)",
      ko: "월~일 10:30~익일 6:00 (목요일만 10:30~익일 2:30)",
    },
    lunch: {
      ja: "10:30～16:00 (土日祝は15:00まで)",
      en: "10:30 AM - 4:00 PM (Weekends/Holidays until 3:00 PM)",
      vi: "10:30 - 16:00 (Cuối tuần & Ngày lễ đến 15:00)",
      zh: "10:30～16:00 (周末及法定节假日营业至15:00)",
      ko: "10:30~16:00 (토/일/공휴일은 15:00까지)",
    },
    access: {
      ja: "JR新宿駅東口 徒歩4分",
      en: "JR Shinjuku Station (East Exit) - 4 min walk",
      vi: "Ga JR Shinjuku (Cổng Đông) - 4 phút đi bộ",
      zh: "JR新宿站东口 步行4分",
      ko: "JR 신주쿠역 동쪽 출구 도보 4분",
    },
    mapsLink: "https://maps.app.goo.gl/vKdz6UaXdUfxSfZE7",
    image: "store-honten.jpg",
  },
  {
    id: "nishi-shinjuku",
    name: {
      ja: "とんかつ にいむら 西新宿店",
      en: "Tonkatsu Niimura Nishi-Shinjuku",
      vi: "Tonkatsu Niimura (Chi nhánh Nishi-Shinjuku)",
      zh: "炸猪排 新村 西新宿店",
      ko: "돈카츠 니이무라 니시신주쿠점",
    },
    address: "東京都新宿区西新宿7-5-6",
    tel: "03-3361-9315",
    hours: {
      ja: "月〜金 10:30～22:00 / 土日 10:30～21:30",
      en: "Mon-Fri 10:30 AM - 10:00 PM / Sat-Sun 10:30 AM - 9:30 PM",
      vi: "T2 - T6: 10:30 - 22:00 / T7 & CN: 10:30 - 21:30",
      zh: "周一至周五 10:30～22:00 / 周六周日 10:30～21:30",
      ko: "월~금 10:30~22:00 / 토일 10:30~21:30",
    },
    lunch: {
      ja: "11:00～17:00",
      en: "11:00 AM - 5:00 PM",
      vi: "11:00 - 17:00",
      zh: "11:00～17:00",
      ko: "11:00~17:00",
    },
    access: {
      ja: "JR新宿駅西口 徒歩6分",
      en: "JR Shinjuku Station (West Exit) - 6 min walk",
      vi: "Ga JR Shinjuku (Cổng Tây) - 6 phút đi bộ",
      zh: "JR新宿站西口 步行6分",
      ko: "JR 신주쿠역 서쪽 출구 도보 6분",
    },
    mapsLink: "https://maps.app.goo.gl/fcxuaXwtWWFonMsa7",
    image: "store-nishi.jpg",
  },
  {
    id: "okubo",
    name: {
      ja: "とんかつ にいむら 大久保店",
      en: "Tonkatsu Niimura Okubo",
      vi: "Tonkatsu Niimura (Chi nhánh Okubo)",
      zh: "炸猪排 新村 大久保店",
      ko: "돈카츠 니이무라 오쿠보점",
    },
    address: "東京都新宿区百人町1-18-10",
    tel: "03-3366-9711",
    hours: {
      ja: "月〜日 11:00～23:30",
      en: "Mon-Sun 11:00 AM - 11:30 PM",
      vi: "T2 - CN: 11:00 - 23:30",
      zh: "周一至周日 11:00～23:30",
      ko: "월~일 11:00~23:30",
    },
    lunch: {
      ja: "11:00～17:00",
      en: "11:00 AM - 5:00 PM",
      vi: "11:00 - 17:00",
      zh: "11:00～17:00",
      ko: "11:00~17:00",
    },
    access: {
      ja: "JR大久保駅 徒歩1分 / JR新大久保駅 徒歩5分",
      en: "JR Okubo Station - 1 min walk / JR Shin-Okubo Station - 5 min walk",
      vi: "Ga JR Okubo - 1 phút đi bộ / Ga JR Shin-Okubo - 5 phút đi bộ",
      zh: "JR大久保站 步行1分 / JR新大久保站 步行5分",
      ko: "JR 오쿠보역 도보 1분 / JR 신오쿠보역 도보 5분",
    },
    mapsLink: "https://maps.app.goo.gl/zJf75WA7XhMbXVV86",
    image: "store-okubo.jpg",
  },
];