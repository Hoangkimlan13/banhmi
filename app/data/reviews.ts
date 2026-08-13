import type { Locale } from "../i18n";

export type Review = {
  id: number;
  name: string;
  date: string;
  rating: number;
  source: "google" | "tripadvisor";
  text: string;
  link: string;
};

// Đường dẫn thực tế chuẩn xác của nhà hàng Tonkatsu Niimura (Kabukicho)
export const GOOGLE_REVIEWS_URL = "https://www.google.co.jp/maps/place/Niimura+Main+Store/@35.694595,139.701192,17z/data=!3m1!5s0x60188cd781207bf3:0x66b196b1b51aa03c!4m8!3m7!1s0x60188cd781186361:0x7a91c336a809439b!8m2!3d35.694595!4d139.701192!9m1!1b1!16s%2Fg%2F1tf_hdhk?entry=ttu&g_ep=EgoyMDI2MDcxMi4wIKXMDSoASAFQAw%3D%3D";
export const TRIPADVISOR_URL = "https://www.tripadvisor.jp/Restaurant_Review-g14133667-d1687503-Reviews-Tonkatsu_Niimura_Main_Branch-Kabukicho_Shinjuku_Tokyo_Tokyo_Prefecture_Kanto.html";

export const reviewsData = {
  ja: [
    {
      id: 1,
      name: "Takahiro M.",
      date: "1か月前",
      rating: 5,
      source: "google",
      text: "歌舞伎町でとんかつを食べるならここ。伝統の黒豚ロースは脂身まで甘く、サクサクの衣が極上。老舗の安定感と丁寧な接客にいつも癒されます。",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 2,
      name: "ringo",
      date: "3週間前",
      rating: 5,
      source: "google",
      text: "ランチとして利用しました。価格帯も手頃で美味しいです。スタッフの方も積極的にキャベツのおかわり等を聞いてくれます。店内も清潔でした。",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 3,
      name: "村田 淳",
      date: "2026年5月",
      rating: 5,
      source: "tripadvisor",
      text: "駅近で会合には最高のお店。昔の部下達と久しぶりにゆっくり会いたくて利用させてもらいました。肉が美味い❗️接客もいい❗️ゆっくりと語らう事が出来ました。",
      link: TRIPADVISOR_URL
    },
    {
      id: 4,
      name: "Toru",
      date: "2週間前",
      rating: 5,
      source: "google",
      text: "新宿にある創業63年の老舗。ロースかつランチを注文。衣はサクサク、中はジューシーでバランスが良い仕上がり。ライスとキャベツがおかわり自由でコスパも最高です。",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 5,
      name: "高橋寛治",
      date: "3ヶ月前",
      rating: 4,
      source: "google",
      text: "歌舞伎町のにいむら本店に初めて行きました。少し贅沢に黒豚ロースカツ定食3500円にしました。油がロースなのに少なめで柔らかくて非常に美味しい！落ち着いて食べられます。",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 6,
      name: "Yuki T.",
      date: "2か月前",
      rating: 4,
      source: "tripadvisor",
      text: "ランチタイムに訪問。混んでいましたが回転が早く、揚げたてサクサクのヒレかつを堪能。ソースの深みのある味わいも非常に好みでした。",
      link: TRIPADVISOR_URL
    },
    {
      id: 7,
      name: "Kenji Sato",
      date: "1週間前",
      rating: 5,
      source: "google",
      text: "昭和の雰囲気を残す素晴らしい老舗。カツのクオリティはもちろん、タブレット注文の導入など現代的な便利さもあって、とても快適に食事ができます。",
      link: GOOGLE_REVIEWS_URL
    }
  ],
  en: [
    {
      id: 1,
      name: "Sarah Jenkins",
      date: "2 weeks ago",
      rating: 5,
      source: "tripadvisor",
      text: "Incredible Tonkatsu! The pork was unbelievably tender and juicy. Fast service, English menu available on tablet. An absolute must-visit in Shinjuku.",
      link: TRIPADVISOR_URL
    },
    {
      id: 2,
      name: "Takahiro M.",
      date: "1 month ago",
      rating: 5,
      source: "google",
      text: "The definitive tonkatsu spot in Kabukicho. The traditional black pork loin is sweet down to the fat, with a superb crispy coating. Friendly service.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 3,
      name: "Westie Boy",
      date: "1 month ago",
      rating: 5,
      source: "google",
      text: "Best Katsu I have eaten. So Crispy and Juicy. The Special Homemade Tonkatsu Sauce is smooth and matches perfectly. I love it together with the mild mustard! Cool.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 4,
      name: "phr ip",
      date: "3 months ago",
      rating: 5,
      source: "google",
      text: "A fried black pork specialist, with a revamped menu and new choices, it offers a unique food selection and delicious cooking. I've eaten here since the 1980s, and the standards remain the same.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 5,
      name: "Francesca Farima",
      date: "1 month ago",
      rating: 5,
      source: "google",
      text: "Tranquil and comfortable atmosphere, reasonable waiting times across multiple floors. Table ordering is very intuitive via tablet with English. Great, flavorful food, generous portions!",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 6,
      name: "Joyce Diaz",
      date: "2 months ago",
      rating: 4,
      source: "tripadvisor",
      text: "Food was delicious. We had the fried chicken meal (2,000 yen) and pork meal (2,100 yen). Highly recommend ordering via the tablet which supports multiple languages.",
      link: TRIPADVISOR_URL
    },
    {
      id: 7,
      name: "David K.",
      date: "3 weeks ago",
      rating: 5,
      source: "google",
      text: "The Kagoshima black pork cutlet is out of this world. Extremely crispy on the outside, and incredibly juicy on the inside. Free refills of cabbage and rice are a huge bonus!",
      link: GOOGLE_REVIEWS_URL
    }
  ],
  vi: [
    {
      id: 1,
      name: "Takahiro M.",
      date: "1 tháng trước",
      rating: 5,
      source: "google",
      text: "Địa chỉ tonkatsu chuẩn mực tại Kabukicho. Thịt thăn lợn đen truyền thống ngọt béo tự nhiên, lớp vỏ giòn tan cực đỉnh. Sự chu đáo đúng chuẩn truyền thống.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 2,
      name: "Sarah Jenkins",
      date: "2 tuần trước",
      rating: 5,
      source: "tripadvisor",
      text: "Món Tonkatsu tuyệt vời! Thịt siêu mềm và mọng nước. Phục vụ nhanh chóng, có sẵn thực đơn tiếng Anh trên máy tính bảng. Địa điểm không thể bỏ qua tại Shinjuku.",
      link: TRIPADVISOR_URL
    },
    {
      id: 3,
      name: "JANG정희",
      date: "1 tháng trước",
      rating: 5,
      source: "google",
      text: "Nhân viên phục vụ với trang phục vô cùng chỉn chu lịch sự, không gian sang trọng và sạch sẽ. Thịt có phần mỡ béo ngậy hài hòa rất đặc trưng, ăn kèm sốt cà ri đậm đà cực kỳ đưa cơm.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 4,
      name: "Yuki T.",
      date: "2 tháng trước",
      rating: 4,
      source: "tripadvisor",
      text: "Ghé quán vào giờ ăn trưa. Dù khá đông nhưng xếp hàng nhanh, món thịt thăn fillet chiên nóng hổi ngon xuất sắc. Nước sốt đậm đà rất đặc trưng.",
      link: TRIPADVISOR_URL
    },
    {
      id: 5,
      name: "Francesca Farima",
      date: "1 tháng trước",
      rating: 5,
      source: "google",
      text: "Không gian yên tĩnh dễ chịu, có nhiều tầng. Gọi món siêu tiện qua tablet có ảnh minh họa và tiếng Anh rõ ràng. Đồ ăn ngon, đầy đặn, được thêm bắp cải bào miễn phí.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 6,
      name: "Minh Anh Nguyễn",
      date: "3 tuần trước",
      rating: 5,
      source: "google",
      text: "Nhà hàng tonkatsu lâu đời nằm ngay trung tâm Kabukicho. Thịt heo đen Kagoshima chiên xù cực kỳ chất lượng, giòn ngoài mềm trong. Rất đáng đồng tiền bát gạo khi tới Shinjuku.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 7,
      name: "Toru",
      date: "2 tuần trước",
      rating: 5,
      source: "google",
      text: "Quán ăn lâu đời với hơn 60 năm lịch sử. Set cơm trưa giá cả cực hợp lý, vỏ bột giòn rụm không bị ngấy mỡ. Cơm và bắp cải được gọi thêm thoải mái, no nê ra về.",
      link: GOOGLE_REVIEWS_URL
    }
  ],
  zh: [
    {
      id: 1,
      name: "Takahiro M.",
      date: "1 个月前",
      rating: 5,
      source: "google",
      text: "歌舞伎町吃炸猪排的首选。传统的黑猪里脊肉连肥肉部分都很甜，酥脆的外衣堪称极品。老字号的安定感和周到的服务总是让人感到治愈。",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 2,
      name: "Queenie",
      date: "3 周前",
      rating: 5,
      source: "google",
      text: "超级好吃的猪扒饭😍点的是鹿儿岛的猪扒🐷里脊肉切的很厚很大只 🤣但是肉一点都不柴🩷汁水很足一点但没有一点腥味🤫是我吃过的处理的最好的猪扒👅咖喱配着很下饭🤩山药泥很好吃很新鲜👀包菜丝一直有人在旁边帮你添加👅",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 3,
      name: "Liu Che-Ming (Lao Liu)",
      date: "2 个月前",
      rating: 4,
      source: "google",
      text: "價格偏高，店內裝潢非常有年代感，但豬排肉質與油花真的很讚，外皮酥脆口感極佳！",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 4,
      name: "Yuki T.",
      date: "2 个月前",
      rating: 4,
      source: "tripadvisor",
      text: "午餐时间到访。虽然排队人多但翻台很快，品尝到了刚炸好酥脆的菲力猪排。酱汁浓郁深奥的滋味也很合我胃口。",
      link: TRIPADVISOR_URL
    },
    {
      id: 5,
      name: "Francesca Farima",
      date: "1 个月前",
      rating: 5,
      source: "google",
      text: "环境安静舒适，有多层用餐空间。点餐非常方便，每张桌子都配有带英文和图片的高清平板电脑，非常直观易懂。分量足且非常美味！",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 6,
      name: "张小明",
      date: "2 周前",
      rating: 5,
      source: "google",
      text: "这家老字号的黑猪排确实名不虚传，咬下去肉汁四溢。卷心菜和米饭都是无限量续加的，服务员态度也很亲切，绝对推荐！",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 7,
      name: "Chen Wei",
      date: "1 个月前",
      rating: 5,
      source: "tripadvisor",
      text: "就在歌舞伎町的中心，交通很方便。炸鸡块套餐和炸猪排套餐都非常好吃，外皮酥脆内里多汁。可以用平板点餐对外国人非常友好。",
      link: TRIPADVISOR_URL
    }
  ],
  ko: [
    {
      id: 1,
      name: "JANG정희",
      date: "1달 전",
      rating: 5,
      source: "google",
      text: "돈가스인데 다들 깔끔한 복장으로 서빙하시고 시설도 그렇고 고급 돈가스집 같아요. 가부키쵸 지나다니며 눈여겨보다 먹었는데 고기가 지방과 기름이 적절히 어우러져 너무 좋았습니다. 느끼함 없이 밸런스가 최고네요! 추가한 카레 소스도 깊고 풍미가 진해 남은 밥에 비벼 먹기 딱 좋았어요. 게살가스도 입안에서 사르르 녹아내립니다.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 2,
      name: "이다연맘",
      date: "2주 전",
      rating: 5,
      source: "google",
      text: "음식양이 많아요. 안심 돈카츠 우리나라 스타일과 좀 다르지만 나름의 매력이 있어 맛있어요. 함박 고기가 너무 부드러워서 깜놀..주문 테블릿으로 하니까 일본어 몰라도 영어로 ok.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 3,
      name: "Margaret Jihyun Song",
      date: "1달 전",
      rating: 5,
      source: "google",
      text: "기대를 많이 안하고 들어갔는데 고기도 밥도 카레도 맛있었어요!! 겉보기에는 일반 돈카츠와 다를게 없는데 씹으면 고기 육즙이 넘쳐요!! 카레는 살짝매운데 와규 햄버그의 느끼함을 잘 잡아줘서 잘어울려요~~~ 특제소스가 맛있고 함께주는 오이가 맛있습니당♥",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 4,
      name: "Kim Ji-hoon",
      date: "3주 전",
      rating: 5,
      source: "google",
      text: "신주쿠 가부키초의 명물 돈카츠 매장. 튀김옷이 아주 가볍고 바삭하며 육즙이 가득합니다. 양배추와 밥도 리필이 가능해서 든든한 한 끼를 먹었습니다.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 5,
      name: "Francesca Farima",
      date: "1달 전",
      rating: 5,
      source: "google",
      text: "조용하고 편안한 분위기이며 여러 층으로 이루어져 있습니다. 테이블마다 사진과 영어가 제공되는 아주 편리한 태블릿이 있어 주문이 직관적입니다. 맛도 훌륭하고 양도 아주 푸짐합니다!",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 6,
      name: "Toru",
      date: "2주 전",
      rating: 5,
      source: "google",
      text: "신주쿠에 있는 63년 전통의 노포 돈카츠 전문점. 겉은 바삭하고 속은 촉촉한 완벽한 밸런스입니다. 밥과 양배추가 무한 리필이라 든든하게 먹을 수 있어 추천합니다.",
      link: GOOGLE_REVIEWS_URL
    },
    {
      id: 7,
      name: "박민우",
      date: "2달 전",
      rating: 5,
      source: "google",
      text: "가고시마산 흑돼지 돈카츠를 먹었는데 지방의 고소함과 살코기의 조화가 미쳤습니다. 소스도 맛있고 양배추 소스까지 취향 저격이네요. 가격대는 좀 있지만 돈이 아깝지 않은 맛입니다.",
      link: GOOGLE_REVIEWS_URL
    }
  ]
} satisfies Record<Locale, Review[]>;

export const dictionary = {
  ja: { 
    eyebrow: "REVIEWS", 
    title: "お客様の声と評価", 
    googleLabel: "Google クチコミ", 
    taLabel: "TripAdvisor 評価", 
    verified: "元の評価を見る" 
  },
  en: { 
    eyebrow: "REVIEWS", 
    title: "Guest Experiences", 
    googleLabel: "Google Reviews", 
    taLabel: "TripAdvisor Rating", 
    verified: "View Original" 
  },
  vi: { 
    eyebrow: "ĐÁNH GIÁ", 
    title: "Trải Nghiệm Thực Tế", 
    googleLabel: "Đánh Giá Google", 
    taLabel: "Điểm TripAdvisor", 
    verified: "Xem nguồn gốc" 
  },
  zh: { 
    eyebrow: "REVIEWS", 
    title: "顾客评价与体验", 
    googleLabel: "Google 评价", 
    taLabel: "TripAdvisor 评分", 
    verified: "查看原文" 
  },
  ko: { 
    eyebrow: "REVIEWS", 
    title: "고객 후기 및 평가", 
    googleLabel: "Google 리뷰", 
    taLabel: "TripAdvisor 평가", 
    verified: "원본 보기" 
  }
} satisfies Record<Locale, Record<string, string>>;