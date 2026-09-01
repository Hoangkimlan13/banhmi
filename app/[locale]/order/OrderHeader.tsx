'use client';

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { languageOptions, dictionary, localizePath, type Locale } from "@/app/i18n";
import "./header.css";

interface OrderHeaderProps {
  locale: Locale;
  storeName?: string;
  storeInfo?: {
    title?: string;
    name?: string;
    type?: string;
    locationName?: string | null;
  } | null;
}

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function OrderHeader({ locale, storeName, storeInfo }: OrderHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentStoreSlug = searchParams.get("store");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const t = dictionary[locale] || dictionary.ja;

  const currentLangObj = languageOptions.find((l) => l.code === locale);
  const currentLangDisplayLabel = currentLangObj ? currentLangObj.label : locale.toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLangChange = (targetLocale: Locale) => {
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get("storeId");
    const storeSlug = params.get("store");

    let nextPath = localizePath(pathname, targetLocale);

    if (storeSlug) {
      nextPath += `?store=${storeSlug}`;
    } else if (storeId) {
      nextPath += `?storeId=${storeId}`;
    }

    setIsLangOpen(false);
    router.push(nextPath);
  };

  const openDrawer = () => {
    setIsDrawerVisible(true);
    requestAnimationFrame(() => {
      setIsMenuOpen(true);
    });
  };

  const closeDrawer = () => {
    setIsMenuOpen(false);
    setTimeout(() => {
      setIsDrawerVisible(false);
    }, 300);
  };

  const sloganText = {
    ja: "本格的なベトナムの味をお楽しみください",
    en: "Enjoy authentic Vietnamese flavors",
    vi: "Thưởng thức hương vị Việt Nam đích thực",
    zh: "品尝正宗的越南风味",
    ko: "정통 베트남의 맛을 즐겨보세요"
  }[locale] || "Enjoy authentic Vietnamese flavors";

  const baseStoreName = storeInfo?.title || storeInfo?.name || storeName || '';

  // ✅ Xác định icon theo loại cửa hàng
  const storeIcon = storeInfo?.type === "Truck" ? "local_shipping" : "store";

  // ✅ Text gợi ý thay đổi cửa hàng theo ngôn ngữ
  const changeStoreText = {
    ja: "変更",
    vi: "Đổi",
    en: "Change",
    zh: "更换",
    ko: "변경"
  }[locale] || "Change";

  return (
    <>
      <header className="order-mini-header">
        <div 
          className="order-header-left" 
          onClick={() => {
            if (currentStoreSlug) {
              router.push(`/${locale}/order?store=${currentStoreSlug}`);
            } else {
              router.push(`/${locale}/store-select`);
            }
          }} 
          style={{ cursor: 'pointer' }} 
          title={
            currentStoreSlug
              ? (locale === 'ja' ? 'メニューに戻る' : 
                locale === 'vi' ? 'Quay lại menu' : 
                locale === 'zh' ? '返回菜单' : 'Back to Menu')
              : (locale === 'ja' ? '店舗を選択' : 
                locale === 'vi' ? 'Chọn cửa hàng' : 
                locale === 'zh' ? '选择门店' : 'Select Store')
          }
        >
          <div className="store-avatar">
            <span className="material-symbols-outlined">{storeIcon}</span>
          </div>
          <div className="store-info">
            <span className="store-name">
              {baseStoreName || (
                locale === "ja"
                  ? "店舗を選択"
                  : locale === "vi"
                  ? "Chọn cửa hàng"
                  : locale === "zh"
                  ? "选择门店"
                  : "Select Store"
              )}
            </span>

            {storeInfo?.type === "Truck" &&
              storeInfo.locationName && (
                <span className="store-location">
                  <span className="material-symbols-outlined">
                    location_on
                  </span>
                  {storeInfo.locationName}
                </span>
              )}
          </div>
        </div>

        <div className="order-header-right">
          <div className="order-lang-wrapper" ref={langRef}>
            <button 
              className="order-lang-btn" 
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-label="Select Language"
            >
              <GlobeIcon className="order-globe-icon" />
              <span className="order-lang-code">{currentLangDisplayLabel}</span>
              <ChevronIcon className={`order-chevron ${isLangOpen ? "rotated" : ""}`} />
            </button>

            {isLangOpen && (
              <div className="order-lang-dropdown">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    className={`order-lang-item ${locale === lang.code ? "active" : ""}`}
                    onClick={() => handleLangChange(lang.code)}
                  >
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            className="order-menu-icon-btn"
            onClick={openDrawer}
            aria-label="Open Menu"
          >
            <span className="material-symbols-outlined">
              menu
            </span>
          </button>
        </div>
      </header>

      {isDrawerVisible && (
        <div 
          className={`order-drawer-backdrop ${isMenuOpen ? "show" : ""}`}
          onClick={closeDrawer}
        >
          <div 
            className={`order-drawer-content ${isMenuOpen ? "show" : ""}`}
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="drawer-header">
              <h3>{t.menu}</h3>
              <button 
                className="drawer-close" 
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close Menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="drawer-brand-area">
              <div className="drawer-logo-wrapper">
                <Image
                  src="/images/logo_header.png"
                  alt={`${t.siteName} logo`}
                  width={130}
                  height={50}
                  priority
                  className="drawer-logo-image"
                />
              </div>
              <p className="drawer-slogan">{sloganText}</p>
            </div>

            <div className="drawer-links">
              <Link 
                href={currentStoreSlug ? `/${locale}/order?store=${currentStoreSlug}` : `/${locale}/store-select`} 
                className="drawer-link" 
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="material-symbols-outlined">restaurant_menu</span>
                <span>
                  {locale === 'ja' ? 'メニュー注文' :
                  locale === 'vi' ? 'Đặt món' :
                  locale === 'zh' ? '菜单点餐' : 'Menu Order'}
                </span>
              </Link>

              <Link href={`/${locale}/order-history?store=${currentStoreSlug}`} className="drawer-link" onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-outlined">history</span>
                <span>
                  {locale === 'ja' ? '注文履歴' :
                  locale === 'vi' ? 'Lịch sử đơn hàng' :
                  locale === 'zh' ? '订单历史' : 'Order History'}
                </span>
              </Link>
              
              <Link href={`/${locale}/store-select`} className="drawer-link" onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-outlined">store</span>
                <span>
                  {locale === 'ja' ? '店舗選択' :
                  locale === 'vi' ? 'Chọn cửa hàng' :
                  locale === 'zh' ? '选择门店' : 'Select Store'}
                </span>
              </Link>

              <Link href={localizePath("/contact", locale)} className="drawer-link" onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-outlined">support_agent</span>
                <span>{t.contact}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}