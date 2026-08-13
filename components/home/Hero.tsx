"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";

const baseImages = [
  { src: "/images/hero/hero1.jpg", alt: "Premium Tonkatsu Close-up" },
  { src: "/images/hero/hero2.jpg", alt: "Niimura Luxury Dining Room" },
  { src: "/images/hero/hero3.jpg", alt: "Master Chef Preparing Aged Pork" },
  { src: "/images/hero/hero4.jpg", alt: "Feather-light Crispy Panko Detail 1" },
  { src: "/images/hero/hero5.jpg", alt: "Artisan Selection process" },
  { src: "/images/hero/hero6.jpg", alt: "Golden Crispy Texture" },
  { src: "/images/hero/hero7.jpg", alt: "Niimura Hospitality Table" }
];

const slideImages = [...baseImages, ...baseImages, ...baseImages];
const START_INDEX = baseImages.length;
const SLIDE_DURATION = 5000;

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(START_INDEX);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const trackRef = useRef<HTMLDivElement | null>(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // thêm dòng này
  const isSwiping = useRef(false);

  const realIndex = currentSlide % baseImages.length;

  const handleIndexReset = (targetIndex: number) => {
    setTimeout(() => {
      setIsTransitioning(false);
      setCurrentSlide(targetIndex);
    }, 450);
  };

  const handlePrev = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    // Thay vì return thẳng, ta chỉ cho phép chuyển slide nếu trạng thái transition cũ đã sẵn sàng hoặc đang ở trạng thái reset tạm thời.
    if (!isTransitioning) return;

    const nextIndex = currentSlide - 1;
    setCurrentSlide(nextIndex);

    if (nextIndex < baseImages.length) {
      handleIndexReset(nextIndex + baseImages.length);
    }
  };

  const handleNext = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    if (!isTransitioning) return;

    const nextIndex = currentSlide + 1;
    setCurrentSlide(nextIndex);

    if (nextIndex >= baseImages.length * 2) {
      handleIndexReset(nextIndex - baseImages.length);
    }
  };

  const handleThumbClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTransitioning) return;
    setCurrentSlide(START_INDEX + (index % baseImages.length));
  };

  // Bật lại transition sau khi hoàn thành công việc reset index ngầm
  useEffect(() => {
    if (!isTransitioning) {
      const t = setTimeout(() => setIsTransitioning(true), 50);
      return () => clearTimeout(t);
    }
  }, [isTransitioning]);

  // CHỮA LỖI ĐÓNG BĂNG: Điều khiển Autoplay tập trung bằng useEffect độc lập
  useEffect(() => {
    if (isLightboxOpen) return; // Dừng chạy tự động nếu đang mở Lightbox xem ảnh to

    const timer = setInterval(() => {
      // Gọi trực tiếp logic tăng slide mà không bị chặn bởi cơ chế click-guard
      setCurrentSlide((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= baseImages.length * 2) {
          handleIndexReset(nextIndex - baseImages.length);
        }
        return nextIndex;
      });
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [currentSlide, isLightboxOpen]);

  // Tự động cuộn thanh Thumbnails theo ảnh hiển thị chính
  useEffect(() => {
    if (trackRef.current) {
      const activeThumb = trackRef.current.children[currentSlide] as HTMLElement;
      if (activeThumb) {
        const trackWidth = trackRef.current.offsetWidth;
        const thumbLeft = activeThumb.offsetLeft;
        const thumbWidth = activeThumb.offsetWidth;
        const scrollPosition = thumbLeft - trackWidth / 2 + thumbWidth / 2;
        
        trackRef.current.scrollTo({
          left: scrollPosition,
          behavior: isTransitioning ? "smooth" : "auto"
        });
      }
    }
  }, [currentSlide, isTransitioning]);

  // Hỗ trợ vuốt tay cho màn hình cảm ứng di động
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = touchStartX.current;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;

    const move = Math.abs(
      touchEndX.current - touchStartX.current
    );

    if (move > 15) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;

    const distance =
      touchStartX.current - touchEndX.current;

    if (distance > 80) {
      handleNext();
    } else if (distance < -80) {
      handlePrev();
    }

    setTimeout(() => {
      isSwiping.current = false;
    }, 30);
  };



  return (
    <>
      <div className={styles.heroWrapper}>
        <section className={styles.heroSection} id="home">
          {/* CINEMATIC SLIDER */}
          <div 
            className={styles.sliderContainer} 
            onClick={() => {
              if (!isSwiping.current) {
                setIsLightboxOpen(true);
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {slideImages.map((image, index) => (
              <div
                key={`slide-${index}`}
                className={`${styles.slide} ${index === currentSlide ? styles.slideActive : ""}`}
                style={{ transition: isTransitioning ? "opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none" }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority={index === START_INDEX}
                  unoptimized={true}
                  sizes="100vw"
                  className={styles.slideImage}
                />
              </div>
            ))}
            <div className={styles.sliderOverlay} />
          </div>

          {/* BOTTOM LEFT: ASYMMETRIC NAV CONTROLS */}
          <div className={styles.premiumNavControls}>
            <button className={styles.controlBtn} onClick={() => handlePrev()} aria-label="Previous image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className={styles.navSeparator} />
            <button className={styles.controlBtn} onClick={() => handleNext()} aria-label="Next image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* BOTTOM RIGHT: MINIMAL INDICATOR */}
          <div className={styles.luxuryCounter}>
            <span className={styles.currentNum}>{String(realIndex + 1).padStart(2, "0")}</span>
            <div className={styles.progressBarTrack}>
              <div 
                key={currentSlide} 
                className={styles.progressBarFill} 
                style={{ animationDuration: `${SLIDE_DURATION}ms` }}
              />
            </div>
            <span className={styles.totalNum}>{String(baseImages.length).padStart(2, "0")}</span>
          </div>
        </section>

        {/* THUMBNAILS CONTAINER */}
        <div className={styles.externalThumbSection}>
          <div className={styles.thumbnailTrack} ref={trackRef}>
            {slideImages.map((image, index) => {
              const isSelected = index === currentSlide || ( !isTransitioning && (index % baseImages.length === realIndex) );
              return (
                <button
                  key={`thumb-${index}`}
                  className={`${styles.thumbWrapper} ${isSelected ? styles.thumbActive : ""}`}
                  onClick={(e) => handleThumbClick(index, e)}
                >
                  <Image
                    src={image.src}
                    alt={`Thumbnail ${index + 1}`}
                    width={84}
                    height={52}
                    unoptimized={true}
                    className={styles.thumbImage}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* LUXURY LIGHTBOX MODE */}
      {isLightboxOpen && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setIsLightboxOpen(false)}
        >
         
          <button className={styles.closeLightbox} onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            className={`${styles.lightboxBtn} ${styles.lightboxLeft} ${styles.desktopOnly}`}
            onClick={(e) => handlePrev(e)}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                d="M15 19l-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className={styles.lightboxImageContainer}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              src={baseImages[realIndex].src}
              alt={baseImages[realIndex].alt}
              fill
              unoptimized={true}
              className={styles.lightboxMainImage}
            />
          </div>

          <button className={`${styles.lightboxBtn} ${styles.lightboxRight} ${styles.desktopOnly}`} onClick={(e) => handleNext(e)}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className={styles.lightboxCounter}>
            <span className={styles.lightboxCurrent}>{String(realIndex + 1).padStart(2, "0")}</span>
            <span className={styles.lightboxDivider}>/</span>
            <span className={styles.lightboxTotal}>{String(baseImages.length).padStart(2, "0")}</span>
          </div>
        </div>
      )}
    </>
  );
}