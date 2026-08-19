// app/store-manager/(dashboard)/StoreLayoutClient.tsx
"use client";

import { useState } from "react";
import StoreSidebar from "./orders/components/StoreSidebar"; 
import StoreHeader from "./orders/components/StoreHeader";   
import styles from "./layout.module.css"; 

export default function StoreLayoutClient({
  children,
  store,
}: {
  children: React.ReactNode;
  store: { id: number | string; title: string; accepting_orders?: boolean };
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schedule, setSchedule] = useState(null);

  return (
    <div className={styles.adminContainer}>
      <StoreHeader 
        store={store}
        schedule={schedule}
        onScheduleChange={setSchedule}
        onToggleMobileMenu={() => setIsSidebarOpen(true)}
      />

      <div className={styles.adminBody}>
        <StoreSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          store={store}
        />

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
}