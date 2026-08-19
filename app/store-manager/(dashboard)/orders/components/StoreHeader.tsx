"use client";

import StoreStatusToggle from "./StoreStatusToggle";
import styles from "./StoreManager.module.css";

type StoreHeaderProps = {
  store: any;
  schedule: any;
  onScheduleChange: (schedule: any) => void;
  onToggleMobileMenu: () => void;
  onNotify?: (message: string, type: "success" | "error") => void;
};

export default function StoreHeader({ store, onToggleMobileMenu, onNotify }: StoreHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.storeTitleWrapper}>
        <button 
          className={styles.mobileMenuBtn} 
          onClick={onToggleMobileMenu}
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className={styles.desktopStoreBranding}>
          <div className={styles.storeLogoBox}>
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <div className={styles.storeInfo}>
            <h1 className={styles.storeName}>{store?.title ?? "Store Manager"}</h1>
            <span className={styles.storeSubtitle}>店舗管理ダッシュボード</span>
          </div>
        </div>

        <span className={styles.mobileStoreNameOnly}>{store?.title ?? "Store"}</span>
      </div>
      
      <div className={styles.headerActions}>
        <StoreStatusToggle store={store} onNotify={onNotify} />
      </div>
    </header>
  );
}