"use client";

import Link from "next/link";
import styles from "../styles/menuEditorHeader.module.css";


type Props = {
  store: {
    id: number;
    title: string;
    type: string;
  };

  menu: {
    id: number;
    name: string;
    is_default: boolean;
    is_active: boolean;
  };
};


export default function MenuEditorHeader({ store, menu }: Props) {

  const isTruck = store.type?.toLowerCase() === "truck";


  return (
    <header className={styles.header}>
      {/* Nút quay lại */}
      <Link href="/store-manager/menu-settings" className={styles.backButton}>
        <span className="material-symbols-outlined">chevron_left</span>
        <span>メニュー一覧</span>
      </Link>

      {/* Thông tin chính dạng Compact */}
      <div className={styles.mainInfo}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.menuTitle}>{menu.name}</h1>
          <span className={styles.storeSubtext}>
            <span className="material-symbols-outlined">
              {isTruck ? "local_shipping" : "storefront"}
            </span>
            {store.title}
          </span>
        </div>

        {/* Trạng thái Badges */}
        <div className={styles.badgeGroup}>
          {menu.is_default && (
            <span className={styles.defaultBadge}>
              <span className="material-symbols-outlined">star</span>
              通常
            </span>
          )}

          <span className={menu.is_active ? styles.activeBadge : styles.inactiveBadge}>
            <span className={styles.statusDot} />
            {menu.is_active ? "有効" : "無効"}
          </span>
        </div>
      </div>
    </header>
  );
}