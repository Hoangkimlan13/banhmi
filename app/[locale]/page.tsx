import ScrollAnimate from "@/components/common/ScrollAnimate";

import Hero from "@/components/home/Hero";
import BrandStory from "@/components/home/BrandStory";
import MenuPreview from "@/components/home/MenuPreview";
import StoreStrip from "@/components/home/StoreStrip";
import Reviews from "@/components/home/Reviews"; 
import NewsList from "@/components/home/NewsList";
import ReservationPanel from "@/components/home/ReservationPanel";
import SiteFooter from "@/components/SiteFooter";
import { menuPreviewItems, news, stores } from "../data"; // Chỉnh lại đường dẫn lùi 1 cấp nếu cần
import type { Locale } from "../i18n";

interface Props {
  params: Promise<{ locale: Locale }>;
}

export default async function Home({ params }: Props) {
  // Lấy chính xác locale từ thanh URL (ví dụ: /vi, /en)
  const { locale } = await params;

  return (
    <main style={{ overflowX: "hidden" }}>
      {/* 1. Slider cinematic */}
      <section id="hero">
        <Hero />
      </section>

      {/* 2. Giới thiệu triết lý nhà hàng */}
      <section id="about">
        <ScrollAnimate>
          <BrandStory locale={locale} />
        </ScrollAnimate>
      </section>

      {/* 3. Thực đơn tinh hoa */}
      <section id="menu">
        <ScrollAnimate>
          <MenuPreview data={menuPreviewItems} locale={locale} />
        </ScrollAnimate>
      </section>

      {/* 4. Hệ thống cửa hàng */}
      <section id="store">
        <ScrollAnimate>
          <StoreStrip data={stores} locale={locale} />
        </ScrollAnimate>
      </section>

      {/* 5. Đánh giá khách hàng thực tế */}
      <ScrollAnimate>
        <Reviews locale={locale} />
      </ScrollAnimate>

      {/* 6. ReservationPanel */}
      <section id="reservation">
        <ScrollAnimate>
          <ReservationPanel locale={locale} />
        </ScrollAnimate>
      </section>

      {/* 7. Tin tức cập nhật */}
      <section id="news">
        <ScrollAnimate>
          <NewsList data={news} locale={locale} />
        </ScrollAnimate>
      </section>

      {/* 8. SiteFooter */}
      <SiteFooter locale={locale} />
    </main>
  );
}