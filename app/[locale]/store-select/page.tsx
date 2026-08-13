'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Locale } from "@/app/i18n";
import { getActiveStores } from "@/app/web/actions/menu.action";
import { saveSelectedStore } from "@/app/web/store/selected-store";
import "./store-select.css";

interface Props {
  params: Promise<{ locale: Locale }>;
}

interface Store {
  id: number;
  title: string;
  slug: string; // Lấy trực tiếp từ database
  type: string;
  color: string | null;
  address: string | null;
  googleMapUrl: string | null;
  openTime: string | null;
  closeTime: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  locationName?: string | null;
}

export default function StoreSelectPage({ params }: Props) {
  const [locale, setLocale] = useState<Locale>("ja");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    getActiveStores().then((data) => {
      // Chuẩn hóa tọa độ số nếu cần, hoàn toàn không gán cứng thông tin địa chỉ/kitchen-car nữa
      const cleanedData = data.map((store: any) => ({
        ...store,
        latitude: store.latitude !== null && store.latitude !== undefined ? Number(store.latitude) : null,
        longitude: store.longitude !== null && store.longitude !== undefined ? Number(store.longitude) : null,
      }));

      setStores(cleanedData);
      setLoading(false);
    });
  }, []);

  const handleSelectStore = (store: Store) => {
    saveSelectedStore({
      id: store.id,
      title: store.title,
      type: store.type,
      slug: store.slug
    });

    // Dùng trực tiếp slug từ database trả về
    router.push(`/${locale}/order?store=${store.slug}`);
  };

  const formatTimeStr = (timeStr: string | null) => {
    if (!timeStr) return "";
    try {
      if (timeStr.includes("T")) {
        const timePart = timeStr.split("T")[1];
        return timePart.substring(0, 5);
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  const titles = {
    ja: "店舗を選択してください",
    vi: "Vui lòng chọn cửa hàng",
    en: "Please select a store",
    zh: "请选择门店"
  };

  const subtitles = {
    ja: "ご注文いただく店舗をお選びください。",
    vi: "Chọn chi nhánh bạn muốn bắt đầu đặt món.",
    en: "Choose a location to start your order.",
    zh: "请选择您要点餐的门店位置。"
  };

  const loadingText = {
    ja: "読み込み中...",
    vi: "Đang tải...",
    en: "Loading stores...",
    zh: "加载中..."
  };
  const emptyText = {
    ja: "利用可能な店舗がありません",
    vi: "Không tìm thấy cửa hàng khả dụng",
    en: "No available stores found",
    zh: "暂无可用门店"
  };
  const selectStoreText = {
    ja: "店舗を選ぶ",
    vi: "Chọn quán",
    en: "Select Store",
    zh: "选择门店"
  };

  const labels = {
    ja: { location: "エリア", address: "住所", hours: "営業時間" },
    vi: { location: "Khu vực", address: "Địa chỉ", hours: "Giờ mở cửa" },
    en: { location: "Area", address: "Address", hours: "Hours" },
    zh: { location: "区域", address: "地址", hours: "营业时间" }
  };

  const currentLabels = labels[locale] || labels.en;

  return (
    <div className="store-select-wrapper">
      <div className="store-select-container">
        <div className="store-header-content">
          <h2>{titles[locale] || titles.en}</h2>
          <p>{subtitles[locale] || subtitles.en}</p>
        </div>

        {loading ? (
          <div className="store-status-box">
            <div className="spinner"></div>
            <p>{loadingText[locale] || loadingText.en}</p>
          </div>
        ) : stores.length === 0 ? (
          <div className="store-status-box empty">
            <p>{emptyText[locale] || emptyText.en}</p>
          </div>
        ) : (
          <div className="store-grid-layout">
            {stores.map((store) => {
              const formattedOpen = formatTimeStr(store.openTime);
              const formattedClose = formatTimeStr(store.closeTime);

              const hasCoord = store.latitude && store.longitude;
              const embedMapUrl = hasCoord
                ? `https://maps.google.com/maps?q=${store.latitude},${store.longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                : `https://maps.google.com/maps?q=${encodeURIComponent(store.address || store.title)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

              const mapLink = store.googleMapUrl || (hasCoord
                ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.title)}`);

              return (
                <div
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  className="store-card-modern"
                >
                  <div className="store-map-preview" onClick={(e) => e.stopPropagation()}>
                    <iframe
                      title={`map-${store.id}`}
                      src={embedMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                    <div className="store-map-overlay-badge">
                      <span className="live-dot"></span>
                      <span>Google Map</span>
                    </div>
                  </div>

                  <div className="store-card-content-wrapper">
                    <div className="store-card-body">
                      <div className="store-name-row">
                        <h3 className="store-title">{store.title}</h3>
                      </div>

                      {store.locationName && (
                        <div className="store-info-row location">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          <span className="store-label-title">{currentLabels.location}:</span>
                          <span>{store.locationName}</span>
                        </div>
                      )}

                      {store.address && (
                        <div className="store-info-row address">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                          <span className="store-label-title">{currentLabels.address} :</span>
                          <span>{store.address}</span>
                        </div>
                      )}

                      {formattedOpen && formattedClose && (
                        <div className="store-info-row time">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span className="store-label-title">{currentLabels.hours} :</span>
                          <span>{formattedOpen} - {formattedClose}</span>
                        </div>
                      )}
                    </div>

                    <div className="store-card-footer" onClick={(e) => e.stopPropagation()}>
                      <a href={mapLink} target="_blank" rel="noopener noreferrer" className="btn-external-map">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2"></polygon><line x1="8" y1="18" x2="8" y2="2"></line><line x1="16" y1="22" x2="16" y2="6"></line></svg>
                        <span>Maps</span>
                      </a>
                      
                      <button
                        type="button"
                        className="btn-select-action"
                        onClick={() => handleSelectStore(store)}
                      >
                        <span>{selectStoreText[locale] || selectStoreText.en}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}