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
  slug: string;
  type: string;
  color: string | null;
  address: string | null;
  googleMapUrl: string | null;
  openTime: string | null;
  closeTime: string | null;
  acceptingOrders: boolean;

  latitude: number | string | null;
  longitude: number | string | null;
  locationName?: string | null;
}

export default function StoreSelectPage({ params }: Props) {
  const [locale, setLocale] = useState<Locale>("ja");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

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



  const getStoreStatus = (
    store: Store
  ): "OPEN" | "OUTSIDE_HOURS" | "STOPPED" => {

    // ============================================
    // 1. ORDER STOPPED
    // ============================================
    if (store.acceptingOrders !== true) {
      return "STOPPED";
    }

    // ============================================
    // 2. NO OPENING HOURS
    // ============================================
    if (!store.openTime || !store.closeTime) {
      return "OPEN";
    }

    const open = formatTimeStr(store.openTime);
    const close = formatTimeStr(store.closeTime);

    if (!open || !close) {
      return "OPEN";
    }

    const [openHour, openMinute] = open
      .split(":")
      .map(Number);

    const [closeHour, closeMinute] = close
      .split(":")
      .map(Number);

    if (
      Number.isNaN(openHour) ||
      Number.isNaN(openMinute) ||
      Number.isNaN(closeHour) ||
      Number.isNaN(closeMinute)
    ) {
      return "OPEN";
    }

    // ============================================
    // JAPAN TIME
    // ============================================
    const japanTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(currentTime);

    const [currentHour, currentMinute] = japanTime
      .split(":")
      .map(Number);

    const currentMinutes =
      currentHour * 60 + currentMinute;

    const openMinutes =
      openHour * 60 + openMinute;

    const closeMinutes =
      closeHour * 60 + closeMinute;

    // ============================================
    // OVERNIGHT
    // 18:00 → 02:00
    // ============================================
    if (closeMinutes < openMinutes) {
      const isOpen =
        currentMinutes >= openMinutes ||
        currentMinutes < closeMinutes;

      return isOpen
        ? "OPEN"
        : "OUTSIDE_HOURS";
    }

    // ============================================
    // NORMAL
    // 10:30 → 23:00
    // ============================================
    const isOpen =
      currentMinutes >= openMinutes &&
      currentMinutes < closeMinutes;

    return isOpen
      ? "OPEN"
      : "OUTSIDE_HOURS";
  };


  const getStoreOpenStatus = (
    openTime: string | null,
    closeTime: string | null
  ): boolean | null => {
    if (!openTime || !closeTime) {
      return null;
    }

    try {
      const open = formatTimeStr(openTime);
      const close = formatTimeStr(closeTime);

      if (!open || !close) {
        return null;
      }

      const [openHour, openMinute] = open
        .split(":")
        .map(Number);

      const [closeHour, closeMinute] = close
        .split(":")
        .map(Number);

      if (
        Number.isNaN(openHour) ||
        Number.isNaN(openMinute) ||
        Number.isNaN(closeHour) ||
        Number.isNaN(closeMinute)
      ) {
        return null;
      }

      // --------------------------------------------------
      // Lấy giờ hiện tại theo Asia/Tokyo
      // --------------------------------------------------

      const japanTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(currentTime);

      const [currentHour, currentMinute] = japanTime
        .split(":")
        .map(Number);

      const currentTotal =
        currentHour * 60 + currentMinute;

      const openTotal =
        openHour * 60 + openMinute;

      const closeTotal =
        closeHour * 60 + closeMinute;

      // --------------------------------------------------
      // Trường hợp bình thường
      // Ví dụ 11:00 → 20:00
      // --------------------------------------------------

      if (openTotal < closeTotal) {
        return (
          currentTotal >= openTotal &&
          currentTotal < closeTotal
        );
      }

      // --------------------------------------------------
      // Trường hợp qua ngày
      // Ví dụ 22:00 → 02:00
      // --------------------------------------------------

      if (openTotal > closeTotal) {
        return (
          currentTotal >= openTotal ||
          currentTotal < closeTotal
        );
      }

      // --------------------------------------------------
      // open == close
      // Không nên coi là đang mở
      // --------------------------------------------------

      return false;
    } catch (error) {
      console.error(
        "[StoreSelect] Error checking opening status:",
        error
      );

      return null;
    }
  };

  const titles: Record<Locale, string> = {
    ja: "店舗を選択してください",
    vi: "Vui lòng chọn cửa hàng",
    en: "Please select a store",
    zh: "请选择门店",
    ko: "매장을 선택해주세요",
  };

  const subtitles: Record<Locale, string> = {
    ja: "ご注文いただく店舗をお選びください。",
    vi: "Chọn chi nhánh bạn muốn bắt đầu đặt món.",
    en: "Choose a location to start your order.",
    zh: "请选择您要点餐的门店位置。",
    ko: "주문하실 매장을 선택해 주세요.",
  };

  const loadingText: Record<Locale, string> = {
    ja: "読み込み中...",
    vi: "Đang tải...",
    en: "Loading stores...",
    zh: "加载中...",
    ko: "불러오는 중...",
  };
  const emptyText: Record<Locale, string> = {
    ja: "利用可能な店舗がありません",
    vi: "Không tìm thấy cửa hàng khả dụng",
    en: "No available stores found",
    zh: "暂无可用门店",
    ko: "이용 가능한 매장이 없습니다",
  };

  const selectStoreText: Record<Locale, string> = {
      ja: "店舗を選ぶ",
      vi: "Chọn quán",
      en: "Select Store",
      zh: "选择门店",
      ko: "매장 선택",
    };

  const orderStatusText: Record<
    Locale,
    {
      accepting: string;
      outsideHours: string;
      stopped: string;
    }
  > = {
    ja: {
      accepting: "注文受付中",
      outsideHours: "営業時間外",
      stopped: "注文受付停止中",
    },

    vi: {
      accepting: "Đang nhận đơn",
      outsideHours: "Ngoài giờ mở cửa",
      stopped: "Đang tạm dừng nhận đơn",
    },

    en: {
      accepting: "Orders Open",
      outsideHours: "Outside Business Hours",
      stopped: "Order Acceptance Stopped",
    },

    zh: {
      accepting: "正在接受订单",
      outsideHours: "营业时间外",
      stopped: "暂停接单",
    },

    ko: {
      accepting: "주문 접수 중",
      outsideHours: "영업시간 외",
      stopped: "주문 접수 중지",
    },
  };

  const statusText: Record<
    Locale,
    {
      open: string;
      outsideHours: string;
      stopped: string;
    }
  > = {
    ja: {
      open: "営業中",
      outsideHours: "営業時間外",
      stopped: "注文受付停止中",
    },
    vi: {
      open: "Đang mở cửa",
      outsideHours: "Ngoài giờ mở cửa",
      stopped: "Đang tạm dừng nhận đơn",
    },
    en: {
      open: "Open now",
      outsideHours: "Outside business hours",
      stopped: "Orders temporarily paused",
    },
    zh: {
      open: "营业中",
      outsideHours: "营业时间外",
      stopped: "暂停接单",
    },
    ko: {
      open: "영업 중",
      outsideHours: "영업시간 외",
      stopped: "주문 접수 일시 중지",
    },
  };

    const openStatusText: Record<
    Locale,
    {
      open: string;
      closed: string;
      unknown: string;
    }
  > = {
    ja: {
      open: "現在営業中",
      closed: "現在営業時間外",
      unknown: "営業時間未設定",
    },

    vi: {
      open: "Hiện đang mở cửa",
      closed: "Hiện đang ngoài giờ mở cửa",
      unknown: "Chưa có giờ mở cửa",
    },

    en: {
      open: "Open now",
      closed: "Currently closed",
      unknown: "Opening hours unavailable",
    },

    zh: {
      open: "现在营业中",
      closed: "当前非营业时间",
      unknown: "营业时间未设置",
    },

    ko: {
      open: "현재 영업 중",
      closed: "현재 영업시간 외",
      unknown: "영업시간 미설정",
    },
  };

  const labels: Record<Locale, { location: string; address: string; hours: string }> = {
    ja: { location: "エリア", address: "住所", hours: "営業時間" },
    vi: { location: "Khu vực", address: "Địa chỉ", hours: "Giờ mở cửa" },
    en: { location: "Area", address: "Address", hours: "Hours" },
    zh: { location: "区域", address: "地址", hours: "营业时间" },
    ko: { location: "지역", address: "주소", hours: "영업 시간" },
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

              const storeStatus = getStoreStatus(store);

              const statusLabel =
                storeStatus === "OPEN"
                  ? statusText[locale].open
                  : storeStatus === "OUTSIDE_HOURS"
                    ? statusText[locale].outsideHours
                    : statusText[locale].stopped;

              const isOpen = getStoreOpenStatus(
                store.openTime,
                store.closeTime
              );

              const hasOpeningHours =
                formattedOpen && formattedClose;

              const hasCoord =
                store.latitude !== null &&
                store.longitude !== null;

              const embedMapUrl = hasCoord
                ? `https://maps.google.com/maps?q=${store.latitude},${store.longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`
                : `https://maps.google.com/maps?q=${encodeURIComponent(
                    store.address || store.title
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

              const mapLink =
                store.googleMapUrl ||
                (hasCoord
                  ? `https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      store.address || store.title
                    )}`);

              return (
                <div
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  className={`store-card-modern ${
                    isOpen === false
                      ? "store-card-closed"
                      : ""
                  }`}
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

                        <span
                          className={`store-status-badge ${storeStatus.toLowerCase()}`}
                        >
                          <span className="store-status-dot"></span>
                          {statusLabel}
                        </span>
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