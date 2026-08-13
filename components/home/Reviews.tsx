"use client";

import { useState, useRef, UIEvent } from "react";
import ScrollAnimate from "@/components/common/ScrollAnimate";
import type { Locale } from "@/app/i18n";
import { reviewsData, dictionary, GOOGLE_REVIEWS_URL, TRIPADVISOR_URL } from "@/app/data/reviews";
import styles from "./Reviews.module.css";

interface ReviewsProps {
  locale: Locale;
}

export default function Reviews({ locale }: ReviewsProps) {
  const currentLocale = locale || "ja";
  const ui = dictionary[currentLocale] || dictionary.en;
  const list = reviewsData[currentLocale] || reviewsData.en;

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const children = container.querySelectorAll(`.${styles.reviewCard}`);
    if (!children.length) return;

    const containerLeft = container.getBoundingClientRect().left;
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const distance = Math.abs(rect.left - containerLeft);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const children = container.querySelectorAll(`.${styles.reviewCard}`);
    const target = children[index] as HTMLElement;
    if (target) {
      container.scrollTo({
        left: target.offsetLeft - 10,
        behavior: "smooth"
      });
      setActiveIndex(index);
    }
  };

  return (
    <section className={styles.reviewsSection} id="reviews">
      <div className={styles.container}>
        
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>{ui.eyebrow}</p>
          <h2 className={styles.mainTitle}>{ui.title}</h2>
          
          {/* Hệ thống Huy hiệu Đánh giá chuẩn thực tế */}
          <div className={styles.trustBadges}>
            {/* Google Badge (4.0 sao, 2,038+ đánh giá) */}
            <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className={styles.badgeCard}>
              <svg className={styles.badgeLogo} viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className={styles.badgeInfo}>
                <div className={styles.badgeRating}>
                  <span>4.0</span>
                  <span className={styles.badgeStars}>★★★★☆</span>
                </div>
                <span className={styles.badgeLabel}>{ui.googleLabel} (2,038+)</span>
              </div>
            </a>

            {/* TripAdvisor Badge */}
            <a href={TRIPADVISOR_URL} target="_blank" rel="noopener noreferrer" className={styles.badgeCard}>
                <svg 
                    className={styles.badgeLogo} 
                    viewBox="0 0 24 24" 
                    width="24" 
                    height="24" 
                    fill="#00af87" 
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                >
                    <title>Tripadvisor</title>
                    <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z"/>
                </svg>
                <div className={styles.badgeInfo}>
                    <div className={styles.badgeRating}>
                    <span>4.1</span>
                    <span className={styles.badgeStars}>★★★★☆</span>
                    </div>
                    <span className={styles.badgeLabel}>{ui.taLabel} (103件)</span>
                </div>
            </a>
          </div>
        </div>

        {/* Slider */}
        <div className={styles.sliderWrapper}>
          <div 
            className={styles.sliderContainer} 
            ref={scrollRef}
            onScroll={handleScroll}
          >
            {list.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                
                {/* Logo Icon nguồn góc trên bên phải - ĐÃ FIX LOGO CHUẨN */}
                <div className={styles.sourceWatermark}>
                  {review.source === "google" ? (
                    <svg className={styles.badgeLogo} viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ) : (
                    <svg 
                        className={styles.badgeLogo} 
                        viewBox="0 0 24 24" 
                        width="24" 
                        height="24" 
                        fill="#00af87" 
                        xmlns="http://www.w3.org/2000/svg"
                        role="img"
                    >
                        <title>Tripadvisor</title>
                        <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z"/>
                    </svg>
                  )}
                </div>

                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className={styles.authorName}>{review.name}</h4>
                    <div className={styles.metaRow}>
                      <span style={{ color: "#ffb400" }}>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      <span>•</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                </div>

                <p className={styles.comment}>"{review.text}"</p>
                
                <div className={styles.verifiedLabel}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <a href={review.link} target="_blank" rel="noopener noreferrer" className={styles.verifiedLink}>
                    {ui.verified}
                  </a>
                </div>

              </div>
            ))}
          </div>

          {/* Điều khiển lướt trang */}
          <div className={styles.controls}>
            <button 
              className={styles.navButton}
              onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
              aria-label="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className={styles.paginationDots}>
              {list.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${activeIndex === i ? styles.activeDot : ""}`}
                  onClick={() => scrollToIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button 
              className={styles.navButton}
              onClick={() => scrollToIndex(Math.min(list.length - 1, activeIndex + 1))}
              aria-label="Next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}