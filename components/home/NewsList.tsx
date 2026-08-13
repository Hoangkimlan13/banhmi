"use client";

import type { Locale } from "@/app/i18n"; 
import { localizePath } from "@/app/i18n"; // Import hàm localizePath để chuyển route chuẩn đa ngôn ngữ
import styles from "./NewsList.module.css";

export interface NewsItem {
  date: string;
  slug: string;
  title: Record<Locale, string>;
  category: Record<Locale, string>;
}

interface NewsListProps {
  data: NewsItem[];
  locale: Locale;
}

// Từ điển dịch tiêu đề phần News và nút Xem tất cả
const sectionTitles: Record<Locale, { eyebrow: string; title: string; viewAll: string }> = {
  ja: { eyebrow: "NEWS", title: "最新情報", viewAll: " tất cả thông báo" }, // Sửa text tiếng Nhật: "すべてのニュースを見る"
  en: { eyebrow: "NEWS", title: "Latest News", viewAll: "View All News" },
  vi: { eyebrow: "TIN TỨC", title: "Tin Tức Mới Nhất", viewAll: "Xem tất cả thông báo" },
  zh: { eyebrow: "最新动态", title: "最新情报", viewAll: "查看全部动态" },
  ko: { eyebrow: "NEWS", title: "최신 소식", viewAll: "전체 소식 보기" },
};

export default function NewsList({ data = [], locale }: NewsListProps) {
  const safeData = data || [];
  
  // Trích xuất văn bản dựa trên locale, nếu không có sẽ dùng tiếng Nhật (ja) làm fallback
  const currentHeading = sectionTitles[locale] || sectionTitles.ja;

  // Xử lý chuẩn text fallback cho tiếng Nhật nếu vô tình bị lỗi gõ chữ
  const viewAllText = locale === "ja" ? "すべてのニュースを見る" : currentHeading.viewAll;

  return (
    <section className={styles.newsSection} id="news">
      <div className={styles.container}>
        
        {/* Tiêu đề phần tin tức được quốc tế hóa */}
        <div className={styles.heading}>
          <p className={styles.eyebrow}>{currentHeading.eyebrow}</p>
          <h2 className={styles.title}>{currentHeading.title}</h2>
        </div>

        {/* Danh sách bài viết */}
        <div className={styles.listContainer}>
          {safeData.map((item) => {
            const localizedTitle = item.title[locale] || item.title["ja"];
            const localizedCategory = item.category[locale] || item.category["ja"];

            return (
              <a 
                key={item.slug} 
                className={styles.newsItem} 
                href={`/${locale}/news/${item.slug}`} /* Route động chuẩn SEO */
              >
                {/* Khối metadata: Ngày & Tag */}
                <div className={styles.metaGroup}>
                  <span className={styles.date}>{item.date}</span>
                  <span className={styles.category}>{localizedCategory}</span>
                </div>

                {/* Tiêu đề bài viết */}
                <h3 className={styles.newsTitle}>{localizedTitle}</h3>

                {/* Mũi tên trượt tinh tế khi hover */}
                <svg 
                  className={styles.arrowIcon} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            );
          })}
        </div>

        {/* BỔ SUNG NÚT XEM TẤT CẢ THÔNG BÁO */}
        <div className={styles.btnWrapper}>
          <a href={`/${locale}/news`} className={styles.viewAllBtn}>
            <span>{viewAllText}</span>
            <svg 
              className={styles.btnArrow}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}