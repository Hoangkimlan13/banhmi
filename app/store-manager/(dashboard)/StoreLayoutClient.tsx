// app/store-manager/(dashboard)/StoreLayoutClient.tsx

"use client";

import { useState } from "react";

import StoreSidebar from "./orders/components/StoreSidebar";
import StoreHeader from "./orders/components/StoreHeader";

import styles from "./layout.module.css";

type Store = {
  id: number | string;
  title: string;
  accepting_orders?: boolean;
};

type Props = {
  children: React.ReactNode;
  store: Store;
};

export default function StoreLayoutClient({
  children,
  store,
}: Props) {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  return (
    <div className={styles.adminContainer}>
      {/* =====================================================
          HEADER
          ===================================================== */}

      <StoreHeader
        store={store}
        onToggleMobileMenu={() =>
          setIsSidebarOpen(true)
        }
      />

      {/* =====================================================
          BODY
          ===================================================== */}

      <div className={styles.adminBody}>
        <StoreSidebar
          isOpen={isSidebarOpen}
          onClose={() =>
            setIsSidebarOpen(false)
          }
          store={store}
        />

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}