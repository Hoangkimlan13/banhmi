import type { Locale } from "../i18n";

type LocalizedText = Record<Locale, string>;

export type MenuPreviewItem = {
  id: string;
  name: LocalizedText;
  image: string;
  href: string;
  prices: {
    teishoku: string;
    tanpin: string;
  };
  isFeatured?: boolean; // Thêm dòng này: true = hiển thị, false = ẩn
};

export type MenuSection = {
  id: string;
  title: LocalizedText;
  items: {
    name: LocalizedText;
    description: LocalizedText;
    note: LocalizedText;
    price: string;
  }[];
};

export const menuPreviewItems: MenuPreviewItem[] = [
  {
    id: "kurobuta-rosu",
    name: {
      ja: "黒豚ロースかつ",
      en: "Premium Kurobuta Loin Katsu",
      vi: "Thăn heo Kurobuta chiên xù",
      zh: "黑豚里脊炸猪排",
      ko: "흑돼지 등심 카츠",
    },
    image: "kurobuta-rosu.jpg",
    href: "/menu#tonkatsu",
    prices: { teishoku: "¥2,980", tanpin: "¥2,480" },
    isFeatured: true, // Cho phép hiển thị
  },
  {
    id: "kurobuta-hire",
    name: {
      ja: "黒豚ヒレかつ",
      en: "Premium Kurobuta Fillet Katsu",
      vi: "Phi lê heo Kurobuta chiên xù",
      zh: "黑豚菲力炸猪排",
      ko: "흑돼지 안심 카츠",
    },
    image: "kurobuta-hire.jpg",
    href: "/menu#tonkatsu",
    prices: { teishoku: "¥3,200", tanpin: "¥2,700" },
    isFeatured: true, // Cho phép hiển thị
  },
  {
    id: "niimura-mix",
    name: {
      ja: "にいむらミックス",
      en: "Niimura Seafood & Katsu Mix",
      vi: "Set mix hải sản và katsu Niimura",
      zh: "Niimura 海鲜炸物拼盘",
      ko: "니이무라 해산물 카츠 믹스",
    },
    image: "niimura-mix.jpg",
    href: "/menu#tonkatsu",
    prices: { teishoku: "¥2,850", tanpin: "¥2,350" },
    isFeatured: true, // Cho phép hiển thị
  },
  {
    id: "katsu-curry",
    name: {
      ja: "黒豚ロースカツカレー",
      en: "Kurobuta Loin Katsu Curry",
      vi: "Cà ri katsu thăn Kurobuta",
      zh: "黑豚里脊咖喱猪排",
      ko: "흑돼지 등심 카츠 카레",
    },
    image: "katsu-curry.jpg",
    href: "/menu#curry",
    prices: { teishoku: "¥2,200", tanpin: "¥1,900" },
    isFeatured: true, // 💡 ĐỔI THÀNH FALSE LÀ MÓN NÀY SẼ KHÔNG HIỂN THỊ NỮA
  },
];

// ... Toàn bộ mảng menuSections ở phía dưới giữ nguyên không thay đổi ...
export const menuSections: MenuSection[] = [
  {
    id: "tonkatsu",
    title: {
      ja: "とんかつ", en: "Tonkatsu", vi: "Tonkatsu", zh: "炸猪排", ko: "돈카츠"
    },
    items: [
      {
        name: menuPreviewItems[0].name,
        description: {
          ja: "旨味の強い黒豚ロースを、軽い衣で香ばしく揚げます。",
          en: "Rich Kurobuta loin fried in a light, crisp panko crust.",
          vi: "Thăn Kurobuta đậm vị, phủ panko mỏng và chiên giòn.",
          zh: "浓郁黑豚里脊，裹轻盈面包糠炸至酥脆。",
          ko: "풍미 깊은 흑돼지 등심을 가벼운 빵가루로 바삭하게 튀겼습니다.",
        },
        note: {
          ja: "ご飯、味噌汁、香の物付き",
          en: "Served with rice, miso soup, and pickles",
          vi: "Kèm cơm, súp miso và đồ chua",
          zh: "配米饭、味噌汤与渍物",
          ko: "밥, 미소국, 절임 포함",
        },
        price: "¥2,980",
      },
      {
        name: menuPreviewItems[1].name,
        description: {
          ja: "やわらかなヒレを中心までしっとり仕上げます。",
          en: "Tender fillet finished juicy through the center.",
          vi: "Phi lê mềm, giữ độ mọng ở phần giữa.",
          zh: "柔嫩菲力，中心保持多汁。",
          ko: "부드러운 안심을 속까지 촉촉하게 완성합니다.",
        },
        note: {
          ja: "軽めのソースとからしで",
          en: "Best with light sauce and mustard",
          vi: "Hợp với sốt nhẹ và mù tạt",
          zh: "推荐搭配清爽酱汁与芥末",
          ko: "가벼운 소스와 겨자 추천",
        },
        price: "¥3,200",
      },
    ],
  },
  {
    id: "curry",
    title: {
      ja: "カレー", en: "Curry", vi: "Cà ri", zh: "咖喱", ko: "카레"
    },
    items: [
      {
        name: menuPreviewItems[3].name,
        description: {
          ja: "香味野菜 and 黑豚의 감칠맛을 더한 카츠 카레입니다.",
          en: "Katsu curry layered with aromatics and Kurobuta richness.",
          vi: "Cà ri katsu thơm rau củ và vị ngọt của Kurobuta.",
          zh: "香味蔬菜与黑豚旨味交织的猪排咖喱。",
          ko: "향채와 흑돼지의 감칠맛을 더한 카츠 카레입니다.",
        },
        note: {
          ja: "辛さ控えめ", en: "Mild spice", vi: "Cay nhẹ", zh: "微辣", ko: "순한 매운맛"
        },
        price: "¥2,200",
      },
    ],
  },
];