"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import PrinterStatus from "./PrinterStatus";
import styles from "../styles/sidebar.module.css";

const menus = [
  {
    href: "/store-manager/orders",
    icon: "receipt_long",
    label: "注文",
  },
  {
    href: "/store-manager/history",
    icon: "history",
    label: "注文履歴",
  },
  {
    href: "/store-manager/reservations",
    icon: "event_note",
    label: "ご予約",
  },
  {
    href: "/store-manager/menu",
    icon: "restaurant_menu",
    label: "メニュー管理",
  },

  {
    href: "/store-manager/menu-settings",
    icon: "menu_book",
    label: "メニュー設定",
  },

  {
    href: "/store-manager/locations",
    icon: "location_on",
    label: "販売場所",
  },
  {
    href: "/store-manager/schedule",
    icon: "calendar_month",
    label: "営業スケジュール",
  },
  {
    href: "/store-manager/settings",
    icon: "settings",
    label: "営業設定",
  },
  {
    href: "/store-manager/special-schedule",
    icon: "calendar_month",
    label: "営業カレンダー",
  },
];

type StoreSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  store?: any;
};

export default function StoreSidebar({
  isOpen,
  onClose,
  store,
}: StoreSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`${styles.mobileOverlay} ${isOpen ? styles.show : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`${styles.sidebar} ${
          isOpen ? styles.mobileOpen : ""
        }`}
      >
        {/* Mobile Header */}
        <div className={styles.mobileSidebarHeader}>
          <div className={styles.mobileBrandRow}>
            <div className={styles.mobileLogoBox}>
              <span className="material-symbols-outlined">
                storefront
              </span>
            </div>

            <div className={styles.mobileStoreInfo}>
              <h2 className={styles.mobileStoreTitle}>
                {store?.title ?? "Store Manager"}
              </h2>

              <span className={styles.mobileStoreSub}>
                店舗管理ダッシュボード
              </span>
            </div>
          </div>

          <div className={styles.mobilePrinterWrapper}>
            <PrinterStatus />
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={styles.sidebarNav}
          aria-label="店舗管理メニュー"
        >
          {menus.map((menu) => {
            const active =
              pathname === menu.href ||
              pathname.startsWith(`${menu.href}/`);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                onClick={onClose}
                className={`${styles.sidebarItem} ${
                  active ? styles.active : ""
                }`}
              >
                <span className="material-symbols-outlined">
                  {menu.icon}
                </span>

                <span className={styles.sidebarLabel}>
                  {menu.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <form
          className={styles.logoutForm}
          action="/api/store-manager/logout"
          method="POST"
        >
          <button
            type="submit"
            className={`${styles.sidebarItem} ${styles.logoutBtn}`}
          >
            <span className="material-symbols-outlined">
              logout
            </span>

            <span className={styles.sidebarLabel}>
              ログアウト
            </span>
          </button>
        </form>
      </aside>
    </>
  );
}