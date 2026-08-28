"use client";

import StoreStatusToggle from "./StoreStatusToggle";
import styles from "./StoreManager.module.css";

type StoreSchedule = {
  id: number;
  work_date: string | Date;
  location_name: string | null;
  address: string | null;
};

type StoreHeaderProps = {
  store: any;
  schedule?: StoreSchedule | null;
  onToggleMobileMenu: () => void;
  onNotify?: (
    message: string,
    type: "success" | "error"
  ) => void;
};

export default function StoreHeader({
  store,
  schedule,
  onToggleMobileMenu,
  onNotify,
}: StoreHeaderProps) {
  const isTruck = store?.type === "Truck";

  const location =
    schedule?.location_name ||
    schedule?.address ||
    "場所未設定";

  return (
    <header className={styles.header}>
      <div className={styles.storeTitleWrapper}>

        {/* MOBILE MENU */}
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onToggleMobileMenu}
          aria-label="Toggle Menu"
        >
          <span className="material-symbols-outlined">
            menu
          </span>
        </button>

        {/* DESKTOP BRANDING */}
        <div className={styles.desktopStoreBranding}>
          <div className={styles.storeLogoBox}>
            <span className="material-symbols-outlined">
              {isTruck
                ? "local_shipping"
                : "storefront"}
            </span>
          </div>

          <div className={styles.storeInfo}>
            <h1 className={styles.storeName}>
              {store?.title ?? "Store Manager"}
            </h1>

            {isTruck ? (
              <span className={styles.storeSubtitle}>
                {schedule ? (
                  <>
                    <strong>
                      本日の出店
                    </strong>
                    {" ・ "}
                    {location}
                  </>
                ) : (
                  "本日の出店予定なし"
                )}
              </span>
            ) : (
              <span className={styles.storeSubtitle}>
                店舗管理ダッシュボード
              </span>
            )}
          </div>
        </div>

        {/* MOBILE */}
        <span
          className={styles.mobileStoreNameOnly}
        >
          {store?.title ?? "Store"}
        </span>
      </div>

      <div className={styles.headerActions}>
        <StoreStatusToggle
          store={store}
          onNotify={onNotify}
        />
      </div>
    </header>
  );
}