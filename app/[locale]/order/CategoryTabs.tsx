'use client';

import { useRef, useEffect } from "react";
import { type Locale } from "@/app/i18n";
import "./category.css";

interface CategoryTabsProps {
  locale: Locale;
  categories: any[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  getCategoryName: (cat: any) => string;
}

export default function CategoryTabs({
  locale,
  categories,
  selectedCategory,
  onSelectCategory,
  getCategoryName,
}: CategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);

  // Xử lý đồng thời cuộn thanh tab ngang và ép xóa sạch class 'active' cũ trên DOM để tránh dính màu
  useEffect(() => {

    if (!containerRef.current) return;


    const activeBtn = containerRef.current.querySelector(
      ".category-tab.active"
    ) as HTMLElement;


    if (!activeBtn) return;


    const containerWidth = containerRef.current.offsetWidth;

    const btnLeft = activeBtn.offsetLeft;

    const btnWidth = activeBtn.offsetWidth;


    containerRef.current.scrollTo({

      left:
        btnLeft -
        containerWidth / 2 +
        btnWidth / 2,

      behavior:"smooth"

    });


  }, [selectedCategory]);

  return (
    <div className="category-sticky-wrapper">
      <div className="category-tabs-container" ref={containerRef}>
        <button
          className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="cat-label">
            {locale === 'ja' ? 'すべて' :
            locale === 'vi' ? 'Tất cả' :
            locale === 'zh' ? '全部' : 'All'}
          </span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span className="cat-label">{getCategoryName(cat)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}