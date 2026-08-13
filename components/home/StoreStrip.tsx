"use client";

import { useState, useRef, UIEvent } from "react";
import Link from "next/link";
import ScrollAnimate from "@/components/common/ScrollAnimate";
import type { Locale } from "@/app/i18n";
import type { Store } from "@/app/data/stores";
import styles from "./StoreStrip.module.css";

const storeUiDictionary = {
  ja: {
    eyebrow: "STORES",
    title: "店舗案内",
    subTitle: "伝統を受け継ぐ、新宿の3つの空間",
    hours: "営業時間",
    lunch: "ランチ",
    access: "アクセス",
    googleMaps: "Google Maps で見る",
    viewDetail: "店舗詳細を見る",
  },
  en: {
    eyebrow: "STORES",
    title: "Our Locations",
    subTitle: "Three unique culinary spaces in Shinjuku",
    hours: "Hours",
    lunch: "Lunch Time",
    access: "Access",
    googleMaps: "View on Google Maps",
    viewDetail: "View Store Details",
  },
  vi: {
    eyebrow: "HỆ THỐNG",
    title: "Không Gian Cửa Hàng",
    subTitle: "Ba điểm đến tinh hoa lưu giữ hương vị truyền thống tại Shinjuku",
    hours: "Giờ mở cửa",
    lunch: "Giờ ăn trưa",
    access: "Chỉ dẫn đường đi",
    googleMaps: "Xem bản đồ Google Maps",
    viewDetail: "Xem chi tiết cửa hàng",
  },
  zh: {
    eyebrow: "STORES",
    title: "店铺案内",
    subTitle: "传承传统，新宿的三处独特空间",
    hours: "营业时间",
    lunch: "午餐时间",
    access: "交通方式",
    googleMaps: "在 Google Maps 上查看",
    viewDetail: "查看店铺详情",
  },
  ko: {
    eyebrow: "STORES",
    title: "매장 안내",
    subTitle: "전통을 이어가는 신주쿠의 세 가지 공간",
    hours: "영업시간",
    lunch: "런치타임",
    access: "오시는 길",
    googleMaps: "Google 지도에서 보기",
    viewDetail: "매장 상세 보기",
  },
};

interface StoreStripProps {
  data: Store[];
  locale: Locale;
}

export default function StoreStrip({ data, locale }: StoreStripProps) {
  const currentLocale = locale || "ja";
  const ui = storeUiDictionary[currentLocale];
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCleanEmbedUrl = (storeNameJa: string, address: string) => {
    const searchQuery = `${storeNameJa} ${address}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(
      searchQuery
    )}&t=&z=16&ie=UTF8&iwloc=A&output=embed`;
  };

  // Tính toán chính xác dấu chấm active bằng cách tìm card nằm gần tâm container nhất
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container) return;

    const children = container.querySelectorAll(`.${styles.scrollItem}`);
    if (!children.length) return;

    const containerCenter = container.getBoundingClientRect().left + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const childCenter = rect.left + rect.width / 2;
      const distance = Math.abs(childCenter - containerCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  };

  // Click vào chấm tròn tự động cuộn card tương ứng vào chính giữa màn hình
  const handleDotClick = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const children = container.querySelectorAll(`.${styles.scrollItem}`);
    const targetChild = children[index] as HTMLElement;

    if (targetChild) {
      const containerWidth = container.clientWidth;
      const childWidth = targetChild.clientWidth;
      // Công thức cuộn căn giữa hoàn hảo: Lề trái của phần tử - (Nửa chiều rộng container - Nửa chiều rộng phần tử con)
      const targetScrollLeft = targetChild.offsetLeft - (containerWidth / 2 - childWidth / 2);

      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth"
      });
      setActiveIndex(index);
    }
  };

  return (
    <section className={styles.storeStripSection} id="stores">
      <div className={styles.container}>
        
        {/* Tiêu đề khối */}
        <ScrollAnimate>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>{ui.eyebrow}</p>
            <h2 className={styles.mainTitle}>{ui.title}</h2>
            <p className={styles.subTitle}>{ui.subTitle}</p>
          </div>
        </ScrollAnimate>

        {/* Container danh sách cửa hàng */}
        <div 
          className={styles.storeListOuter} 
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <div className={styles.storeList}>
            {data.map((store) => {
              const currentName = store.name[currentLocale] || store.name["ja"];
              const currentHours = store.hours[currentLocale] || store.hours["ja"];
              const currentAccess = store.access[currentLocale] || store.access["ja"];
              const currentLunch = store.lunch[currentLocale] || store.lunch["ja"];

              const nameJaForMap = store.name["ja"] || currentName;
              const mapEmbedUrl = getCleanEmbedUrl(nameJaForMap, store.address);

              return (
                <div key={store.id} className={styles.scrollItem}>
                  <article className={styles.storeRow}>
                    
                    {/* Bản đồ */}
                    <div className={styles.mapBlock}>
                      <iframe
                        src={mapEmbedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`${currentName} Map`}
                        className={styles.googleMapIframe}
                      ></iframe>
                    </div>

                    {/* Nội dung thông tin */}
                    <div className={styles.infoBlock}>
                      <h3 className={styles.storeName}>{currentName}</h3>
                      <p className={styles.storeAddress}>{store.address}</p>
                      <a href={`tel:${store.tel.replace(/[^0-0a-zA-Z+]/g, "")}`} className={styles.storeTel}>
                        TEL : {store.tel}
                      </a>

                      <div className={styles.metaDivider} />

                      <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>{ui.hours}</span>
                          <p className={styles.value}>{currentHours}</p>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>{ui.lunch}</span>
                          <p className={styles.value}>{currentLunch}</p>
                        </div>
                        <div className={styles.detailItem}>
                          <span className={styles.label}>{ui.access}</span>
                          <p className={styles.value}>{currentAccess}</p>
                        </div>
                      </div>

                      <div className={styles.actionButtonGroup}>
                        <Link 
                          href={`/${currentLocale}/stores/${store.id}`}
                          className={styles.primaryButton}
                        >
                          <span>{ui.viewDetail}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>

                        <a 
                          href={store.mapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.mapButton}
                        >
                          <span>{ui.googleMaps}</span>
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 13L13 1M13 1H4M13 1V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </a>
                      </div>
                    </div>

                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hệ thống Dấu chấm chỉ mục dưới Mobile */}
        <div className={styles.paginationDots}>
          {data.map((_, dotIndex) => (
            <button
              key={dotIndex}
              className={`${styles.dot} ${activeIndex === dotIndex ? styles.activeDot : ""}`}
              onClick={() => handleDotClick(dotIndex)}
              aria-label={`Go to store ${dotIndex + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}