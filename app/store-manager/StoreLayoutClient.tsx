// app/store-manager/StoreLayoutClient.tsx
"use client";

import { useState } from "react";

import StoreSidebar from "./(dashboard)/orders/components/StoreSidebar";
import StoreHeader from "./(dashboard)/orders/components/StoreHeader";

import styles from "./layout.module.css";

type Store = {
  id: number | string;
  title: string;
  accepting_orders?: boolean;
};

export default function StoreLayoutClient({
  children,
  store,
}: {
  children: React.ReactNode;
  store: Store;
}) {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  return (
    <div className={styles.adminContainer}>
      {/* HEADER */}
      <StoreHeader
        store={store}
        onToggleMobileMenu={() =>
          setIsSidebarOpen(true)
        }
      />

      {/* BODY */}
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