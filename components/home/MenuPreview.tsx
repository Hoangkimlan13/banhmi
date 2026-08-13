"use client";

import { useEffect, useRef, useState, UIEvent, MouseEvent } from "react";
import Link from "next/link";
import styles from "./MenuPreview.module.css";
import { localizePath, type Locale } from "@/app/i18n";
import type { MenuPreviewItem } from "@/app/data/menu";

// Định nghĩa từ điển đa ngôn ngữ cho các chuỗi text tĩnh của component
const menuUiDictionary = {
  ja: {
    eyebrow: "RECOMMENDED",
    title: "おすすめメニュー",
    teishoku: "定食",
    tanpin: "単品",
    viewAll: "全メニューを見る",
  },
  en: {
    eyebrow: "RECOMMENDED",
    title: "Recommended Menu",
    teishoku: "Set",
    tanpin: "À La Carte",
    viewAll: "View Full Menu",
  },
  vi: {
    eyebrow: "MÓN ĐỀ XUẤT",
    title: "Thực Đơn Gợi Ý",
    teishoku: "Set cơm",
    tanpin: "Món lẻ",
    viewAll: "Xem toàn bộ thực đơn",
  },
  zh: {
    eyebrow: "店长推荐",
    title: "推荐菜品",
    teishoku: "定食",
    tanpin: "单点",
    viewAll: "查看完整菜单",
  },
  ko: {
    eyebrow: "RECOMMENDED",
    title: "추천 메뉴",
    teishoku: "정식",
    tanpin: "단품",
    viewAll: "전체 메뉴 보기",
  },
};

interface MenuPreviewProps {
  data: MenuPreviewItem[];
  locale: Locale;
}

export default function MenuPreview({ data, locale }: MenuPreviewProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const currentLocale = locale || "ja";
  const ui = menuUiDictionary[currentLocale];

  // 💡 BƯỚC LỌC QUAN TRỌNG: Chỉ lấy những món có isFeatured khác false
  const filteredData = data.filter((item) => item.isFeatured !== false);
  const originLength = filteredData.length;

  // Tránh crash nếu sau khi lọc không còn món nào hiển thị
  if (originLength === 0) return null;

  // Tạo mảng xoay vòng vô hạn từ danh sách đã lọc
  const extendedData = [...filteredData, ...filteredData, ...filteredData];
  
  const [activeVirtualIndex, setActiveVirtualIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || originLength === 0) return;

    const initSetup = () => {
      const cardWidth = 360 + 48; // width + gap
      slider.scrollLeft = cardWidth * originLength;
    };
    
    setTimeout(initSetup, 50);
  }, [originLength]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const slider = e.currentTarget;
    if (!slider || originLength === 0) return;

    const cardWidth = 360 + 48; 
    const currentScroll = slider.scrollLeft;

    if (currentScroll < cardWidth * (originLength - 1)) {
      slider.style.scrollBehavior = "auto";
      slider.scrollLeft = currentScroll + cardWidth * originLength;
    } 
    else if (currentScroll >= cardWidth * originLength * 2) {
      slider.style.scrollBehavior = "auto";
      slider.scrollLeft = currentScroll - cardWidth * originLength;
    }

    const sliderCenter = slider.getBoundingClientRect().left + slider.offsetWidth / 2;
    const children = slider.children;
    let closestVirtualIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < children.length; i++) {
      const childRect = children[i].getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const distance = Math.abs(sliderCenter - childCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestVirtualIndex = i;
      }
    }
    
    setActiveVirtualIndex(closestVirtualIndex);
    setActiveIndex(closestVirtualIndex % originLength);
  };

  const handleCardClick = (e: MouseEvent<HTMLAnchorElement>, virtualIndex: number) => {
    if (virtualIndex !== activeVirtualIndex) {
      e.preventDefault();
      
      const slider = sliderRef.current;
      if (!slider) return;

      slider.style.scrollBehavior = "smooth";
      const cardWidth = 360 + 48;
      slider.scrollLeft = virtualIndex * cardWidth;
    }
  };

  const scrollToItem = (targetIndex: number) => {
    const slider = sliderRef.current;
    if (!slider) return;
    
    slider.style.scrollBehavior = "smooth";
    const cardWidth = 360 + 48;
    slider.scrollLeft = cardWidth * originLength + (targetIndex * cardWidth);
  };

  return (
    <section className={styles.splitSection} id="menu">
      
      <div className={styles.sectionMeta}>
        <p className={styles.eyebrow}>{ui.eyebrow}</p>
        <h2 className={styles.mainTitle}>{ui.title}</h2>
      </div>

      <div className={styles.menuSliderOuter}>
        <div 
          className={styles.menuPreviewSlider} 
          ref={sliderRef}
          onScroll={handleScroll}
        >
          {extendedData.map((item, index) => {
            const isActive = index === activeVirtualIndex;
            const currentName = item?.name?.[currentLocale] || item?.name?.["ja"] || "";
            
            return (
              <Link 
                href={localizePath(item.href, currentLocale)} 
                className={`${styles.previewCard} ${isActive ? styles.activeCard : ""}`} 
                key={`${item.id}-${index}`}
                onClick={(e) => handleCardClick(e, index)}
              >
                <div className={styles.imageWrapper}>
                  <img 
                    src={`/images/osusume/${item.image}`} 
                    alt={currentName} 
                    className={styles.menuImage}
                    loading="lazy"
                  />
                </div>
                
                <div className={styles.cardInfo}>
                  <div className={styles.titleRow}>
                    <span className={styles.title}>{currentName}</span>
                  </div>
                  
                  {item.prices ? (
                    <div className={styles.pricesBlock}>
                      <div className={styles.priceLine}>
                        <span className={styles.priceLabel}>{ui.teishoku}</span>
                        <strong className={styles.priceValue}>{item.prices.teishoku}</strong>
                      </div>
                      <div className={styles.priceLine}>
                        <span className={styles.priceLabelSecondary}>{ui.tanpin}</span>
                        <span className={styles.priceValueSecondary}>{item.prices.tanpin}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className={styles.paginationDots}>
        {filteredData.map((_, index) => (
          <button
            key={index}
            className={`${styles.dot} ${index === activeIndex ? styles.activeDot : ""}`}
            onClick={() => scrollToItem(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className={styles.linkWrapper}>
        <Link className={styles.luxuryButton} href={localizePath("/menu", currentLocale)}>
          <span className={styles.buttonBg}></span>
          <span className={styles.buttonBorder}></span>
          <span className={styles.buttonContent}>
            <span className={styles.buttonText}>{ui.viewAll}</span>
            <span className={styles.arrowIcon}>
              <svg width="26" height="12" viewBox="0 0 26 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 1L25 6M25 6L20 11M25 6H1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </span>
        </Link>
      </div>

    </section>
  );
}